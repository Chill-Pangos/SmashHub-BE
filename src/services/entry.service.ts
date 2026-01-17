import Entries from "../models/entries.model";
import EntryMember from "../models/entryMember.model";
import Team from "../models/team.model";
import TournamentContent from "../models/tournamentContent.model";
import EloScore from "../models/eloScore.model";
import User from "../models/user.model";
import TeamMember from "../models/teamMember.model";
import { CreateEntryDto, UpdateEntryDto, RegisterEntryDto } from "../dto/entry.dto";
import { withTransaction } from "../utils/transaction.helper";
import { ValidationHelper } from "../utils/validation.helper";
import { QueryHelper } from "../utils/query.helper";

export class EntryService {
  async create(data: CreateEntryDto): Promise<Entries> {
    return await Entries.create(data as any);
  }

  async registerEntry(data: RegisterEntryDto, userId: number): Promise<Entries> {
    return withTransaction(async (transaction) => {
      // Verify user is team_manager of the team
      await ValidationHelper.verifyTeamManager(userId, data.teamId, transaction);

      // Verify team belongs to the tournament of the content
      const content = await TournamentContent.findByPk(data.contentId, { transaction });
      if (!content) {
        throw new Error('Content not found');
      }

      const { team } = await ValidationHelper.verifyTeamBelongsToTournament(
        data.teamId,
        content.tournamentId,
        transaction
      );

      // Check if entries limit has been reached
      const existingEntriesCount = await Entries.count({
        where: { contentId: data.contentId },
        transaction,
      });

      await ValidationHelper.verifyContentCapacity(
        data.contentId,
        existingEntriesCount,
        transaction
      );

      // Verify all members belong to the team
      await ValidationHelper.verifyTeamMembers(data.teamId, data.memberIds, transaction);

      // Validate gender requirements
      await this.validateMembersGender(data.memberIds, content, transaction);

      // Create entry
      const entry = await Entries.create(
        {
          contentId: data.contentId,
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
      const entryWithRelations = await Entries.findByPk(entry.id, {
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
   * Validate members gender against content requirements
   */
  private async validateMembersGender(
    memberIds: number[],
    content: TournamentContent,
    transaction: any
  ): Promise<void> {
    // If content doesn't have gender requirement, skip validation
    if (!content.gender) {
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
      } else if (user.gender !== content.gender) {
        invalidUsers.push(`${user.username} (${user.gender})`);
      }
    }

    if (invalidUsers.length > 0) {
      throw new Error(
        `Gender mismatch: Content requires "${content.gender}" but found: ${invalidUsers.join(', ')}`
      );
    }
  }

  async findAll(skip = 0, limit = 10): Promise<Entries[]> {
    return await Entries.findAll({
      offset: skip,
      limit,
    });
  }

  async findById(id: number): Promise<Entries | null> {
    return await Entries.findByPk(id);
  }

  async findByContentId(
    contentId: number,
    skip = 0,
    limit = 10
  ): Promise<Entries[]> {
    return await Entries.findAll({
      where: { contentId },
      offset: skip,
      limit,
    });
  }

  async update(id: number, data: UpdateEntryDto): Promise<[number, Entries[]]> {
    return await Entries.update(data, {
      where: { id },
      returning: true,
    });
  }

  async delete(id: number): Promise<number> {
    return await Entries.destroy({ where: { id } });
  }
}

export default new EntryService();
