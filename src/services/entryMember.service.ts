import EntryMember from "../models/entryMember.model";
import { CreateEntryMemberDto, UpdateEntryMemberDto } from "../dto/entryMember.dto";

export class EntryMemberService {
  async create(data: CreateEntryMemberDto): Promise<EntryMember> {
    return await EntryMember.create(data as any);
  }

  async findAll(skip = 0, limit = 10): Promise<EntryMember[]> {
    return await EntryMember.findAll({
      offset: skip,
      limit,
    });
  }

  async findById(id: number): Promise<EntryMember | null> {
    return await EntryMember.findByPk(id);
  }

  async findByEntryId(
    entryId: number,
    skip = 0,
    limit = 10
  ): Promise<EntryMember[]> {
    return await EntryMember.findAll({
      where: { entryId },
      offset: skip,
      limit,
    });
  }

  async findByUserId(
    userId: number,
    skip = 0,
    limit = 10
  ): Promise<EntryMember[]> {
    return await EntryMember.findAll({
      where: { userId },
      offset: skip,
      limit,
    });
  }

  async findByEntryIdAndUserId(
    entryId: number,
    userId: number
  ): Promise<EntryMember | null> {
    return await EntryMember.findOne({
      where: { entryId, userId },
    });
  }

  async update(id: number, data: UpdateEntryMemberDto): Promise<[number, EntryMember[]]> {
    return await EntryMember.update(data, {
      where: { id },
      returning: true,
    });
  }

  async delete(id: number): Promise<number> {
    return await EntryMember.destroy({ where: { id } });
  }

  async deleteByEntryIdAndUserId(entryId: number, userId: number): Promise<number> {
    return await EntryMember.destroy({ where: { entryId, userId } });
  }
}

export default new EntryMemberService();
