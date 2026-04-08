// eloHistory.service.ts
import EloHistory from "../models/eloHistory.model";
import User from "../models/user.model";
import Match from "../models/match.model";

const USER_ATTRIBUTES = ["id", "firstName", "lastName", "avatarUrl"];

export class EloHistoryService {
  /**
   * Lịch sử ELO của 1 user theo thời gian.
   */
  async getByUser(
    userId: number,
    options: { skip?: number; limit?: number } = {}
  ): Promise<{ rows: EloHistory[]; count: number }> {
    const { skip = 0, limit = 20 } = options;

    return await EloHistory.findAndCountAll({
      where: { userId },
      include: [{ model: Match, as: "match", attributes: ["id", "status"] }],
      order: [["createdAt", "DESC"]],
      offset: skip,
      limit,
      distinct: true,
    });
  }

  /**
   * Lịch sử ELO của tất cả players trong 1 match.
   */
  async getByMatch(matchId: number): Promise<EloHistory[]> {
    return await EloHistory.findAll({
      where: { matchId },
      include: [{ model: User, as: "user", attributes: USER_ATTRIBUTES }],
      order: [["createdAt", "DESC"]],
    });
  }

  /**
   * Tổng thay đổi ELO của user trong 1 khoảng thời gian.
   */
  async getNetEloChange(
    userId: number,
    from: Date,
    to: Date
  ): Promise<number> {
    const histories = await EloHistory.findAll({
      where: {
        userId,
        createdAt: { $gte: from, $lte: to },
      },
      attributes: ["eloDelta"],
    });

    return histories.reduce((sum, h) => sum + h.eloDelta, 0);
  }
}

export default new EloHistoryService();