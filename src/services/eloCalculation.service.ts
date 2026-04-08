// eloCalculation.service.ts
import { Transaction } from "sequelize";
import sequelize from "../config/database";
import Match from "../models/match.model";
import SubMatch from "../models/subMatch.model";
import MatchSet from "../models/matchSet.model";
import Entry from "../models/entry.model";
import EntryMember from "../models/entryMember.model";
import EloScore from "../models/eloScore.model";
import EloHistory from "../models/eloHistory.model";
import TournamentCategory from "../models/tournamentCategory.model";
import Schedule from "../models/schedule.model";
import Tournament from "../models/tournament.model";

// ─── Types ────────────────────────────────────────────────────────────────────

interface EloChangePreview {
  userId: number;
  currentElo: number;
  expectedElo: number;
  change: number;
}

export interface EloPreview {
  entryA: { averageElo: number; expectedScore: number; actualScore: number };
  entryB: { averageElo: number; expectedScore: number; actualScore: number };
  marginMultiplier: number;
  changes: EloChangePreview[];
}

export interface TournamentEloPreview {
  tournamentId: number;
  totalMatches: number;
  changes: {
    userId: number;
    currentElo: number;
    finalElo: number;
    totalDelta: number;
  }[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const K_FACTOR = 12;
const DEFAULT_ELO = 1000;

// ─── Pure ELO functions ───────────────────────────────────────────────────────

function expectedScore(ratingA: number, ratingB: number): number {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

function actualScore(winsA: number, total: number): number {
  return total === 0 ? 0 : winsA / total;
}

function marginMultiplier(winsA: number, winsB: number): number {
  const total = winsA + winsB;
  return total === 0 ? 1 : 1 + Math.abs(winsA - winsB) / total;
}

function calcEloDelta(
  current: number,
  expected: number,
  actual: number,
  margin: number
): number {
  return Math.round(K_FACTOR * margin * (actual - expected));
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getOrCreateEloScore(
  userId: number,
  t?: Transaction
): Promise<EloScore> {
  const options: any = {
    where: { userId },
    defaults: { userId, score: DEFAULT_ELO },
    transaction: t,
  };
  
  // Only add lock if transaction exists
  if (t && t.LOCK) {
    options.lock = t.LOCK.UPDATE;
  }
  
  const [score] = await EloScore.findOrCreate(options);
  return score;
}

async function getMemberElos(
  entryId: number,
  t?: Transaction
): Promise<{ userId: number; currentElo: number }[]> {
  const options: any = {
    where: { entryId },
    attributes: ["userId"],
    transaction: t,
  };
  
  // Only add lock if transaction exists
  if (t && t.LOCK) {
    options.lock = t.LOCK.UPDATE;
  }
  
  const members = await EntryMember.findAll(options);

  return await Promise.all(
    members.map(async (m) => {
      const elo = await getOrCreateEloScore(m.userId, t);
      return { userId: m.userId, currentElo: elo.score };
    })
  );
}

function averageElo(members: { currentElo: number }[]): number {
  if (members.length === 0) return DEFAULT_ELO;
  return members.reduce((sum, m) => sum + m.currentElo, 0) / members.length;
}

function countSubMatchResults(subMatches: SubMatch[]): {
  entryAWins: number;
  entryBWins: number;
  total: number;
} {
  const entryAWins = subMatches.filter((s) => s.winnerTeam === "A").length;
  const entryBWins = subMatches.filter((s) => s.winnerTeam === "B").length;
  return { entryAWins, entryBWins, total: entryAWins + entryBWins };
}

/**
 * Tính delta ELO cho 1 trận — không ghi DB.
 * currentElos là snapshot ELO tại thời điểm bắt đầu tính (trước giải).
 */
function calcMatchDeltas(
  match: Match,
  entryAMemberElos: { userId: number; currentElo: number }[],
  entryBMemberElos: { userId: number; currentElo: number }[]
): Map<number, number> {
  const deltas = new Map<number, number>();

  const { entryAWins, entryBWins, total } = countSubMatchResults(
    match.subMatches ?? []
  );
  if (total === 0) return deltas;

  const avgA = averageElo(entryAMemberElos);
  const avgB = averageElo(entryBMemberElos);
  const margin = marginMultiplier(entryAWins, entryBWins);

  const expectedA = expectedScore(avgA, avgB);
  const expectedB = 1 - expectedA;
  const actualA = actualScore(entryAWins, total);
  const actualB = actualScore(entryBWins, total);

  for (const { userId, currentElo } of entryAMemberElos) {
    const delta = calcEloDelta(currentElo, expectedA, actualA, margin);
    deltas.set(userId, (deltas.get(userId) ?? 0) + delta);
  }

  for (const { userId, currentElo } of entryBMemberElos) {
    const delta = calcEloDelta(currentElo, expectedB, actualB, margin);
    deltas.set(userId, (deltas.get(userId) ?? 0) + delta);
  }

  return deltas;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export class EloCalculationService {
  /**
   * Cập nhật ELO sau khi tournament kết thúc.
   * Tính delta từng trận, cộng dồn, ghi 1 lần per user.
   */
  async updateEloForTournament(tournamentId: number): Promise<void> {
    const matches = await this.getApprovedMatchesInTournament(tournamentId);

    if (matches.length === 0) {
      throw new Error("No approved matches found in this tournament");
    }

    // Lấy ELO snapshot trước khi tính (dùng ELO hiện tại — chưa bị giải này ảnh hưởng)
    const userEloSnapshot = await this.buildUserEloSnapshot(matches);

    // Tính tổng delta cho từng user
    const totalDeltas = new Map<number, number>();

    for (const match of matches) {
      const entryAMembers = this.getMembersFromEntry(
        match.entryA,
        userEloSnapshot
      );
      const entryBMembers = this.getMembersFromEntry(
        match.entryB,
        userEloSnapshot
      );

      const deltas = calcMatchDeltas(match, entryAMembers, entryBMembers);

      for (const [userId, delta] of deltas) {
        totalDeltas.set(userId, (totalDeltas.get(userId) ?? 0) + delta);
      }
    }

    // Ghi vào DB trong 1 transaction
    await sequelize.transaction(async (t) => {
      // Sử dụng matchId của trận cuối cùng trong giải làm reference
      const referenceMatchId = matches[matches.length - 1]!.id;
      
      for (const [userId, totalDelta] of totalDeltas) {
        const eloScore = await getOrCreateEloScore(userId, t);
        const previousElo = eloScore.score;
        const newEloValue = Math.max(0, previousElo + totalDelta);

        await eloScore.update({ score: newEloValue }, { transaction: t });

        await EloHistory.create(
          {
            userId,
            matchId: referenceMatchId, // gắn với trận cuối cùng của giải
            tournamentId,
            previousElo,
            newElo: newEloValue,
            eloDelta: totalDelta,
            changeReason: `Tournament ${tournamentId} completed (${matches.length} matches)`,
          },
          { transaction: t }
        );
      }
    });
  }

  /**
   * Preview thay đổi ELO của toàn giải — không ghi DB.
   */
  async previewTournamentEloChanges(
    tournamentId: number
  ): Promise<TournamentEloPreview> {
    const matches = await this.getApprovedMatchesInTournament(tournamentId);
    const userEloSnapshot = await this.buildUserEloSnapshot(matches);

    const totalDeltas = new Map<number, number>();

    for (const match of matches) {
      const entryAMembers = this.getMembersFromEntry(match.entryA, userEloSnapshot);
      const entryBMembers = this.getMembersFromEntry(match.entryB, userEloSnapshot);
      const deltas = calcMatchDeltas(match, entryAMembers, entryBMembers);

      for (const [userId, delta] of deltas) {
        totalDeltas.set(userId, (totalDeltas.get(userId) ?? 0) + delta);
      }
    }

    const changes = Array.from(totalDeltas.entries()).map(([userId, totalDelta]) => {
      const currentElo = userEloSnapshot.get(userId) ?? DEFAULT_ELO;
      return {
        userId,
        currentElo,
        finalElo: Math.max(0, currentElo + totalDelta),
        totalDelta,
      };
    });

    return {
      tournamentId,
      totalMatches: matches.length,
      changes: changes.sort((a, b) => b.finalElo - a.finalElo),
    };
  }

  /**
   * Preview ELO cho 1 trận cụ thể (dùng cho chief referee dashboard).
   */
  async previewMatchEloChanges(matchId: number): Promise<EloPreview> {
    const match = await Match.findByPk(matchId, {
      include: [
        { model: SubMatch, as: "subMatches" },
        { model: Entry, as: "entryA", include: [{ model: EntryMember, as: "members" }] },
        { model: Entry, as: "entryB", include: [{ model: EntryMember, as: "members" }] },
      ],
    });
    if (!match) throw new Error("Match not found");

    const entryAMemberElos = await getMemberElos(match.entryAId);
    const entryBMemberElos = await getMemberElos(match.entryBId);
    const avgA = averageElo(entryAMemberElos);
    const avgB = averageElo(entryBMemberElos);

    const { entryAWins, entryBWins, total } = countSubMatchResults(
      match.subMatches ?? []
    );
    const margin = marginMultiplier(entryAWins, entryBWins);
    const expectedA = expectedScore(avgA, avgB);
    const expectedB = 1 - expectedA;
    const actualA = actualScore(entryAWins, total);
    const actualB = actualScore(entryBWins, total);

    const buildChanges = (
      members: { userId: number; currentElo: number }[],
      expected: number,
      actual: number
    ): EloChangePreview[] =>
      members.map(({ userId, currentElo }) => {
        const delta = calcEloDelta(currentElo, expected, actual, margin);
        return {
          userId,
          currentElo,
          expectedElo: currentElo + delta,
          change: delta,
        };
      });

    return {
      entryA: { averageElo: avgA, expectedScore: expectedA, actualScore: actualA },
      entryB: { averageElo: avgB, expectedScore: expectedB, actualScore: actualB },
      marginMultiplier: margin,
      changes: [
        ...buildChanges(entryAMemberElos, expectedA, actualA),
        ...buildChanges(entryBMemberElos, expectedB, actualB),
      ],
    };
  }

  // ── Helpers nội bộ ────────────────────────────────────────────────────────

  private async getApprovedMatchesInTournament(
    tournamentId: number
  ): Promise<Match[]> {
    return await Match.findAll({
      where: { status: "completed", resultStatus: "approved" },
      include: [
        {
          model: Schedule,
          as: "schedule",
          required: true,
          include: [{
            model: TournamentCategory,
            as: "tournamentCategory",
            where: { tournamentId },
            required: true,
          }],
        },
        { model: SubMatch, as: "subMatches" },
        {
          model: Entry,
          as: "entryA",
          include: [{ model: EntryMember, as: "members" }],
        },
        {
          model: Entry,
          as: "entryB",
          include: [{ model: EntryMember, as: "members" }],
        },
      ],
    });
  }

  /**
   * Build snapshot ELO hiện tại của tất cả users tham gia giải.
   * Dùng ELO trước giải (không bị ảnh hưởng bởi các trận trong giải).
   */
  private async buildUserEloSnapshot(
    matches: Match[]
  ): Promise<Map<number, number>> {
    const userIds = new Set<number>();

    for (const match of matches) {
      for (const m of match.entryA?.members ?? []) userIds.add(m.userId);
      for (const m of match.entryB?.members ?? []) userIds.add(m.userId);
    }

    const snapshot = new Map<number, number>();

    await Promise.all(
      Array.from(userIds).map(async (userId) => {
        const elo = await getOrCreateEloScore(userId);
        snapshot.set(userId, elo.score);
      })
    );

    return snapshot;
  }

  private getMembersFromEntry(
    entry: Entry | undefined,
    snapshot: Map<number, number>
  ): { userId: number; currentElo: number }[] {
    return (entry?.members ?? []).map((m) => ({
      userId: m.userId,
      currentElo: snapshot.get(m.userId) ?? DEFAULT_ELO,
    }));
  }
}

export default new EloCalculationService();