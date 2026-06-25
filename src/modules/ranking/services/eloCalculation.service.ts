// eloCalculation.service.ts
import { Transaction } from "sequelize";
import sequelize from "../../../config/database";
import { competitionReadService } from "../../competition/public.read";
import { tournamentReadService } from "../../tournament/public.read";
import type { ApprovedTournamentMatch } from "../../competition/public.contracts";
import EloScore from "../models/eloScore.model";
import EloHistory from "../models/eloHistory.model";
import type {
  TournamentEloChange,
  TournamentEloUpdateResult,
} from "../public.contracts";

// ─── Constants ────────────────────────────────────────────────────────────────

const K_FACTOR = 12;
const DEFAULT_ELO = 1000;
const TIER_MULTIPLIERS: Record<number, number> = {
  1: 1.5,
  2: 1.35,
  3: 1.2,
  4: 1.1,
  5: 1,
};

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

function getTierMultiplier(tier?: number): number {
  if (!tier) return TIER_MULTIPLIERS[1]!;
  return TIER_MULTIPLIERS[tier] ?? TIER_MULTIPLIERS[1]!;
}

function calcEloDelta(
  current: number,
  expected: number,
  actual: number,
  margin: number,
  tierMultiplier: number
): number {
  return Math.round(K_FACTOR * margin * tierMultiplier * (actual - expected));
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

function averageElo(members: { currentElo: number }[]): number {
  if (members.length === 0) return DEFAULT_ELO;
  return members.reduce((sum, m) => sum + m.currentElo, 0) / members.length;
}

function countSubMatchResults(subMatches: ApprovedTournamentMatch["subMatches"]): {
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
  match: ApprovedTournamentMatch,
  entryAMemberElos: { userId: number; currentElo: number }[],
  entryBMemberElos: { userId: number; currentElo: number }[],
  tierMultiplier: number
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
    const delta = calcEloDelta(currentElo, expectedA, actualA, margin, tierMultiplier);
    deltas.set(userId, (deltas.get(userId) ?? 0) + delta);
  }

  for (const { userId, currentElo } of entryBMemberElos) {
    const delta = calcEloDelta(currentElo, expectedB, actualB, margin, tierMultiplier);
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
  async updateEloForTournament(tournamentId: number): Promise<TournamentEloUpdateResult> {
    const tournament = await tournamentReadService.getTournamentForElo(tournamentId);
    if (!tournament) {
      throw new Error("Tournament not found");
    }
    if (tournament.status !== "completed") {
      throw new Error("Tournament must be completed before Elo can be calculated");
    }

    const existingHistoryCount = await EloHistory.count({
      where: { tournamentId },
    });
    if (existingHistoryCount > 0) {
      throw new Error("ELO has already been calculated for this tournament");
    }

    const matches = await competitionReadService.getApprovedTournamentMatchesForElo(tournamentId);

    if (matches.length === 0) {
      throw new Error("No approved matches found in this tournament");
    }
    const tierMultiplier = getTierMultiplier(tournament.tier);

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

      const deltas = calcMatchDeltas(match, entryAMembers, entryBMembers, tierMultiplier);

      for (const [userId, delta] of deltas) {
        totalDeltas.set(userId, (totalDeltas.get(userId) ?? 0) + delta);
      }
    }

    // Ghi vào DB trong 1 transaction
    const changes: TournamentEloChange[] = [];

    await sequelize.transaction(async (t) => {
      // Sử dụng matchId của trận cuối cùng trong giải làm reference
      const referenceMatchId = matches[matches.length - 1]!.id;
      
      for (const [userId, totalDelta] of totalDeltas) {
        const eloScore = await getOrCreateEloScore(userId, t);
        const previousElo = eloScore.score;
        const newEloValue = Math.max(0, previousElo + totalDelta);

        await eloScore.update({ score: newEloValue }, { transaction: t });

        changes.push({
          userId,
          currentElo: previousElo,
          finalElo: newEloValue,
          totalDelta,
        });

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

    return {
      tournamentId,
      totalMatches: matches.length,
      tierMultiplier,
      historyRecordsCreated: changes.length,
      changes: changes.sort((a, b) => b.finalElo - a.finalElo),
    };
  }

  // ── Helpers nội bộ ────────────────────────────────────────────────────────

  /**
   * Build snapshot ELO hiện tại của tất cả users tham gia giải.
   * Dùng ELO trước giải (không bị ảnh hưởng bởi các trận trong giải).
   */
  private async buildUserEloSnapshot(
    matches: ApprovedTournamentMatch[]
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
    entry: ApprovedTournamentMatch["entryA"] | undefined,
    snapshot: Map<number, number>
  ): { userId: number; currentElo: number }[] {
    return (entry?.members ?? []).map((m) => ({
      userId: m.userId,
      currentElo: snapshot.get(m.userId) ?? DEFAULT_ELO,
    }));
  }
}

export default new EloCalculationService();
