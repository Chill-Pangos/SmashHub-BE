// match.service.ts
import { Op, Transaction } from "sequelize";
import { sequelize } from "../config/database";
import Match, { MatchStatus } from "../models/match.model";
import MatchReferee from "../models/matchReferee.model";
import SubMatch from "../models/subMatch.model";
import MatchSet from "../models/matchSet.model";
import Schedule from "../models/schedule.model";
import TournamentCategory from "../models/tournamentCategory.model";
import Tournament from "../models/tournament.model";
import TournamentReferee from "../models/tournamentReferee.model";
import GroupStanding from "../models/groupStanding.model";
import KnockoutBracket from "../models/knockoutBracket.model";
import Entry from "../models/entry.model";
import EntryMember from "../models/entryMember.model";
import User from "../models/user.model";
import groupStandingService from "./groupStanding.service";
import knockoutBracketService from "./knockoutBracket.service";
import scheduleService from "./schedule.service";

// ─── Types ────────────────────────────────────────────────────────────────────

interface MatchWithContext {
  instance: Match;
  category: TournamentCategory;
  tournament: Tournament;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ENTRY_MEMBER_INCLUDE = {
  model: EntryMember,
  as: "members",
  include: [
    {
      model: User,
      as: "user",
      attributes: ["id", "firstName", "lastName", "email", "avatarUrl"],
    },
  ],
};

const MATCH_DETAIL_INCLUDE = [
  {
    model: Schedule,
    as: "schedule",
    include: [{ model: TournamentCategory, as: "tournamentCategory" }],
  },
  { model: Entry, as: "entryA", include: [ENTRY_MEMBER_INCLUDE] },
  { model: Entry, as: "entryB", include: [ENTRY_MEMBER_INCLUDE] },
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

function countSetsWon(sets: MatchSet[]): {
  entryASets: number;
  entryBSets: number;
} {
  return sets.reduce(
    (acc, set) => {
      if (set.entryAScore > set.entryBScore) acc.entryASets++;
      else if (set.entryBScore > set.entryAScore) acc.entryBSets++;
      return acc;
    },
    { entryASets: 0, entryBSets: 0 },
  );
}

// ─── Service ──────────────────────────────────────────────────────────────────

export class MatchService {
  // ── 1. Bắt đầu trận ───────────────────────────────────────────────────────

  /**
   * Chuyển match sang in_progress.
   * Assign trọng tài động từ pool của tournament.
   */
  async startMatch(matchId: number, refereeId: number): Promise<Match> {
    const { instance, tournament } = await getMatchWithContext(matchId);
    await assertMatchReferee(refereeId, matchId);

    if (instance.status !== "scheduled") {
      throw new Error(
        `Cannot start match. Status is "${instance.status}", must be "scheduled"`,
      );
    }

    return await sequelize.transaction(async (t) => {
      await instance.update({ status: "in_progress" }, { transaction: t });

      // Assign trọng tài động (chọn người rảnh nhất)
      await scheduleService.assignRefereeDynamic(matchId, tournament.id, t);

      return instance.reload({ transaction: t });
    });
  }

  // ── 2. Nộp kết quả (trọng tài) ────────────────────────────────────────────

  /**
   * Trọng tài nộp kết quả → status = completed, resultStatus = pending.
   * Chief referee sẽ approve/reject sau.
   */
  async finalizeMatch(matchId: number, refereeId: number): Promise<Match> {
    const { instance, category } = await getMatchWithContext(matchId);
    await assertMatchReferee(refereeId, matchId);

    if (instance.status !== "in_progress") {
      throw new Error(
        `Cannot finalize match. Status is "${instance.status}", must be "in_progress"`,
      );
    }

    const sets = await MatchSet.findAll({ where: { matchId } });
    if (sets.length === 0) throw new Error("No sets found for this match");

    const { entryASets, entryBSets } = countSetsWon(sets);
    const setsToWin = Math.floor(category.maxSets / 2) + 1;

    if (entryASets < setsToWin && entryBSets < setsToWin) {
      throw new Error(
        `Match not complete. Need ${setsToWin} sets to win. Entry A: ${entryASets}, Entry B: ${entryBSets}`,
      );
    }

    const winnerEntryId =
      entryASets >= setsToWin ? instance.entryAId : instance.entryBId;

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

  // ── 4. Reject kết quả (chief referee) ────────────────────────────────────

  async rejectMatchResult(
    matchId: number,
    chiefRefereeId: number,
    reviewNotes: string,
  ): Promise<Match> {
    const { instance, tournament } = await getMatchWithContext(matchId);
    await assertChiefReferee(chiefRefereeId, tournament.id);

    if (instance.status !== "completed") {
      throw new Error(
        `Cannot reject. Status is "${instance.status}", must be "completed"`,
      );
    }
    if (instance.resultStatus !== "pending") {
      throw new Error(
        `Cannot reject. Result status is "${instance.resultStatus}", must be "pending"`,
      );
    }
    if (!reviewNotes?.trim()) {
      throw new Error(
        "Review notes are required when rejecting a match result",
      );
    }

    await instance.update({
      status: "in_progress",
      resultStatus: "rejected",
      reviewNotes,
      winnerEntryId: undefined,
    });

    return instance;
  }

  // ── 5. Pending matches (chief referee dashboard) ──────────────────────────

  async findPendingMatches(
    chiefRefereeId: number,
    tournamentId: number,
    skip = 0,
    limit = 10,
  ): Promise<{ matches: Match[]; count: number }> {
    await assertChiefReferee(chiefRefereeId, tournamentId);

    const { rows: matches, count } = await Match.findAndCountAll({
      where: { status: "completed", resultStatus: "pending" },
      include: [
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
        { model: MatchSet, as: "matchSets" },
      ],
      offset: skip,
      limit,
      order: [["updatedAt", "DESC"]],
      distinct: true,
    });

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

  // ── 6. Upcoming & history cho athlete ────────────────────────────────────

  async findUpcomingMatchesByAthlete(
    userId: number,
    skip = 0,
    limit = 10,
  ): Promise<{ matches: Match[]; count: number }> {
    const entryIds = await this.getEntryIdsByUser(userId);
    if (entryIds.length === 0) return { matches: [], count: 0 };

    const { rows: matches, count } = await Match.findAndCountAll({
      where: {
        [Op.or]: [
          { entryAId: { [Op.in]: entryIds } },
          { entryBId: { [Op.in]: entryIds } },
        ],
        status: { [Op.in]: ["scheduled", "in_progress"] },
      },
      include: MATCH_DETAIL_INCLUDE,
      order: [[{ model: Schedule, as: "schedule" }, "scheduledAt", "ASC"]],
      offset: skip,
      limit,
      distinct: true,
    });

    return { matches, count };
  }

  async findMatchHistoryByAthlete(
    userId: number,
    skip = 0,
    limit = 10,
  ): Promise<{ matches: Match[]; count: number }> {
    const entryIds = await this.getEntryIdsByUser(userId);
    if (entryIds.length === 0) return { matches: [], count: 0 };

    const { rows: matches, count } = await Match.findAndCountAll({
      where: {
        [Op.or]: [
          { entryAId: { [Op.in]: entryIds } },
          { entryBId: { [Op.in]: entryIds } },
        ],
        status: "completed",
        resultStatus: "approved",
      },
      include: [
        ...MATCH_DETAIL_INCLUDE,
        { model: Entry, as: "winnerEntry", include: [ENTRY_MEMBER_INCLUDE] },
        { model: MatchSet, as: "matchSets" },
      ],
      order: [["updatedAt", "DESC"]],
      offset: skip,
      limit,
      distinct: true,
    });

    return { matches, count };
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
