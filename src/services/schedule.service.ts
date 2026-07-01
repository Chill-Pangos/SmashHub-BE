// schedule.service.ts
import { Op, Transaction } from "sequelize";
import { sequelize } from "../config/database";
import Schedule from "../models/schedule.model";
import type { Stage, KnockoutRound } from "../models/schedule.model";
import Match from "../models/match.model";
import MatchReferee from "../models/matchReferee.model";
import SubMatch, { SubMatchStatus } from "../models/subMatch.model";
import SubMatchPlayer from "../models/subMatchPlayer.model";
import Entry from "../models/entry.model";
import EntryMember from "../models/entryMember.model";
import TournamentReferee from "../models/tournamentReferee.model";
import TournamentCategory from "../models/tournamentCategory.model";
import Tournament from "../models/tournament.model";
import ScheduleConfig from "../models/scheduleConfig.model";
import GroupStanding from "../models/groupStanding.model";
import KnockoutBracket from "../models/knockoutBracket.model";
import { toUtcDate } from "../utils/date.helper";
import { removeUndefinedFields } from "../utils/object.helper";
import { BadRequestError, ConflictError, NotFoundError } from "../utils/errors.helper";
import {
  type ScheduleSlotPlan,
  getNextScheduleDayStart,
  getOptimizedScheduleSlotPlan,
  getScheduleSlotDurationMs,
  getScheduleTournamentEndTime,
  isSingleDaySchedule,
  withScheduleTime,
} from "../utils/scheduleSlot.helper";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ScheduleResult {
  schedules: Schedule[];
  matches: Match[];
  warning?: string;
}

interface ResourceAssignment {
  tableNumber: number;
  refereeIds: [number, number];
}

interface GroupMatchPair {
  stage: Stage;
  entryAId: number;
  entryBId: number;
  groupName: string;
  roundNumber: number;
}

type OptimizableMatchJob = {
  stage: Stage;
  roundNumber: number;
  entryAId?: number | null;
  entryBId?: number | null;
  groupName?: string;
  groupSequenceKey?: string;
  categoryId?: number;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const MATCH_INCLUDE = {
  model: Match,
  as: "scheduledMatches",
  include: [
    { model: Entry, as: "entryA" },
    { model: Entry, as: "entryB" },
  ],
};
const GROUP_STAGE: Stage = "group";
const KNOCKOUT_STAGE: Stage = "knockout";

// ─── Tournament Type Detection ────────────────────────────────────────────────

function isSingleDayTournament(config: ScheduleConfig): boolean {
  return isSingleDaySchedule(config);
}

function nextDayStart(date: Date, config: ScheduleConfig): Date {
  return getNextScheduleDayStart(date, config);
}

// ─── Slot Allocation ─────────────────────────────────────────────────────────

function getSlotDurationMs(config: ScheduleConfig): number {
  return getScheduleSlotDurationMs(config);
}

function getOptimizedSlotPlan<T extends OptimizableMatchJob>(
  config: ScheduleConfig,
  phaseStart: Date,
  items: T[],
): ScheduleSlotPlan<T> {
  return getOptimizedScheduleSlotPlan(config, phaseStart, items);
}

function getTournamentEndTime(config: ScheduleConfig): Date {
  return getScheduleTournamentEndTime(config);
}

function assertTableNumberInRange(tableNumber: number, config: ScheduleConfig): void {
  if (
    !Number.isInteger(tableNumber) ||
    tableNumber < 1 ||
    tableNumber > config.numberOfTables
  ) {
    throw new BadRequestError(
      `tableNumber must be an integer between 1 and ${config.numberOfTables}`,
    );
  }
}

async function getBusyTablesAtStartTime(
  tournamentId: number,
  config: ScheduleConfig,
  t: Transaction,
  excludeMatchId?: number,
): Promise<Set<number>> {
  const slotDurationMs =
    getSlotDurationMs(config);
  const now = new Date();
  const windowStart = new Date(now.getTime() - slotDurationMs);
  const windowEnd = new Date(now.getTime() + slotDurationMs);

  const matchFilter =
    excludeMatchId === undefined ? {} : { id: { [Op.ne]: excludeMatchId } };

  const inProgressMatches = await Match.findAll({
    include: [
      {
        model: Schedule,
        as: "schedule",
        where: {
          tableNumber: { [Op.not]: null },
        },
        required: true,
        attributes: ["tableNumber"],
        include: [
          {
            model: TournamentCategory,
            as: "tournamentCategory",
            where: { tournamentId },
            required: true,
            attributes: [],
          },
        ],
      },
    ],
    where: { ...matchFilter, status: "in_progress" },
    attributes: [],
    transaction: t,
  });

  const overlappingScheduledMatches = await Match.findAll({
    include: [
      {
        model: Schedule,
        as: "schedule",
        where: {
          scheduledAt: { [Op.gt]: windowStart, [Op.lt]: windowEnd },
          tableNumber: { [Op.not]: null },
        },
        required: true,
        attributes: ["tableNumber"],
        include: [
          {
            model: TournamentCategory,
            as: "tournamentCategory",
            where: { tournamentId },
            required: true,
            attributes: [],
          },
        ],
      },
    ],
    where: { ...matchFilter, status: "scheduled" },
    attributes: [],
    transaction: t,
  });

  return new Set(
    [...inProgressMatches, ...overlappingScheduledMatches]
      .map((m) => m.schedule?.tableNumber)
      .filter((tableNumber): tableNumber is number => tableNumber != null),
  );
}

async function assertScheduleTableAvailableForSlot(options: {
  tournamentId: number;
  scheduleId: number;
  scheduledAt: Date;
  tableNumber: number;
  config: ScheduleConfig;
  t?: Transaction;
}): Promise<void> {
  const slotDurationMs = getSlotDurationMs(options.config);
  const windowStart = new Date(options.scheduledAt.getTime() - slotDurationMs);
  const windowEnd = new Date(options.scheduledAt.getTime() + slotDurationMs);

  const conflictQuery: any = {
    where: {
      id: { [Op.ne]: options.scheduleId },
      tableNumber: options.tableNumber,
      scheduledAt: { [Op.gt]: windowStart, [Op.lt]: windowEnd },
    },
    include: [
      {
        model: TournamentCategory,
        as: "tournamentCategory",
        where: { tournamentId: options.tournamentId },
        required: true,
        attributes: [],
      },
      {
        model: Match,
        as: "scheduledMatches",
        where: { status: { [Op.in]: ["scheduled", "in_progress"] } },
        required: true,
        attributes: [],
      },
    ],
  };
  if (options.t) conflictQuery.transaction = options.t;

  const conflict = await Schedule.findOne(conflictQuery);

  if (conflict) {
    throw new ConflictError(
      `Table ${options.tableNumber} is already assigned to another active match in this time slot`,
    );
  }
}

// ─── Referee Assignment ───────────────────────────────────────────────────────

async function bulkCreateMatchReferees(
  matchId: number,
  refereeIds: number[],
  t: Transaction,
): Promise<void> {
  if (refereeIds.length === 0) return;
  await MatchReferee.bulkCreate(
    refereeIds.map((refereeId) => ({ matchId, refereeId })),
    { transaction: t },
  );
}

function getSubMatchCount(category: TournamentCategory): number {
  if (category.type !== "team") return 1;
  if (!category.teamFormat) {
    throw new BadRequestError("Team category must have teamFormat to create sub-matches");
  }
  return category.teamFormat.split("-").length;
}

async function createSubMatchesForMatch(
  match: Match,
  category: TournamentCategory,
  t: Transaction,
): Promise<void> {
  const count = getSubMatchCount(category);
  const subMatches = await SubMatch.bulkCreate(
    Array.from({ length: count }, (_, i) => ({
      matchId: match.id,
      subMatchNumber: i + 1,
      status: "scheduled" satisfies SubMatchStatus,
    })),
    { transaction: t },
  );

  await syncSubMatchPlayersForMatch(match, category, t, subMatches[0]);
}

async function syncSubMatchPlayersForMatch(
  match: Match,
  category: TournamentCategory,
  t: Transaction,
  firstSubMatch?: SubMatch,
): Promise<void> {
  if (category.type === "team") return;

  const targetSubMatch = firstSubMatch ?? await SubMatch.findOne({
    where: { matchId: match.id },
    order: [["subMatchNumber", "ASC"]],
    transaction: t,
  });
  if (!targetSubMatch) return;

  if (match.entryAId == null || match.entryBId == null) {
    await SubMatchPlayer.destroy({ where: { subMatchId: targetSubMatch.id }, transaction: t });
    return;
  }

  const entryIds = [match.entryAId, match.entryBId].filter(
    (id): id is number => id != null,
  );

  const entryMembers = await EntryMember.findAll({
    where: { entryId: { [Op.in]: entryIds } },
    order: [["id", "ASC"]],
    transaction: t,
  });

  const rows = entryMembers.map((member) => ({
    subMatchId: targetSubMatch.id,
    entryMemberId: member.id,
    team: member.entryId === match.entryAId ? "A" : "B",
  }));

  await SubMatchPlayer.destroy({ where: { subMatchId: targetSubMatch.id }, transaction: t });

  if (rows.length > 0) {
    await SubMatchPlayer.bulkCreate(rows, { transaction: t });
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getCategoryWithTournament(
  categoryId: number,
): Promise<TournamentCategory> {
  const category = await TournamentCategory.findByPk(categoryId, {
    include: [{ model: Tournament }],
  });
  if (!category) throw new NotFoundError("Category not found");
  return category;
}

function assertOrganizer(userId: number, tournament: Tournament): void {
  if (tournament.createdBy !== userId) {
    throw new BadRequestError("Only the tournament organizer can perform this action");
  }
}

async function assertBracketsGenerated(tournament: Tournament): Promise<void> {
  if (tournament.status !== "brackets_generated") {
    throw new BadRequestError("Tournament must be in brackets_generated status before generating schedules");
  }

  const config = await ScheduleConfig.findOne({ where: { tournamentId: tournament.id } });
  if (!config?.bracketGenerationDate) {
    throw new BadRequestError("Bracket generation date is not configured for this tournament");
  }

  if (new Date() < config.bracketGenerationDate) {
    throw new BadRequestError("Bracket generation date must be reached before generating schedules");
  }
}

async function getTournamentReferees(
  tournamentId: number,
  t?: Transaction,
): Promise<TournamentReferee[]> {
  return await TournamentReferee.findAll({
    where: { tournamentId, role: "referee" },
    ...(t && { transaction: t }),
  });
}

async function assertMinimumTournamentReferees(
  tournamentId: number,
  config: ScheduleConfig,
): Promise<void> {
  const refereeCount = await TournamentReferee.count({
    where: { tournamentId, role: "referee" },
  });

  const requiredReferees = config.numberOfTables * 2;
  if (refereeCount !== requiredReferees) {
    throw new BadRequestError(
      `Tournament needs exactly ${requiredReferees} accepted referee(s) for ${config.numberOfTables} table(s). Current accepted referees: ${refereeCount}`,
    );
  }
}

type SlotTableUsage = Map<string, Set<number>>;

async function getTournamentScheduleSlotUsage(
  tournamentId: number,
  t: Transaction,
): Promise<SlotTableUsage> {
  const schedules = await Schedule.findAll({
    where: { tableNumber: { [Op.not]: null } },
    include: [
      {
        model: TournamentCategory,
        as: "tournamentCategory",
        where: { tournamentId },
        required: true,
        attributes: [],
      },
    ],
    attributes: ["scheduledAt", "tableNumber"],
    transaction: t,
    lock: t.LOCK.UPDATE,
  });

  const usage: SlotTableUsage = new Map();
  for (const schedule of schedules) {
    if (schedule.tableNumber == null) continue;

    const slotKey = schedule.scheduledAt.toISOString();
    const usedTables = usage.get(slotKey) ?? new Set<number>();
    usedTables.add(schedule.tableNumber);
    usage.set(slotKey, usedTables);
  }

  return usage;
}

function getRefereeIdsForTable(
  referees: TournamentReferee[],
  tableNumber: number,
): [number, number] {
  const refereeIds = referees
    .map((referee) => referee.refereeId)
    .sort((a, b) => a - b);
  const refereeIndex = (tableNumber - 1) * 2;
  const firstRefereeId = refereeIds[refereeIndex];
  const secondRefereeId = refereeIds[refereeIndex + 1];
  if (firstRefereeId == null || secondRefereeId == null) {
    throw new BadRequestError(
      `Tournament does not have 2 assigned referee(s) for table ${tableNumber}`,
    );
  }

  return [
    firstRefereeId,
    secondRefereeId,
  ];
}

async function setMatchRefereesForSchedule(
  scheduleId: number,
  tournamentId: number,
  tableNumber: number,
  t: Transaction,
): Promise<void> {
  const refereeIds = getRefereeIdsForTable(
    await getTournamentReferees(tournamentId, t),
    tableNumber,
  );
  const matches = await Match.findAll({
    where: { scheduleId },
    attributes: ["id"],
    transaction: t,
  });

  for (const match of matches) {
    await MatchReferee.destroy({ where: { matchId: match.id }, transaction: t });
    await bulkCreateMatchReferees(match.id, refereeIds, t);
  }
}

function createResourceAssigner(
  config: ScheduleConfig,
  referees: TournamentReferee[],
  slotUsage: SlotTableUsage = new Map(),
): (scheduledAt: Date) => ResourceAssignment {
  return (scheduledAt: Date): ResourceAssignment => {
    const slotKey = scheduledAt.toISOString();
    const usedTables = slotUsage.get(slotKey) ?? new Set<number>();
    let tableNumber: number | null = null;

    for (let table = 1; table <= config.numberOfTables; table++) {
      if (!usedTables.has(table)) {
        tableNumber = table;
        break;
      }
    }

    if (tableNumber == null) {
      throw new ConflictError(
        `Schedule slot ${slotKey} has more matches than ${config.numberOfTables} table(s)`,
      );
    }

    usedTables.add(tableNumber);
    slotUsage.set(slotKey, usedTables);

    return {
      tableNumber,
      refereeIds: getRefereeIdsForTable(referees, tableNumber),
    };
  };
}

async function getRequiredScheduleConfig(
  tournamentId: number,
  t?: Transaction,
  lockForUpdate = false,
): Promise<ScheduleConfig> {
  const config = await ScheduleConfig.findOne({
    where: { tournamentId },
    ...(t && { transaction: t }),
    ...(t && lockForUpdate && { lock: t.LOCK.UPDATE }),
  });
  if (!config) {
    throw new NotFoundError(
      "Schedule config not found. Please create a schedule configuration first.",
    );
  }
  return config;
}

async function clearExistingSchedules(
  categoryId: number,
  stage: Stage,
  t: Transaction,
): Promise<void> {
  const existing = await Schedule.findAll({
    where: { categoryId, stage },
    attributes: ["id"],
    transaction: t,
  });

  const scheduleIds = existing.map((s) => s.id);
  const matchIds = await getMatchIdsByScheduleIds(scheduleIds, t);

  if (stage === "knockout" && scheduleIds.length > 0) {
    await KnockoutBracket.update(
      { scheduleId: null, matchId: null },
      { where: { categoryId, scheduleId: { [Op.in]: scheduleIds } }, transaction: t },
    );
  }

  if (matchIds.length > 0) {
    await MatchReferee.destroy({
      where: { matchId: { [Op.in]: matchIds } },
      transaction: t,
    });
    await Match.destroy({
      where: { id: { [Op.in]: matchIds } },
      transaction: t,
    });
  }

  await Schedule.destroy({ where: { categoryId, stage }, transaction: t });
}

async function getGroupStageEndTime(
  categoryId: number,
  config: ScheduleConfig,
): Promise<Date> {
  const lastGroupSchedule = await Schedule.findOne({
    where: { categoryId, stage: GROUP_STAGE },
    order: [["scheduledAt", "DESC"]],
  });

  if (!lastGroupSchedule) {
    throw new BadRequestError("Generate group stage schedule first before knockout schedule");
  }

  return new Date(lastGroupSchedule.scheduledAt.getTime() + getSlotDurationMs(config));
}

async function getKnockoutPhaseStart(
  category: TournamentCategory,
  config: ScheduleConfig,
): Promise<Date> {
  const tournamentStart = withScheduleTime(
    config.startDate,
    config.dailyStartHour,
    config.dailyStartMinute,
  );

  if (!category.isGroupStage) return tournamentStart;

  const groupEnd = await getGroupStageEndTime(category.id, config);
  return isSingleDayTournament(config) ? groupEnd : nextDayStart(groupEnd, config);
}

async function getMatchIdsByScheduleIds(
  scheduleIds: number[],
  t: Transaction,
): Promise<number[]> {
  if (scheduleIds.length === 0) return [];

  const matches = await Match.findAll({
    where: { scheduleId: { [Op.in]: scheduleIds } },
    attributes: ["id"],
    transaction: t,
  });

  return matches.map((m) => m.id);
}

// ─── Match Pair Builders ──────────────────────────────────────────────────────

/**
 * Build round-robin pairs từ groupStandings của 1 category.
 */
async function buildGroupMatchPairs(
  categoryId: number,
): Promise<GroupMatchPair[]> {
  const standings = await GroupStanding.findAll({
    where: { categoryId },
    order: [
      ["groupName", "ASC"],
      ["position", "ASC"],
      ["id", "ASC"],
    ],
  });

  if (standings.length === 0) {
    throw new BadRequestError(
      `No group standings found for category ${categoryId}. Generate groups first.`,
    );
  }

  const groupMap = new Map<string, number[]>();
  for (const s of standings) {
    const group = groupMap.get(s.groupName) ?? [];
    group.push(s.entryId);
    groupMap.set(s.groupName, group);
  }

  const pairs: GroupMatchPair[] = [];
  for (const [groupName, entryIds] of groupMap) {
    const players: (number | null)[] = [...entryIds];
    if (players.length % 2 === 1) players.push(null);

    for (let round = 1; round < players.length; round++) {
      for (let i = 0; i < players.length / 2; i++) {
        const entryAId = players[i];
        const entryBId = players[players.length - 1 - i];
        if (entryAId == null || entryBId == null) continue;

        pairs.push({
          stage: GROUP_STAGE,
          entryAId,
          entryBId,
          groupName,
          roundNumber: round,
        });
      }

      const fixed = players[0]!;
      const rotating = players.slice(1);
      players.splice(0, players.length, fixed, rotating[rotating.length - 1]!, ...rotating.slice(0, -1));
    }
  }

  return pairs;
}

/**
 * Build knockout pairs từ knockoutBrackets của 1 category.
 * Lấy tất cả brackets (kể cả TBD) trừ bye matches.
 * entryAId / entryBId có thể null nếu vẫn là TBD placeholder.
 */
async function buildKnockoutPairs(
  categoryId: number,
  roundName?: KnockoutRound,
): Promise<
  {
    stage: Stage;
    bracketId: number;
    entryAId: number | null;
    entryBId: number | null;
    roundName: KnockoutRound;
    roundNumber: number;
    bracketPosition: number;
  }[]
> {
  const where: Record<string, unknown> = {
    categoryId,
    isByeMatch: false,
  };
  if (roundName) where.roundName = roundName;

  const brackets = await KnockoutBracket.findAll({
    where,
    order: [
      ["roundNumber", "ASC"],
      ["bracketPosition", "ASC"],
    ],
  });

  if (brackets.length === 0) {
    throw new BadRequestError(
      `No knockout brackets found for category ${categoryId}. Generate placeholders first.`,
    );
  }

  return brackets.map((b) => ({
    stage: KNOCKOUT_STAGE,
    bracketId: b.id,
    entryAId: b.entryAId ?? null,
    entryBId: b.entryBId ?? null,
    roundName: b.roundName,
    roundNumber: b.roundNumber,
    bracketPosition: b.bracketPosition,
  }));
}

// ─── Service ──────────────────────────────────────────────────────────────────

export class ScheduleService {
  // ── 1. Tạo lịch group stage cho 1 category ────────────────────────────────

  /**
   * Tạo lịch vòng bảng cho 1 category dựa trên groupStandings.
   * Lịch được sắp xếp theo scheduleConfig của tournament.
   * tableNumber và trọng tài được gán sẵn theo slot.
   */
  async generateGroupStageSchedule(
    organizerId: number,
    categoryId: number,
  ): Promise<ScheduleResult> {
    const category = await getCategoryWithTournament(categoryId);
    const tournament = category.tournament!;
    assertOrganizer(organizerId, tournament);
    await assertBracketsGenerated(tournament);

    const config = await getRequiredScheduleConfig(tournament.id);
    await assertMinimumTournamentReferees(tournament.id, config);

    const pairs = await buildGroupMatchPairs(categoryId);
    if (pairs.length === 0) {
      throw new BadRequestError("Not enough group entries to create matches");
    }
    const groupStart = withScheduleTime(
      config.startDate,
      config.dailyStartHour,
      config.dailyStartMinute,
    );
    const groupPlan = getOptimizedSlotPlan(config, groupStart, pairs);
    const groupEnd = groupPlan.endTime;
    const tournamentEnd = getTournamentEndTime(config);
    const warning = groupEnd > tournamentEnd
      ? `Schedule overflows tournament end time. Last match ends at ${groupEnd.toISOString()}, tournament ends at ${tournamentEnd.toISOString()}`
      : undefined;
    const groupSlots = groupPlan.slots;

    const result = await sequelize.transaction(async (t) => {
      await clearExistingSchedules(categoryId, "group", t);
      const assignResource = createResourceAssigner(
        config,
        await getTournamentReferees(tournament.id, t),
        await getTournamentScheduleSlotUsage(tournament.id, t),
      );

      const schedules: Schedule[] = [];
      const matches: Match[] = [];

      for (let i = 0; i < pairs.length; i++) {
        const pair = pairs[i]!;
        const scheduledAt = groupSlots.get(pair)!;
        const assignment = assignResource(scheduledAt);

        const schedule = await Schedule.create(
          {
            categoryId,
            stage: GROUP_STAGE,
            groupName: pair.groupName,
            scheduledAt: toUtcDate(scheduledAt, "scheduledAt"),
            tableNumber: assignment.tableNumber,
          },
          { transaction: t },
        );

        const match = await Match.create(
          {
            scheduleId: schedule.id,
            entryAId: pair.entryAId,
            entryBId: pair.entryBId,
            status: "scheduled",
          },
          { transaction: t },
        );

        await createSubMatchesForMatch(match, category, t);
        await bulkCreateMatchReferees(match.id, assignment.refereeIds, t);

        schedules.push(schedule);
        matches.push(match);
      }

      return { schedules, matches };
    });

    return { ...result, ...(warning !== undefined && { warning }) };
  }

  // ── 2. Tạo lịch knockout cho 1 category ───────────────────────────────────

  /**
   * Tạo lịch knockout cho 1 category dựa trên knockoutBrackets.
   * Lấy tất cả brackets (kể cả TBD placeholder) trừ bye matches.
   * Match với TBD sẽ có entryAId / entryBId = null — fill sau khi fillQualifiers().
   *
   * Nếu truyền roundName → chỉ tạo lịch cho vòng đó (không xóa lịch vòng khác).
   * Nếu không truyền → tạo lịch cho tất cả vòng, xóa lịch knockout cũ.
   */
  async generateKnockoutSchedule(
    organizerId: number,
    categoryId: number,
    roundName?: KnockoutRound,
  ): Promise<ScheduleResult> {
    const category = await getCategoryWithTournament(categoryId);
    const tournament = category.tournament!;
    assertOrganizer(organizerId, tournament);
    await assertBracketsGenerated(tournament);

    const config = await getRequiredScheduleConfig(tournament.id);
    await assertMinimumTournamentReferees(tournament.id, config);

    const pairs = await buildKnockoutPairs(categoryId, roundName);
    const knockoutStart = await getKnockoutPhaseStart(category, config);
    const knockoutPlan = getOptimizedSlotPlan(config, knockoutStart, pairs);
    const knockoutEnd = knockoutPlan.endTime;
    const tournamentEnd = getTournamentEndTime(config);
    const warning = knockoutEnd > tournamentEnd
      ? `Schedule overflows tournament end time. Last match ends at ${knockoutEnd.toISOString()}, tournament ends at ${tournamentEnd.toISOString()}`
      : undefined;
    const knockoutSlots = knockoutPlan.slots;

    const result = await sequelize.transaction(async (t) => {
      // Nếu generate toàn bộ → xóa knockout schedule cũ
      // Nếu chỉ 1 vòng → chỉ xóa vòng đó
      if (!roundName) {
        await clearExistingSchedules(categoryId, "knockout", t);
      } else {
        await this._clearKnockoutRound(categoryId, roundName, t);
      }
      const assignResource = createResourceAssigner(
        config,
        await getTournamentReferees(tournament.id, t),
        await getTournamentScheduleSlotUsage(tournament.id, t),
      );

      const schedules: Schedule[] = [];
      const matches: Match[] = [];

      for (let i = 0; i < pairs.length; i++) {
        const pair = pairs[i]!;
        const scheduledAt = knockoutSlots.get(pair)!;
        const assignment = assignResource(scheduledAt);

        const schedule = await Schedule.create(
          {
            categoryId,
            stage: KNOCKOUT_STAGE,
            knockoutRound: pair.roundName,
            scheduledAt: toUtcDate(scheduledAt, "scheduledAt"),
            tableNumber: assignment.tableNumber,
          },
          { transaction: t },
        );

        // Match với TBD: entryAId / entryBId = null, status = "scheduled"
        // Sẽ được fill sau khi fillQualifiers() cập nhật bracket
        const match = await Match.create(
          {
            scheduleId: schedule.id,
            entryAId: pair.entryAId ?? null,
            entryBId: pair.entryBId ?? null,
            status: "scheduled",
          },
          { transaction: t },
        );

        await createSubMatchesForMatch(match, category, t);
        await bulkCreateMatchReferees(match.id, assignment.refereeIds, t);

        // Link bracket → schedule và match
        await KnockoutBracket.update(
          { scheduleId: schedule.id, matchId: match.id },
          { where: { id: pair.bracketId }, transaction: t },
        );

        schedules.push(schedule);
        matches.push(match);
      }

      return { schedules, matches };
    });

    return { ...result, ...(warning !== undefined && { warning }) };
  }

  // ── 3. Tạo lịch toàn bộ tournament (group + knockout) theo thứ tự ─────────

  /**
   * Tạo lịch cho toàn bộ tournament.
   * Thứ tự phase toàn giải: tất cả group stage trước, knockout sau.
   *
   * Nếu giải nhiều ngày, knockout bắt đầu từ ngày kế tiếp sau group phase.
   */
  async generateTournamentSchedule(
    organizerId: number,
    tournamentId: number,
  ): Promise<{ categoryId: number; result: ScheduleResult }[]> {
    const tournament = await Tournament.findByPk(tournamentId);
    if (!tournament) throw new NotFoundError("Tournament not found");
    assertOrganizer(organizerId, tournament);
    await assertBracketsGenerated(tournament);

    const categories = await TournamentCategory.findAll({
      where: { tournamentId },
      order: [["id", "ASC"]],
    });
    if (categories.length === 0) {
      throw new BadRequestError("Tournament has no categories.");
    }

    const config = await getRequiredScheduleConfig(tournament.id);
    await assertMinimumTournamentReferees(tournament.id, config);

    const groupJobs: {
      category: TournamentCategory;
      stage: Stage;
      categoryId: number;
      entryAId: number;
      entryBId: number;
      groupName: string;
      groupSequenceKey: string;
      roundNumber: number;
      pair: GroupMatchPair;
    }[] = [];
    const knockoutJobs: {
      category: TournamentCategory;
      stage: Stage;
      categoryId: number;
      entryAId: number | null;
      entryBId: number | null;
      roundNumber: number;
      pair: {
        bracketId: number;
        entryAId: number | null;
        entryBId: number | null;
        roundName: KnockoutRound;
      };
    }[] = [];

    for (const category of categories) {
      if (category.isGroupStage) {
        const pairs = await buildGroupMatchPairs(category.id);
        if (pairs.length === 0) {
          throw new BadRequestError(`Not enough group entries to create matches for category ${category.id}`);
        }
        groupJobs.push(...pairs.map((pair) => ({
          category,
          stage: GROUP_STAGE,
          categoryId: category.id,
          entryAId: pair.entryAId,
          entryBId: pair.entryBId,
          groupName: pair.groupName,
          groupSequenceKey: `${category.id}:${pair.groupName}`,
          roundNumber: pair.roundNumber,
          pair,
        })));
      }

      const pairs = await buildKnockoutPairs(category.id);
      knockoutJobs.push(...pairs.map((pair) => ({
        category,
        stage: KNOCKOUT_STAGE,
        categoryId: category.id,
        entryAId: pair.entryAId,
        entryBId: pair.entryBId,
        roundNumber: pair.roundNumber,
        pair,
      })));
    }

    const tournamentStart = withScheduleTime(
      config.startDate,
      config.dailyStartHour,
      config.dailyStartMinute,
    );
    const groupPlan = getOptimizedSlotPlan(config, tournamentStart, groupJobs);
    const groupEnd = groupPlan.endTime;
    const knockoutStart = groupJobs.length === 0
      ? tournamentStart
      : isSingleDayTournament(config)
        ? groupEnd
        : nextDayStart(groupEnd, config);
    const knockoutPlan = getOptimizedSlotPlan(config, knockoutStart, knockoutJobs);
    const finalEnd = knockoutPlan.endTime;
    const tournamentEnd = getTournamentEndTime(config);
    const warning = finalEnd > tournamentEnd
      ? `Schedule overflows tournament end time. Last match ends at ${finalEnd.toISOString()}, tournament ends at ${tournamentEnd.toISOString()}`
      : undefined;
    const groupSlots = groupPlan.slots;
    const knockoutSlots = knockoutPlan.slots;

    const resultsByCategory = new Map<number, ScheduleResult>();
    for (const category of categories) {
      resultsByCategory.set(category.id, { schedules: [], matches: [] });
    }

    await sequelize.transaction(async (t) => {
      for (const category of categories) {
        await clearExistingSchedules(category.id, "group", t);
        await clearExistingSchedules(category.id, "knockout", t);
      }
      const assignResource = createResourceAssigner(
        config,
        await getTournamentReferees(tournament.id, t),
        await getTournamentScheduleSlotUsage(tournament.id, t),
      );

      for (let i = 0; i < groupJobs.length; i++) {
        const job = groupJobs[i]!;
        const scheduledAt = groupSlots.get(job)!;
        const assignment = assignResource(scheduledAt);
        const schedule = await Schedule.create(
          {
            categoryId: job.category.id,
            stage: GROUP_STAGE,
            groupName: job.pair.groupName,
            scheduledAt: toUtcDate(scheduledAt, "scheduledAt"),
            tableNumber: assignment.tableNumber,
          },
          { transaction: t },
        );

        const match = await Match.create(
          {
            scheduleId: schedule.id,
            entryAId: job.pair.entryAId,
            entryBId: job.pair.entryBId,
            status: "scheduled",
          },
          { transaction: t },
        );

        await createSubMatchesForMatch(match, job.category, t);
        await bulkCreateMatchReferees(match.id, assignment.refereeIds, t);

        const result = resultsByCategory.get(job.category.id)!;
        result.schedules.push(schedule);
        result.matches.push(match);
      }

      for (let i = 0; i < knockoutJobs.length; i++) {
        const job = knockoutJobs[i]!;
        const scheduledAt = knockoutSlots.get(job)!;
        const assignment = assignResource(scheduledAt);
        const schedule = await Schedule.create(
          {
            categoryId: job.category.id,
            stage: KNOCKOUT_STAGE,
            knockoutRound: job.pair.roundName,
            scheduledAt: toUtcDate(scheduledAt, "scheduledAt"),
            tableNumber: assignment.tableNumber,
          },
          { transaction: t },
        );

        const match = await Match.create(
          {
            scheduleId: schedule.id,
            entryAId: job.pair.entryAId ?? null,
            entryBId: job.pair.entryBId ?? null,
            status: "scheduled",
          },
          { transaction: t },
        );

        await createSubMatchesForMatch(match, job.category, t);
        await bulkCreateMatchReferees(match.id, assignment.refereeIds, t);
        await KnockoutBracket.update(
          { scheduleId: schedule.id, matchId: match.id },
          { where: { id: job.pair.bracketId }, transaction: t },
        );

        const result = resultsByCategory.get(job.category.id)!;
        result.schedules.push(schedule);
        result.matches.push(match);
      }
    });

    return categories.map((category) => {
      const result = resultsByCategory.get(category.id)!;
      if (warning) result.warning = warning;
      return { categoryId: category.id, result };
    });
  }

  // ── 4. Fill entryId vào match sau khi fillQualifiers ─────────────────────

  /**
   * Sau khi fillQualifiers() cập nhật bracket với entryId thật,
   * cập nhật lại match tương ứng trong schedule.
   * Gọi từ knockoutBracket.service sau fillQualifiers().
   */
  async syncMatchEntriesFromBrackets(
    organizerId: number,
    categoryId: number,
    t?: Transaction,
  ): Promise<void> {
    const category = await getCategoryWithTournament(categoryId);
    assertOrganizer(organizerId, category.tournament!);

    const run = async (transaction: Transaction) => {
      const brackets = await KnockoutBracket.findAll({
        where: {
          categoryId,
          isByeMatch: false,
          matchId: { [Op.not]: null },
        },
        transaction,
      });

      for (const bracket of brackets) {
        if (!bracket.matchId) continue;

        await Match.update(
          {
            entryAId: bracket.entryAId ?? null,
            entryBId: bracket.entryBId ?? null,
            // Chuyển sang ready nếu đã có đủ 2 entry
            ...(bracket.entryAId && bracket.entryBId
              ? { status: "scheduled" }
              : {}),
          },
          { where: { id: bracket.matchId }, transaction },
        );

        const match = await Match.findByPk(bracket.matchId, { transaction });
        if (match) {
          await syncSubMatchPlayersForMatch(match, category, transaction);
        }
      }
    };

    if (t) {
      await run(t);
    } else {
      await sequelize.transaction(run);
    }
  }

  // ── 5. Assign bàn thi đấu khi match bắt đầu ──────────────────────────────

  /**
   * Gọi từ match.service khi match chuyển sang `in_progress`.
   * Kiểm tra bàn đã được gán sẵn khi tạo lịch.
   */
  async assignTableForMatch(
    matchId: number,
    tournamentId: number,
    t: Transaction,
  ): Promise<number> {
    const config = await getRequiredScheduleConfig(tournamentId, t, true);
    const match = await Match.findByPk(matchId, {
      include: [{ model: Schedule, as: "schedule" }],
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!match) throw new NotFoundError("Match not found");
    if (!match.schedule) throw new NotFoundError("Match schedule not found");

    const existingTable = match.schedule.tableNumber;
    if (existingTable == null) {
      throw new BadRequestError(
        "Match table is not assigned. Regenerate schedule before starting match.",
      );
    }

    assertTableNumberInRange(existingTable, config);
    const busyTables = await getBusyTablesAtStartTime(
      tournamentId,
      config,
      t,
      matchId,
    );
    if (busyTables.has(existingTable)) {
      throw new ConflictError(
        `Table ${existingTable} is not available at this time`,
      );
    }
    return existingTable;
  }

  // ── 6. Queries ────────────────────────────────────────────────────────────

  async getScheduleById(id: number): Promise<Schedule> {
    const schedule = await Schedule.findByPk(id, { include: [MATCH_INCLUDE] });
    if (!schedule) throw new NotFoundError("Schedule not found");
    return schedule;
  }

  async getSchedulesByCategory(
    categoryId: number,
    options: {
      offset?: number;
      limit?: number;
      stage?: Stage;
      groupName?: string;
      knockoutRound?: KnockoutRound;
    } = {},
  ): Promise<{ rows: Schedule[]; count: number }> {
    const { offset = 0, limit = 20, stage, groupName, knockoutRound } = options;

    const where: Record<string, unknown> = { categoryId };
    if (stage) where.stage = stage;
    if (groupName) where.groupName = groupName;
    if (knockoutRound) where.knockoutRound = knockoutRound;

    return await Schedule.findAndCountAll({
      where,
      include: [MATCH_INCLUDE],
      order: [["scheduledAt", "ASC"]],
      offset,
      limit,
      distinct: true,
    });
  }

  async updateSchedule(
    organizerId: number,
    scheduleId: number,
    data: Partial<{ scheduledAt: Date | string; tableNumber: number | null }>,
  ): Promise<Schedule> {
    return await sequelize.transaction(async (t) => {
      const schedule = await Schedule.findByPk(scheduleId, {
        include: [MATCH_INCLUDE],
        transaction: t,
        lock: t.LOCK.UPDATE,
      });
      if (!schedule) throw new NotFoundError("Schedule not found");

      const category = await getCategoryWithTournament(schedule.categoryId);
      const tournament = category.tournament!;
      assertOrganizer(organizerId, tournament);
      const startedMatch = schedule.scheduledMatches?.find(
        (match) => match.status !== "scheduled",
      );
      if (startedMatch) {
        throw new BadRequestError("Cannot update schedule after match has started");
      }

      const config = await getRequiredScheduleConfig(tournament.id, t, true);
      const scheduledAt = data.scheduledAt != null
        ? toUtcDate(data.scheduledAt, "scheduledAt")
        : schedule.scheduledAt;
      const tableNumber = data.tableNumber !== undefined
        ? data.tableNumber
        : schedule.tableNumber;
      if (tableNumber == null) {
        throw new BadRequestError("tableNumber is required for scheduled matches");
      }

      assertTableNumberInRange(tableNumber, config);
      await assertScheduleTableAvailableForSlot({
        tournamentId: tournament.id,
        scheduleId,
        scheduledAt: new Date(scheduledAt),
        tableNumber,
        config,
        t,
      });

      const updateData = removeUndefinedFields({
        ...data,
        ...(data.scheduledAt != null && { scheduledAt }),
      });

      const updated = await schedule.update(updateData, { transaction: t });
      await setMatchRefereesForSchedule(scheduleId, tournament.id, tableNumber, t);

      return await updated.reload({ include: [MATCH_INCLUDE], transaction: t });
    });
  }

  async deleteSchedule(
    organizerId: number,
    scheduleId: number,
  ): Promise<void> {
    const schedule = await this.getScheduleById(scheduleId);
    const category = await getCategoryWithTournament(schedule.categoryId);
    assertOrganizer(organizerId, category.tournament!);
    await schedule.destroy();
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  /**
   * Xóa schedules và matches của 1 knockout round cụ thể.
   */
  private async _clearKnockoutRound(
    categoryId: number,
    roundName: KnockoutRound,
    t: Transaction,
  ): Promise<void> {
    const existing = await Schedule.findAll({
      where: { categoryId, stage: KNOCKOUT_STAGE, knockoutRound: roundName },
      attributes: ["id"],
      transaction: t,
    });

    const scheduleIds = existing.map((s) => s.id);
    const matchIds = await getMatchIdsByScheduleIds(scheduleIds, t);

    if (scheduleIds.length > 0) {
      await KnockoutBracket.update(
        { scheduleId: null, matchId: null },
        { where: { categoryId, scheduleId: { [Op.in]: scheduleIds } }, transaction: t },
      );
    }

    if (matchIds.length > 0) {
      await MatchReferee.destroy({
        where: { matchId: { [Op.in]: matchIds } },
        transaction: t,
      });
      await Match.destroy({
        where: { id: { [Op.in]: matchIds } },
        transaction: t,
      });
    }

    await Schedule.destroy({
      where: { categoryId, stage: KNOCKOUT_STAGE, knockoutRound: roundName },
      transaction: t,
    });
  }
}

export default new ScheduleService();
