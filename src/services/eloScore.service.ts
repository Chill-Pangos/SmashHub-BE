// eloScore.service.ts
import { Op } from "sequelize";
import EloScore from "../models/eloScore.model";
import User from "../models/user.model";

const USER_ATTRIBUTES = ["id", "firstName", "lastName", "avatarUrl"];

export class EloScoreService {
  /**
   * Lấy ELO của 1 user. Nếu chưa có → tạo mới với 1000 điểm.
   * Dùng nội bộ bởi eloCalculation.service.
   */
  async getOrCreate(userId: number): Promise<EloScore> {
    const [score] = await EloScore.findOrCreate({
      where: { userId },
      defaults: { userId, score: 1000 },
    });
    return score;
  }

  async getByUserId(userId: number): Promise<EloScore> {
    const score = await EloScore.findOne({
      where: { userId },
      include: [{ model: User, as: "user", attributes: USER_ATTRIBUTES }],
    });
    if (!score) throw new Error("ELO score not found for this user");
    return score;
  }

  /**
   * Leaderboard toàn hệ thống.
   */
  async getLeaderboard(
    options: { skip?: number; limit?: number } = {}
  ): Promise<{ rows: EloScore[]; count: number }> {
    const { skip = 0, limit = 20 } = options;

    return await EloScore.findAndCountAll({
      include: [{ model: User, as: "user", attributes: USER_ATTRIBUTES }],
      order: [["score", "DESC"]],
      offset: skip,
      limit,
      distinct: true,
    });
  }

  /**
   * Leaderboard theo tournament (lấy ELO tại thời điểm đăng ký từ EntryMember).
   */
  async getLeaderboardByRange(
    minScore?: number,
    maxScore?: number,
    options: { skip?: number; limit?: number } = {}
  ): Promise<{ rows: EloScore[]; count: number }> {
    const { skip = 0, limit = 20 } = options;

    const where: Record<string, unknown> = {};
    if (minScore != null) where.score = { [Op.gte]: minScore };
    if (maxScore != null) {
      where.score = { ...(where.score as object), [Op.lte]: maxScore };
    }

    return await EloScore.findAndCountAll({
      where,
      include: [{ model: User, as: "user", attributes: USER_ATTRIBUTES }],
      order: [["score", "DESC"]],
      offset: skip,
      limit,
      distinct: true,
    });
  }
}

export default new EloScoreService();