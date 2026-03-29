import Entry from "../models/entry.model";
import EntryMember from "../models/entryMember.model";
import TournamentCategory from "../models/tournamentCategory.model";
import EloScore from "../models/eloScore.model";
import User from "../models/user.model";
import { CreateEntryDto, UpdateEntryDto } from "../dto/entry.dto";

export class EntryService {
  async create(data: CreateEntryDto): Promise<Entry> {
    return await Entry.create(data as any);
  }

  async findAll(skip = 0, limit = 10): Promise<Entry[]> {
    return await Entry.findAll({
      offset: skip,
      limit,
    });
  }

  async findById(id: number): Promise<Entry | null> {
    return await Entry.findByPk(id);
  }

  async findByCategoryId(
    categoryId: number,
    skip = 0,
    limit = 10
  ): Promise<Entry[]> {
    return await Entry.findAll({
      where: { categoryId },
      offset: skip,
      limit,
    });
  }

  async update(id: number, data: UpdateEntryDto): Promise<[number, Entry[]]> {
    return await Entry.update(data, {
      where: { id },
      returning: true,
    });
  }

  async delete(id: number): Promise<number> {
    return await Entry.destroy({ where: { id } });
  }
}

export default new EntryService();
