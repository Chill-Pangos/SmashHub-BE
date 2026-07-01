// subMatchPlayer.service.ts — đơn giản, chủ yếu query
import { sequelize } from "../config/database";
import { getRedisClient } from "../config/redis";
import SubMatchPlayer from "../models/subMatchPlayer.model";
import SubMatch from "../models/subMatch.model";
import EntryMember from "../models/entryMember.model";
import User from "../models/user.model";
import { Team } from "../models/subMatch.model";
import Match from "../models/match.model";
import Schedule from "../models/schedule.model";
import TournamentCategory from "../models/tournamentCategory.model";
import Entry from "../models/entry.model";
import config from "../config/config";
import { BadRequestError, ConflictError, ForbiddenError, InternalServerError, NotFoundError } from "../utils/errors.helper";

interface TeamLineupRequest {
  subMatchId: number;
  team: Team;
  entryId: number;
  entryMemberIds: number[];
  submittedById: number;
  submittedAt: string;
}

interface TeamLineupRejection extends TeamLineupRequest {
  rejectedById: number;
  rejectedAt: string;
  reviewNotes?: string;
}

interface TeamLineupInput {
  subMatchId: number;
  entryMemberIds: number[];
}

interface SubMatchContext {
  subMatch: SubMatch;
  match: Match;
  category: TournamentCategory;
}

function lineupRequestKey(subMatchId: number, team: Team): string {
  return `sub-match:${subMatchId}:team:${team}:lineup-request`;
}

function pendingLineupSetKey(umpireId: number): string {
  return `umpire:${umpireId}:pending-lineup-requests`;
}

function rejectedLineupSetKey(captainId: number): string {
  return `captain:${captainId}:rejected-lineup-requests`;
}

function rejectedLineupKey(subMatchId: number, team: Team): string {
  return `sub-match:${subMatchId}:team:${team}:lineup-rejection`;
}

function safeParseJson<T>(payload: string): T | null {
  try {
    return JSON.parse(payload) as T;
  } catch {
    return null;
  }
}

async function getRequiredRedisClient() {
  const client = await getRedisClient();
  if (!client) throw new InternalServerError("Redis is required for pending lineup approval");
  return client;
}

async function getSubMatchContext(
  subMatchId: number,
): Promise<SubMatchContext> {
  const subMatch = await SubMatch.findByPk(subMatchId, {
    include: [
      {
        model: Match,
        as: "match",
        include: [
          {
            model: Schedule,
            as: "schedule",
            include: [{ model: TournamentCategory, as: "tournamentCategory" }],
          },
          { model: Entry, as: "entryA" },
          { model: Entry, as: "entryB" },
        ],
      },
    ],
  });

  if (!subMatch) throw new NotFoundError("SubMatch not found");
  const match = subMatch.match;
  if (!match) throw new NotFoundError("SubMatch match not found");
  const category = match.schedule?.tournamentCategory;
  if (!category) throw new NotFoundError("SubMatch category not found");

  return { subMatch, match, category };
}

async function cleanupPendingLineupKey(
  client: Awaited<ReturnType<typeof getRequiredRedisClient>>,
  subMatch: SubMatch,
  key: string,
): Promise<void> {
  await client.del(key);
  if (subMatch.umpireId) {
    await client.sRem(pendingLineupSetKey(subMatch.umpireId), key);
  }
  if (subMatch.assistantUmpireId) {
    await client.sRem(pendingLineupSetKey(subMatch.assistantUmpireId), key);
  }
}

function assertTeamCategory(category: TournamentCategory): void {
  if (category.type !== "team") {
    throw new BadRequestError("Lineup approval flow is only for team categories");
  }
}

async function assertEntryCaptain(
  userId: number,
  entryId: number,
): Promise<void> {
  const entry = await Entry.findByPk(entryId, { attributes: ["id", "captainId"] });
  if (!entry || entry.captainId !== userId) {
    throw new ForbiddenError("Only the entry captain can submit lineup");
  }
}

async function assertEntryMembers(
  entryId: number,
  entryMemberIds: number[],
): Promise<EntryMember[]> {
  const uniqueIds = [...new Set(entryMemberIds)];
  if (uniqueIds.length !== entryMemberIds.length) {
    throw new ConflictError("entryMemberIds must not contain duplicates");
  }

  const members = await EntryMember.findAll({
    where: { id: uniqueIds, entryId },
    order: [["id", "ASC"]],
  });

  if (members.length !== uniqueIds.length) {
    throw new BadRequestError("Some entry members do not belong to this team");
  }

  return members;
}

function assertUmpireCanReview(subMatch: SubMatch, userId: number): void {
  if (subMatch.umpireId !== userId && subMatch.assistantUmpireId !== userId) {
    throw new ForbiddenError("Only the assigned umpire can review lineup");
  }
}

async function getCaptainTeamAndEntry(
  match: Match,
  captainId: number,
): Promise<{ team: Team; entryId: number }> {
  const entryAId = match.entryAId;
  const entryBId = match.entryBId;
  if (!entryAId || !entryBId) {
    throw new BadRequestError("Both entries must be assigned before submitting lineup");
  }

  const entries = await Entry.findAll({
    where: { id: [entryAId, entryBId] },
    attributes: ["id", "captainId"],
  });

  const captainEntry = entries.find((entry) => entry.captainId === captainId);
  if (!captainEntry) {
    throw new ForbiddenError("Only entry captain can submit lineup");
  }

  return {
    team: captainEntry.id === entryAId ? "A" : "B",
    entryId: captainEntry.id,
  };
}

export class SubMatchPlayerService {
  async submitTeamLineups(
    captainId: number,
    matchId: number,
    lineups: TeamLineupInput[],
  ): Promise<TeamLineupRequest[]> {
    if (!Array.isArray(lineups) || lineups.length === 0) {
      throw new BadRequestError("lineups must be a non-empty array");
    }

    const match = await Match.findByPk(matchId, {
      include: [
        {
          model: Schedule,
          as: "schedule",
          include: [{ model: TournamentCategory, as: "tournamentCategory" }],
        },
        { model: SubMatch, as: "subMatches" },
      ],
    });
    if (!match) throw new NotFoundError("Match not found");

    const category = match.schedule?.tournamentCategory;
    if (!category) throw new NotFoundError("Match category not found");
    assertTeamCategory(category);

    const subMatches = match.subMatches ?? [];
    if (subMatches.length === 0) throw new NotFoundError("No sub-matches found");
    if (lineups.length !== subMatches.length) {
      throw new BadRequestError("Lineup must be submitted for all sub-matches");
    }

    const subMatchIds = new Set(subMatches.map((subMatch) => subMatch.id));
    const submittedSubMatchIds = new Set(lineups.map((lineup) => lineup.subMatchId));
    if (submittedSubMatchIds.size !== lineups.length) {
      throw new ConflictError("lineups must not contain duplicate subMatchId");
    }
    for (const lineup of lineups) {
      if (!subMatchIds.has(lineup.subMatchId)) {
        throw new BadRequestError("All lineups must belong to this match");
      }
    }

    const { team, entryId } = await getCaptainTeamAndEntry(match, captainId);
    await assertEntryCaptain(captainId, entryId);

    const requests: TeamLineupRequest[] = [];
    for (const lineup of lineups) {
      if (!Array.isArray(lineup.entryMemberIds) || lineup.entryMemberIds.length === 0) {
        throw new BadRequestError("entryMemberIds must be a non-empty array");
      }
      if (lineup.entryMemberIds.some((id) => !Number.isInteger(id) || id <= 0)) {
        throw new BadRequestError("entryMemberIds must contain positive integers only");
      }

      const subMatch = subMatches.find((item) => item.id === lineup.subMatchId)!;
      if (!subMatch.umpireId) {
        throw new BadRequestError("Umpire must be assigned before submitting lineup");
      }

      await assertEntryMembers(entryId, lineup.entryMemberIds);

      const existingApproved = await SubMatchPlayer.count({
        where: { subMatchId: lineup.subMatchId, team },
      });
      if (existingApproved > 0) {
        throw new ConflictError(`Lineup already approved for subMatch ${lineup.subMatchId}`);
      }

      const request: TeamLineupRequest = {
        subMatchId: lineup.subMatchId,
        team,
        entryId,
        entryMemberIds: lineup.entryMemberIds,
        submittedById: captainId,
        submittedAt: new Date().toISOString(),
      };

      const client = await getRequiredRedisClient();
      const key = lineupRequestKey(lineup.subMatchId, team);
      await client.set(key, JSON.stringify(request), {
        EX: config.redis.lineupRequestTtlSeconds,
      });
      await client.sAdd(pendingLineupSetKey(subMatch.umpireId), key);
      await client.expire(pendingLineupSetKey(subMatch.umpireId), config.redis.lineupRequestTtlSeconds);
      if (subMatch.assistantUmpireId) {
        await client.sAdd(pendingLineupSetKey(subMatch.assistantUmpireId), key);
        await client.expire(
          pendingLineupSetKey(subMatch.assistantUmpireId),
          config.redis.lineupRequestTtlSeconds,
        );
      }

      requests.push(request);
    }

    return requests;
  }

  async submitTeamLineup(
    captainId: number,
    subMatchId: number,
    entryMemberIds: number[],
  ): Promise<TeamLineupRequest> {
    if (!Array.isArray(entryMemberIds) || entryMemberIds.length === 0) {
      throw new BadRequestError("entryMemberIds must be a non-empty array");
    }
    if (entryMemberIds.some((id) => !Number.isInteger(id) || id <= 0)) {
      throw new BadRequestError("entryMemberIds must contain positive integers only");
    }

    const { subMatch, match, category } = await getSubMatchContext(subMatchId);
    assertTeamCategory(category);
    const { team, entryId } = await getCaptainTeamAndEntry(match, captainId);
    await assertEntryCaptain(captainId, entryId);
    await assertEntryMembers(entryId, entryMemberIds);

    if (!subMatch.umpireId) {
      throw new BadRequestError("Umpire must be assigned before submitting lineup");
    }

    const existingApproved = await SubMatchPlayer.count({
      where: { subMatchId, team },
    });
    if (existingApproved > 0) {
      throw new ConflictError("Lineup already approved for this team");
    }

    const request: TeamLineupRequest = {
      subMatchId,
      team,
      entryId,
      entryMemberIds,
      submittedById: captainId,
      submittedAt: new Date().toISOString(),
    };

    const client = await getRequiredRedisClient();
    const key = lineupRequestKey(subMatchId, team);
    await client.set(key, JSON.stringify(request), {
      EX: config.redis.lineupRequestTtlSeconds,
    });
    await client.sAdd(pendingLineupSetKey(subMatch.umpireId), key);
    await client.expire(pendingLineupSetKey(subMatch.umpireId), config.redis.lineupRequestTtlSeconds);
    if (subMatch.assistantUmpireId) {
      await client.sAdd(pendingLineupSetKey(subMatch.assistantUmpireId), key);
      await client.expire(
        pendingLineupSetKey(subMatch.assistantUmpireId),
        config.redis.lineupRequestTtlSeconds,
      );
    }

    return request;
  }

  async getPendingLineupsForUmpire(umpireId: number): Promise<TeamLineupRequest[]> {
    const client = await getRequiredRedisClient();
    const setKey = pendingLineupSetKey(umpireId);
    const keys = await client.sMembers(setKey);
    if (keys.length === 0) return [];

    const values = await Promise.all(keys.map((key) => client.get(key)));
    const requests: TeamLineupRequest[] = [];
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i]!;
      const value = values[i];
      if (!value) {
        await client.sRem(setKey, key);
        continue;
      }
      const request = safeParseJson<TeamLineupRequest>(value);
      if (!request) {
        await client.del(key);
        await client.sRem(setKey, key);
        continue;
      }
      requests.push(request);
    }
    return requests;
  }

  async approveTeamLineup(
    umpireId: number,
    subMatchId: number,
    team: Team,
  ): Promise<SubMatchPlayer[]> {
    if (team !== "A" && team !== "B") throw new BadRequestError("Team must be A or B");

    const { subMatch, category } = await getSubMatchContext(subMatchId);
    assertTeamCategory(category);
    assertUmpireCanReview(subMatch, umpireId);

    const client = await getRequiredRedisClient();
    const key = lineupRequestKey(subMatchId, team);
    const payload = await client.get(key);
    if (!payload) throw new NotFoundError("No pending lineup found");

    const request = safeParseJson<TeamLineupRequest>(payload);
    if (!request) {
      await cleanupPendingLineupKey(client, subMatch, key);
      throw new NotFoundError("No pending lineup found");
    }
    const entryId = request.entryId;
    const members = await assertEntryMembers(entryId, request.entryMemberIds);

    const players = await sequelize.transaction(async (t) => {
      await SubMatchPlayer.destroy({ where: { subMatchId, team }, transaction: t });
      return await SubMatchPlayer.bulkCreate(
        members.map((member) => ({
          subMatchId,
          entryMemberId: member.id,
          team,
        })),
        { transaction: t },
      );
    });

    await cleanupPendingLineupKey(client, subMatch, key);

    return players;
  }

  async rejectTeamLineup(
    umpireId: number,
    subMatchId: number,
    team: Team,
    reviewNotes?: string,
  ): Promise<TeamLineupRejection> {
    if (team !== "A" && team !== "B") throw new BadRequestError("Team must be A or B");

    const { subMatch, category } = await getSubMatchContext(subMatchId);
    assertTeamCategory(category);
    assertUmpireCanReview(subMatch, umpireId);

    const client = await getRequiredRedisClient();
    const key = lineupRequestKey(subMatchId, team);
    const payload = await client.get(key);
    if (!payload) throw new NotFoundError("No pending lineup found");

    const request = safeParseJson<TeamLineupRequest>(payload);
    if (!request) {
      await cleanupPendingLineupKey(client, subMatch, key);
      throw new NotFoundError("No pending lineup found");
    }
    const rejection: TeamLineupRejection = {
      ...request,
      rejectedById: umpireId,
      rejectedAt: new Date().toISOString(),
      ...(reviewNotes?.trim() && { reviewNotes: reviewNotes.trim() }),
    };

    await cleanupPendingLineupKey(client, subMatch, key);

    const rejectedKey = rejectedLineupKey(subMatchId, team);
    await client.set(rejectedKey, JSON.stringify(rejection), { EX: 24 * 60 * 60 });
    await client.sAdd(rejectedLineupSetKey(request.submittedById), rejectedKey);
    await client.expire(rejectedLineupSetKey(request.submittedById), 24 * 60 * 60);

    return rejection;
  }

  async rejectPendingLineupsByMatch(
    umpireId: number,
    matchId: number,
    reviewNotes?: string,
  ): Promise<TeamLineupRejection[]> {
    const subMatches = await SubMatch.findAll({
      where: { matchId },
      order: [["subMatchNumber", "ASC"]],
    });
    if (subMatches.length === 0) throw new NotFoundError("No sub-matches found");

    const rejected: TeamLineupRejection[] = [];
    for (const subMatch of subMatches) {
      for (const team of ["A", "B"] as Team[]) {
        const client = await getRequiredRedisClient();
        const payload = await client.get(lineupRequestKey(subMatch.id, team));
        if (!payload) continue;
        const rejection = await this.rejectTeamLineup(
          umpireId,
          subMatch.id,
          team,
          reviewNotes,
        );
        rejected.push(rejection);
      }
    }

    if (rejected.length === 0) throw new NotFoundError("No pending lineup found");
    return rejected;
  }

  async getRejectedLineupsForCaptain(
    captainId: number,
  ): Promise<TeamLineupRejection[]> {
    const client = await getRequiredRedisClient();
    const setKey = rejectedLineupSetKey(captainId);
    const keys = await client.sMembers(setKey);
    if (keys.length === 0) return [];

    const values = await Promise.all(keys.map((key) => client.get(key)));
    const rejected: TeamLineupRejection[] = [];
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i]!;
      const value = values[i];
      if (!value) {
        await client.sRem(setKey, key);
        continue;
      }
      const rejection = safeParseJson<TeamLineupRejection>(value);
      if (!rejection) {
        await client.del(key);
        await client.sRem(setKey, key);
        continue;
      }
      rejected.push(rejection);
    }
    return rejected;
  }

  async approvePendingLineupsBySubMatch(
    umpireId: number,
    subMatchId: number,
  ): Promise<SubMatchPlayer[]> {
    const approved: SubMatchPlayer[] = [];
    for (const team of ["A", "B"] as Team[]) {
      const client = await getRequiredRedisClient();
      const payload = await client.get(lineupRequestKey(subMatchId, team));
      if (!payload) continue;
      const players = await this.approveTeamLineup(umpireId, subMatchId, team);
      approved.push(...players);
    }
    if (approved.length === 0) throw new NotFoundError("No pending lineup found");
    return approved;
  }

  async approvePendingLineupsByMatch(
    umpireId: number,
    matchId: number,
  ): Promise<SubMatchPlayer[]> {
    const subMatches = await SubMatch.findAll({
      where: { matchId },
      order: [["subMatchNumber", "ASC"]],
    });
    if (subMatches.length === 0) throw new NotFoundError("No sub-matches found");

    const approved: SubMatchPlayer[] = [];
    for (const subMatch of subMatches) {
      for (const team of ["A", "B"] as Team[]) {
        const client = await getRequiredRedisClient();
        const payload = await client.get(lineupRequestKey(subMatch.id, team));
        if (!payload) continue;
        const players = await this.approveTeamLineup(umpireId, subMatch.id, team);
        approved.push(...players);
      }
    }

    if (approved.length === 0) throw new NotFoundError("No pending lineup found");
    return approved;
  }

  async getPlayersBySubMatch(subMatchId: number, options?: { offset?: number; limit?: number }): Promise<{ players?: SubMatchPlayer[], pagination?: any } | SubMatchPlayer[]> {
    const offset = options?.offset || 0;
    const limit = options?.limit || 10;

    // If pagination is requested
    if (options && (options.offset !== undefined || options.limit !== undefined)) {
      const { count, rows } = await SubMatchPlayer.findAndCountAll({
        where: { subMatchId },
        include: [{
          model: EntryMember,
          as: "entryMember",
          include: [{
            model: User,
            as: "user",
            attributes: ["id", "firstName", "lastName", "avatarUrl"],
          }],
        }],
        offset,
        limit: limit,
      });

      const totalPages = Math.ceil(count / limit);
      const page = Math.floor(offset / limit) + 1;

      return {
        players: rows,
        pagination: {
          total: count,
          page,
          limit,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      };
    }

    return await SubMatchPlayer.findAll({
      where: { subMatchId },
      include: [{
        model: EntryMember,
        as: "entryMember",
        include: [{
          model: User,
          as: "user",
          attributes: ["id", "firstName", "lastName", "avatarUrl"],
        }],
      }],
    });
  }

  async getPlayersByTeam(
    subMatchId: number,
    team: Team,
    options?: { offset?: number; limit?: number }
  ): Promise<{ players?: SubMatchPlayer[], pagination?: any } | SubMatchPlayer[]> {
    const offset = options?.offset || 0;
    const limit = options?.limit || 10;

    // If pagination is requested
    if (options && (options.offset !== undefined || options.limit !== undefined)) {
      const { count, rows } = await SubMatchPlayer.findAndCountAll({
        where: { subMatchId, team },
        include: [{
          model: EntryMember,
          as: "entryMember",
          include: [{
            model: User,
            as: "user",
            attributes: ["id", "firstName", "lastName", "avatarUrl"],
          }],
        }],
        offset,
        limit: limit,
      });

      const totalPages = Math.ceil(count / limit);
      const page = Math.floor(offset / limit) + 1;

      return {
        players: rows,
        pagination: {
          total: count,
          page,
          limit,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      };
    }

    return await SubMatchPlayer.findAll({
      where: { subMatchId, team },
      include: [{
        model: EntryMember,
        as: "entryMember",
        include: [{
          model: User,
          as: "user",
          attributes: ["id", "firstName", "lastName", "avatarUrl"],
        }],
      }],
    });
  }

  async getMatchesByEntryMember(
    entryMemberId: number,
    offset = 0,
    limit = 10
  ): Promise<{ matches?: SubMatchPlayer[], pagination?: any }> {
    const { count, rows } = await SubMatchPlayer.findAndCountAll({
      where: { entryMemberId },
      include: [{ model: SubMatch, as: "subMatch" }],
      offset,
      limit,
      order: [["createdAt", "DESC"]],
    });

    const totalPages = Math.ceil(count / limit);
    const page = Math.floor(offset / limit) + 1;

    return {
      matches: rows,
      pagination: {
        total: count,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    };
  }
}

export default new SubMatchPlayerService();
