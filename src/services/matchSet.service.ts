// matchSet.service.ts
import MatchSet from "../models/matchSet.model";
import Match from "../models/match.model";
import SubMatch from "../models/subMatch.model";
import Schedule from "../models/schedule.model";
import TournamentCategory from "../models/tournamentCategory.model";
import MatchReferee from "../models/matchReferee.model";
import matchSetScoreCacheService, {
  LiveMatchSetScoreCache,
  MatchSetScoreCache,
} from "./matchSetScoreCache.service";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SetScoreInput {
  subMatchId: number;
  setNumber?: number;
  entryAScore: number;
  entryBScore: number;
}

interface ScoreValidation {
  isValid: boolean;
  winner: "A" | "B" | null;
  error?: string;
}

type MatchSetResult = MatchSet | MatchSetScoreCache;

interface LiveSetScoreResult {
  message: string;
  liveScore: LiveMatchSetScoreCache;
  isCompleted: boolean;
  persistedSet?: MatchSet;
  nextSetNumber?: number;
  subMatchReadyToFinalize?: boolean;
  winningTeam?: "A" | "B";
  finalizationNotice?: FinalizationNotice;
}

interface FinalizationNotice {
  subMatchId: number;
  matchId: number;
  completedSetNumber: number;
  entryAScore: number;
  entryBScore: number;
  entryASets: number;
  entryBSets: number;
  winningTeam: "A" | "B";
  matchWillBeCompleted: boolean;
  winnerEntryId?: number;
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

async function cacheSetScore(set: MatchSet): Promise<void> {
  try {
    await matchSetScoreCacheService.setScore(set);
  } catch (error) {
    console.error("Failed to cache match set score:", error);
  }
}

async function getCachedOrModel(set: MatchSet): Promise<MatchSetResult> {
  try {
    const cachedSet = await matchSetScoreCacheService.getScore(set.id);
    if (cachedSet) return cachedSet;

    await matchSetScoreCacheService.setScore(set);
    return set;
  } catch (error) {
    console.error("Failed to read match set score cache:", error);
    return set;
  }
}

async function mergeCachedScores(sets: MatchSet[]): Promise<MatchSetResult[]> {
  return await Promise.all(sets.map(getCachedOrModel));
}

/**
 * Validate điểm theo luật bóng bàn:
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

function validateScoreRange(entryAScore: number, entryBScore: number): void {
  if (!Number.isInteger(entryAScore) || !Number.isInteger(entryBScore)) {
    throw new Error("Scores must be integers");
  }
  if (entryAScore < 0 || entryBScore < 0) {
    throw new Error("Score cannot be negative");
  }
  if (entryAScore > 30 || entryBScore > 30) {
    throw new Error("Score cannot exceed 30");
  }
}

function isSetCompleted(
  entryAScore: number,
  entryBScore: number,
  targetScore: number
): boolean {
  const maxScore = Math.max(entryAScore, entryBScore);
  const minScore = Math.min(entryAScore, entryBScore);
  const diff = maxScore - minScore;
  const deuce = targetScore - 1;

  if (maxScore < targetScore) return false;
  if (minScore < deuce) return maxScore === targetScore;
  return diff >= 2;
}

async function getExistingSets(subMatchId: number): Promise<MatchSet[]> {
  return await MatchSet.findAll({
    where: { subMatchId },
    order: [["setNumber", "ASC"]],
  });
}

function getNextSetNumber(existingSets: MatchSet[]): number {
  return existingSets.length > 0
    ? existingSets[existingSets.length - 1]!.setNumber + 1
    : 1;
}

function assertSubMatchCanAddSet(
  existingSets: MatchSet[],
  category: TournamentCategory
): void {
  if (existingSets.length >= category.maxSets) {
    throw new Error(`Cannot create more sets. Maximum is ${category.maxSets}`);
  }

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

function getWinningTeamFromSets(
  sets: MatchSet[],
  category: TournamentCategory,
): "A" | "B" | null {
  const setsToWin = Math.floor(category.maxSets / 2) + 1;
  const { entryASets, entryBSets } = countSetsWon(sets);
  if (entryASets >= setsToWin) return "A";
  if (entryBSets >= setsToWin) return "B";
  return null;
}

async function buildFinalizationNotice(
  subMatch: SubMatch,
  category: TournamentCategory,
  completedSet: MatchSet,
): Promise<FinalizationNotice | null> {
  const sets = await getExistingSets(subMatch.id);
  const winningTeam = getWinningTeamFromSets(sets, category);
  if (!winningTeam) return null;

  const { entryASets, entryBSets } = countSetsWon(sets);
  const match = await Match.findByPk(subMatch.matchId);
  if (!match) throw new Error("Match not found");

  const siblingSubMatches = await SubMatch.findAll({
    where: { matchId: subMatch.matchId },
    order: [["subMatchNumber", "ASC"]],
  });

  const winsToWinMatch = Math.floor(siblingSubMatches.length / 2) + 1;
  const entryAWins =
    siblingSubMatches.filter((item) => item.winnerTeam === "A").length +
    (winningTeam === "A" && subMatch.winnerTeam !== "A" ? 1 : 0);
  const entryBWins =
    siblingSubMatches.filter((item) => item.winnerTeam === "B").length +
    (winningTeam === "B" && subMatch.winnerTeam !== "B" ? 1 : 0);

  const matchWinnerTeam =
    entryAWins >= winsToWinMatch ? "A" : entryBWins >= winsToWinMatch ? "B" : null;
  const winnerEntryId =
    matchWinnerTeam === "A"
      ? match.entryAId
      : matchWinnerTeam === "B"
        ? match.entryBId
        : undefined;

  return {
    subMatchId: subMatch.id,
    matchId: subMatch.matchId,
    completedSetNumber: completedSet.setNumber,
    entryAScore: completedSet.entryAScore,
    entryBScore: completedSet.entryBScore,
    entryASets,
    entryBSets,
    winningTeam,
    matchWillBeCompleted: matchWinnerTeam !== null,
    ...(winnerEntryId && { winnerEntryId }),
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

    const set = await MatchSet.create({
      subMatchId: data.subMatchId,
      setNumber: nextSetNumber,
      entryAScore: data.entryAScore,
      entryBScore: data.entryBScore,
    });

    await cacheSetScore(set);
    return set;
  }

  async updateLiveSetScore(
    refereeId: number,
    data: SetScoreInput
  ): Promise<LiveSetScoreResult> {
    validateScoreRange(data.entryAScore, data.entryBScore);

    const { subMatch, category } = await getSubMatchWithCategory(data.subMatchId);
    await assertMatchReferee(refereeId, subMatch.matchId);

    if (subMatch.status !== "in_progress") {
      throw new Error(
        `Cannot update live score. SubMatch status is "${subMatch.status}", must be "in_progress"`
      );
    }

    const existingSets = await getExistingSets(data.subMatchId);

    const nextSetNumber = getNextSetNumber(existingSets);
    const setNumber = data.setNumber ?? nextSetNumber;
    if (!Number.isInteger(setNumber) || setNumber <= 0) {
      throw new Error("setNumber must be a positive integer");
    }
    if (setNumber > nextSetNumber) {
      throw new Error(`Can only update current set number ${nextSetNumber}`);
    }

    const setToCorrect = existingSets.find((set) => set.setNumber === setNumber);
    if (setToCorrect) {
      if (!isSetCompleted(data.entryAScore, data.entryBScore, 11)) {
        if (setNumber !== nextSetNumber - 1) {
          throw new Error("Can only reopen the latest persisted set");
        }

        const reopenedLiveScore: LiveMatchSetScoreCache = {
          subMatchId: data.subMatchId,
          setNumber,
          entryAScore: data.entryAScore,
          entryBScore: data.entryBScore,
          updatedBy: refereeId,
          updatedAt: new Date().toISOString(),
        };

        await setToCorrect.destroy();

        try {
          await matchSetScoreCacheService.deleteScore(setToCorrect);
          await matchSetScoreCacheService.setLiveScore(reopenedLiveScore);
        } catch (error) {
          console.error("Failed to reopen persisted set as live score:", error);
        }

        return {
          message: "Persisted set reopened as live score.",
          liveScore: reopenedLiveScore,
          isCompleted: false,
          nextSetNumber: setNumber,
        };
      }

      const updatedSet = await this.updateSetScore(
        refereeId,
        setToCorrect.id,
        data.entryAScore,
        data.entryBScore,
      );

      try {
        await matchSetScoreCacheService.deleteLiveScore(data.subMatchId, setNumber);
      } catch (error) {
        console.error("Failed to delete live match set score cache:", error);
      }

      return {
        message: "Persisted set score corrected.",
        liveScore: {
          subMatchId: data.subMatchId,
          setNumber,
          entryAScore: data.entryAScore,
          entryBScore: data.entryBScore,
          updatedBy: refereeId,
          updatedAt: new Date().toISOString(),
        },
        isCompleted: true,
        persistedSet: updatedSet,
      };
    }

    assertSubMatchCanAddSet(existingSets, category);

    const liveScore: LiveMatchSetScoreCache = {
      subMatchId: data.subMatchId,
      setNumber,
      entryAScore: data.entryAScore,
      entryBScore: data.entryBScore,
      updatedBy: refereeId,
      updatedAt: new Date().toISOString(),
    };

    try {
      await matchSetScoreCacheService.setLiveScore(liveScore);
    } catch (error) {
      console.error("Failed to cache live match set score:", error);
    }

    if (!isSetCompleted(data.entryAScore, data.entryBScore, 11)) {
      return {
        message: "success",
        liveScore,
        isCompleted: false,
        nextSetNumber: setNumber,
      };
    }

    const persistedSet = await this.submitFinalSetScore(refereeId, {
      ...data,
      setNumber,
    });

    try {
      await matchSetScoreCacheService.deleteLiveScore(data.subMatchId, setNumber);
    } catch (error) {
      console.error("Failed to delete live match set score cache:", error);
    }

    const notice = await buildFinalizationNotice(
      subMatch,
      category,
      persistedSet,
    );
    const winningTeam = notice?.winningTeam;
    const subMatchReadyToFinalize = notice !== null;
    const message = subMatchReadyToFinalize
      ? "Set completed and saved. Referee must finalize and submit match."
      : "Set completed and saved. Start next set.";

    return {
      message,
      liveScore,
      isCompleted: true,
      persistedSet,
      ...(!subMatchReadyToFinalize && { nextSetNumber: setNumber + 1 }),
      subMatchReadyToFinalize,
      ...(winningTeam && { winningTeam }),
      ...(notice && { finalizationNotice: notice }),
    };
  }

  async submitFinalSetScore(
    refereeId: number,
    data: SetScoreInput
  ): Promise<MatchSet> {
    const { subMatch, category } = await getSubMatchWithCategory(data.subMatchId);
    await assertMatchReferee(refereeId, subMatch.matchId);

    if (subMatch.status !== "in_progress") {
      throw new Error(
        `Cannot add set. SubMatch status is "${subMatch.status}", must be "in_progress"`
      );
    }

    const existingSets = await getExistingSets(data.subMatchId);
    assertSubMatchCanAddSet(existingSets, category);

    const validation = validateSetScore(data.entryAScore, data.entryBScore, 11);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    const nextSetNumber = getNextSetNumber(existingSets);
    const setNumber = data.setNumber ?? nextSetNumber;
    if (setNumber !== nextSetNumber) {
      throw new Error(`Can only submit current set number ${nextSetNumber}`);
    }

    const set = await MatchSet.create({
      subMatchId: data.subMatchId,
      setNumber,
      entryAScore: data.entryAScore,
      entryBScore: data.entryBScore,
    });

    await cacheSetScore(set);
    try {
      await matchSetScoreCacheService.deleteLiveScore(data.subMatchId, setNumber);
    } catch (error) {
      console.error("Failed to delete live match set score cache:", error);
    }
    return set;
  }

  async getLiveSetScore(
    subMatchId: number,
    setNumber?: number
  ): Promise<LiveMatchSetScoreCache | null> {
    const existingSets = await getExistingSets(subMatchId);
    const currentSetNumber = setNumber ?? getNextSetNumber(existingSets);

    try {
      return await matchSetScoreCacheService.getLiveScore(
        subMatchId,
        currentSetNumber
      );
    } catch (error) {
      console.error("Failed to read live match set score cache:", error);
      return null;
    }
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

    const updatedSet = await set.update({ entryAScore, entryBScore });
    await cacheSetScore(updatedSet);
    return updatedSet;
  }

  // ── 3. Queries ────────────────────────────────────────────────────────────

  async getSetsBySubMatch(subMatchId: number): Promise<MatchSetResult[]> {
    const subMatch = await SubMatch.findByPk(subMatchId, { attributes: ["id"] });
    if (!subMatch) throw new Error("SubMatch not found");

    const sets = await MatchSet.findAll({
      where: { subMatchId },
      order: [["setNumber", "ASC"]],
    });
    return await mergeCachedScores(sets);
  }

  async getSetById(setId: number): Promise<MatchSetResult> {
    try {
      const cachedSet = await matchSetScoreCacheService.getScore(setId);
      if (cachedSet) return cachedSet;
    } catch (error) {
      console.error("Failed to read match set score cache:", error);
    }

    const set = await MatchSet.findByPk(setId);
    if (!set) throw new Error("Set not found");
    await cacheSetScore(set);
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

    try {
      await matchSetScoreCacheService.deleteScore(set);
    } catch (error) {
      console.error("Failed to delete match set score cache:", error);
    }
  }
}

export default new MatchSetService();
