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
        await TournamentContent.bulkCreate(
          data.contents.map(contentData => ({
            tournamentId: tournament.id,
            name: contentData.name,
            type: contentData.type,
            maxEntries: contentData.maxEntries,
            maxSets: contentData.maxSets,
            numberOfSingles: contentData.numberOfSingles ?? null,
            numberOfDoubles: contentData.numberOfDoubles ?? null,
            minAge: contentData.minAge ?? null,
            maxAge: contentData.maxAge ?? null,
            minElo: contentData.minElo ?? null,
            maxElo: contentData.maxElo ?? null,
            racketCheck: contentData.racketCheck,
            gender: contentData.gender ?? null,
            isGroupStage: contentData.isGroupStage,
          })),
          { transaction }
        );
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
    return await Tournament.findByPk(id, {
      include: [
        {
          model: TournamentContent,
          as: "contents",
        },
      ],
    });
  }

  async findByIdWithContents(id: number): Promise<Tournament | null> {
    return await Tournament.findByPk(id, {
      include: [
        {
          model: TournamentContent,
          as: "contents",
        },
      ],
    });
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
  ): Promise<Tournament | null> {
    const transaction = await sequelize.transaction();

    try {
      // Check if tournament exists
      const tournament = await Tournament.findByPk(id, { transaction });
      if (!tournament) {
        await transaction.rollback();
        return null;
      }

      // Update tournament basic info
      await tournament.update(
        {
          name: data.name,
          startDate: data.startDate,
          endDate: data.endDate,
          location: data.location,
          status: data.status,
        },
        { transaction }
      );

      // Update or create tournament contents if provided
      if (data.contents !== undefined) {
        // Delete existing contents
        await TournamentContent.destroy({
          where: { tournamentId: id },
          transaction,
        });

        // Create new contents if provided
        if (data.contents.length > 0) {
          await TournamentContent.bulkCreate(
            data.contents.map(c => ({
              tournamentId: id,
              name: c.name,
              type: c.type,
              maxEntries: c.maxEntries,
              maxSets: c.maxSets,
              numberOfSingles: c.numberOfSingles ?? null,
              numberOfDoubles: c.numberOfDoubles ?? null,
              minAge: c.minAge ?? null,
              maxAge: c.maxAge ?? null,
              minElo: c.minElo ?? null,
              maxElo: c.maxElo ?? null,
              racketCheck: c.racketCheck,
              gender: c.gender ?? null,
              isGroupStage: c.isGroupStage,
            })),
            { transaction }
          );
        }
      }

      await transaction.commit();

      // Fetch updated tournament with contents
      return await this.findById(id);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async delete(id: number): Promise<number> {
    return await Tournament.destroy({ where: { id } });
  }
}

export default new TournamentService();
