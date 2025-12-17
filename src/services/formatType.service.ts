import FormatType from "../models/formatType.model";
import {
  CreateFormatTypeDto,
  UpdateFormatTypeDto,
} from "../dto/formatType.dto";

export class FormatTypeService {
  async create(data: CreateFormatTypeDto): Promise<FormatType> {
    return await FormatType.create(data as any);
  }

  async findAll(skip = 0, limit = 10): Promise<FormatType[]> {
    return await FormatType.findAll({
      offset: skip,
      limit,
    });
  }

  async findById(id: number): Promise<FormatType | null> {
    return await FormatType.findByPk(id);
  }

  async update(
    id: number,
    data: UpdateFormatTypeDto
  ): Promise<[number, FormatType[]]> {
    return await FormatType.update(data, {
      where: { id },
      returning: true,
    });
  }

  async delete(id: number): Promise<number> {
    return await FormatType.destroy({ where: { id } });
  }
}

export default new FormatTypeService();
