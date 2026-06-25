import type {
  ApprovedTournamentMatch,
  MatchSummary,
  RegistrationWindow,
} from "../public.contracts";
import Match from "../models/match.model";
import Schedule from "../models/schedule.model";
import SubMatch from "../models/subMatch.model";
import ScheduleConfig from "../models/scheduleConfig.model";
import { TournamentCategory } from "../../tournament/public.models";
import { Entry, EntryMember } from "../../registration/public.models";

export class CompetitionReadService {
  async matchExists(matchId: number): Promise<boolean> {
    const match = await Match.findByPk(matchId, { attributes: ["id"] });
    return Boolean(match);
  }

  async getRegistrationWindow(tournamentId: number): Promise<RegistrationWindow | null> {
    const config = await ScheduleConfig.findOne({
      where: { tournamentId },
      attributes: ["tournamentId", "registrationStartDate", "registrationEndDate"],
    });
    if (!config) return null;

    return {
      tournamentId: config.tournamentId,
      registrationStartDate: config.registrationStartDate,
      registrationEndDate: config.registrationEndDate,
    };
  }

  async getApprovedTournamentMatchesForElo(
    tournamentId: number,
  ): Promise<ApprovedTournamentMatch[]> {
    const matches = await Match.findAll({
      where: { status: "completed", resultStatus: "approved" },
      include: [
        {
          model: Schedule,
          as: "schedule",
          required: true,
          include: [{
            model: TournamentCategory,
            as: "tournamentCategory",
            where: { tournamentId },
            required: true,
          }],
        },
        {
          model: SubMatch,
          as: "subMatches",
          attributes: ["winnerTeam"],
        },
        {
          model: Entry,
          as: "entryA",
          include: [{ model: EntryMember, as: "members", attributes: ["userId"] }],
        },
        {
          model: Entry,
          as: "entryB",
          include: [{ model: EntryMember, as: "members", attributes: ["userId"] }],
        },
      ],
    });

    return matches.map((match) => {
      const dto: ApprovedTournamentMatch = {
        id: match.id,
        subMatches: ((match.subMatches ?? []) as Array<{
          winnerTeam?: ApprovedTournamentMatch["subMatches"][number]["winnerTeam"];
        }>).map((subMatch) => ({
          winnerTeam: subMatch.winnerTeam ?? null,
        })),
      };

      const entryA = match.entryA as { members?: Array<{ userId: number }> } | undefined;
      if (entryA) {
        dto.entryA = {
          members: (entryA.members ?? []).map((member) => ({
            userId: member.userId,
          })),
        };
      }

      const entryB = match.entryB as { members?: Array<{ userId: number }> } | undefined;
      if (entryB) {
        dto.entryB = {
          members: (entryB.members ?? []).map((member) => ({
            userId: member.userId,
          })),
        };
      }

      return dto;
    });
  }

  async getMatchSummariesByIds(matchIds: number[]): Promise<MatchSummary[]> {
    if (matchIds.length === 0) return [];

    const matches = await Match.findAll({
      where: { id: matchIds },
      attributes: ["id", "status"],
    });

    return matches.map((match) => ({
      id: match.id,
      status: match.status,
    }));
  }
}

export default new CompetitionReadService();
