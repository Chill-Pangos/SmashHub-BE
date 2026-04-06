// subMatchPlayer.service.ts — đơn giản, chủ yếu query
import SubMatchPlayer from "../models/subMatchPlayer.model";
import SubMatch from "../models/subMatch.model";
import EntryMember from "../models/entryMember.model";
import User from "../models/user.model";
import { Team } from "../models/subMatch.model";

export class SubMatchPlayerService {
  async getPlayersBySubMatch(subMatchId: number): Promise<SubMatchPlayer[]> {
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
    team: Team
  ): Promise<SubMatchPlayer[]> {
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
    skip = 0,
    limit = 10
  ): Promise<SubMatchPlayer[]> {
    return await SubMatchPlayer.findAll({
      where: { entryMemberId },
      include: [{ model: SubMatch, as: "subMatch" }],
      offset: skip,
      limit,
      order: [["createdAt", "DESC"]],
    });
  }
}

export default new SubMatchPlayerService();