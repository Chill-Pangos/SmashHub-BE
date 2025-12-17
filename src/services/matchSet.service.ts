import MatchSet from "../models/matchSet.model";
import { CreateMatchSetDto, UpdateMatchSetDto } from "../dto/matchSet.dto";

export class MatchSetService {
  async create(data: CreateMatchSetDto): Promise<MatchSet> {
    return await MatchSet.create(data as any);
  }

  async findAll(skip = 0, limit = 10): Promise<MatchSet[]> {
    return await MatchSet.findAll({
      offset: skip,
      limit,
    });
  }

  async findById(id: number): Promise<MatchSet | null> {
    return await MatchSet.findByPk(id);
  }

  async findByMatchId(
    matchId: number,
    skip = 0,
    limit = 10
  ): Promise<MatchSet[]> {
    return await MatchSet.findAll({
      where: { matchId },
      offset: skip,
      limit,
      order: [["setNumber", "ASC"]],
    });
  }

  async update(
    id: number,
    data: UpdateMatchSetDto
  ): Promise<[number, MatchSet[]]> {
    return await MatchSet.update(data, {
      where: { id },
      returning: true,
    });
  }

  async delete(id: number): Promise<number> {
    return await MatchSet.destroy({ where: { id } });
  }
}

export default new MatchSetService();
