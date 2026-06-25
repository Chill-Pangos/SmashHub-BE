// eloHistory.service.ts
import EloHistory from "../models/eloHistory.model";
import { competitionReadService } from "../../competition/public.read";
import { Op } from "sequelize";

type EloHistoryResponse = ReturnType<EloHistory["get"]> & {
  match: Awaited<ReturnType<typeof competitionReadService.getMatchSummariesByIds>>[number] | null;
};

async function attachMatches(rows: EloHistory[]): Promise<EloHistoryResponse[]> {
  const matchIds = rows.map((row) => row.matchId);
  const matches = await competitionReadService.getMatchSummariesByIds(matchIds);
  const matchById = new Map(matches.map((match) => [match.id, match]));

  return rows.map((row) => ({
    ...row.get({ plain: true }),
    match: matchById.get(row.matchId) ?? null,
  }) as EloHistoryResponse);
}

export class EloHistoryService {
  /**
   * Lịch sử ELO của 1 user theo thời gian.
   */
  async getByUser(
    userId: number,
    options: { offset?: number; limit?: number } = {}
  ): Promise<{ rows: EloHistoryResponse[]; count: number }> {
    const { offset = 0, limit = 20 } = options;

    const { rows, count } = await EloHistory.findAndCountAll({
      where: { userId },
      order: [["createdAt", "DESC"]],
      offset,
      limit,
      distinct: true,
    });

    return { rows: await attachMatches(rows), count };
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
