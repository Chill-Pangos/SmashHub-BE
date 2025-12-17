import Tournament from "../models/tournament.model";
import {
  CreateTournamentDto,
  UpdateTournamentDto,
} from "../dto/tournament.dto";

export class TournamentService {
  async create(data: CreateTournamentDto): Promise<Tournament> {
    return await Tournament.create(data as any);
  }

  async findAll(skip = 0, limit = 10): Promise<Tournament[]> {
    return await Tournament.findAll({
      offset: skip,
      limit,
      order: [["startDate", "DESC"]],
    });
  }

  async findById(id: number): Promise<Tournament | null> {
    return await Tournament.findByPk(id);
  }

  async findByStatus(
    status: string,
    skip = 0,
    limit = 10
  ): Promise<Tournament[]> {
    return await Tournament.findAll({
      where: { status },
      offset: skip,
      limit,
      order: [["startDate", "DESC"]],
    });
  }

  async update(
    id: number,
    data: UpdateTournamentDto
  ): Promise<[number, Tournament[]]> {
    return await Tournament.update(data, {
      where: { id },
      returning: true,
    });
  }

  async delete(id: number): Promise<number> {
    return await Tournament.destroy({ where: { id } });
  }
}

export default new TournamentService();
