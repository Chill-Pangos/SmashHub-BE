// match.service.ts
import { Op, Transaction } from "sequelize";
import { sequelize } from "../config/database";
import Match from "../models/match.model";
import MatchReferee from "../models/matchReferee.model";
import MatchSet from "../models/matchSet.model";
import SubMatch from "../models/subMatch.model";
import Schedule from "../models/schedule.model";
import TournamentCategory from "../models/tournamentCategory.model";
import Tournament from "../models/tournament.model";
import TournamentReferee from "../models/tournamentReferee.model";

import KnockoutBracket from "../models/knockoutBracket.model";
import Entry from "../models/entry.model";
import EntryMember from "../models/entryMember.model";
import User from "../models/user.model";
import groupStandingService from "./groupStanding.service";
import knockoutBracketService from "./knockoutBracket.service";
import scheduleService from "./schedule.service";
import { Stage, STAGES } from "../models/schedule.model";
import { MATCH_STATUSES, MatchStatus, RESULT_STATUSES, ResultStatus } from "../models/match.model";

// ─── Types ────────────────────────────────────────────────────────────────────

interface MatchWithContext {
  instance: Match;
  category: TournamentCategory;
  tournament: Tournament;
}

interface CategoryMatchesFilters {
  stage?: Stage;
  status?: MatchStatus;
  resultStatus?: ResultStatus;
  offset?: number;
  limit?: number;
}

interface RefereeAssignedMatchesFilters {
  categoryId: number;
  statuses?: MatchStatus[];
  offset?: number;
  limit?: number;
}

interface MatchFinalizeSummary {
  match: Match;
  entryASubMatchWins: number;
  entryBSubMatchWins: number;
  winsToFinalize: number;
  matchReadyToFinalize: boolean;
  winnerEntryId?: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const createEntryMemberInclude = () => ({
  model: EntryMember,
  as: "members",
  include: [
    {
      model: User,
      as: "user",
      attributes: ["id", "firstName", "lastName", "email", "avatarUrl"],
    },
  ],
});

const createMatchDetailInclude = () => [
  {
    model: Schedule,
    as: "schedule",
    include: [{ model: TournamentCategory, as: "tournamentCategory" }],
  },
  { model: Entry, as: "entryA", include: [createEntryMemberInclude()] },
  { model: Entry, as: "entryB", include: [createEntryMemberInclude()] },
  {
    model: MatchReferee,
    as: "matchReferees",
    include: [
      {
        model: User,
        as: "referee",
        attributes: ["id", "firstName", "lastName", "email"],
      },
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getMatchWithContext(matchId: number): Promise<MatchWithContext> {
  const instance = await Match.findByPk(matchId, {
    include: [
      {
        model: Schedule,
        as: "schedule",
        include: [
          {
            model: TournamentCategory,
            as: "tournamentCategory",
            include: [{ model: Tournament }],
          },
        ],
      },
    ],
  });
  if (!instance) throw new Error("Match not found");

  const category = instance.schedule?.tournamentCategory;
  if (!category) throw new Error("Match schedule or category not found");

  const tournament = category.tournament;
  if (!tournament) throw new Error("Tournament not found");

  return { instance, category, tournament };
}

async function assertChiefReferee(
  userId: number,
  tournamentId: number,
): Promise<void> {
  const ref = await TournamentReferee.findOne({
    where: { refereeId: userId, tournamentId, role: "chief" },
  });
  if (!ref) throw new Error("Only the chief referee can perform this action");
}

async function assertMatchReferee(
  userId: number,
  matchId: number,
): Promise<void> {
  const ref = await MatchReferee.findOne({
    where: { matchId, refereeId: userId },
  });
  if (!ref) throw new Error("Only an assigned referee can perform this action");
}

async function assertTournamentReferee(
  userId: number,
  tournamentId: number,
): Promise<void> {
  const ref = await TournamentReferee.findOne({
    where: {
      refereeId: userId,
      tournamentId,
      role: { [Op.in]: ["referee", "chief"] },
    },
  });
  if (!ref) throw new Error("Only a tournament referee can perform this action");
}

function countSubMatchWins(subMatches: SubMatch[]): {
  entryASubMatchWins: number;
  entryBSubMatchWins: number;
} {
  return subMatches.reduce(
    (acc, subMatch) => {
      if (subMatch.winnerTeam === "A") acc.entryASubMatchWins++;
      else if (subMatch.winnerTeam === "B") acc.entryBSubMatchWins++;
      return acc;
    },
    { entryASubMatchWins: 0, entryBSubMatchWins: 0 },
  );
}

function assertValidStage(stage?: string): asserts stage is Stage | undefined {
  if (stage && !STAGES.includes(stage as Stage)) {
    throw new Error(`Invalid stage. Must be one of: ${STAGES.join(", ")}`);
  }
}

function assertValidMatchStatus(
  status?: string,
): asserts status is MatchStatus | undefined {
  if (status && !MATCH_STATUSES.includes(status as MatchStatus)) {
    throw new Error(
      `Invalid match status. Must be one of: ${MATCH_STATUSES.join(", ")}`,
    );
  }
}

function assertValidMatchStatuses(statuses?: string[]): asserts statuses is MatchStatus[] | undefined {
  const invalidStatus = statuses?.find(
    (status) => !MATCH_STATUSES.includes(status as MatchStatus),
  );
  if (invalidStatus) {
    throw new Error(
      `Invalid match status "${invalidStatus}". Must be one of: ${MATCH_STATUSES.join(", ")}`,
    );
  }
}

function assertValidResultStatus(
  resultStatus?: string,
): asserts resultStatus is ResultStatus | undefined {
  if (resultStatus && !RESULT_STATUSES.includes(resultStatus as ResultStatus)) {
    throw new Error(
      `Invalid result status. Must be one of: ${RESULT_STATUSES.join(", ")}`,
    );
  }
}

async function paginateMatchIds(options: {
  where?: any;
  include?: any[];
  order?: any[];
  offset?: number;
  limit?: number;
}): Promise<{ ids: number[]; count: number }> {
  const count = (await Match.count({
    where: options.where,
    include: options.include,
    distinct: true,
    col: "id",
  } as any)) as unknown as number;

  const rows = await Match.findAll({
    where: options.where,
    include: options.include,
    attributes: ["id"],
    order: options.order,
    offset: options.offset ?? 0,
    limit: options.limit ?? 10,
    subQuery: false,
  } as any);

  return {
    ids: [...new Set(rows.map((match) => match.id))],
    count,
  };
}

async function loadMatchesByIds(
  ids: number[],
  include: any[],
  order: any[] = [],
): Promise<Match[]> {
  if (ids.length === 0) return [];

  const matches = await Match.findAll({
    where: { id: { [Op.in]: ids } },
    include,
    order,
  });
  const byId = new Map(matches.map((match) => [match.id, match]));

  return ids
    .map((id) => byId.get(id))
    .filter((match): match is Match => Boolean(match));
}

async function assignUmpiresToSubMatches(
  matchId: number,
  t: Transaction,
): Promise<void> {
  const matchReferees = await MatchReferee.findAll({
    where: { matchId },
    attributes: ["refereeId"],
    order: [["id", "ASC"]],
    transaction: t,
  });

  const refereeIds = matchReferees.map((ref) => ref.refereeId);
  if (refereeIds.length === 0) return;

  const hasAssistant = refereeIds.length >= 2;
  const firstRefereeId =
    hasAssistant && Math.random() < 0.5 ? refereeIds[1]! : refereeIds[0]!;
  const secondRefereeId =
    hasAssistant && firstRefereeId === refereeIds[0]!
      ? refereeIds[1]!
      : refereeIds[0]!;

  const subMatches = await SubMatch.findAll({
    where: { matchId },
    order: [["subMatchNumber", "ASC"]],
    transaction: t,
  });

  for (const subMatch of subMatches) {
    await subMatch.update(
      {
        umpireId: firstRefereeId,
        assistantUmpireId: hasAssistant ? secondRefereeId : null,
      },
      { transaction: t },
    );
  }
}

// ─── Service ──────────────────────────────────────────────────────────────────

export class MatchService {
  async findById(matchId: number): Promise<Match | null> {
    return Match.findByPk(matchId, {
      include: [
        ...createMatchDetailInclude(),
        { model: Entry, as: "winnerEntry", include: [createEntryMemberInclude()] },
        { model: SubMatch, as: "subMatches", include: [{ model: MatchSet, as: "matchSets" }] },
      ],
      order: [
        [{ model: SubMatch, as: "subMatches" }, "subMatchNumber", "ASC"],
        [
          { model: SubMatch, as: "subMatches" },
          { model: MatchSet, as: "matchSets" },
          "setNumber",
          "ASC",
        ],
      ],
    });
  }

  async findByEntryNames(
    entryAName: string,
    entryBName: string,
    filters: { tournamentId?: number; categoryId?: number } = {},
    offset = 0,
    limit = 10,
  ): Promise<{ matches: Match[]; count: number; offset: number; limit: number }> {
    const firstNamePattern = `%${entryAName.trim()}%`;
    const secondNamePattern = `%${entryBName.trim()}%`;
    const scheduleWhere = filters.categoryId ? { categoryId: filters.categoryId } : undefined;
    const categoryWhere = filters.tournamentId ? { tournamentId: filters.tournamentId } : undefined;

    const filterInclude = [
      {
        model: Schedule,
        as: "schedule",
        ...(scheduleWhere && { where: scheduleWhere, required: true }),
        include: [
          {
            model: TournamentCategory,
            as: "tournamentCategory",
            ...(categoryWhere && { where: categoryWhere, required: true }),
          },
        ],
      },
      { model: Entry, as: "entryA", required: true },
      { model: Entry, as: "entryB", required: true },
    ];

    const { ids, count } = await paginateMatchIds({
      where: {
        [Op.or]: [
          {
            "$entryA.name$": { [Op.like]: firstNamePattern },
            "$entryB.name$": { [Op.like]: secondNamePattern },
          },
          {
            "$entryA.name$": { [Op.like]: secondNamePattern },
            "$entryB.name$": { [Op.like]: firstNamePattern },
          },
        ],
      },
      include: filterInclude,
      offset,
      limit,
      order: [["updatedAt", "DESC"]],
    });

    const matches = await loadMatchesByIds(
      ids,
      [
        {
          model: Schedule,
          as: "schedule",
          include: [
            {
              model: TournamentCategory,
              as: "tournamentCategory",
            },
          ],
        },
        { model: Entry, as: "entryA", include: [createEntryMemberInclude()] },
        { model: Entry, as: "entryB", include: [createEntryMemberInclude()] },
        { model: Entry, as: "winnerEntry", include: [createEntryMemberInclude()] },
        {
          model: MatchReferee,
          as: "matchReferees",
          include: [
            {
              model: User,
              as: "referee",
              attributes: ["id", "firstName", "lastName", "email"],
            },
          ],
        },
        { model: SubMatch, as: "subMatches", include: [{ model: MatchSet, as: "matchSets" }] },
      ],
      [
        [{ model: SubMatch, as: "subMatches" }, "subMatchNumber", "ASC"],
        [
          { model: SubMatch, as: "subMatches" },
          { model: MatchSet, as: "matchSets" },
          "setNumber",
          "ASC",
        ],
      ],
    );

    return { matches, count, offset, limit };
  }

  // ── 1. Bắt đầu trận ───────────────────────────────────────────────────────

  /**
   * Chuyển match sang in_progress.
   * Assign bàn thi đấu động (nếu có bàn trống).
   * Assign trọng tài động từ pool của tournament.
   */
  async startMatch(matchId: number, refereeId: number): Promise<Match> {
    const { instance, tournament } = await getMatchWithContext(matchId);
    await assertTournamentReferee(refereeId, tournament.id);

    if (instance.status !== "scheduled") {
      throw new Error(
        `Cannot start match. Status is "${instance.status}", must be "scheduled"`,
      );
    }
    if (!instance.entryAId || !instance.entryBId) {
      throw new Error("Cannot start match before both entries are assigned");
    }

    return await sequelize.transaction(async (t) => {
      await instance.update({ status: "in_progress" }, { transaction: t });

      // Assign bàn thi đấu động (tìm bàn trống)
      await scheduleService.assignTableForMatch(matchId, tournament.id, t);

      // Assign trọng tài động (chọn người rảnh nhất)
      await scheduleService.assignRefereeDynamic(matchId, tournament.id, t);

      // Assign umpire/assistantUmpire cho các sub-match vừa có referee
      await assignUmpiresToSubMatches(matchId, t);

      return instance.reload({ transaction: t });
    });
  }

  // ── 2. Nộp kết quả (trọng tài) ────────────────────────────────────────────

  /**
   * Trọng tài nộp kết quả → status = completed, resultStatus = pending.
   * Chief referee sẽ approve sau.
   */
  async finalizeMatch(matchId: number, refereeId: number): Promise<Match> {
    const { instance } = await getMatchWithContext(matchId);
    await assertMatchReferee(refereeId, matchId);

    if (instance.status !== "in_progress") {
      throw new Error(
        `Cannot finalize match. Status is "${instance.status}", must be "in_progress"`,
      );
    }
    if (!instance.entryAId || !instance.entryBId) {
      throw new Error("Cannot finalize match before both entries are assigned");
    }

    const subMatches = await SubMatch.findAll({
      where: { matchId },
      order: [["subMatchNumber", "ASC"]],
    });
    if (subMatches.length === 0) throw new Error("No sub-matches found for this match");

    const { entryASubMatchWins, entryBSubMatchWins } =
      countSubMatchWins(subMatches);
    const winsToFinalize = Math.floor(subMatches.length / 2) + 1;

    if (
      entryASubMatchWins < winsToFinalize &&
      entryBSubMatchWins < winsToFinalize
    ) {
      throw new Error(
        `Match not complete. Need ${winsToFinalize} sub-match wins. Entry A: ${entryASubMatchWins}, Entry B: ${entryBSubMatchWins}`,
      );
    }

    const winnerEntryId =
      entryASubMatchWins >= winsToFinalize ? instance.entryAId : instance.entryBId;

    await instance.update({
      status: "completed",
      winnerEntryId,
      resultStatus: "pending",
    });

    return instance;
  }

  // ── 3. Approve kết quả (chief referee) ───────────────────────────────────

  async approveMatchResult(
    matchId: number,
    chiefRefereeId: number,
    reviewNotes?: string,
  ): Promise<Match> {
    const { instance, category, tournament } =
      await getMatchWithContext(matchId);
    await assertChiefReferee(chiefRefereeId, tournament.id);

    if (instance.status !== "completed") {
      throw new Error(
        `Cannot approve. Status is "${instance.status}", must be "completed"`,
      );
    }
    if (instance.resultStatus !== "pending") {
      throw new Error(
        `Cannot approve. Result status is "${instance.resultStatus}", must be "pending"`,
      );
    }
    if (!instance.winnerEntryId) {
      throw new Error("Match has no winner set");
    }

    await instance.update({ resultStatus: "approved", reviewNotes });

    // Cập nhật standings hoặc bracket
    const stage = instance.schedule?.stage;
    // match.service.ts — sửa trong approveMatchResult()

    if (stage === "group") {
      await groupStandingService.updateStandingsAfterMatch(
        chiefRefereeId, // ← thêm vào
        matchId,
      );
    } else if (stage === "knockout") {
      await knockoutBracketService.advanceWinner(
        chiefRefereeId,
        await this.getBracketIdByMatch(matchId),
        instance.winnerEntryId,
      );
    }

    return instance;
  }

  // ── 5. Pending matches (chief referee dashboard) ──────────────────────────

  async findPendingMatches(
    chiefRefereeId: number,
    tournamentId: number,
    offset = 0,
    limit = 10,
  ): Promise<{ matches: Match[]; count: number }> {
    await assertChiefReferee(chiefRefereeId, tournamentId);

    const filterInclude = [
      {
        model: Schedule,
        as: "schedule",
        required: true,
        include: [
          {
            model: TournamentCategory,
            as: "tournamentCategory",
            where: { tournamentId },
            required: true,
          },
        ],
      },
    ];

    const { ids, count } = await paginateMatchIds({
      where: { status: "completed", resultStatus: "pending" },
      include: filterInclude,
      offset,
      limit,
      order: [["updatedAt", "DESC"]],
    });

    const matches = await loadMatchesByIds(
      ids,
      [
        {
          model: Schedule,
          as: "schedule",
          include: [
            {
              model: TournamentCategory,
              as: "tournamentCategory",
              where: { tournamentId },
              required: true,
            },
          ],
        },
        { model: SubMatch, as: "subMatches", include: [{ model: MatchSet, as: "matchSets" }] },
      ],
      [
        [{ model: SubMatch, as: "subMatches" }, "subMatchNumber", "ASC"],
        [
          { model: SubMatch, as: "subMatches" },
          { model: MatchSet, as: "matchSets" },
          "setNumber",
          "ASC",
        ],
      ],
    );

    return { matches, count };
  }

  // ── 5.1 Category schedules & matches (chief referee dashboard) ───────────

  async findCategorySchedulesAndMatchesForChiefReferee(
    chiefRefereeId: number,
    categoryId: number,
    filters: CategoryMatchesFilters = {},
  ): Promise<{ matches: Match[]; count: number }> {
    assertValidStage(filters.stage);
    assertValidMatchStatus(filters.status);
    assertValidResultStatus(filters.resultStatus);

    const category = await TournamentCategory.findByPk(categoryId);
    if (!category) throw new Error("Category not found");

    await assertChiefReferee(chiefRefereeId, category.tournamentId);

    const matchWhere: Record<string, unknown> = {};
    if (filters.status) matchWhere.status = filters.status;
    if (filters.resultStatus) matchWhere.resultStatus = filters.resultStatus;

    const filterInclude = [
      {
        model: Schedule,
        as: "schedule",
        where: {
          categoryId,
          ...(filters.stage && { stage: filters.stage }),
        },
        required: true,
      },
    ];

    const { ids, count } = await paginateMatchIds({
      where: matchWhere,
      include: filterInclude,
      offset: filters.offset ?? 0,
      limit: filters.limit ?? 10,
      order: [
        [{ model: Schedule, as: "schedule" }, "scheduledAt", "ASC"],
        ["id", "ASC"],
      ],
    });

    const matches = await loadMatchesByIds(
      ids,
      [
        {
          model: Schedule,
          as: "schedule",
          include: [{ model: TournamentCategory, as: "tournamentCategory" }],
        },
        { model: Entry, as: "entryA", include: [createEntryMemberInclude()] },
        { model: Entry, as: "entryB", include: [createEntryMemberInclude()] },
        { model: Entry, as: "winnerEntry", include: [createEntryMemberInclude()] },
        {
          model: MatchReferee,
          as: "matchReferees",
          include: [
            {
              model: User,
              as: "referee",
              attributes: ["id", "firstName", "lastName", "email"],
            },
          ],
        },
        {
          model: SubMatch,
          as: "subMatches",
          include: [{ model: MatchSet, as: "matchSets" }],
        },
      ],
      [
        [{ model: SubMatch, as: "subMatches" }, "subMatchNumber", "ASC"],
        [
          { model: SubMatch, as: "subMatches" },
          { model: MatchSet, as: "matchSets" },
          "setNumber",
          "ASC",
        ],
      ],
    );

    return { matches, count };
  }

  // ── 5.2 Assigned matches (referee dashboard) ─────────────────────────────

  async findAssignedMatchesForReferee(
    refereeId: number,
    filters: RefereeAssignedMatchesFilters,
  ): Promise<{ matches: Match[]; count: number }> {
    assertValidMatchStatuses(filters.statuses);

    const where = filters.statuses ? { status: { [Op.in]: filters.statuses } } : {};
    const filterInclude = [
      {
        model: Schedule,
        as: "schedule",
        where: { categoryId: filters.categoryId },
        required: true,
      },
      {
        model: MatchReferee,
        as: "matchReferees",
        where: { refereeId },
        required: true,
        attributes: [],
      },
    ];

    const { ids, count } = await paginateMatchIds({
      where,
      include: filterInclude,
      offset: filters.offset ?? 0,
      limit: filters.limit ?? 10,
      order: [
        ["status", "DESC"],
        ["updatedAt", "DESC"],
      ],
    });

    const matches = await loadMatchesByIds(
      ids,
      [
        {
          model: Schedule,
          as: "schedule",
          include: [{ model: TournamentCategory, as: "tournamentCategory" }],
        },
        { model: Entry, as: "entryA", include: [createEntryMemberInclude()] },
        { model: Entry, as: "entryB", include: [createEntryMemberInclude()] },
        { model: Entry, as: "winnerEntry", include: [createEntryMemberInclude()] },
        {
          model: MatchReferee,
          as: "matchReferees",
          include: [
            {
              model: User,
              as: "referee",
              attributes: ["id", "firstName", "lastName", "email"],
            },
          ],
        },
        {
          model: SubMatch,
          as: "subMatches",
          include: [{ model: MatchSet, as: "matchSets" }],
        },
      ],
      [
        [{ model: SubMatch, as: "subMatches" }, "subMatchNumber", "ASC"],
        [
          { model: SubMatch, as: "subMatches" },
          { model: MatchSet, as: "matchSets" },
          "setNumber",
          "ASC",
        ],
      ],
    );

    return { matches, count };
  }

  async getPendingMatch(
    matchId: number,
    chiefRefereeId: number,
  ): Promise<{ match: Match }> {
    const { instance, tournament } = await getMatchWithContext(matchId);
    await assertChiefReferee(chiefRefereeId, tournament.id);

    if (instance.resultStatus !== "pending") {
      throw new Error(
        `Result status is "${instance.resultStatus}", must be "pending" to preview`,
      );
    }

    return { match: instance };
  }

  async getFinalizeSummary(
    matchId: number,
    refereeId: number,
  ): Promise<MatchFinalizeSummary> {
    await assertMatchReferee(refereeId, matchId);

    const match = await Match.findByPk(matchId, {
      include: [
        {
          model: Schedule,
          as: "schedule",
          include: [{ model: TournamentCategory, as: "tournamentCategory" }],
        },
        { model: Entry, as: "entryA", include: [createEntryMemberInclude()] },
        { model: Entry, as: "entryB", include: [createEntryMemberInclude()] },
        {
          model: MatchReferee,
          as: "matchReferees",
          include: [
            {
              model: User,
              as: "referee",
              attributes: ["id", "firstName", "lastName", "email"],
            },
          ],
        },
        {
          model: SubMatch,
          as: "subMatches",
          include: [{ model: MatchSet, as: "matchSets" }],
        },
      ],
      order: [
        [{ model: SubMatch, as: "subMatches" }, "subMatchNumber", "ASC"],
        [
          { model: SubMatch, as: "subMatches" },
          { model: MatchSet, as: "matchSets" },
          "setNumber",
          "ASC",
        ],
      ],
    });
    if (!match) throw new Error("Match not found");

    const subMatches = match.subMatches ?? [];
    const { entryASubMatchWins, entryBSubMatchWins } =
      countSubMatchWins(subMatches);
    const winsToFinalize = Math.floor(subMatches.length / 2) + 1;
    const matchReadyToFinalize =
      entryASubMatchWins >= winsToFinalize ||
      entryBSubMatchWins >= winsToFinalize;
    const winnerEntryId = entryASubMatchWins >= winsToFinalize
      ? match.entryAId
      : entryBSubMatchWins >= winsToFinalize
        ? match.entryBId
        : undefined;

    return {
      match,
      entryASubMatchWins,
      entryBSubMatchWins,
      winsToFinalize,
      matchReadyToFinalize,
      ...(winnerEntryId && { winnerEntryId }),
    };
  }

  // ── 6. Upcoming & history cho athlete ────────────────────────────────────

  async findUpcomingMatchesByAthlete(
    userId: number,
    offset = 0,
    limit = 10,
  ): Promise<{ matches: Match[]; count: number }> {
    const entryIds = await this.getEntryIdsByUser(userId);
    if (entryIds.length === 0) return { matches: [], count: 0 };

    const where = {
      [Op.or]: [
        { entryAId: { [Op.in]: entryIds } },
        { entryBId: { [Op.in]: entryIds } },
      ],
      status: { [Op.in]: ["scheduled", "in_progress"] },
    };

    const { ids, count } = await paginateMatchIds({
      where,
      include: [
        {
          model: Schedule,
          as: "schedule",
          required: true,
        },
      ],
      offset,
      limit,
      order: [[{ model: Schedule, as: "schedule" }, "scheduledAt", "ASC"]],
    });

    const matches = await loadMatchesByIds(ids, createMatchDetailInclude());

    return { matches, count };
  }

  async findMatchHistoryByAthlete(
    userId: number,
    offset = 0,
    limit = 10,
  ): Promise<{ matches: Match[]; count: number }> {
    const entryIds = await this.getEntryIdsByUser(userId);
    if (entryIds.length === 0) return { matches: [], count: 0 };

    const where = {
      [Op.or]: [
        { entryAId: { [Op.in]: entryIds } },
        { entryBId: { [Op.in]: entryIds } },
      ],
      status: "completed",
      resultStatus: "approved",
    };

    const { ids, count } = await paginateMatchIds({
      where,
      offset,
      limit,
      order: [["updatedAt", "DESC"]],
    });

    const matches = await loadMatchesByIds(
      ids,
      [
        ...createMatchDetailInclude(),
        { model: Entry, as: "winnerEntry", include: [createEntryMemberInclude()] },
        { model: SubMatch, as: "subMatches", include: [{ model: MatchSet, as: "matchSets" }] },
      ],
      [
        [{ model: SubMatch, as: "subMatches" }, "subMatchNumber", "ASC"],
        [
          { model: SubMatch, as: "subMatches" },
          { model: MatchSet, as: "matchSets" },
          "setNumber",
          "ASC",
        ],
      ],
    );

    return { matches, count };
  }

  /**
   * Bắt đầu nhiều trận cùng lúc.
   * Dùng khi tournament có nhiều bàn thi đấu chạy song song.
   * Mỗi trận vẫn assign bàn và trọng tài động độc lập.
   * Trận nào fail sẽ ghi vào errors, không rollback toàn bộ.
   */
  async bulkStartMatches(
    refereeId: number,
    matchIds: number[],
  ): Promise<{
    succeeded: Match[];
    failed: { matchId: number; reason: string }[];
  }> {
    if (matchIds.length === 0) throw new Error("matchIds must not be empty");

    const succeeded: Match[] = [];
    const failed: { matchId: number; reason: string }[] = [];

    for (const matchId of matchIds) {
      try {
        const match = await this.startMatch(matchId, refereeId);
        succeeded.push(match);
      } catch (err) {
        failed.push({
          matchId,
          reason: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }

    return { succeeded, failed };
  }

  // ── Helpers nội bộ ────────────────────────────────────────────────────────

  private async getEntryIdsByUser(userId: number): Promise<number[]> {
    const members = await EntryMember.findAll({
      where: { userId },
      attributes: ["entryId"],
    });
    return members.map((m) => m.entryId);
  }

  private async getBracketIdByMatch(matchId: number): Promise<number> {
    const bracket = await KnockoutBracket.findOne({
      where: { matchId },
      attributes: ["id"],
    });
    if (!bracket) throw new Error("Knockout bracket not found for this match");
    return bracket.id;
  }
}

export default new MatchService();
