import TournamentContent from "../models/tournamentContent.model";
import {
  CreateTournamentContentDto,
  UpdateTournamentContentDto,
} from "../dto/tournamentContent.dto";

export class TournamentContentService {
  async create(data: CreateTournamentContentDto): Promise<TournamentContent> {
    return await TournamentContent.create(data as any);
  }

  async findAll(skip = 0, limit = 10): Promise<TournamentContent[]> {
    return await TournamentContent.findAll({
      offset: skip,
      limit,
    });
  }

  async findById(id: number): Promise<TournamentContent | null> {
    return await TournamentContent.findByPk(id);
  }

  async findByTournamentId(
    tournamentId: number,
    skip = 0,
    limit = 10
  ): Promise<TournamentContent[]> {
    return await TournamentContent.findAll({
      where: { tournamentId },
      offset: skip,
      limit,
    });
  }

  async update(
    id: number,
    data: UpdateTournamentContentDto
  ): Promise<[number, TournamentContent[]]> {
    return await TournamentContent.update(data, {
      where: { id },
      returning: true,
    });
  }

  async delete(id: number): Promise<number> {
    return await TournamentContent.destroy({ where: { id } });
  }
}

export default new TournamentContentService();
