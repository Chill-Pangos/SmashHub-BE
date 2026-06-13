import Tournament from "../models/tournament.model";
import TournamentCategory from "../models/tournamentCategory.model";
import Entry from "../models/entry.model";
import EntryMember from "../models/entryMember.model";
import TournamentReferee from "../models/tournamentReferee.model";
import ScheduleConfig from "../models/scheduleConfig.model";
import Payment from "../models/payment.model";
import GroupStanding from "../models/groupStanding.model";
import KnockoutBracket from "../models/knockoutBracket.model";
import User from "../models/user.model";
import eloCalculationService, { TournamentEloUpdateResult } from "./eloCalculation.service";
import knockoutBracketService from "./knockoutBracket.service";
import {
  CreateTournamentDto,
  UpdateTournamentDto,
  TournamentFilterDto,
} from "../dto/tournament.dto";
import { sequelize } from "../config/database";
import { Op, WhereOptions } from "sequelize";

const MAX_CATEGORIES_PER_TOURNAMENT = 1;
const MIN_ELIGIBLE_ENTRIES_TO_RUN = 16;

type AwardEntry = {
  id: number;
  name: string;
  captainId?: number;
  members: {
    userId: number;
    eloAtEntry: number;
    user?: {
      id: number;
      firstName: string;
      lastName: string;
      email: string;
      avatarUrl?: string;
    };
  }[];
};

type TournamentAward = {
  categoryId: number;
  categoryName: string;
  source: "knockout" | "group";
  placement: number;
  title: "champion" | "runner_up" | "third_place" | "group_winner" | "group_runner_up" | "group_third_place";
  groupName?: string;
  entry: AwardEntry;
};

export type CompleteTournamentResult = {
  tournament: Tournament;
  awards: TournamentAward[];
  elo: TournamentEloUpdateResult;
};

export class TournamentService {
  async create(data: CreateTournamentDto): Promise<Tournament> {
    const transaction = await sequelize.transaction();

    try {
      // Create tournament
      const tournament = await Tournament.create(
        {
          name: data.name,
          introduction: data.introduction ?? null,
          tier: data.tier,
          location: data.location,
          status: data.status || "upcoming",
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
            entryFee: categoryData.entryFee ?? 0,
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
    const { offset = 0, limit, name, userId, createdBy, ...categoryFilters } = filters;

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

    if (name?.trim()) {
      tournamentWhere.name = { [Op.like]: `%${name.trim()}%` };
    }

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
      {
        model: ScheduleConfig,
        as: "scheduleConfig",
        required: false,
        attributes: [],
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
      offset: offset,
      ...(limit && limit > 0 && { limit }),
      order: [[{ model: ScheduleConfig, as: "scheduleConfig" }, "startDate", "DESC"]],
      distinct: true,
    });

    // Calculate pagination info
    const currentLimit = limit && limit > 0 ? limit : count;
    const currentPage =
      currentLimit > 0 ? Math.floor(offset / currentLimit) + 1 : 1;
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
        {
          model: ScheduleConfig,
          as: "scheduleConfig",
          required: false,
        },
        {
          model: User,
          as: "creator",
          attributes: ["id", "firstName", "lastName", "gender", "avatarUrl"],
          required: false,
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
          introduction: data.introduction,
          location: data.location,
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
              entryFee: c.entryFee ?? 0,
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

  async completeTournament(id: number): Promise<CompleteTournamentResult | null> {
    const tournament = await Tournament.findByPk(id, {
      include: [{ model: TournamentCategory, as: "categories" }],
    });

    if (!tournament) {
      return null;
    }

    const categories = tournament.categories ?? [];
    if (categories.length === 0) {
      throw new Error("Tournament has no categories");
    }

    const awards = await this.getTournamentAwards(categories);

    if (tournament.status !== "completed") {
      await tournament.update({ status: "completed" });
      tournament.status = "completed";
    }

    const elo = await eloCalculationService.updateEloForTournament(id);

    return {
      tournament,
      awards,
      elo,
    };
  }

  async cancelTournament(id: number, organizerId: number): Promise<Tournament | null> {
    const tournament = await Tournament.findByPk(id, {
      include: [{ model: TournamentCategory, as: "categories" }],
    });

    if (!tournament) {
      return null;
    }
    if (tournament.createdBy !== organizerId) {
      throw new Error("Only the tournament organizer can cancel this tournament");
    }
    if (tournament.status === "completed") {
      throw new Error("Completed tournaments cannot be cancelled");
    }
    if (tournament.status === "cancelled") {
      throw new Error("Tournament is already cancelled");
    }

    await tournament.update({ status: "cancelled" });
    tournament.status = "cancelled";

    return tournament;
  }

  private async getTournamentAwards(categories: TournamentCategory[]): Promise<TournamentAward[]> {
    const awards: TournamentAward[] = [];

    for (const category of categories) {
      const hasKnockoutBrackets = await KnockoutBracket.count({
        where: { categoryId: category.id },
      });

      if (hasKnockoutBrackets > 0) {
        awards.push(...await this.getKnockoutAwards(category));
        continue;
      }

      awards.push(...await this.getGroupAwards(category));
    }

    return awards;
  }

  private async getKnockoutAwards(category: TournamentCategory): Promise<TournamentAward[]> {
    const standings = await knockoutBracketService.getStandings(category.id);
    const awardItems: {
      entryId: number | undefined;
      placement: number;
      title: TournamentAward["title"];
    }[] = [
      { entryId: standings.champion, placement: 1, title: "champion" },
      { entryId: standings.runnerUp, placement: 2, title: "runner_up" },
      ...(standings.thirdPlace ?? []).map((entryId) => ({
        entryId,
        placement: 3,
        title: "third_place" as const,
      })),
    ];

    const awards: TournamentAward[] = [];
    for (const item of awardItems) {
      if (item.entryId == null) continue;

      const entry = await this.findAwardEntry(item.entryId);
      if (!entry) continue;

      awards.push({
        categoryId: category.id,
        categoryName: category.name,
        source: "knockout",
        placement: item.placement,
        title: item.title,
        entry,
      });
    }

    return awards;
  }

  private async getGroupAwards(category: TournamentCategory): Promise<TournamentAward[]> {
    const standings = await GroupStanding.findAll({
      where: {
        categoryId: category.id,
        position: { [Op.in]: [1, 2, 3] },
      },
      include: [
        {
          model: Entry,
          as: "entry",
          include: [
            {
              model: EntryMember,
              as: "members",
              include: [{ model: User, as: "user", attributes: ["id", "firstName", "lastName", "email", "avatarUrl"] }],
            },
          ],
        },
      ],
      order: [
        ["groupName", "ASC"],
        ["position", "ASC"],
      ],
    });

    const titleByPosition: Record<number, TournamentAward["title"]> = {
      1: "group_winner",
      2: "group_runner_up",
      3: "group_third_place",
    };

    return standings
      .filter((standing) => standing.position != null && standing.entry)
      .map((standing) => ({
        categoryId: category.id,
        categoryName: category.name,
        source: "group" as const,
        placement: standing.position!,
        title: titleByPosition[standing.position!]!,
        groupName: standing.groupName,
        entry: this.toAwardEntry(standing.entry!),
      }));
  }

  private async findAwardEntry(entryId: number): Promise<AwardEntry | null> {
    const entry = await Entry.findByPk(entryId, {
      include: [
        {
          model: EntryMember,
          as: "members",
          include: [{ model: User, as: "user", attributes: ["id", "firstName", "lastName", "email", "avatarUrl"] }],
        },
      ],
    });

    return entry ? this.toAwardEntry(entry) : null;
  }

  private toAwardEntry(entry: Entry): AwardEntry {
    const result: AwardEntry = {
      id: entry.id,
      name: entry.name,
      members: (entry.members ?? []).map((member) => {
        const item: AwardEntry["members"][number] = {
          userId: member.userId,
          eloAtEntry: member.eloAtEntry,
        };

        if (member.user) {
          item.user = {
            id: member.user.id,
            firstName: member.user.firstName,
            lastName: member.user.lastName,
            email: member.user.email,
            ...(member.user.avatarUrl ? { avatarUrl: member.user.avatarUrl } : {}),
          };
        }

        return item;
      }),
    };

    if (entry.captainId != null) {
      result.captainId = entry.captainId;
    }

    return result;
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
    cancelledCount: number;
    totalUpdated: number;
  }> {
    const now = new Date();
    const statuses = {
      openedCount: 0,
      closedCount: 0,
      bracketsGeneratedCount: 0,
      cancelledCount: 0,
    };

    // Helper: lấy tournamentIds từ ScheduleConfig theo điều kiện ngày
    const getIds = async (where: WhereOptions<any>): Promise<number[]> => {
      const configs = await ScheduleConfig.findAll({
        where,
        attributes: ["tournamentId"],
      });
      return configs.map((c) => c.tournamentId);
    };

    const splitByMinimumEligibleEntries = async (
      tournamentIds: number[],
    ): Promise<{ runnableIds: number[]; cancellableIds: number[] }> => {
      if (tournamentIds.length === 0) {
        return { runnableIds: [], cancellableIds: [] };
      }

      const categories = await TournamentCategory.findAll({
        where: { tournamentId: { [Op.in]: tournamentIds } },
        attributes: ["id", "tournamentId", "entryFee"],
      });

      const categoryIds = categories.map((category) => category.id);
      const entries = categoryIds.length > 0
        ? await Entry.findAll({
            where: { categoryId: { [Op.in]: categoryIds } },
            attributes: ["id", "categoryId", "requiredMemberCount", "currentMemberCount", "isConfirmed"],
            raw: true,
          })
        : [];

      const paidEntryIds = new Set<number>();
      const entryIdsRequiringPayment = entries
        .filter((entry) => {
          const category = categories.find((c) => c.id === entry.categoryId);
          return category?.entryFee != null && Number(category.entryFee) > 0;
        })
        .map((entry) => entry.id);

      if (entryIdsRequiringPayment.length > 0) {
        const payments = await Payment.findAll({
          where: {
            entryId: { [Op.in]: entryIdsRequiringPayment },
            status: "completed",
          },
          attributes: ["entryId"],
          raw: true,
        });

        for (const payment of payments) {
          paidEntryIds.add(payment.entryId);
        }
      }

      const categoryById = new Map(categories.map((category) => [category.id, category]));
      const eligibleEntryCountByCategoryId = new Map<number, number>();

      for (const entry of entries) {
        const category = categoryById.get(entry.categoryId);
        const requiresPayment = category?.entryFee != null && Number(category.entryFee) > 0;
        const hasEnoughMembers =
          entry.requiredMemberCount == null ||
          entry.currentMemberCount >= entry.requiredMemberCount;

        if (!hasEnoughMembers || !entry.isConfirmed) continue;
        if (requiresPayment && !paidEntryIds.has(entry.id)) continue;

        eligibleEntryCountByCategoryId.set(
          entry.categoryId,
          (eligibleEntryCountByCategoryId.get(entry.categoryId) ?? 0) + 1,
        );
      }

      const eligibleEntryCountByTournamentId = new Map<number, number>();
      for (const category of categories) {
        eligibleEntryCountByTournamentId.set(
          category.tournamentId,
          (eligibleEntryCountByTournamentId.get(category.tournamentId) ?? 0) +
            (eligibleEntryCountByCategoryId.get(category.id) ?? 0),
        );
      }

      const runnableIds: number[] = [];
      const cancellableIds: number[] = [];

      for (const tournamentId of tournamentIds) {
        const eligibleEntryCount = eligibleEntryCountByTournamentId.get(tournamentId) ?? 0;
        if (eligibleEntryCount >= MIN_ELIGIBLE_ENTRIES_TO_RUN) {
          runnableIds.push(tournamentId);
        } else {
          cancellableIds.push(tournamentId);
        }
      }

      return { runnableIds, cancellableIds };
    };

    // 1. upcoming → registration_open
    const openIds = await getIds({
      registrationStartDate: { [Op.lte]: now, [Op.not]: null },
      registrationEndDate: { [Op.gt]: now, [Op.not]: null },
    });
    if (openIds.length > 0) {
      const r = await Tournament.update(
        { status: "registration_open" },
        { where: { status: "upcoming", id: { [Op.in]: openIds } } }
      );
      statuses.openedCount += r[0];
    }

    // 2. registration_open → registration_closed
    const closeIds = await getIds({
      registrationEndDate: { [Op.lte]: now, [Op.not]: null },
      bracketGenerationDate: { [Op.gt]: now, [Op.not]: null },
    });
    if (closeIds.length > 0) {
      const r = await Tournament.update(
        { status: "registration_closed" },
        { where: { status: "registration_open", id: { [Op.in]: closeIds } } }
      );
      statuses.closedCount += r[0];
    }

    // 3. registration_closed → brackets_generated
    const bracketIds = await getIds({
      bracketGenerationDate: { [Op.lte]: now, [Op.not]: null },
    });
    const { runnableIds: runnableBracketIds, cancellableIds } =
      await splitByMinimumEligibleEntries(bracketIds);

    if (cancellableIds.length > 0) {
      const r = await Tournament.update(
        { status: "cancelled" },
        {
          where: {
            status: { [Op.in]: ["upcoming", "registration_open", "registration_closed"] },
            id: { [Op.in]: cancellableIds },
          },
        }
      );
      statuses.cancelledCount += r[0];
    }

    if (runnableBracketIds.length > 0) {
      const r = await Tournament.update(
        { status: "brackets_generated" },
        { where: { status: "registration_closed", id: { [Op.in]: runnableBracketIds } } }
      );
      statuses.bracketsGeneratedCount += r[0];
    }

    // 4. Edge case: upcoming → registration_closed (skip open phase)
    const skipCloseIds = await getIds({
      registrationStartDate: { [Op.lte]: now, [Op.not]: null },
      registrationEndDate: { [Op.lte]: now, [Op.not]: null },
      bracketGenerationDate: { [Op.gt]: now, [Op.not]: null },
    });
    if (skipCloseIds.length > 0) {
      const r = await Tournament.update(
        { status: "registration_closed" },
        { where: { status: "upcoming", id: { [Op.in]: skipCloseIds } } }
      );
      statuses.closedCount += r[0];
    }

    // 5. Edge case: any early phase → brackets_generated
    if (runnableBracketIds.length > 0) {
      const r = await Tournament.update(
        { status: "brackets_generated" },
        {
          where: {
            status: { [Op.in]: ["upcoming", "registration_open", "registration_closed"] },
            id: { [Op.in]: runnableBracketIds },
          },
        }
      );
      statuses.bracketsGeneratedCount += r[0];
    }

    return {
      openedCount: statuses.openedCount,
      closedCount: statuses.closedCount,
      bracketsGeneratedCount: statuses.bracketsGeneratedCount,
      cancelledCount: statuses.cancelledCount,
      totalUpdated:
        statuses.openedCount +
        statuses.closedCount +
        statuses.bracketsGeneratedCount +
        statuses.cancelledCount,
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

    const findTournamentsByConfigDates = async (
      status: string,
      configWhere: WhereOptions<any>
    ): Promise<Tournament[]> => {
      const configs = await ScheduleConfig.findAll({
        where: configWhere,
        attributes: ["tournamentId"],
      });
      const ids = configs.map((c) => c.tournamentId);
      if (ids.length === 0) return [];
      return Tournament.findAll({
        where: { status, id: { [Op.in]: ids } },
        attributes: ["id", "name", "status"],
        include: [{ model: ScheduleConfig, as: "scheduleConfig", attributes: ["registrationStartDate", "registrationEndDate", "bracketGenerationDate"] }],
      });
    };

    const [openingSoon, closingSoon, bracketsSoon] = await Promise.all([
      findTournamentsByConfigDates("upcoming", {
        registrationStartDate: { [Op.between]: [now, futureTime] },
      }),
      findTournamentsByConfigDates("registration_open", {
        registrationEndDate: { [Op.between]: [now, futureTime] },
      }),
      findTournamentsByConfigDates("registration_closed", {
        bracketGenerationDate: { [Op.between]: [now, futureTime] },
      }),
    ]);

    return { openingSoon, closingSoon, bracketsSoon };
  }

   async getTournamentsByOrganizer(
    organizerId: number,
    options?: { offset?: number; limit?: number; sortBy?: string; sortOrder?: "ASC" | "DESC" }
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
    const { offset = 0, limit = 10, sortBy = "createdAt", sortOrder = "DESC" } = options || {};

    const { count, rows } = await Tournament.findAndCountAll({
      where: { createdBy: organizerId },
      include: [
        {
          model: TournamentCategory,
          as: "categories",
        },
      ],
      offset,
      ...(limit > 0 && { limit }),
      order: [[sortBy, sortOrder]],
      distinct: true,
    });

    const currentLimit = limit > 0 ? limit : count;
    const currentPage = currentLimit > 0 ? Math.floor(offset / currentLimit) + 1 : 1;
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

  async getTournamentsByReferee(
    refereeId: number,
    options?: { offset?: number; limit?: number; sortBy?: string; sortOrder?: "ASC" | "DESC" }
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
    const { offset = 0, limit = 10, sortBy = "createdAt", sortOrder = "DESC" } = options || {};

    const { count, rows } = await Tournament.findAndCountAll({
      include: [
        {
          model: TournamentReferee,
          as: "referees",
          where: { refereeId },
          required: true,
          attributes: [],
        },
        {
          model: TournamentCategory,
          as: "categories",
        },
      ],
      offset,
      ...(limit > 0 && { limit }),
      order: [[sortBy, sortOrder]],
      distinct: true,
    });

    const currentLimit = limit > 0 ? limit : count;
    const currentPage = currentLimit > 0 ? Math.floor(offset / currentLimit) + 1 : 1;
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

}

export default new TournamentService();
