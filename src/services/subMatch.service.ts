// subMatch.service.ts
import { sequelize } from "../config/database";
import SubMatch, { SubMatchStatus, Team } from "../models/subMatch.model";
import SubMatchPlayer from "../models/subMatchPlayer.model";
import MatchSet from "../models/matchSet.model";
import Match from "../models/match.model";
import MatchReferee from "../models/matchReferee.model";
import EntryMember from "../models/entryMember.model";
import Entry from "../models/entry.model";
import User from "../models/user.model";

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function assertMatchReferee(
  userId: number,
  matchId: number
): Promise<void> {
  const ref = await MatchReferee.findOne({ where: { matchId, refereeId: userId } });
  if (!ref) throw new Error("Only an assigned referee can perform this action");
}

async function getSubMatchWithMatch(subMatchId: number): Promise<SubMatch> {
  const subMatch = await SubMatch.findByPk(subMatchId, {
    include: [{ model: Match, as: "match" }],
  });
  if (!subMatch) throw new Error("SubMatch not found");
  return subMatch;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export class SubMatchService {
  // ── 1. Tạo sub-match (team format) ───────────────────────────────────────

  /**
   * Tạo các sub-match từ teamFormat của category.
   * VD: "S-D-S" → 3 sub-matches
   */
  async createSubMatchesFromFormat(
    refereeId: number,
    matchId: number,
    teamFormat: string
  ): Promise<SubMatch[]> {
    const match = await Match.findByPk(matchId);
    if (!match) throw new Error("Match not found");
    await assertMatchReferee(refereeId, matchId);

    if (match.status !== "in_progress") {
      throw new Error("Match must be in_progress to create sub-matches");
    }

    const existing = await SubMatch.findAll({ where: { matchId } });
    if (existing.length > 0) {
      throw new Error("Sub-matches already created for this match");
    }

    const formats = teamFormat.split("-");

    return await sequelize.transaction(async (t) => {
      const subMatches: SubMatch[] = [];
      for (let i = 0; i < formats.length; i++) {
        const subMatch = await SubMatch.create(
          {
            matchId,
            subMatchNumber: i + 1,
            status: "scheduled" satisfies SubMatchStatus,
          },
          { transaction: t }
        );
        subMatches.push(subMatch);
      }
      return subMatches;
    });
  }

  // ── 2. Bắt đầu sub-match + assign umpire ─────────────────────────────────

  async startSubMatch(
    refereeId: number,
    subMatchId: number
  ): Promise<SubMatch> {
    const subMatch = await getSubMatchWithMatch(subMatchId);
    await assertMatchReferee(refereeId, subMatch.matchId);

    if (subMatch.status !== "scheduled") {
      throw new Error(
        `Cannot start sub-match. Status is "${subMatch.status}", must be "scheduled"`
      );
    }

    // Lấy danh sách referees của match — 2 người tự thỏa thuận ai là umpire
    // Người gọi API này chính là umpire
    return await subMatch.update({
      status: "in_progress" satisfies SubMatchStatus,
      umpireId: refereeId,
    });
  }

  // ── 3. Kết thúc sub-match ─────────────────────────────────────────────────

  async finalizeSubMatch(
    refereeId: number,
    subMatchId: number
  ): Promise<SubMatch> {
    const subMatch = await getSubMatchWithMatch(subMatchId);
    await assertMatchReferee(refereeId, subMatch.matchId);

    if (subMatch.status !== "in_progress") {
      throw new Error(
        `Cannot finalize sub-match. Status is "${subMatch.status}", must be "in_progress"`
      );
    }

    const sets = await MatchSet.findAll({ where: { subMatchId } });
    if (sets.length === 0) throw new Error("No sets found for this sub-match");

    // Tính winner team từ sets
    let teamASets = 0;
    let teamBSets = 0;
    for (const set of sets) {
      if (set.entryAScore > set.entryBScore) teamASets++;
      else if (set.entryBScore > set.entryAScore) teamBSets++;
    }

    if (teamASets === teamBSets) {
      throw new Error("Sub-match cannot end in a draw");
    }

    const winnerTeam: Team = teamASets > teamBSets ? "A" : "B";

    return await subMatch.update({
      status: "completed" satisfies SubMatchStatus,
      winnerTeam,
    });
  }

  // ── 4. Assign players vào sub-match ──────────────────────────────────────

  async assignPlayers(
    refereeId: number,
    subMatchId: number,
    players: { entryMemberId: number; team: Team }[]
  ): Promise<SubMatchPlayer[]> {
    const subMatch = await getSubMatchWithMatch(subMatchId);
    await assertMatchReferee(refereeId, subMatch.matchId);

    if (subMatch.status !== "scheduled") {
      throw new Error("Can only assign players before sub-match starts");
    }

    // Validate team A và B đều có player
    const teamA = players.filter((p) => p.team === "A");
    const teamB = players.filter((p) => p.team === "B");
    if (teamA.length === 0 || teamB.length === 0) {
      throw new Error("Both teams must have at least 1 player");
    }

    return await sequelize.transaction(async (t) => {
      // Xóa assignments cũ
      await SubMatchPlayer.destroy({ where: { subMatchId }, transaction: t });

      return await SubMatchPlayer.bulkCreate(
        players.map((p) => ({ subMatchId, ...p })),
        { transaction: t }
      );
    });
  }

  // ── 5. Queries ────────────────────────────────────────────────────────────

  async getSubMatchesByMatch(matchId: number, options?: { skip?: number; limit?: number }): Promise<{ subMatches?: SubMatch[], pagination?: any } | SubMatch[]> {
    const skip = options?.skip || 0;
    const limit = options?.limit || 10;

    // If pagination is requested
    if (options && (options.skip !== undefined || options.limit !== undefined)) {
      const { count, rows } = await SubMatch.findAndCountAll({
        where: { matchId },
        include: [
          { model: MatchSet, as: "matchSets" },
          {
            model: SubMatchPlayer,
            as: "subMatchPlayers",
            include: [{
              model: EntryMember,
              as: "entryMember",
              include: [{
                model: User,
                as: "user",
                attributes: ["id", "firstName", "lastName"],
              }],
            }],
          },
        ],
        order: [["subMatchNumber", "ASC"]],
        offset: skip,
        limit: limit,
      });

      const totalPages = Math.ceil(count / limit);
      const page = Math.floor(skip / limit) + 1;

      return {
        subMatches: rows,
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

    return await SubMatch.findAll({
      where: { matchId },
      include: [
        { model: MatchSet, as: "matchSets" },
        {
          model: SubMatchPlayer,
          as: "subMatchPlayers",
          include: [{
            model: EntryMember,
            as: "entryMember",
            include: [{
              model: User,
              as: "user",
              attributes: ["id", "firstName", "lastName"],
            }],
          }],
        },
      ],
      order: [["subMatchNumber", "ASC"]],
    });
  }

  async getSubMatchById(subMatchId: number): Promise<SubMatch> {
    const subMatch = await SubMatch.findByPk(subMatchId, {
      include: [
        { model: MatchSet, as: "matchSets" },
        {
          model: SubMatchPlayer,
          as: "subMatchPlayers",
          include: [{ model: EntryMember, as: "entryMember" }],
        },
      ],
    });
    if (!subMatch) throw new Error("SubMatch not found");
    return subMatch;
  }
}

export default new SubMatchService();