import Match from "../models/match.model";
import { CreateMatchDto, UpdateMatchDto } from "../dto/match.dto";

export class MatchService {
  async create(data: CreateMatchDto): Promise<Match> {
    return await Match.create(data as any);
  }

  async findAll(skip = 0, limit = 10): Promise<Match[]> {
    return await Match.findAll({
      offset: skip,
      limit,
    });
  }

  async findById(id: number): Promise<Match | null> {
    return await Match.findByPk(id);
  }

  async findByScheduleId(
    scheduleId: number,
    skip = 0,
    limit = 10
  ): Promise<Match[]> {
    return await Match.findAll({
      where: { scheduleId },
      offset: skip,
      limit,
    });
  }

  async findByStatus(status: string, skip = 0, limit = 10): Promise<Match[]> {
    return await Match.findAll({
      where: { status },
      offset: skip,
      limit,
    });
  }

  async update(id: number, data: UpdateMatchDto): Promise<[number, Match[]]> {
    return await Match.update(data, {
      where: { id },
      returning: true,
    });
  }

  async delete(id: number): Promise<number> {
    return await Match.destroy({ where: { id } });
  }
}

export default new MatchService();
