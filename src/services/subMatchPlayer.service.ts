// subMatchPlayer.service.ts — đơn giản, chủ yếu query
import SubMatchPlayer from "../models/subMatchPlayer.model";
import SubMatch from "../models/subMatch.model";
import EntryMember from "../models/entryMember.model";
import User from "../models/user.model";
import { Team } from "../models/subMatch.model";

export class SubMatchPlayerService {
  async getPlayersBySubMatch(subMatchId: number, options?: { offset?: number; limit?: number }): Promise<{ players?: SubMatchPlayer[], pagination?: any } | SubMatchPlayer[]> {
    const offset = options?.offset || 0;
    const limit = options?.limit || 10;

    // If pagination is requested
    if (options && (options.offset !== undefined || options.limit !== undefined)) {
      const { count, rows } = await SubMatchPlayer.findAndCountAll({
        where: { subMatchId },
        include: [{
          model: EntryMember,
          as: "entryMember",
          include: [{
            model: User,
            as: "user",
            attributes: ["id", "firstName", "lastName", "avatarUrl"],
          }],
        }],
        offset,
        limit: limit,
      });

      const totalPages = Math.ceil(count / limit);
      const page = Math.floor(offset / limit) + 1;

      return {
        players: rows,
        pagination: {
          total: count,
          page,
          limit,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      };
    }

    return await SubMatchPlayer.findAll({
      where: { subMatchId },
      include: [{
        model: EntryMember,
        as: "entryMember",
        include: [{
          model: User,
          as: "user",
          attributes: ["id", "firstName", "lastName", "avatarUrl"],
        }],
      }],
    });
  }

  async getPlayersByTeam(
    subMatchId: number,
    team: Team,
    options?: { offset?: number; limit?: number }
  ): Promise<{ players?: SubMatchPlayer[], pagination?: any } | SubMatchPlayer[]> {
    const offset = options?.offset || 0;
    const limit = options?.limit || 10;

    // If pagination is requested
    if (options && (options.offset !== undefined || options.limit !== undefined)) {
      const { count, rows } = await SubMatchPlayer.findAndCountAll({
        where: { subMatchId, team },
        include: [{
          model: EntryMember,
          as: "entryMember",
          include: [{
            model: User,
            as: "user",
            attributes: ["id", "firstName", "lastName", "avatarUrl"],
          }],
        }],
        offset,
        limit: limit,
      });

      const totalPages = Math.ceil(count / limit);
      const page = Math.floor(offset / limit) + 1;

      return {
        players: rows,
        pagination: {
          total: count,
          page,
          limit,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      };
    }

    return await SubMatchPlayer.findAll({
      where: { subMatchId, team },
      include: [{
        model: EntryMember,
        as: "entryMember",
        include: [{
          model: User,
          as: "user",
          attributes: ["id", "firstName", "lastName", "avatarUrl"],
        }],
      }],
    });
  }

  async getMatchesByEntryMember(
    entryMemberId: number,
    offset = 0,
    limit = 10
  ): Promise<{ matches?: SubMatchPlayer[], pagination?: any }> {
    const { count, rows } = await SubMatchPlayer.findAndCountAll({
      where: { entryMemberId },
      include: [{ model: SubMatch, as: "subMatch" }],
      offset,
      limit,
      order: [["createdAt", "DESC"]],
    });

    const totalPages = Math.ceil(count / limit);
    const page = Math.floor(offset / limit) + 1;

    return {
      matches: rows,
      pagination: {
        total: count,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    };
  }
}

export default new SubMatchPlayerService();