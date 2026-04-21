// matchSet.service.ts
import { sequelize } from "../config/database";
import MatchSet from "../models/matchSet.model";
import Match from "../models/match.model";
import SubMatch from "../models/subMatch.model";
import Schedule from "../models/schedule.model";
import TournamentCategory from "../models/tournamentCategory.model";
import MatchReferee from "../models/matchReferee.model";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SetScoreInput {
  subMatchId: number;
  entryAScore: number;
  entryBScore: number;
}

interface ScoreValidation {
  isValid: boolean;
  winner: "A" | "B" | null;
  error?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getSubMatchWithCategory(subMatchId: number): Promise<{
  subMatch: SubMatch;
  match: Match;
  category: TournamentCategory;
}> {
  const subMatch = await SubMatch.findByPk(subMatchId, {
    include: [{
      model: Match,
      as: "match",
      include: [{
        model: Schedule,
        as: "schedule",
        include: [{ model: TournamentCategory, as: "tournamentCategory" }],
      }],
    }],
  });
  if (!subMatch) throw new Error("SubMatch not found");
  if (!subMatch.match) throw new Error("Match not found");

  const category = subMatch.match.schedule?.tournamentCategory;
  if (!category) throw new Error("Match category not found");

  return { subMatch, match: subMatch.match, category };
}

async function assertMatchReferee(
  userId: number,
  matchId: number
): Promise<void> {
  const ref = await MatchReferee.findOne({ where: { matchId, refereeId: userId } });
  if (!ref) throw new Error("Only an assigned referee can perform this action");
}

/**
 * Validate điểm theo luật bóng bàn/cầu lông:
 * - Thắng khi đạt điểm target (11 cho bóng bàn) và dẫn ít nhất 2 điểm
 * - Từ deuce (target-1 : target-1) phải thắng cách 2 điểm
 */
function validateSetScore(
  entryAScore: number,
  entryBScore: number,
  targetScore: number // lấy từ category config
): ScoreValidation {
  if (entryAScore < 0 || entryBScore < 0) {
    return { isValid: false, winner: null, error: "Score cannot be negative" };
  }

  const maxScore = Math.max(entryAScore, entryBScore);
  const minScore = Math.min(entryAScore, entryBScore);
  const diff = maxScore - minScore;
  const deuce = targetScore - 1;

  if (maxScore < targetScore) {
    return {
      isValid: false,
      winner: null,
      error: `At least one player must reach ${targetScore} points`,
    };
  }

  // Trước deuce: thắng khi đạt đúng targetScore và đối < targetScore-1
  if (minScore < deuce) {
    if (maxScore === targetScore) {
      return { isValid: true, winner: entryAScore > entryBScore ? "A" : "B" };
    }
    return {
      isValid: false,
      winner: null,
      error: `Invalid score: winner must have exactly ${targetScore} when opponent has less than ${deuce}`,
    };
  }

  // Deuce trở lên: phải thắng cách 2 điểm
  if (diff >= 2) {
    return { isValid: true, winner: entryAScore > entryBScore ? "A" : "B" };
  }

  return {
    isValid: false,
    winner: null,
    error: `From ${deuce}-${deuce} onwards, must win by 2 points (current diff: ${diff})`,
  };
}

// ─── Service ──────────────────────────────────────────────────────────────────

export class MatchSetService {
  // ── 1. Thêm set với điểm số ───────────────────────────────────────────────

  async createSet(refereeId: number, data: SetScoreInput): Promise<MatchSet> {
    const { subMatch, match, category } = await getSubMatchWithCategory(data.subMatchId);
    await assertMatchReferee(refereeId, subMatch.matchId);

    if (subMatch.status !== "in_progress") {
      throw new Error(
        `Cannot add set. SubMatch status is "${subMatch.status}", must be "in_progress"`
      );
    }

    const existingSets = await MatchSet.findAll({
      where: { subMatchId: data.subMatchId },
      order: [["setNumber", "ASC"]],
    });

    if (existingSets.length >= category.maxSets) {
      throw new Error(
        `Cannot create more sets. Maximum is ${category.maxSets}`
      );
    }

    // Check đã có người thắng chưa
    const setsToWin = Math.floor(category.maxSets / 2) + 1;
    const entryASets = existingSets.filter(
      (s) => s.entryAScore > s.entryBScore
    ).length;
    const entryBSets = existingSets.filter(
      (s) => s.entryBScore > s.entryAScore
    ).length;

    if (entryASets >= setsToWin) {
      throw new Error(`Entry A already won ${entryASets} sets. SubMatch should be finalized.`);
    }
    if (entryBSets >= setsToWin) {
      throw new Error(`Entry B already won ${entryBSets} sets. SubMatch should be finalized.`);
    }

    // Validate điểm — target score lấy từ maxSets (5 sets → 11pts, 7 sets → 11pts)
    // Có thể mở rộng thành field riêng trong category nếu cần
    const targetScore = 11;
    const validation = validateSetScore(
      data.entryAScore,
      data.entryBScore,
      targetScore
    );
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    const nextSetNumber =
      existingSets.length > 0
        ? existingSets[existingSets.length - 1]!.setNumber + 1
        : 1;

    return await MatchSet.create({
      subMatchId: data.subMatchId,
      setNumber: nextSetNumber,
      entryAScore: data.entryAScore,
      entryBScore: data.entryBScore,
    });
  }

  // ── 2. Sửa điểm set (referee nhập sai) ───────────────────────────────────

  async updateSetScore(
    refereeId: number,
    setId: number,
    entryAScore: number,
    entryBScore: number
  ): Promise<MatchSet> {
    const set = await MatchSet.findByPk(setId);
    if (!set) throw new Error("Set not found");

    const { subMatch } = await getSubMatchWithCategory(set.subMatchId);
    await assertMatchReferee(refereeId, subMatch.matchId);

    if (subMatch.status !== "in_progress") {
      throw new Error("Can only update score while sub-match is in progress");
    }

    const validation = validateSetScore(entryAScore, entryBScore, 11);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    return await set.update({ entryAScore, entryBScore });
  }

  // ── 3. Queries ────────────────────────────────────────────────────────────

  async getSetsBySubMatch(subMatchId: number, options?: { skip?: number; limit?: number }): Promise<{ sets?: MatchSet[], pagination?: any } | MatchSet[]> {
    const skip = options?.skip || 0;
    const limit = options?.limit || 10;

    // If pagination is requested
    if (options && (options.skip !== undefined || options.limit !== undefined)) {
      const { count, rows } = await MatchSet.findAndCountAll({
        where: { subMatchId },
        order: [["setNumber", "ASC"]],
        offset: skip,
        limit: limit,
      });

      const totalPages = Math.ceil(count / limit);
      const page = Math.floor(skip / limit) + 1;

      return {
        sets: rows,
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

    return await MatchSet.findAll({
      where: { subMatchId },
      order: [["setNumber", "ASC"]],
    });
  }

  async getSetById(setId: number): Promise<MatchSet> {
    const set = await MatchSet.findByPk(setId);
    if (!set) throw new Error("Set not found");
    return set;
  }

  async deleteSet(refereeId: number, setId: number): Promise<void> {
    const set = await MatchSet.findByPk(setId);
    if (!set) throw new Error("Set not found");

    const { subMatch } = await getSubMatchWithCategory(set.subMatchId);
    await assertMatchReferee(refereeId, subMatch.matchId);

    if (subMatch.status !== "in_progress") {
      throw new Error("Can only delete set while sub-match is in progress");
    }

    // Chỉ cho xóa set cuối cùng
    const allSets = await MatchSet.findAll({
      where: { subMatchId: set.subMatchId },
      order: [["setNumber", "DESC"]],
    });
    if (allSets[0]?.id !== setId) {
      throw new Error("Can only delete the latest set");
    }

    await set.destroy();
  }
}

export default new MatchSetService();