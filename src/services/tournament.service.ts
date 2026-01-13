import Tournament from "../models/tournament.model";
import TournamentContent from "../models/tournamentContent.model";
import {
  CreateTournamentDto,
  UpdateTournamentDto,
} from "../dto/tournament.dto";
import { sequelize } from "../config/database";

export class TournamentService {
  async create(data: CreateTournamentDto): Promise<Tournament> {
    const transaction = await sequelize.transaction();

    try {
      // Create tournament
      const tournament = await Tournament.create(
        {
          name: data.name,
          startDate: data.startDate,
          endDate: data.endDate ? data.endDate : null,
          location: data.location,
          status: data.status || "upcoming",
          createdBy: data.createdBy,
        } as any,
        { transaction }
      );

      // Create tournament contents if provided
      if (data.contents && data.contents.length > 0) {
        for (const contentData of data.contents) {
          await TournamentContent.create(
            {
              tournamentId: tournament.id,
              name: contentData.name,
              type: contentData.type,
              maxEntries: contentData.maxEntries,
              maxSets: contentData.maxSets,
              numberOfSingles: contentData.numberOfSingles ? contentData.numberOfSingles : null,
              numberOfDoubles: contentData.numberOfDoubles ? contentData.numberOfDoubles : null,
              racketCheck: contentData.racketCheck,
              isGroupStage: contentData.isGroupStage,
            } as any,
            { transaction }
          );
        }
      }

      await transaction.commit();

      // Fetch the created tournament with all related data
      const createdTournament = await Tournament.findByPk(tournament.id, {
        include: [
          {
            model: TournamentContent,
            as: "contents",
          },
        ],
      });

      return createdTournament!;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
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
