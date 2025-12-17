import { CreateEloHistoryDto } from "../dto/eloHistory.dto";
import EloHistory from "../models/eloHistory.model";

export class EloHistoryService {
  async create(data: CreateEloHistoryDto): Promise<EloHistory> {
    return await EloHistory.create(data as any);
  }

  async findAll(skip = 0, limit = 10): Promise<EloHistory[]> {
    return await EloHistory.findAll({
      offset: skip,
      limit,
      order: [["createdAt", "DESC"]],
    });
  }

  async findById(id: number): Promise<EloHistory | null> {
    return await EloHistory.findByPk(id);
  }

  async findByUserId(
    userId: number,
    skip = 0,
    limit = 10
  ): Promise<EloHistory[]> {
    return await EloHistory.findAll({
      where: { userId },
      offset: skip,
      limit,
      order: [["createdAt", "DESC"]],
    });
  }

  async findByMatchId(
    matchId: number,
    skip = 0,
    limit = 10
  ): Promise<EloHistory[]> {
    return await EloHistory.findAll({
      where: { matchId },
      offset: skip,
      limit,
      order: [["createdAt", "DESC"]],
    });
  }

  async delete(id: number): Promise<number> {
    return await EloHistory.destroy({ where: { id } });
  }
}

export default new EloHistoryService();
