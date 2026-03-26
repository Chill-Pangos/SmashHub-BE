import SubMatch from "../models/subMatch.model";
import { CreateSubMatchDto, UpdateSubMatchDto } from "../dto/subMatch.dto";

export class SubMatchService {
  async create(data: CreateSubMatchDto): Promise<SubMatch> {
    return await SubMatch.create(data as any);
  }

  async findAll(skip = 0, limit = 10): Promise<SubMatch[]> {
    return await SubMatch.findAll({
      offset: skip,
      limit,
    });
  }

  async findById(id: number): Promise<SubMatch | null> {
    return await SubMatch.findByPk(id);
  }

  async findByMatchId(
    matchId: number,
    skip = 0,
    limit = 10
  ): Promise<SubMatch[]> {
    return await SubMatch.findAll({
      where: { matchId },
      offset: skip,
      limit,
      order: [["subMatchNumber", "ASC"]],
    });
  }

  async findByStatus(
    status: string,
    skip = 0,
    limit = 10
  ): Promise<SubMatch[]> {
    return await SubMatch.findAll({
      where: { status },
      offset: skip,
      limit,
    });
  }

  async update(id: number, data: UpdateSubMatchDto): Promise<[number, SubMatch[]]> {
    return await SubMatch.update(data, {
      where: { id },
      returning: true,
    });
  }

  async delete(id: number): Promise<number> {
    return await SubMatch.destroy({ where: { id } });
  }
}

export default new SubMatchService();
