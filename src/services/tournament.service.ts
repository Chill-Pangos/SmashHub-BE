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

const MAX_CATEGORIES_PER_TOURNAMENT = 1;

export class TournamentService {
  async create(data: CreateTournamentDto): Promise<Tournament> {
    const transaction = await sequelize.transaction();

    try {
      // Create tournament
      const tournament = await Tournament.create(
        {
          name: data.name,
          tier: data.tier,
          startDate: data.startDate,
          endDate: data.endDate ? data.endDate : null,
          registrationStartDate: data.registrationStartDate
            ? data.registrationStartDate
            : null,
          registrationEndDate: data.registrationEndDate
            ? data.registrationEndDate
            : null,
          bracketGenerationDate: data.bracketGenerationDate
            ? data.bracketGenerationDate
            : null,
          location: data.location,
          status: data.status || "upcoming",
          numberOfTables: data.numberOfTables || 1,
          createdBy: data.createdBy,
        } as any,
        { transaction },
      );

      // Create tournament categories if provided
      if (data.categories && data.categories.length > 0) {
        if (data.categories.length > MAX_CATEGORIES_PER_TOURNAMENT) {
          throw new Error(
            `A tournament can have at most ${MAX_CATEGORIES_PER_TOURNAMENT} categories.`,
          );
        }

        await TournamentCategory.bulkCreate(
          data.categories.map((categoryData) => ({
            tournamentId: tournament.id,
            name: categoryData.name,
            type: categoryData.type,
            maxEntries: categoryData.maxEntries,
            maxSets: categoryData.maxSets,
            teamFormat: categoryData.teamFormat ?? null,
            minAge: categoryData.minAge ?? null,
            maxAge: categoryData.maxAge ?? null,
            minElo: categoryData.minElo ?? null,
            maxElo: categoryData.maxElo ?? null,
            maxMembersPerEntry: categoryData.maxMembersPerEntry ?? null,
            gender: categoryData.gender ?? null,
            isGroupStage: categoryData.isGroupStage,
          })),
          { transaction },
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
        throw new Error("Tournament not found after creation");
      }

      return createdTournament;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async findAllWithCategoriesFiltered(filters: TournamentFilterDto): Promise<{
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
    if (categoryFilters.status !== undefined) {
      categoryWhere.status = categoryFilters.status;
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
        attributes: ["tournamentId"],
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
            const intersection = finalTournamentIds.filter((id) =>
              existingIds.includes(id),
            );
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
      ...(Object.keys(tournamentWhere).length > 0 && {
        where: tournamentWhere,
      }),
      include: includeOptions,
      offset: skip,
      ...(limit && limit > 0 && { limit }),
      order: [["startDate", "DESC"]],
      distinct: true,
    });

    // Calculate pagination info
    const currentLimit = limit && limit > 0 ? limit : count;
    const currentPage =
      currentLimit > 0 ? Math.floor(skip / currentLimit) + 1 : 1;
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

  async update(
    id: number,
    data: UpdateTournamentDto,
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
          registrationStartDate: data.registrationStartDate
            ? data.registrationStartDate
            : null,
          registrationEndDate: data.registrationEndDate
            ? data.registrationEndDate
            : null,
          bracketGenerationDate: data.bracketGenerationDate
            ? data.bracketGenerationDate
            : null,
          location: data.location,
          numberOfTables: data.numberOfTables ?? 1,
          status: data.status,
        },
        { transaction },
      );

      if (
        data.categories !== undefined &&
        data.categories.length > MAX_CATEGORIES_PER_TOURNAMENT
      ) {
        throw new Error(
          `Currently only ${MAX_CATEGORIES_PER_TOURNAMENT} category per tournament is allowed`,
        );
      }

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
            data.categories.map((c) => ({
              tournamentId: id,
              name: c.name,
              type: c.type,
              maxEntries: c.maxEntries,
              maxSets: c.maxSets,
              teamFormat: c.teamFormat ?? null,
              minAge: c.minAge ?? null,
              maxAge: c.maxAge ?? null,
              minElo: c.minElo ?? null,
              maxElo: c.maxElo ?? null,
              maxMembersPerEntry: c.maxMembersPerEntry ?? null,
              gender: c.gender ?? null,
              isGroupStage: c.isGroupStage,
            })),
            { transaction },
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

  /**
   * Manually trigger tournament status update based on dates
   * This can be called by admin endpoint or used for testing
   * @returns Object containing counts of updated tournaments
   */
  async updateTournamentStatuses(): Promise<{
    openedCount: number;
    closedCount: number;
    bracketsGeneratedCount: number;
    totalUpdated: number;
  }> {
    const now = new Date();

    // Track counts per status
    const statuses = {
      openedCount: 0,
      closedCount: 0,
      bracketsGeneratedCount: 0,
    };

    // 1. Update to registration_open: upcoming → registration_open
    // (registrationStartDate has passed, but registrationEndDate has NOT)
    const openedResult = await Tournament.update(
      { status: "registration_open" },
      {
        where: {
          status: "upcoming",
          registrationStartDate: {
            [Op.lte]: now,
            [Op.not]: null,
          },
          registrationEndDate: {
            [Op.gt]: now,
            [Op.not]: null,
          },
        },
      },
    );
    statuses.openedCount += openedResult[0];

    // 2. Update to registration_closed: registration_open → registration_closed
    // (registrationEndDate has passed, but bracketGenerationDate has NOT)
    const closedResult = await Tournament.update(
      { status: "registration_closed" },
      {
        where: {
          status: "registration_open",
          registrationEndDate: {
            [Op.lte]: now,
            [Op.not]: null,
          },
          bracketGenerationDate: {
            [Op.gt]: now,
            [Op.not]: null,
          },
        },
      },
    );
    statuses.closedCount += closedResult[0];

    // 3. Update to brackets_generated: registration_closed → brackets_generated
    // (bracketGenerationDate has passed)
    const bracketsResult = await Tournament.update(
      { status: "brackets_generated" },
      {
        where: {
          status: "registration_closed",
          bracketGenerationDate: {
            [Op.lte]: now,
            [Op.not]: null,
          },
        },
      },
    );
    statuses.bracketsGeneratedCount += bracketsResult[0];

    // Handle edge cases: tournaments that skipped phases due to incorrect date setup
    // If a tournament was created after registrationStartDate, it may still be "upcoming"
    // but needs to jump to later phases

    // Skip from upcoming → registration_closed
    // (when both registrationStartDate AND registrationEndDate have passed)
    const skippedClosedResult = await Tournament.update(
      { status: "registration_closed" },
      {
        where: {
          status: "upcoming",
          registrationStartDate: { [Op.lte]: now, [Op.not]: null },
          registrationEndDate: { [Op.lte]: now, [Op.not]: null },
          bracketGenerationDate: { [Op.gt]: now, [Op.not]: null },
        },
      },
    );
    statuses.closedCount += skippedClosedResult[0];

    // Skip from upcoming/registration_open → brackets_generated
    // (when all dates including bracketGenerationDate have passed)
    const skippedBracketsResult = await Tournament.update(
      { status: "brackets_generated" },
      {
        where: {
          status: {
            [Op.in]: ["upcoming", "registration_open", "registration_closed"],
          },
          bracketGenerationDate: { [Op.lte]: now, [Op.not]: null },
        },
      },
    );
    statuses.bracketsGeneratedCount += skippedBracketsResult[0];

    return {
      openedCount: statuses.openedCount,
      closedCount: statuses.closedCount,
      bracketsGeneratedCount: statuses.bracketsGeneratedCount,
      totalUpdated:
        statuses.openedCount +
        statuses.closedCount +
        statuses.bracketsGeneratedCount,
    };
  }

  /**
   * Get tournaments that will change status within the next specified hours
   * Useful for notifications and monitoring
   * @param hours - Number of hours to look ahead (default: 24)
   */
  async getUpcomingStatusChanges(hours: number = 24): Promise<{
    openingSoon: Tournament[];
    closingSoon: Tournament[];
    bracketsSoon: Tournament[];
  }> {
    const now = new Date();
    const futureTime = new Date(now.getTime() + hours * 60 * 60 * 1000);

    const openingSoon = await Tournament.findAll({
      where: {
        status: "upcoming",
        registrationStartDate: {
          [Op.between]: [now, futureTime],
        },
      },
      attributes: ["id", "name", "registrationStartDate", "status"],
    });

    const closingSoon = await Tournament.findAll({
      where: {
        status: "registration_open",
        registrationEndDate: {
          [Op.between]: [now, futureTime],
        },
      },
      attributes: ["id", "name", "registrationEndDate", "status"],
    });

    const bracketsSoon = await Tournament.findAll({
      where: {
        status: "registration_closed",
        bracketGenerationDate: {
          [Op.between]: [now, futureTime],
        },
      },
      attributes: ["id", "name", "bracketGenerationDate", "status"],
    });

    return {
      openingSoon,
      closingSoon,
      bracketsSoon,
    };
  }
}

export default new TournamentService();
