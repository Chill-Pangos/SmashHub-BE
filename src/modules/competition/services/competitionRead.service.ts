import type {
  ApprovedTournamentMatch,
  GroupAwardStanding,
  KnockoutStanding,
  MatchSummary,
  RegistrationWindow,
  ScheduleConfigFilter,
  ScheduleDateCondition,
  TournamentScheduleConfig,
} from "../public.contracts";
import { Op, WhereOptions } from "sequelize";
import Match from "../models/match.model";
import Schedule from "../models/schedule.model";
import SubMatch from "../models/subMatch.model";
import ScheduleConfig from "../models/scheduleConfig.model";
import GroupStanding from "../models/groupStanding.model";
import KnockoutBracket from "../models/knockoutBracket.model";
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

  async getTournamentScheduleConfig(
    tournamentId: number,
  ): Promise<TournamentScheduleConfig | null> {
    const config = await ScheduleConfig.findOne({ where: { tournamentId } });
    return config ? this.toTournamentScheduleConfig(config) : null;
  }

  async getScheduleConfigsByTournamentIds(
    tournamentIds: number[],
  ): Promise<TournamentScheduleConfig[]> {
    const uniqueTournamentIds = Array.from(new Set(tournamentIds));
    if (uniqueTournamentIds.length === 0) return [];

    const configs = await ScheduleConfig.findAll({
      where: { tournamentId: { [Op.in]: uniqueTournamentIds } },
    });

    return configs.map((config) => this.toTournamentScheduleConfig(config));
  }

  async findScheduleConfigs(
    filter: ScheduleConfigFilter,
  ): Promise<TournamentScheduleConfig[]> {
    const where = this.toScheduleConfigWhere(filter);
    const configs = await ScheduleConfig.findAll({ where });
    return configs.map((config) => this.toTournamentScheduleConfig(config));
  }

  async getOverlappingTournamentIds(tournamentId: number): Promise<number[]> {
    const targetConfig = await this.getTournamentScheduleConfig(tournamentId);
    if (!targetConfig) {
      throw new Error("Schedule config not found for this tournament");
    }

    const configs = await this.findScheduleConfigs({
      tournamentId: { ne: tournamentId },
      startDate: { lt: targetConfig.endDate },
      endDate: { gt: targetConfig.startDate },
    });

    return configs.map((config) => config.tournamentId);
  }

  async hasKnockoutBrackets(categoryId: number): Promise<boolean> {
    const count = await KnockoutBracket.count({ where: { categoryId } });
    return count > 0;
  }

  async getKnockoutStandings(categoryId: number): Promise<KnockoutStanding> {
    const brackets = await KnockoutBracket.findAll({
      where: { categoryId },
      order: [["roundNumber", "DESC"]],
    });

    if (brackets.length === 0) throw new Error("No brackets found");

    const totalRounds = Math.max(...brackets.map((bracket) => bracket.roundNumber));
    const final = brackets.find(
      (bracket) =>
        bracket.roundNumber === totalRounds && bracket.bracketPosition === 0,
    );

    if (!final || final.status !== "completed") {
      throw new Error("Tournament is not completed yet");
    }

    const champion = final.winnerEntryId;
    const runnerUp = champion === final.entryAId ? final.entryBId : final.entryAId;
    const semiFinals = brackets.filter(
      (bracket) => bracket.roundNumber === totalRounds - 1,
    );
    const thirdPlace = semiFinals
      .filter((bracket) => bracket.status === "completed" && bracket.winnerEntryId)
      .map((bracket) =>
        bracket.winnerEntryId === bracket.entryAId ? bracket.entryBId : bracket.entryAId,
      )
      .filter((entryId): entryId is number => entryId != null);
    const eliminated: KnockoutStanding["eliminated"] = [];

    for (const bracket of brackets) {
      if (bracket.status !== "completed" || !bracket.winnerEntryId || bracket.isByeMatch) {
        continue;
      }
      if (bracket.roundNumber >= totalRounds - 1) continue;

      const loserId =
        bracket.winnerEntryId === bracket.entryAId ? bracket.entryBId : bracket.entryAId;
      if (loserId) {
        eliminated.push({ entryId: loserId, eliminatedAt: bracket.roundName });
      }
    }

    const standings: KnockoutStanding = { eliminated };
    if (champion != null) standings.champion = champion;
    if (runnerUp != null) standings.runnerUp = runnerUp;
    if (thirdPlace.length > 0) standings.thirdPlace = thirdPlace;

    return standings;
  }

  async getTopGroupAwardStandings(categoryId: number): Promise<GroupAwardStanding[]> {
    const standings = await GroupStanding.findAll({
      where: {
        categoryId,
        position: { [Op.in]: [1, 2, 3] },
      },
      attributes: ["categoryId", "groupName", "entryId", "position"],
      order: [
        ["groupName", "ASC"],
        ["position", "ASC"],
      ],
    });

    return standings
      .filter((standing) => standing.position != null)
      .map((standing) => ({
        categoryId: standing.categoryId,
        groupName: standing.groupName,
        entryId: standing.entryId,
        position: standing.position!,
      }));
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

  private toScheduleConfigWhere(filter: ScheduleConfigFilter): WhereOptions<any> {
    const where: WhereOptions<any> = {};

    if (filter.tournamentId?.in) {
      where.tournamentId = { [Op.in]: filter.tournamentId.in };
    }
    if (filter.tournamentId?.ne !== undefined) {
      where.tournamentId = {
        ...((where.tournamentId as Record<symbol, unknown>) ?? {}),
        [Op.ne]: filter.tournamentId.ne,
      };
    }

    for (const field of [
      "startDate",
      "endDate",
      "registrationStartDate",
      "registrationEndDate",
      "bracketGenerationDate",
    ] as const) {
      const condition = filter[field];
      if (condition) {
        where[field] = this.toDateWhere(condition);
      }
    }

    return where;
  }

  private toDateWhere(condition: ScheduleDateCondition): Record<symbol, Date | [Date, Date] | null> {
    const where: Record<symbol, Date | [Date, Date] | null> = {};
    if (condition.lt) where[Op.lt] = condition.lt;
    if (condition.lte) where[Op.lte] = condition.lte;
    if (condition.gt) where[Op.gt] = condition.gt;
    if (condition.gte) where[Op.gte] = condition.gte;
    if (condition.between) where[Op.between] = condition.between;
    if (condition.notNull) where[Op.not] = null;
    return where;
  }

  private toTournamentScheduleConfig(config: ScheduleConfig): TournamentScheduleConfig {
    const plain = config.get({ plain: true }) as Record<string, unknown>;
    const dto: TournamentScheduleConfig = {
      id: config.id,
      tournamentId: config.tournamentId,
      startDate: config.startDate,
      endDate: config.endDate,
      registrationStartDate: config.registrationStartDate,
      registrationEndDate: config.registrationEndDate,
      bracketGenerationDate: config.bracketGenerationDate,
      numberOfTables: config.numberOfTables,
      matchDurationMinutes: config.matchDurationMinutes,
      breakDurationMinutes: config.breakDurationMinutes,
      dailyStartHour: config.dailyStartHour,
      dailyStartMinute: config.dailyStartMinute,
      dailyEndHour: config.dailyEndHour,
      dailyEndMinute: config.dailyEndMinute,
      lunchBreakStartHour: config.lunchBreakStartHour ?? null,
      lunchBreakStartMinute: config.lunchBreakStartMinute ?? null,
      lunchBreakEndHour: config.lunchBreakEndHour ?? null,
      lunchBreakEndMinute: config.lunchBreakEndMinute ?? null,
      lunchBreakDurationMinutes: config.lunchBreakDurationMinutes ?? null,
      notes: config.notes ?? null,
    };

    if (plain.createdAt instanceof Date) dto.createdAt = plain.createdAt;
    if (plain.updatedAt instanceof Date) dto.updatedAt = plain.updatedAt;

    return dto;
  }
}

export default new CompetitionReadService();
