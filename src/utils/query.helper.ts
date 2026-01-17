import TeamMember from "../models/teamMember.model";
import Team from "../models/team.model";
import TournamentContent from "../models/tournamentContent.model";
import EntryMember from "../models/entryMember.model";

/**
 * Common include options for queries
 */
export class QueryHelper {
  /**
   * Include options for Team with members
   */
  static teamWithMembers() {
    return [
      {
        model: TeamMember,
        as: "members",
      },
    ];
  }

  /**
   * Include options for Entry with related data
   */
  static entryWithRelations() {
    return [
      {
        model: EntryMember,
        as: 'members',
      },
      {
        model: Team,
        as: 'team',
      },
      {
        model: TournamentContent,
        as: 'content',
      },
    ];
  }

  /**
   * Include options for Tournament with contents
   */
  static tournamentWithContents() {
    return [
      {
        model: TournamentContent,
        as: "contents",
      },
    ];
  }

  /**
   * Calculate pagination info
   */
  static calculatePagination(count: number, skip: number, limit?: number) {
    const currentLimit = limit && limit > 0 ? limit : count;
    const currentPage = currentLimit > 0 ? Math.floor(skip / currentLimit) + 1 : 1;
    const totalPages = currentLimit > 0 ? Math.ceil(count / currentLimit) : 1;

    return {
      total: count,
      page: currentPage,
      limit: currentLimit,
      totalPages,
      hasNextPage: currentPage < totalPages,
      hasPrevPage: currentPage > 1,
    };
  }

  /**
   * Create empty pagination response
   */
  static emptyPagination(limit?: number) {
    return {
      total: 0,
      page: 1,
      limit: limit && limit > 0 ? limit : 0,
      totalPages: 0,
      hasNextPage: false,
      hasPrevPage: false,
    };
  }
}
