import { Op } from "sequelize";
import EloScore from "../models/eloScore.model";
import type { UserEloSnapshot } from "../public.contracts";

const DEFAULT_REGISTRATION_ELO = 0;

export class RankingReadService {
  async getUserElo(userId: number): Promise<number> {
    const score = await EloScore.findOne({
      where: { userId },
      attributes: ["userId", "score"],
    });
    return score?.score ?? DEFAULT_REGISTRATION_ELO;
  }

  async getUserElos(userIds: number[]): Promise<UserEloSnapshot[]> {
    const uniqueUserIds = Array.from(new Set(userIds));
    if (uniqueUserIds.length === 0) return [];

    const scores = await EloScore.findAll({
      where: { userId: { [Op.in]: uniqueUserIds } },
      attributes: ["userId", "score"],
    });
    const scoreByUserId = new Map(scores.map((score) => [score.userId, score.score]));

    return uniqueUserIds.map((userId) => ({
      userId,
      score: scoreByUserId.get(userId) ?? DEFAULT_REGISTRATION_ELO,
    }));
  }
}

export default new RankingReadService();
