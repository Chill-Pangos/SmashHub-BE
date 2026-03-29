import Entry from "../models/entry.model";
import EntryMember from "../models/entryMember.model";
import TournamentCategory from "../models/tournamentCategory.model";
import EloScore from "../models/eloScore.model";
import User from "../models/user.model";
import { CreateEntryDto, UpdateEntryDto, RegisterEntryDto } from "../dto/entry.dto";
import { withTransaction } from "../utils/transaction.helper";
import { ValidationHelper } from "../utils/validation.helper";
import { QueryHelper } from "../utils/query.helper";

export class EntryService {
  async create(data: CreateEntryDto): Promise<Entry> {
    return await Entry.create(data as any);
  }

  async registerEntry(data: RegisterEntryDto, userId: number): Promise<Entry> {
    return withTransaction(async (transaction) => {
      // Verify user is team_manager of the team
      await ValidationHelper.verifyTeamManager(userId, data.teamId, transaction);

      // Verify team belongs to the tournament of the category
      const category = await TournamentCategory.findByPk(data.categoryId, { transaction });
      if (!category) {
        throw new Error('Category not found');
      }

      const { team } = await ValidationHelper.verifyTeamBelongsToTournament(
        data.teamId,
        category.tournamentId,
        transaction
      );

      // Check if entries limit has been reached
      const existingEntriesCount = await Entry.count({
        where: { categoryId: data.categoryId },
        transaction,
      });

      await ValidationHelper.verifyCategoryCapacity(
        data.categoryId,
        existingEntriesCount,
        transaction
      );

      // Verify all members belong to the team
      await ValidationHelper.verifyTeamMembers(data.teamId, data.memberIds, transaction);

      // Validate gender requirements
      await this.validateMembersGender(data.memberIds, category, transaction);

      // Create entry
      const entry = await Entry.create(
        {
          categoryId: data.categoryId,
          teamId: data.teamId,
        } as any,
        { transaction }
      );

      // Get ELO scores for members and create entry members
      const entryMembersData = await this.getEntryMembersData(
        entry.id,
        data.memberIds,
        transaction
      );

      await EntryMember.bulkCreate(entryMembersData, { transaction });

      // Fetch the created entry with all related data within the same transaction
      const entryWithRelations = await Entry.findByPk(entry.id, {
        include: QueryHelper.entryWithRelations(),
        transaction,
      });

      if (!entryWithRelations) {
        throw new Error('Entry not found after creation');
      }

      return entryWithRelations;
    });
  }

  private async getEntryMembersData(
    entryId: number,
    memberIds: number[],
    transaction: any
  ): Promise<Array<{ entryId: number; userId: number; eloAtEntry: number }>> {
    return Promise.all(
      memberIds.map(async (memberId) => {
        const eloScore = await EloScore.findOne({
          where: { userId: memberId },
          transaction,
        });

        return {
          entryId,
          userId: memberId,
          eloAtEntry: eloScore?.score || 1000,
        };
      })
    );
  }

  /**
   * Validate members gender against category requirements
   */
  private async validateMembersGender(
    memberIds: number[],
    category: TournamentCategory,
    transaction: any
  ): Promise<void> {
    // If category doesn't have gender requirement, skip validation
    if (!category.gender) {
      return;
    }

    // Get all members with their user info
    const users = await User.findAll({
      where: { id: memberIds },
      ...(transaction && { transaction }),
    });

    // Check each user's gender
    const invalidUsers: string[] = [];
    for (const user of users) {
      if (!user.gender) {
        invalidUsers.push(`${user.username} (gender not set)`);
      } else if (user.gender !== category.gender) {
        invalidUsers.push(`${user.username} (${user.gender})`);
      }
    }

    if (invalidUsers.length > 0) {
      throw new Error(
        `Gender mismatch: Category requires "${category.gender}" but found: ${invalidUsers.join(', ')}`
      );
    }
  }

  async findAll(skip = 0, limit = 10): Promise<Entry[]> {
    return await Entry.findAll({
      offset: skip,
      limit,
    });
  }

  async findById(id: number): Promise<Entries | null> {
    return await Entry.findByPk(id);
  }

  async findByCategoryId(
    categoryId: number,
    skip = 0,
    limit = 10
  ): Promise<Entry[]> {
    return await Entry.findAll({
      where: { categoryId },
      offset: skip,
      limit,
    });
  }

  async update(id: number, data: UpdateEntryDto): Promise<[number, Entry[]]> {
    return await Entry.update(data, {
      where: { id },
      returning: true,
    });
  }

  async delete(id: number): Promise<number> {
    return await Entry.destroy({ where: { id } });
  }
}

export default new EntryService();
