import TournamentReferee from "../models/tournamentReferee.model";
import User from "../models/user.model";
import {
  CreateTournamentRefereeDto,
  UpdateTournamentRefereeDto,
  AssignRefereeDto,
} from "../dto/tournamentReferee.dto";
import { Op } from "sequelize";

export class TournamentRefereeService {
  async create(data: CreateTournamentRefereeDto): Promise<TournamentReferee> {
    return await TournamentReferee.create(data as any);
  }

  async findAll(
    tournamentId?: number,
    skip = 0,
    limit = 10
  ): Promise<TournamentReferee[]> {
    const where: any = {};
    if (tournamentId) {
      where.tournamentId = tournamentId;
    }

    return await TournamentReferee.findAll({
      where,
      offset: skip,
      limit,
      include: [
        {
          model: User,
          as: "referee",
          attributes: ["id", "username", "email"],
        },
      ],
    });
  }

  async findById(id: number): Promise<TournamentReferee | null> {
    return await TournamentReferee.findByPk(id, {
      include: [
        {
          model: User,
          as: "referee",
          attributes: ["id", "username", "email"],
        },
      ],
    });
  }

  async findByTournamentId(
    tournamentId: number,
    skip = 0,
    limit = 10
  ): Promise<TournamentReferee[]> {
    return await TournamentReferee.findAll({
      where: { tournamentId },
      offset: skip,
      limit,
      include: [
        {
          model: User,
          as: "referee",
          attributes: ["id", "username", "email"],
        },
      ],
    });
  }

  async update(
    id: number,
    data: UpdateTournamentRefereeDto
  ): Promise<[number, TournamentReferee[]]> {
    return await TournamentReferee.update(data, {
      where: { id },
      returning: true,
    });
  }

  async delete(id: number): Promise<number> {
    return await TournamentReferee.destroy({ where: { id } });
  }

  async deleteByTournamentAndReferee(
    tournamentId: number,
    refereeId: number
  ): Promise<number> {
    return await TournamentReferee.destroy({
      where: { tournamentId, refereeId },
    });
  }

  async assignReferees(data: AssignRefereeDto): Promise<TournamentReferee[]> {
    const { tournamentId, refereeIds } = data;

    const referees = await Promise.all(
      refereeIds.map((refereeId) =>
        TournamentReferee.create({
          tournamentId,
          refereeId,
          role: "main",
          isAvailable: true,
        } as any)
      )
    );

    return referees;
  }

  async getAvailableReferees(
    tournamentId: number,
    excludeIds: number[] = []
  ): Promise<TournamentReferee[]> {
    return await TournamentReferee.findAll({
      where: {
        tournamentId,
        isAvailable: true,
        refereeId: {
          [Op.notIn]: excludeIds,
        },
      },
      include: [
        {
          model: User,
          as: "referee",
          attributes: ["id", "username", "email"],
        },
      ],
      limit: 2,
    });
  }

  async updateAvailability(
    id: number,
    isAvailable: boolean
  ): Promise<[number, TournamentReferee[]]> {
    return await TournamentReferee.update(
      { isAvailable },
      {
        where: { id },
        returning: true,
      }
    );
  }
}

export default new TournamentRefereeService();
