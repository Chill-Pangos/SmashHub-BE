import { Op } from "sequelize";
import EloScore from "../models/eloScore.model";
import type { UserEloSnapshot, UserEloView } from "../public.contracts";

const DEFAULT_REGISTRATION_ELO = 0;

export class RankingReadService {
  private toEloView(score: EloScore): UserEloView {
    const plain = score.get({ plain: true }) as UserEloView;
    return plain;
  }

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

  async getUserEloView(userId: number): Promise<UserEloView | null> {
    const score = await EloScore.findOne({ where: { userId } });
    return score ? this.toEloView(score) : null;
  }

  async getUserEloViews(userIds: number[]): Promise<UserEloView[]> {
    const uniqueUserIds = Array.from(new Set(userIds));
    if (uniqueUserIds.length === 0) return [];

    const scores = await EloScore.findAll({
      where: { userId: { [Op.in]: uniqueUserIds } },
    });
    return scores.map((score) => this.toEloView(score));
  }
}

export default new RankingReadService();
