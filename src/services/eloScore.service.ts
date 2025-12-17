import EloScore from "../models/eloScore.model";
import { CreateEloScoreDto, UpdateEloScoreDto } from "../dto/eloScore.dto";

export class EloScoreService {
  async create(data: CreateEloScoreDto): Promise<EloScore> {
    return await EloScore.create(data as any);
  }

  async findAll(skip = 0, limit = 10): Promise<EloScore[]> {
    return await EloScore.findAll({
      offset: skip,
      limit,
      order: [["score", "DESC"]],
    });
  }

  async findById(id: number): Promise<EloScore | null> {
    return await EloScore.findByPk(id);
  }

  async findByUserId(userId: number): Promise<EloScore | null> {
    return await EloScore.findOne({ where: { userId } });
  }

  async update(
    id: number,
    data: UpdateEloScoreDto
  ): Promise<[number, EloScore[]]> {
    return await EloScore.update(data, {
      where: { id },
      returning: true,
    });
  }

  async delete(id: number): Promise<number> {
    return await EloScore.destroy({ where: { id } });
  }

  async getLeaderboard(skip = 0, limit = 10): Promise<EloScore[]> {
    return await EloScore.findAll({
      offset: skip,
      limit,
      order: [["score", "DESC"]],
    });
  }
}

export default new EloScoreService();
