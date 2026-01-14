import Tournament from "../models/tournament.model";
import TournamentContent from "../models/tournamentContent.model";
import Entries from "../models/entries.model";
import EntryMember from "../models/entrymember.model";
import Profile from "../models/profile.model";
import {
  CreateTournamentDto,
  UpdateTournamentDto,
  TournamentFilterDto,
} from "../dto/tournament.dto";
import { sequelize } from "../config/database";
import { Op, WhereOptions } from "sequelize";

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

  async findAllWithContentsFiltered(
    filters: TournamentFilterDto
  ): Promise<{ tournaments: Tournament[]; total: number }> {
    const { skip = 0, limit = 10, userId, createdBy, ...contentFilters } = filters;

    // Build where clause for TournamentContent
    const contentWhere: WhereOptions<any> = {};
    if (contentFilters.minAge !== undefined) {
      contentWhere.minAge = { [Op.lte]: contentFilters.minAge };
    }
    if (contentFilters.maxAge !== undefined) {
      contentWhere.maxAge = { [Op.gte]: contentFilters.maxAge };
    }
    if (contentFilters.minElo !== undefined) {
      contentWhere.minElo = { [Op.lte]: contentFilters.minElo };
    }
    if (contentFilters.maxElo !== undefined) {
      contentWhere.maxElo = { [Op.gte]: contentFilters.maxElo };
    }
    if (contentFilters.gender !== undefined) {
      contentWhere.gender = contentFilters.gender;
    }
    if (contentFilters.racketCheck !== undefined) {
      contentWhere.racketCheck = contentFilters.racketCheck;
    }
    if (contentFilters.isGroupStage !== undefined) {
      contentWhere.isGroupStage = contentFilters.isGroupStage;
    }

    // Build include for filtering by userId if provided
    const includeOptions: any[] = [
      {
        model: TournamentContent,
        as: "contents",
        where: Object.keys(contentWhere).length > 0 ? contentWhere : undefined,
        required: Object.keys(contentWhere).length > 0,
      },
    ];

    // If userId is provided, filter tournaments where user has entries
    const tournamentWhere: WhereOptions<any> = {};
    
    // Add createdBy filter if provided
    if (createdBy !== undefined) {
      tournamentWhere.createdBy = createdBy;
    }
    
    if (userId !== undefined) {
      // Find tournaments where user has entries
      const userEntries = await Entries.findAll({
        include: [
          {
            model: EntryMember,
            as: "members",
            where: { userId },
            required: true,
          },
        ],
      });

      const tournamentIds = [
        ...new Set(userEntries.map((entry) => entry.contentId)),
      ];

      if (tournamentIds.length > 0) {
        // Get tournament IDs from content IDs
        const contents = await TournamentContent.findAll({
          where: { id: { [Op.in]: tournamentIds } },
          attributes: ["tournamentId"],
        });

        const finalTournamentIds = [
          ...new Set(contents.map((c) => c.tournamentId)),
        ];

        if (finalTournamentIds.length > 0) {
          tournamentWhere.id = { [Op.in]: finalTournamentIds };
        } else {
          // User has no entries matching filters
          return { tournaments: [], total: 0 };
        }
      } else {
        // User has no entries
        return { tournaments: [], total: 0 };
      }
    }

    const { count, rows } = await Tournament.findAndCountAll({
      ...(Object.keys(tournamentWhere).length > 0 && { where: tournamentWhere }),
      include: includeOptions,
      offset: skip,
      limit,
      order: [["startDate", "DESC"]],
      distinct: true,
    });

    return { tournaments: rows, total: count };
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
