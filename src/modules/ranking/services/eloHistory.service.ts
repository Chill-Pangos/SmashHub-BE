// eloHistory.service.ts
import EloHistory from "../models/eloHistory.model";
import { Match } from "../../competition/public.models";
import { Op } from "sequelize";

const USER_ATTRIBUTES = ["id", "firstName", "lastName", "avatarUrl"];

export class EloHistoryService {
  /**
   * Lịch sử ELO của 1 user theo thời gian.
   */
  async getByUser(
    userId: number,
    options: { offset?: number; limit?: number } = {}
  ): Promise<{ rows: EloHistory[]; count: number }> {
    const { offset = 0, limit = 20 } = options;

    return await EloHistory.findAndCountAll({
      where: { userId },
      include: [{ model: Match, as: "match", attributes: ["id", "status"] }],
      order: [["createdAt", "DESC"]],
      offset,
      limit,
      distinct: true,
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
        createdAt: { [Op.gte]: from, [Op.lte]: to },
      },
      attributes: ["eloDelta"],
    });

    return histories.reduce((sum, h) => sum + h.eloDelta, 0);
  }
}

export default new EloHistoryService();
