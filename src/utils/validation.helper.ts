import TeamMember from "../models/teamMember.model";
import Team from "../models/team.model";
import TournamentCategory from "../models/tournamentCategory.model";
import { Transaction } from "sequelize";

export class ValidationHelper {
  /**
   * Verify user is team manager
   */
  static async verifyTeamManager(
    userId: number,
    teamId: number,
    transaction?: Transaction | null
  ): Promise<void> {
    const teamMember = await TeamMember.findOne({
      where: { teamId, userId, role: 'team_manager' },
      ...(transaction && { transaction }),
    });

    if (!teamMember) {
      throw new Error('Only team manager can perform this action');
    }
  }

  /**
   * Verify team belongs to tournament
   */
  static async verifyTeamBelongsToTournament(
    teamId: number,
    tournamentId: number,
    transaction?: Transaction | null
  ): Promise<{ team: Team }> {
    const team = await Team.findByPk(teamId, {
      ...(transaction && { transaction }),
    });

    if (!team) {
      throw new Error('Team not found');
    }

    if (team.tournamentId !== tournamentId) {
      throw new Error('Team does not belong to this tournament');
    }

    return { team };
  }

  /**
   * Verify all users are team members
   */
  static async verifyTeamMembers(
    teamId: number,
    userIds: number[],
    transaction?: Transaction | null
  ): Promise<void> {
    const teamMembers = await TeamMember.findAll({
      where: { teamId },
      ...(transaction && { transaction }),
    });

    const teamMemberIds = teamMembers.map(tm => tm.userId);
    const invalidMembers = userIds.filter(id => !teamMemberIds.includes(id));

    if (invalidMembers.length > 0) {
      throw new Error(`Users ${invalidMembers.join(', ')} are not members of the team`);
    }
  }

  /**
   * Verify category capacity
   */
  static async verifyCategoryCapacity(
    categoryId: number,
    currentCount: number,
    transaction?: Transaction | null
  ): Promise<void> {
    const category = await TournamentCategory.findByPk(categoryId, {
      ...(transaction && { transaction }),
    });

    if (!category) {
      throw new Error('Category not found');
    }

    if (currentCount >= category.maxEntries) {
      throw new Error('Maximum number of entries has been reached for this category');
    }
  }
}
