// eloScore.service.ts
import { Op } from "sequelize";
import EloScore from "../models/eloScore.model";
import { identityReadService } from "../../identity/public.read";

type EloScoreResponse = ReturnType<EloScore["get"]> & {
  user: Awaited<ReturnType<typeof identityReadService.getPublicUsersByIds>>[number] | null;
};

async function attachUsers(rows: EloScore[]): Promise<EloScoreResponse[]> {
  const users = await identityReadService.getPublicUsersByIds(rows.map((row) => row.userId));
  const userById = new Map(users.map((user) => [user.id, user]));

  return rows.map((row) => ({
    ...row.get({ plain: true }),
    user: userById.get(row.userId) ?? null,
  }) as EloScoreResponse);
}

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

  async getByUserId(userId: number): Promise<EloScoreResponse> {
    const score = await EloScore.findOne({
      where: { userId },
    });
    if (!score) throw new Error("ELO score not found for this user");
    return (await attachUsers([score]))[0]!;
  }

  /**
   * Leaderboard toàn hệ thống.
   */
  async getLeaderboard(
    options: { offset?: number; limit?: number } = {}
  ): Promise<{ rows: EloScoreResponse[]; count: number }> {
    const { offset = 0, limit = 20 } = options;

    const { rows, count } = await EloScore.findAndCountAll({
      order: [["score", "DESC"]],
      offset,
      limit,
      distinct: true,
    });

    return { rows: await attachUsers(rows), count };
  }

  /**
   * Leaderboard theo tournament (lấy ELO tại thời điểm đăng ký từ EntryMember).
   */
  async getLeaderboardByRange(
    minScore?: number,
    maxScore?: number,
    options: { offset?: number; limit?: number } = {}
  ): Promise<{ rows: EloScoreResponse[]; count: number }> {
    const { offset = 0, limit = 20 } = options;

    const where: Record<string, unknown> = {};
    if (minScore != null) where.score = { [Op.gte]: minScore };
    if (maxScore != null) {
      where.score = { ...(where.score as object), [Op.lte]: maxScore };
    }

    const { rows, count } = await EloScore.findAndCountAll({
      where,
      order: [["score", "DESC"]],
      offset,
      limit,
      distinct: true,
    });

    return { rows: await attachUsers(rows), count };
  }
}

export default new EloScoreService();
