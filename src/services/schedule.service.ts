// schedule.service.ts
import { Op, Transaction } from "sequelize";
import { sequelize } from "../config/database";
import Schedule, { Stage, KnockoutRound } from "../models/schedule.model";
import Match from "../models/match.model";
import MatchReferee from "../models/matchReferee.model";
import Entry from "../models/entry.model";
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
  // tableNumber bị loại bỏ — sẽ được assign động khi match bắt đầu
}

interface RefereeWorkload {
  refereeId: number;
  assignedCount: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SINGLE_DAY_THRESHOLD_HOURS = 20;

const MATCH_INCLUDE = {
  model: Match,
  as: "scheduledMatches",
  include: [
    { model: Entry, as: "entryA" },
    { model: Entry, as: "entryB" },
  ],
};

// ─── Tournament Type Detection ────────────────────────────────────────────────

function isSingleDayTournament(config: ScheduleConfig): boolean {
  return (
    (config.endDate.getTime() - config.startDate.getTime()) / (1000 * 60 * 60) <=
    SINGLE_DAY_THRESHOLD_HOURS
  );
}

// ─── Slot Allocators ──────────────────────────────────────────────────────────

/**
 * Giải 1 ngày.
 * Slot chỉ tính scheduledAt dựa trên slot index.
 * numberOfTables dùng để tính số slot song song (bao nhiêu trận cùng lúc),
 * nhưng KHÔNG gán tableNumber cụ thể vào schedule.
 */
class SingleDayAllocator {
  private readonly slotDuration: number;
  private readonly startDate: Date;
  private readonly endDate: Date;

  constructor(config: ScheduleConfig) {
    this.startDate = config.startDate;
    this.endDate = config.endDate;
    this.slotDuration = config.matchDurationMinutes + config.breakDurationMinutes;
  }

  getSlot(matchIndex: number, numberOfTables: number): TimeSlot {
    const slotIndex = Math.floor(matchIndex / numberOfTables);
    return {
      scheduledAt: new Date(
        this.startDate.getTime() + slotIndex * this.slotDuration * 60_000
      ),
    };
  }

  validate(
    totalMatches: number,
    numberOfTables: number
  ): { fits: boolean; warning?: string } {
    const lastSlotIndex = Math.ceil(totalMatches / numberOfTables) - 1;
    const lastMatchStart = new Date(
      this.startDate.getTime() + lastSlotIndex * this.slotDuration * 60_000
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
 * KHÔNG gán tableNumber.
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
    this.startDate = config.startDate;
    this.endDate = config.endDate;
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
    numberOfTables: number
  ): { fits: boolean; warning?: string } {
    const lastSlotIndex = Math.ceil(totalMatches / numberOfTables) - 1;
    const lastMatchAt = this._computeSlotTime(lastSlotIndex);
    const lastMatchEnd = new Date(
      lastMatchAt.getTime() + this.slotDuration * 60_000
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

function createAllocator(config: ScheduleConfig): SingleDayAllocator | MultiDayAllocator {
  return isSingleDayTournament(config)
    ? new SingleDayAllocator(config)
    : new MultiDayAllocator(config);
}

// ─── Table Assignment ─────────────────────────────────────────────────────────

/**
 * Tìm bàn trống tại thời điểm cụ thể.
 * Bàn được coi là "bận" khi có match đang `in_progress` hoặc `scheduled`
 * với scheduledAt nằm trong khoảng [now - slotDuration, now].
 *
 * @returns tableNumber (1-based) hoặc null nếu không còn bàn trống
 */
async function findAvailableTable(
  tournamentId: number,
  config: ScheduleConfig,
  t: Transaction
): Promise<number | null> {
  const slotDurationMs =
    (config.matchDurationMinutes + config.breakDurationMinutes) * 60_000;
  const now = new Date();
  const windowStart = new Date(now.getTime() - slotDurationMs);

  // Lấy tất cả bàn đang bận trong cửa sổ thời gian hiện tại
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
        where: {
          status: { [Op.in]: ["scheduled", "in_progress"] },
        },
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
    busySchedules.map((s) => s.tableNumber).filter(Boolean)
  );

  // Tìm bàn trống đầu tiên trong khoảng [1, numberOfTables]
  for (let table = 1; table <= config.numberOfTables; table++) {
    if (!busyTables.has(table)) {
      return table;
    }
  }

  return null; // Tất cả bàn đang bận
}

// ─── Referee Assignment ───────────────────────────────────────────────────────

function buildWorkloads(referees: TournamentReferee[]): RefereeWorkload[] {
  return referees.map((r) => ({ refereeId: r.refereeId, assignedCount: 0 }));
}

function assignReferees(workloads: RefereeWorkload[], count: number): number[] {
  if (workloads.length === 0) return [];
  const sorted = [...workloads].sort((a, b) => a.assignedCount - b.assignedCount);
  const selected = sorted.slice(0, count).map((r) => r.refereeId);
  for (const w of workloads) {
    if (selected.includes(w.refereeId)) w.assignedCount += 1;
  }
  return selected;
}

function calcRefsPerMatch(totalMatches: number, totalRefs: number): number {
  if (totalRefs === 0) return 0;
  return totalMatches * 2 <= totalRefs * 3 ? 2 : 1;
}

async function bulkCreateMatchReferees(
  matchId: number,
  refereeIds: number[],
  t: Transaction
): Promise<void> {
  if (refereeIds.length === 0) return;
  await MatchReferee.bulkCreate(
    refereeIds.map((refereeId) => ({ matchId, refereeId })),
    { transaction: t }
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getCategoryWithTournament(
  categoryId: number
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
  tournamentId: number
): Promise<TournamentReferee[]> {
  return await TournamentReferee.findAll({
    where: { tournamentId, role: "referee" },
  });
}

async function getRequiredScheduleConfig(
  tournamentId: number
): Promise<ScheduleConfig> {
  const config = await ScheduleConfig.findOne({ where: { tournamentId } });
  if (!config) {
    throw new Error(
      "Schedule config not found. Please create a schedule configuration first before generating the schedule."
    );
  }
  return config;
}

async function clearExistingSchedules(
  categoryId: number,
  stage: Stage,
  t: Transaction
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

// ─── Service ──────────────────────────────────────────────────────────────────

export class ScheduleService {
  // ── 1. Tạo lịch group stage ────────────────────────────────────────────────

  /**
   * Tạo lịch thi đấu vòng bảng.
   * tableNumber KHÔNG được gán ở đây — sẽ được gán khi trận bắt đầu.
   */
  async generateGroupStageSchedule(
    organizerId: number,
    categoryId: number
  ): Promise<ScheduleResult> {
    const category = await getCategoryWithTournament(categoryId);
    const tournament = category.tournament!;
    assertOrganizer(organizerId, tournament);

    const config = await getRequiredScheduleConfig(tournament.id);

    const standings = await GroupStanding.findAll({
      where: { categoryId },
      order: [["groupName", "ASC"]],
    });
    if (standings.length === 0) {
      throw new Error("No group standings found. Generate groups first.");
    }

    // Build round-robin pairs
    const groupMap = new Map<string, number[]>();
    for (const s of standings) {
      const group = groupMap.get(s.groupName) ?? [];
      group.push(s.entryId);
      groupMap.set(s.groupName, group);
    }

    const matchPairs: { entryAId: number; entryBId: number; groupName: string }[] = [];
    for (const [groupName, entryIds] of groupMap) {
      for (let i = 0; i < entryIds.length; i++) {
        for (let j = i + 1; j < entryIds.length; j++) {
          matchPairs.push({
            entryAId: entryIds[i]!,
            entryBId: entryIds[j]!,
            groupName,
          });
        }
      }
    }

    const allocator = createAllocator(config);
    const { fits, warning } = allocator.validate(
      matchPairs.length,
      config.numberOfTables
    );

    const referees = await getTournamentReferees(tournament.id);
    const workloads = buildWorkloads(referees);
    const refsPerMatch = calcRefsPerMatch(matchPairs.length, referees.length);

    const result = await sequelize.transaction(async (t) => {
      await clearExistingSchedules(categoryId, "group", t);

      const schedules: Schedule[] = [];
      const matches: Match[] = [];

      for (let i = 0; i < matchPairs.length; i++) {
        const pair = matchPairs[i]!;
        // tableNumber = null — sẽ gán khi trận thực sự bắt đầu
        const slot = allocator.getSlot(i, config.numberOfTables);

        const schedule = await Schedule.create(
          {
            categoryId,
            stage: "group" satisfies Stage,
            groupName: pair.groupName,
            scheduledAt: slot.scheduledAt,
            tableNumber: null,
          },
          { transaction: t }
        );

        const match = await Match.create(
          {
            scheduleId: schedule.id,
            entryAId: pair.entryAId,
            entryBId: pair.entryBId,
            status: "scheduled",
          },
          { transaction: t }
        );

        await bulkCreateMatchReferees(
          match.id,
          assignReferees(workloads, refsPerMatch),
          t
        );

        schedules.push(schedule);
        matches.push(match);
      }

      return { schedules, matches };
    });

    return { ...result, ...(warning !== undefined && { warning }) };
  }

  // ── 2. Tạo lịch knockout ───────────────────────────────────────────────────

  /**
   * Tạo lịch thi đấu vòng knockout.
   * tableNumber KHÔNG được gán ở đây.
   */
  async generateKnockoutSchedule(
    organizerId: number,
    categoryId: number,
    roundName?: KnockoutRound
  ): Promise<ScheduleResult> {
    const category = await getCategoryWithTournament(categoryId);
    const tournament = category.tournament!;
    assertOrganizer(organizerId, tournament);

    const config = await getRequiredScheduleConfig(tournament.id);

    const whereClause: Record<string, unknown> = {
      categoryId,
      status: "ready",
      isByeMatch: false,
    };
    if (roundName) whereClause.roundName = roundName;

    const brackets = await KnockoutBracket.findAll({
      where: whereClause,
      order: [["roundNumber", "ASC"], ["bracketPosition", "ASC"]],
    });

    if (brackets.length === 0) {
      throw new Error("No ready brackets found.");
    }

    const allocator = createAllocator(config);
    const { warning } = allocator.validate(brackets.length, config.numberOfTables);

    const referees = await getTournamentReferees(tournament.id);
    const workloads = buildWorkloads(referees);
    const refsPerMatch = calcRefsPerMatch(brackets.length, referees.length);

    const result = await sequelize.transaction(async (t) => {
      if (!roundName) {
        await clearExistingSchedules(categoryId, "knockout", t);
      }

      const schedules: Schedule[] = [];
      const matches: Match[] = [];

      for (let i = 0; i < brackets.length; i++) {
        const bracket = brackets[i]!;
        // tableNumber = null — sẽ gán khi trận thực sự bắt đầu
        const slot = allocator.getSlot(i, config.numberOfTables);

        const schedule = await Schedule.create(
          {
            categoryId,
            stage: "knockout" satisfies Stage,
            knockoutRound: bracket.roundName,
            scheduledAt: slot.scheduledAt,
            tableNumber: null,
          },
          { transaction: t }
        );

        const match = await Match.create(
          {
            scheduleId: schedule.id,
            entryAId: bracket.entryAId!,
            entryBId: bracket.entryBId!,
            status: "scheduled",
          },
          { transaction: t }
        );

        await bracket.update(
          { matchId: match.id, scheduleId: schedule.id },
          { transaction: t }
        );

        await bulkCreateMatchReferees(
          match.id,
          assignReferees(workloads, refsPerMatch),
          t
        );

        schedules.push(schedule);
        matches.push(match);
      }

      return { schedules, matches };
    });

    return { ...result, ...(warning !== undefined && { warning }) };
  }

  // ── 3. Assign bàn thi đấu khi match bắt đầu ───────────────────────────────

  /**
   * Gọi từ match.service khi match chuyển sang `in_progress`.
   *
   * Flow:
   *  1. Tìm bàn trống trong khoảng thời gian hiện tại.
   *  2. Gán tableNumber vào schedule của match đó.
   *  3. Nếu không còn bàn trống → throw error (match không thể bắt đầu).
   *
   * @returns tableNumber đã được gán
   */
  async assignTableForMatch(
    matchId: number,
    tournamentId: number,
    t: Transaction
  ): Promise<number> {
    const config = await getRequiredScheduleConfig(tournamentId);

    const availableTable = await findAvailableTable(tournamentId, config, t);

    if (availableTable === null) {
      throw new Error(
        `No available tables at this time. All ${config.numberOfTables} table(s) are currently in use. ` +
        `Please wait for a table to become available before starting this match.`
      );
    }

    // Cập nhật tableNumber vào schedule của match này
    const match = await Match.findByPk(matchId, { transaction: t });
    if (!match) throw new Error("Match not found");

    await Schedule.update(
      { tableNumber: availableTable },
      { where: { id: match.scheduleId }, transaction: t }
    );

    return availableTable;
  }

  // ── 4. Assign trọng tài động khi match bắt đầu ────────────────────────────

  /**
   * Gọi từ match.service khi match chuyển sang `in_progress`.
   * Tìm trọng tài rảnh nhất và assign.
   */
  async assignRefereeDynamic(
    matchId: number,
    tournamentId: number,
    t: Transaction
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

  // ── 5. Queries ────────────────────────────────────────────────────────────

  async getScheduleById(id: number): Promise<Schedule> {
    const schedule = await Schedule.findByPk(id, { include: [MATCH_INCLUDE] });
    if (!schedule) throw new Error("Schedule not found");
    return schedule;
  }

  async getSchedulesByCategory(
    categoryId: number,
    options: {
      skip?: number;
      limit?: number;
      stage?: Stage;
      groupName?: string;
      knockoutRound?: KnockoutRound;
    } = {}
  ): Promise<{ rows: Schedule[]; count: number }> {
    const { skip = 0, limit = 20, stage, groupName, knockoutRound } = options;

    const where: Record<string, unknown> = { categoryId };
    if (stage) where.stage = stage;
    if (groupName) where.groupName = groupName;
    if (knockoutRound) where.knockoutRound = knockoutRound;

    return await Schedule.findAndCountAll({
      where,
      include: [MATCH_INCLUDE],
      order: [["scheduledAt", "ASC"]],
      offset: skip,
      limit,
      distinct: true,
    });
  }

  async updateSchedule(
    organizerId: number,
    scheduleId: number,
    data: Partial<Pick<Schedule, "scheduledAt" | "tableNumber">>
  ): Promise<Schedule> {
    const schedule = await this.getScheduleById(scheduleId);
    const category = await getCategoryWithTournament(schedule.categoryId);
    assertOrganizer(organizerId, category.tournament!);
    return await schedule.update(data);
  }

  async deleteSchedule(organizerId: number, scheduleId: number): Promise<void> {
    const schedule = await this.getScheduleById(scheduleId);
    const category = await getCategoryWithTournament(schedule.categoryId);
    assertOrganizer(organizerId, category.tournament!);
    await schedule.destroy();
  }
}

export default new ScheduleService();