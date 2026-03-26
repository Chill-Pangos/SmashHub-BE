import SubMatchPlayer from "../models/subMatchPlayer.model";
import { CreateSubMatchPlayerDto, UpdateSubMatchPlayerDto } from "../dto/subMatchPlayer.dto";

export class SubMatchPlayerService {
  async create(data: CreateSubMatchPlayerDto): Promise<SubMatchPlayer> {
    return await SubMatchPlayer.create(data as any);
  }

  async findAll(skip = 0, limit = 10): Promise<SubMatchPlayer[]> {
    return await SubMatchPlayer.findAll({
      offset: skip,
      limit,
    });
  }

  async findById(id: number): Promise<SubMatchPlayer | null> {
    return await SubMatchPlayer.findByPk(id);
  }

  async findBySubMatchId(
    subMatchId: number,
    skip = 0,
    limit = 10
  ): Promise<SubMatchPlayer[]> {
    return await SubMatchPlayer.findAll({
      where: { subMatchId },
      offset: skip,
      limit,
    });
  }

  async findBySubMatchIdAndTeam(
    subMatchId: number,
    team: "A" | "B",
    skip = 0,
    limit = 10
  ): Promise<SubMatchPlayer[]> {
    return await SubMatchPlayer.findAll({
      where: { subMatchId, team },
      offset: skip,
      limit,
    });
  }

  async findByEntryMemberId(
    entryMemberId: number,
    skip = 0,
    limit = 10
  ): Promise<SubMatchPlayer[]> {
    return await SubMatchPlayer.findAll({
      where: { entryMemberId },
      offset: skip,
      limit,
    });
  }

  async update(id: number, data: UpdateSubMatchPlayerDto): Promise<[number, SubMatchPlayer[]]> {
    return await SubMatchPlayer.update(data, {
      where: { id },
      returning: true,
    });
  }

  async delete(id: number): Promise<number> {
    return await SubMatchPlayer.destroy({ where: { id } });
  }
}

export default new SubMatchPlayerService();
