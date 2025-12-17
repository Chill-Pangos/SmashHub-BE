import MatchFormat from "../models/matchFormat.model";
import {
  CreateMatchFormatDto,
  UpdateMatchFormatDto,
} from "../dto/matchFormat.dto";

export class MatchFormatService {
  async create(data: CreateMatchFormatDto): Promise<MatchFormat> {
    return await MatchFormat.create(data as any);
  }

  async findAll(skip = 0, limit = 10): Promise<MatchFormat[]> {
    return await MatchFormat.findAll({
      offset: skip,
      limit,
    });
  }

  async findById(id: number): Promise<MatchFormat | null> {
    return await MatchFormat.findByPk(id);
  }

  async update(
    id: number,
    data: UpdateMatchFormatDto
  ): Promise<[number, MatchFormat[]]> {
    return await MatchFormat.update(data, {
      where: { id },
      returning: true,
    });
  }

  async delete(id: number): Promise<number> {
    return await MatchFormat.destroy({ where: { id } });
  }
}

export default new MatchFormatService();
