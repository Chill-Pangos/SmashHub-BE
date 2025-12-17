import Entries from "../models/entries.model";
import { CreateEntryDto, UpdateEntryDto } from "../dto/entry.dto";

export class EntryService {
  async create(data: CreateEntryDto): Promise<Entries> {
    return await Entries.create(data as any);
  }

  async findAll(skip = 0, limit = 10): Promise<Entries[]> {
    return await Entries.findAll({
      offset: skip,
      limit,
    });
  }

  async findById(id: number): Promise<Entries | null> {
    return await Entries.findByPk(id);
  }

  async findByContentId(
    contentId: number,
    skip = 0,
    limit = 10
  ): Promise<Entries[]> {
    return await Entries.findAll({
      where: { contentId },
      offset: skip,
      limit,
    });
  }

  async update(id: number, data: UpdateEntryDto): Promise<[number, Entries[]]> {
    return await Entries.update(data, {
      where: { id },
      returning: true,
    });
  }

  async delete(id: number): Promise<number> {
    return await Entries.destroy({ where: { id } });
  }
}

export default new EntryService();
