import Tournament from "../models/tournament.model";
import TournamentCategory from "../models/tournamentCategory.model";
import Entry from "../models/entry.model";
import EntryMember from "../models/entryMember.model";
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
          numberOfTables: data.numberOfTables || 1,
          createdBy: data.createdBy,
        } as any,
        { transaction }
      );

      // Create tournament categories if provided
      if (data.categories && data.categories.length > 0) {
        await TournamentCategory.bulkCreate(
          data.categories.map(categoryData => ({
            tournamentId: tournament.id,
            name: categoryData.name,
            type: categoryData.type,
            maxEntries: categoryData.maxEntries,
            maxSets: categoryData.maxSets,
            numberOfSingles: categoryData.numberOfSingles ?? null,
            numberOfDoubles: categoryData.numberOfDoubles ?? null,
            minAge: categoryData.minAge ?? null,
            maxAge: categoryData.maxAge ?? null,
            minElo: categoryData.minElo ?? null,
            maxElo: categoryData.maxElo ?? null,
            gender: categoryData.gender ?? null,
            isGroupStage: categoryData.isGroupStage,
          })),
          { transaction }
        );
      }

      // Fetch the created tournament with all related data within transaction
      const createdTournament = await Tournament.findByPk(tournament.id, {
        include: [
          {
            model: TournamentCategory,
            as: "categories",
          },
        ],
        transaction,
      });

      await transaction.commit();

      if (!createdTournament) {
        throw new Error('Tournament not found after creation');
      }

      return createdTournament;
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

  async findAllWithCategoriesFiltered(
    filters: TournamentFilterDto
  ): Promise<{
    tournaments: Tournament[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  }> {
    const { skip = 0, limit, userId, createdBy, ...categoryFilters } = filters;

    // Build where clause for TournamentCategory
    const categoryWhere: WhereOptions<any> = {};
    if (categoryFilters.minAge !== undefined) {
      categoryWhere.minAge = { [Op.lte]: categoryFilters.minAge };
    }
    if (categoryFilters.maxAge !== undefined) {
      categoryWhere.maxAge = { [Op.gte]: categoryFilters.maxAge };
    }
    if (categoryFilters.minElo !== undefined) {
      categoryWhere.minElo = { [Op.lte]: categoryFilters.minElo };
    }
    if (categoryFilters.maxElo !== undefined) {
      categoryWhere.maxElo = { [Op.gte]: categoryFilters.maxElo };
    }
    if (categoryFilters.gender !== undefined) {
      categoryWhere.gender = categoryFilters.gender;
    }
    if (categoryFilters.isGroupStage !== undefined) {
      categoryWhere.isGroupStage = categoryFilters.isGroupStage;
    }

    // Determine if we should filter by category or just include all
    const hasCategoryFilters = Object.keys(categoryWhere).length > 0;
    
    // Build tournament where clause
    const tournamentWhere: WhereOptions<any> = {};
    
    // Add createdBy filter if provided
    if (createdBy !== undefined) {
      tournamentWhere.createdBy = createdBy;
    }
    
    // If we have category filters, find tournaments that have matching categories
    if (hasCategoryFilters) {
      const matchingCategories = await TournamentCategory.findAll({
        where: categoryWhere,
        attributes: ['tournamentId'],
      });
      
      const tournamentIdsWithMatchingCategory = [
        ...new Set(matchingCategories.map((c) => c.tournamentId)),
      ];
      
      if (tournamentIdsWithMatchingCategory.length === 0) {
        // No tournaments have category matching the filters
        return {
          tournaments: [],
          pagination: {
            total: 0,
            page: 1,
            limit: limit && limit > 0 ? limit : 0,
            totalPages: 0,
            hasNextPage: false,
            hasPrevPage: false,
          },
        };
      }
      
      // Add to tournament where clause
      tournamentWhere.id = { [Op.in]: tournamentIdsWithMatchingCategory };
    }
    
    // Build include for all categories (no filter on include)
    const includeOptions: any[] = [
      {
        model: TournamentCategory,
        as: "categories",
        required: false, // Include all categories of the tournament
      },
    ];
    
    // If userId is provided, filter tournaments where user has entries
    if (userId !== undefined) {
      // Find tournaments where user has entries
      const userEntries = await Entry.findAll({
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
        ...new Set(userEntries.map((entry) => entry.categoryId)),
      ];

      if (tournamentIds.length > 0) {
        // Get tournament IDs from category IDs
        const categories = await TournamentCategory.findAll({
          where: { id: { [Op.in]: tournamentIds } },
          attributes: ["tournamentId"],
        });

        const finalTournamentIds = [
          ...new Set(categories.map((c) => c.tournamentId)),
        ];

        if (finalTournamentIds.length > 0) {
          // Merge with existing id filter if present
          if (tournamentWhere.id && tournamentWhere.id[Op.in]) {
            const existingIds = tournamentWhere.id[Op.in];
            const intersection = finalTournamentIds.filter(id => existingIds.includes(id));
            if (intersection.length === 0) {
              // No overlap between filters
              return {
                tournaments: [],
                pagination: {
                  total: 0,
                  page: 1,
                  limit: limit && limit > 0 ? limit : 0,
                  totalPages: 0,
                  hasNextPage: false,
                  hasPrevPage: false,
                },
              };
            }
            tournamentWhere.id = { [Op.in]: intersection };
          } else {
            tournamentWhere.id = { [Op.in]: finalTournamentIds };
          }
        } else {
          // User has no entries matching filters
          return {
            tournaments: [],
            pagination: {
              total: 0,
              page: 1,
              limit: limit && limit > 0 ? limit : 0,
              totalPages: 0,
              hasNextPage: false,
              hasPrevPage: false,
            },
          };
        }
      } else {
        // User has no entries
        return {
          tournaments: [],
          pagination: {
            total: 0,
            page: 1,
            limit: limit && limit > 0 ? limit : 0,
            totalPages: 0,
            hasNextPage: false,
            hasPrevPage: false,
          },
        };
      }
    }

    const { count, rows } = await Tournament.findAndCountAll({
      ...(Object.keys(tournamentWhere).length > 0 && { where: tournamentWhere }),
      include: includeOptions,
      offset: skip,
      ...(limit && limit > 0 && { limit }),
      order: [["startDate", "DESC"]],
      distinct: true,
    });

    // Calculate pagination info
    const currentLimit = limit && limit > 0 ? limit : count;
    const currentPage = currentLimit > 0 ? Math.floor(skip / currentLimit) + 1 : 1;
    const totalPages = currentLimit > 0 ? Math.ceil(count / currentLimit) : 1;

    return {
      tournaments: rows,
      pagination: {
        total: count,
        page: currentPage,
        limit: currentLimit,
        totalPages,
        hasNextPage: currentPage < totalPages,
        hasPrevPage: currentPage > 1,
      },
    };
  }

  async findById(id: number): Promise<Tournament | null> {
    return await Tournament.findByPk(id, {
      include: [
        {
          model: TournamentCategory,
          as: "categories",
        },
      ],
    });
  }

  async findByIdWithCategories(id: number): Promise<Tournament | null> {
    return await Tournament.findByPk(id, {
      include: [
        {
          model: TournamentCategory,
          as: "categories",
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
          numberOfTables: data.numberOfTables ?? 1,
          status: data.status,
        },
        { transaction }
      );

      // Update or create tournament categories if provided
      if (data.categories !== undefined) {
        // Delete existing categories 
        await TournamentCategory.destroy({
          where: { tournamentId: id },
          transaction,
        });

        // Create new categories if provided
        if (data.categories.length > 0) {
          await TournamentCategory.bulkCreate(
            data.categories.map(c => ({
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
              gender: c.gender ?? null,
              isGroupStage: c.isGroupStage,
            })),
            { transaction }
          );
        }
      }

      // Fetch updated tournament with categories within transaction
      const updatedTournament = await Tournament.findByPk(id, {
        include: [
          {
            model: TournamentCategory,
            as: "categories",
          },
        ],
        transaction,
      });

      await transaction.commit();

      return updatedTournament;
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
