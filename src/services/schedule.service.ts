// schedule.service.ts
import { Op, Transaction } from "sequelize";
import { sequelize } from "../config/database";
import Schedule, { Stage, KnockoutRound } from "../models/schedule.model";
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

// ─── Types ────────────────────────────────────────────────────────────────────

interface ScheduleResult {
  schedules: Schedule[];
  matches: Match[];
  warning?: string;
}

interface TimeSlot {
  scheduledAt: Date;
}

interface RefereeWorkload {
  refereeId: number;
  assignedCount: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MATCH_INCLUDE = {
  model: Match,
  as: "scheduledMatches",
  include: [
    { model: Entry, as: "entryA" },
    { model: Entry, as: "entryB" },
  ],
};

// ─── Tournament Type Detection ────────────────────────────────────────────────

function dateOnlyTime(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function isSingleDayTournament(config: ScheduleConfig): boolean {
  return dateOnlyTime(config.startDate) === dateOnlyTime(config.endDate);
}

function withTime(date: Date, hour: number, minute: number): Date {
  const result = new Date(date);
  result.setHours(hour, minute, 0, 0);
  return result;
}

function nextDayStart(date: Date, config: ScheduleConfig): Date {
  return withTime(
    new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1),
    config.dailyStartHour,
    config.dailyStartMinute,
  );
}

// ─── Slot Allocators ──────────────────────────────────────────────────────────

/**
 * Giải 1 ngày.
 * Slot chỉ tính scheduledAt dựa trên slot index.
 * numberOfTables dùng để tính số slot song song.
 */
class SingleDayAllocator {
  private readonly slotDuration: number;
  private readonly startDate: Date;
  private readonly endDate: Date;

  constructor(config: ScheduleConfig) {
    this.startDate = withTime(config.startDate, config.dailyStartHour, config.dailyStartMinute);
    this.endDate = withTime(config.endDate, config.dailyEndHour, config.dailyEndMinute);
    this.slotDuration = config.matchDurationMinutes + config.breakDurationMinutes;
  }

  getSlot(matchIndex: number, numberOfTables: number): TimeSlot {
    const slotIndex = Math.floor(matchIndex / numberOfTables);
    return {
      scheduledAt: new Date(
        this.startDate.getTime() + slotIndex * this.slotDuration * 60_000,
      ),
    };
  }

  validate(
    totalMatches: number,
    numberOfTables: number,
  ): { fits: boolean; warning?: string } {
    const lastSlotIndex = Math.ceil(totalMatches / numberOfTables) - 1;
    const lastMatchStart = new Date(
      this.startDate.getTime() + lastSlotIndex * this.slotDuration * 60_000,
    );

    if (lastMatchStart > this.endDate) {
      return {
        fits: false,
        warning:
          `Schedule overflows. Last match starts at ${lastMatchStart.toISOString()}, ` +
          `but tournament's last allowed start time is ${this.endDate.toISOString()}`,
      };
    }
    return { fits: true };
  }
}

/**
 * Giải nhiều ngày.
 * Tự động sang ngày mới khi hết giờ trong ngày.
 */
class MultiDayAllocator {
  private readonly startDate: Date;
  private readonly endDate: Date;
  private readonly dailyStartHour: number;
  private readonly dailyStartMinute: number;
  private readonly dailyEndHour: number;
  private readonly dailyEndMinute: number;
  private readonly slotDuration: number;

  constructor(config: ScheduleConfig) {
    this.startDate = withTime(config.startDate, config.dailyStartHour, config.dailyStartMinute);
    this.endDate = withTime(config.endDate, config.dailyEndHour, config.dailyEndMinute);
    this.dailyStartHour = config.dailyStartHour;
    this.dailyStartMinute = config.dailyStartMinute;
    this.dailyEndHour = config.dailyEndHour;
    this.dailyEndMinute = config.dailyEndMinute;
    this.slotDuration = config.matchDurationMinutes + config.breakDurationMinutes;
  }

  getSlot(matchIndex: number, numberOfTables: number): TimeSlot {
    const slotIndex = Math.floor(matchIndex / numberOfTables);
    return { scheduledAt: this._computeSlotTime(slotIndex) };
  }

  private _computeSlotTime(slotIndex: number): Date {
    let current = new Date(this.startDate);

    for (let i = 0; i < slotIndex; i++) {
      current = new Date(current.getTime() + this.slotDuration * 60_000);

      const nextSlotStart = new Date(current.getTime() + this.slotDuration * 60_000);
      const lastStartOfDay = new Date(current);
      lastStartOfDay.setHours(this.dailyEndHour, this.dailyEndMinute, 0, 0);

      if (nextSlotStart > lastStartOfDay) {
        current.setDate(current.getDate() + 1);
        current.setHours(this.dailyStartHour, this.dailyStartMinute, 0, 0);
      }
    }

    return current;
  }

  validate(
    totalMatches: number,
    numberOfTables: number,
  ): { fits: boolean; warning?: string } {
    const lastSlotIndex = Math.ceil(totalMatches / numberOfTables) - 1;
    const lastMatchAt = this._computeSlotTime(lastSlotIndex);
    const lastMatchEnd = new Date(
      lastMatchAt.getTime() + this.slotDuration * 60_000,
    );

    if (lastMatchEnd > this.endDate) {
      return {
        fits: false,
        warning:
          `Schedule overflows tournament end time. Last match ends at ${lastMatchEnd.toISOString()}, ` +
          `tournament ends at ${this.endDate.toISOString()}`,
      };
    }
    return { fits: true };
  }
}

function createAllocator(
  config: ScheduleConfig,
): SingleDayAllocator | MultiDayAllocator {
  return isSingleDayTournament(config)
    ? new SingleDayAllocator(config)
    : new MultiDayAllocator(config);
}

function getPhaseSlot(
  config: ScheduleConfig,
  phaseStart: Date,
  matchIndex: number,
): TimeSlot {
  const slotDuration = config.matchDurationMinutes + config.breakDurationMinutes;
  const slotIndex = Math.floor(matchIndex / config.numberOfTables);

  if (isSingleDayTournament(config)) {
    return {
      scheduledAt: new Date(phaseStart.getTime() + slotIndex * slotDuration * 60_000),
    };
  }

  let current = new Date(phaseStart);
  for (let i = 0; i < slotIndex; i++) {
    current = new Date(current.getTime() + slotDuration * 60_000);

    const nextSlotStart = new Date(current.getTime() + slotDuration * 60_000);
    const lastStartOfDay = withTime(
      current,
      config.dailyEndHour,
      config.dailyEndMinute,
    );

    if (nextSlotStart > lastStartOfDay) {
      current = nextDayStart(current, config);
    }
  }

  return { scheduledAt: current };
}

function getPhaseEndTime(
  config: ScheduleConfig,
  phaseStart: Date,
  matchCount: number,
): Date {
  if (matchCount <= 0) return phaseStart;

  const lastSlot = getPhaseSlot(config, phaseStart, matchCount - 1).scheduledAt;
  return new Date(
    lastSlot.getTime() +
      (config.matchDurationMinutes + config.breakDurationMinutes) * 60_000,
  );
}

function getTournamentEndTime(config: ScheduleConfig): Date {
  return withTime(config.endDate, config.dailyEndHour, config.dailyEndMinute);
}

// ─── Table Assignment ─────────────────────────────────────────────────────────

/**
 * Tìm bàn trống tại thời điểm cụ thể.
 * Bàn được coi là "bận" khi có match đang `in_progress` hoặc `scheduled`
 * với scheduledAt nằm trong khoảng [now - slotDuration, now].
 */
async function findAvailableTable(
  tournamentId: number,
  config: ScheduleConfig,
  t: Transaction,
): Promise<number | null> {
  const slotDurationMs =
    (config.matchDurationMinutes + config.breakDurationMinutes) * 60_000;
  const now = new Date();
  const windowStart = new Date(now.getTime() - slotDurationMs);

  const busySchedules = await Schedule.findAll({
    include: [
      {
        model: TournamentCategory,
        as: "category",
        where: { tournamentId },
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
    attributes: ["tableNumber"],
    where: {
      scheduledAt: { [Op.between]: [windowStart, now] },
      tableNumber: { [Op.not]: null },
    } as any,
    transaction: t,
  });

  const busyTables = new Set(
    busySchedules.map((s) => s.tableNumber).filter(Boolean),
  );

  for (let table = 1; table <= config.numberOfTables; table++) {
    if (!busyTables.has(table)) return table;
  }

  return null;
}

// ─── Referee Assignment ───────────────────────────────────────────────────────

function assignReferees(workloads: RefereeWorkload[], count: number): number[] {
  if (workloads.length === 0) return [];
  const sorted = [...workloads].sort((a, b) => a.assignedCount - b.assignedCount);
  const selected = sorted.slice(0, count).map((r) => r.refereeId);
  for (const w of workloads) {
    if (selected.includes(w.refereeId)) w.assignedCount += 1;
  }
  return selected;
}

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
    throw new Error("Team category must have teamFormat to create sub-matches");
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

  if (category.type === "team") return;

  const firstSubMatch = subMatches[0];
  if (!firstSubMatch) return;

  const entryIds = [match.entryAId, match.entryBId].filter(
    (id): id is number => id != null,
  );
  if (entryIds.length === 0) return;

  const entryMembers = await EntryMember.findAll({
    where: { entryId: { [Op.in]: entryIds } },
    order: [["id", "ASC"]],
    transaction: t,
  });

  const rows = entryMembers.map((member) => ({
    subMatchId: firstSubMatch.id,
    entryMemberId: member.id,
    team: member.entryId === match.entryAId ? "A" : "B",
  }));

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
  if (!category) throw new Error("Category not found");
  return category;
}

function assertOrganizer(userId: number, tournament: Tournament): void {
  if (tournament.createdBy !== userId) {
    throw new Error("Only the tournament organizer can perform this action");
  }
}

async function getTournamentReferees(
  tournamentId: number,
): Promise<TournamentReferee[]> {
  return await TournamentReferee.findAll({
    where: { tournamentId, role: "referee" },
  });
}

async function getRequiredScheduleConfig(
  tournamentId: number,
): Promise<ScheduleConfig> {
  const config = await ScheduleConfig.findOne({ where: { tournamentId } });
  if (!config) {
    throw new Error(
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
    include: [{ model: Match, as: "scheduledMatches", attributes: ["id"] }],
    transaction: t,
  });

  const matchIds = existing
    .flatMap((s) => s.scheduledMatches ?? [])
    .map((m) => m.id);

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

// ─── Match Pair Builders ──────────────────────────────────────────────────────

/**
 * Build round-robin pairs từ groupStandings của 1 category.
 */
async function buildGroupMatchPairs(
  categoryId: number,
): Promise<{ entryAId: number; entryBId: number; groupName: string }[]> {
  const standings = await GroupStanding.findAll({
    where: { categoryId },
    order: [["groupName", "ASC"]],
  });

  if (standings.length === 0) {
    throw new Error(
      `No group standings found for category ${categoryId}. Generate groups first.`,
    );
  }

  const groupMap = new Map<string, number[]>();
  for (const s of standings) {
    const group = groupMap.get(s.groupName) ?? [];
    group.push(s.entryId);
    groupMap.set(s.groupName, group);
  }

  const pairs: { entryAId: number; entryBId: number; groupName: string }[] = [];
  for (const [groupName, entryIds] of groupMap) {
    for (let i = 0; i < entryIds.length; i++) {
      for (let j = i + 1; j < entryIds.length; j++) {
        pairs.push({
          entryAId: entryIds[i]!,
          entryBId: entryIds[j]!,
          groupName,
        });
      }
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
    throw new Error(
      `No knockout brackets found for category ${categoryId}. Generate placeholders first.`,
    );
  }

  return brackets.map((b) => ({
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
   * tableNumber KHÔNG được gán ở đây — sẽ gán khi trận bắt đầu.
   */
  async generateGroupStageSchedule(
    organizerId: number,
    categoryId: number,
  ): Promise<ScheduleResult> {
    const category = await getCategoryWithTournament(categoryId);
    const tournament = category.tournament!;
    assertOrganizer(organizerId, tournament);

    const config = await getRequiredScheduleConfig(tournament.id);
    const pairs = await buildGroupMatchPairs(categoryId);
    const allocator = createAllocator(config);
    const { warning } = allocator.validate(pairs.length, config.numberOfTables);

    const result = await sequelize.transaction(async (t) => {
      await clearExistingSchedules(categoryId, "group", t);

      const schedules: Schedule[] = [];
      const matches: Match[] = [];

      for (let i = 0; i < pairs.length; i++) {
        const pair = pairs[i]!;
        const slot = allocator.getSlot(i, config.numberOfTables);

        const schedule = await Schedule.create(
          {
            categoryId,
            stage: "group" satisfies Stage,
            groupName: pair.groupName,
            scheduledAt: slot.scheduledAt,
            tableNumber: null,
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

    const config = await getRequiredScheduleConfig(tournament.id);
    const pairs = await buildKnockoutPairs(categoryId, roundName);
    const allocator = createAllocator(config);
    const { warning } = allocator.validate(pairs.length, config.numberOfTables);

    const result = await sequelize.transaction(async (t) => {
      // Nếu generate toàn bộ → xóa knockout schedule cũ
      // Nếu chỉ 1 vòng → chỉ xóa vòng đó
      if (!roundName) {
        await clearExistingSchedules(categoryId, "knockout", t);
      } else {
        await this._clearKnockoutRound(categoryId, roundName, t);
      }

      const schedules: Schedule[] = [];
      const matches: Match[] = [];

      for (let i = 0; i < pairs.length; i++) {
        const pair = pairs[i]!;
        const slot = allocator.getSlot(i, config.numberOfTables);

        const schedule = await Schedule.create(
          {
            categoryId,
            stage: "knockout" satisfies Stage,
            knockoutRound: pair.roundName,
            scheduledAt: slot.scheduledAt,
            tableNumber: null,
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
    const tournament = await Tournament.findByPk(tournamentId, {
      include: [{ model: TournamentCategory, as: "categories" }],
    });
    if (!tournament) throw new Error("Tournament not found");
    assertOrganizer(organizerId, tournament);

    const categories = tournament.categories ?? [];
    if (categories.length === 0) {
      throw new Error("Tournament has no categories.");
    }

    const config = await getRequiredScheduleConfig(tournament.id);
    const groupJobs: {
      category: TournamentCategory;
      pair: { entryAId: number; entryBId: number; groupName: string };
    }[] = [];
    const knockoutJobs: {
      category: TournamentCategory;
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
        groupJobs.push(...pairs.map((pair) => ({ category, pair })));
      }

      const pairs = await buildKnockoutPairs(category.id);
      knockoutJobs.push(...pairs.map((pair) => ({ category, pair })));
    }

    const tournamentStart = withTime(
      config.startDate,
      config.dailyStartHour,
      config.dailyStartMinute,
    );
    const groupEnd = getPhaseEndTime(config, tournamentStart, groupJobs.length);
    const knockoutStart = groupJobs.length === 0
      ? tournamentStart
      : isSingleDayTournament(config)
        ? groupEnd
        : nextDayStart(groupEnd, config);
    const finalEnd = getPhaseEndTime(config, knockoutStart, knockoutJobs.length);
    const tournamentEnd = getTournamentEndTime(config);
    const warning = finalEnd > tournamentEnd
      ? `Schedule overflows tournament end time. Last match ends at ${finalEnd.toISOString()}, tournament ends at ${tournamentEnd.toISOString()}`
      : undefined;

    const resultsByCategory = new Map<number, ScheduleResult>();
    for (const category of categories) {
      resultsByCategory.set(category.id, { schedules: [], matches: [] });
    }

    await sequelize.transaction(async (t) => {
      for (const category of categories) {
        await clearExistingSchedules(category.id, "group", t);
        await clearExistingSchedules(category.id, "knockout", t);
      }

      for (let i = 0; i < groupJobs.length; i++) {
        const job = groupJobs[i]!;
        const slot = getPhaseSlot(config, tournamentStart, i);
        const schedule = await Schedule.create(
          {
            categoryId: job.category.id,
            stage: "group" satisfies Stage,
            groupName: job.pair.groupName,
            scheduledAt: slot.scheduledAt,
            tableNumber: null,
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

        const result = resultsByCategory.get(job.category.id)!;
        result.schedules.push(schedule);
        result.matches.push(match);
      }

      for (let i = 0; i < knockoutJobs.length; i++) {
        const job = knockoutJobs[i]!;
        const slot = getPhaseSlot(config, knockoutStart, i);
        const schedule = await Schedule.create(
          {
            categoryId: job.category.id,
            stage: "knockout" satisfies Stage,
            knockoutRound: job.pair.roundName,
            scheduledAt: slot.scheduledAt,
            tableNumber: null,
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
    categoryId: number,
    t?: Transaction,
  ): Promise<void> {
    const brackets = await KnockoutBracket.findAll({
      where: {
        categoryId,
        isByeMatch: false,
        matchId: { [Op.not]: null },
      },
    });

    const run = async (transaction: Transaction) => {
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
   * Tìm bàn trống và gán tableNumber vào schedule của match đó.
   */
  async assignTableForMatch(
    matchId: number,
    tournamentId: number,
    t: Transaction,
  ): Promise<number> {
    const config = await getRequiredScheduleConfig(tournamentId);
    const availableTable = await findAvailableTable(tournamentId, config, t);

    if (availableTable === null) {
      throw new Error(
        `No available tables at this time. All ${config.numberOfTables} table(s) are currently in use. ` +
          `Please wait for a table to become available.`,
      );
    }

    const match = await Match.findByPk(matchId, { transaction: t });
    if (!match) throw new Error("Match not found");

    await Schedule.update(
      { tableNumber: availableTable },
      { where: { id: match.scheduleId }, transaction: t },
    );

    return availableTable;
  }

  // ── 6. Assign trọng tài động khi match bắt đầu ───────────────────────────

  /**
   * Gọi từ match.service khi match chuyển sang `in_progress`.
   * Tìm trọng tài rảnh nhất và assign.
   */
  async assignRefereeDynamic(
    matchId: number,
    tournamentId: number,
    t: Transaction,
  ): Promise<void> {
    const allReferees = await getTournamentReferees(tournamentId);
    if (allReferees.length === 0) return;

    const activeAssignments = await MatchReferee.findAll({
      include: [
        {
          model: Match,
          as: "match",
          where: { status: "in_progress" },
          required: true,
          attributes: [],
        },
      ],
      where: {
        refereeId: { [Op.in]: allReferees.map((r) => r.refereeId) },
      },
      attributes: ["refereeId"],
      transaction: t,
    });

    const activeCount = new Map<number, number>();
    for (const a of activeAssignments) {
      activeCount.set(a.refereeId, (activeCount.get(a.refereeId) ?? 0) + 1);
    }

    const workloads: RefereeWorkload[] = allReferees.map((r) => ({
      refereeId: r.refereeId,
      assignedCount: activeCount.get(r.refereeId) ?? 0,
    }));

    await MatchReferee.destroy({ where: { matchId }, transaction: t });

    const refsPerMatch = allReferees.length >= 2 ? 2 : 1;
    const selected = assignReferees(workloads, refsPerMatch);
    await bulkCreateMatchReferees(matchId, selected, t);
  }

  // ── 7. Queries ────────────────────────────────────────────────────────────

  async getScheduleById(id: number): Promise<Schedule> {
    const schedule = await Schedule.findByPk(id, { include: [MATCH_INCLUDE] });
    if (!schedule) throw new Error("Schedule not found");
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
    data: Partial<Pick<Schedule, "scheduledAt" | "tableNumber">>,
  ): Promise<Schedule> {
    const schedule = await this.getScheduleById(scheduleId);
    const category = await getCategoryWithTournament(schedule.categoryId);
    assertOrganizer(organizerId, category.tournament!);
    return await schedule.update(data);
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
      where: { categoryId, stage: "knockout", knockoutRound: roundName },
      include: [{ model: Match, as: "scheduledMatches", attributes: ["id"] }],
      transaction: t,
    });

    const matchIds = existing
      .flatMap((s) => s.scheduledMatches ?? [])
      .map((m) => m.id);

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
      where: { categoryId, stage: "knockout", knockoutRound: roundName },
      transaction: t,
    });
  }
}

export default new ScheduleService();
