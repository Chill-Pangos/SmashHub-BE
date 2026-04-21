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
import User from "../models/user.model";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ScheduleResult {
  schedules: Schedule[];
  matches: Match[];
  warning?: string | undefined; // thêm | undefined để chấp nhận cả 2 trường hợp
}
interface TimeSlot {
  scheduledAt: Date;
  tableNumber: number;
}

interface RefereeWorkload {
  refereeId: number;
  assignedCount: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SINGLE_DAY_THRESHOLD_HOURS = 20; // startDate và endDate cách nhau < 20h → coi là giải 1 ngày

const MATCH_INCLUDE = {
  model: Match,
  as: "scheduledMatches",
  include: [
    { model: Entry, as: "entryA" },
    { model: Entry, as: "entryB" },
  ],
};

// ─── Tournament Type Detection ────────────────────────────────────────────────

function isSingleDayTournament(tournament: Tournament): boolean {
  const diffHours =
    (tournament.endDate.getTime() - tournament.startDate.getTime()) /
    (1000 * 60 * 60);
  return diffHours <= SINGLE_DAY_THRESHOLD_HOURS;
}

// ─── Slot Allocators ──────────────────────────────────────────────────────────

/**
 * Giải 1 ngày: tất cả trận chạy song song tối đa theo số bàn.
 * Slot = floor(matchIndex / numberOfTables) × slotDuration
 */
class SingleDayAllocator {
  private readonly slotDuration: number;
  private readonly startDate: Date;
  private readonly endDate: Date;

  constructor(tournament: Tournament, scheduleConfig: ScheduleConfig) {
    this.startDate = tournament.startDate;
    this.endDate = tournament.endDate;
    this.slotDuration =
      scheduleConfig.matchDurationMinutes + scheduleConfig.breakDurationMinutes;
  }

  getSlot(matchIndex: number, numberOfTables: number): TimeSlot {
    const slotIndex = Math.floor(matchIndex / numberOfTables);
    const scheduledAt = new Date(
      this.startDate.getTime() + slotIndex * this.slotDuration * 60_000,
    );
    return {
      scheduledAt,
      tableNumber: (matchIndex % numberOfTables) + 1,
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

    // So sánh thời điểm BẮT ĐẦU trận cuối với endDate
    if (lastMatchStart > this.endDate) {
      return {
        fits: false,
        warning: `Schedule overflows. Last match starts at ${lastMatchStart.toISOString()}, but tournament's last allowed start time is ${this.endDate.toISOString()}`,
      };
    }
    return { fits: true };
  }
}

/**
 * Giải nhiều ngày: phân bổ đều số trận mỗi ngày.
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

  constructor(tournament: Tournament, scheduleConfig: ScheduleConfig) {
    this.startDate = tournament.startDate;
    this.endDate = tournament.endDate;
    this.dailyStartHour = scheduleConfig.dailyStartHour;
    this.dailyStartMinute = scheduleConfig.dailyStartMinute;
    this.dailyEndHour = scheduleConfig.dailyEndHour;
    this.dailyEndMinute = scheduleConfig.dailyEndMinute;
    this.slotDuration =
      scheduleConfig.matchDurationMinutes + scheduleConfig.breakDurationMinutes;
  }

  getSlot(matchIndex: number, numberOfTables: number): TimeSlot {
    const slotIndex = Math.floor(matchIndex / numberOfTables);
    const scheduledAt = this.computeSlotTime(slotIndex);
    return {
      scheduledAt,
      tableNumber: (matchIndex % numberOfTables) + 1,
    };
  }

  private computeSlotTime(slotIndex: number): Date {
    let current = new Date(this.startDate);

    for (let i = 0; i < slotIndex; i++) {
      current = new Date(current.getTime() + this.slotDuration * 60_000);

      const nextSlotStart = new Date(
        current.getTime() + this.slotDuration * 60_000,
      );
      const lastStartOfDay = new Date(current);
      lastStartOfDay.setHours(this.dailyEndHour, this.dailyEndMinute, 0, 0);

      // Nếu slot tiếp theo sẽ bắt đầu SAU giờ cuối cho phép → sang ngày mới
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
    const lastMatchAt = this.computeSlotTime(lastSlotIndex);
    const lastMatchEnd = new Date(
      lastMatchAt.getTime() + this.slotDuration * 60_000,
    );

    if (lastMatchEnd > this.endDate) {
      return {
        fits: false,
        warning: `Schedule overflows tournament end time. Last match ends at ${lastMatchEnd.toISOString()}, tournament ends at ${this.endDate.toISOString()}`,
      };
    }
    return { fits: true };
  }
}

function createAllocator(
  tournament: Tournament,
  scheduleConfig: ScheduleConfig
): SingleDayAllocator | MultiDayAllocator {
  return isSingleDayTournament(tournament)
    ? new SingleDayAllocator(tournament, scheduleConfig)
    : new MultiDayAllocator(tournament, scheduleConfig);
}

// ─── Referee Assignment ───────────────────────────────────────────────────────

function buildWorkloads(referees: TournamentReferee[]): RefereeWorkload[] {
  return referees.map((r) => ({ refereeId: r.refereeId, assignedCount: 0 }));
}

function assignReferees(workloads: RefereeWorkload[], count: number): number[] {
  if (workloads.length === 0) return [];
  const sorted = [...workloads].sort(
    (a, b) => a.assignedCount - b.assignedCount,
  );
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
  t: Transaction,
): Promise<void> {
  if (refereeIds.length === 0) return;
  await MatchReferee.bulkCreate(
    refereeIds.map((refereeId) => ({ matchId, refereeId })),
    { transaction: t },
  );
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
    where: { tournamentId, role: "referee" }, // chief không coi trận cụ thể
  });
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

// ─── Service ──────────────────────────────────────────────────────────────────

export class ScheduleService {
  // ── 1. Xếp lịch vòng 1 (group stage) ────────────────────────────────────

  async generateGroupStageSchedule(
    organizerId: number,
    categoryId: number,
  ): Promise<ScheduleResult> {
    const category = await getCategoryWithTournament(categoryId);
    const tournament = category.tournament!;
    assertOrganizer(organizerId, tournament);

    // Lấy schedule config - PHẢI tồn tại
    const scheduleConfig = await ScheduleConfig.findOne({
      where: { tournamentId: tournament.id },
    });

    if (!scheduleConfig) {
      throw new Error(
        "Schedule config not found. Please create a schedule configuration first before generating the schedule."
      );
    }

    const standings = await GroupStanding.findAll({
      where: { categoryId },
      order: [["groupName", "ASC"]],
    });
    if (standings.length === 0) {
      throw new Error("No group standings found. Generate groups first.");
    }

    // Build round-robin pairs trong mỗi bảng
    const groupMap = new Map<string, number[]>();
    for (const s of standings) {
      const group = groupMap.get(s.groupName) ?? [];
      group.push(s.entryId);
      groupMap.set(s.groupName, group);
    }

    const matchPairs: {
      entryAId: number;
      entryBId: number;
      groupName: string;
    }[] = [];
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

    const allocator = createAllocator(tournament, scheduleConfig);
    const { fits, warning } = allocator.validate(
      matchPairs.length,
      tournament.numberOfTables,
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
        const slot = allocator.getSlot(i, tournament.numberOfTables);

        const schedule = await Schedule.create(
          {
            categoryId,
            stage: "group" satisfies Stage,
            groupName: pair.groupName,
            scheduledAt: slot.scheduledAt,
            tableNumber: slot.tableNumber,
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

        await bulkCreateMatchReferees(
          match.id,
          assignReferees(workloads, refsPerMatch),
          t,
        );

        schedules.push(schedule);
        matches.push(match);
      }

      return { schedules, matches };
    });

    return {
      ...result,
      ...(warning !== undefined && { warning }),
    };
  }

  // ── 2. Xếp lịch vòng knockout ────────────────────────────────────────────

  async generateKnockoutSchedule(
    organizerId: number,
    categoryId: number,
    roundName?: KnockoutRound,
  ): Promise<ScheduleResult> {
    const category = await getCategoryWithTournament(categoryId);
    const tournament = category.tournament!;
    assertOrganizer(organizerId, tournament);

    // Lấy schedule config - PHẢI tồn tại
    const scheduleConfig = await ScheduleConfig.findOne({
      where: { tournamentId: tournament.id },
    });

    if (!scheduleConfig) {
      throw new Error(
        "Schedule config not found. Please create a schedule configuration first before generating the schedule."
      );
    }

    const whereClause: Record<string, unknown> = {
      categoryId,
      status: "ready",
      isByeMatch: false,
    };
    if (roundName) whereClause.roundName = roundName;

    const brackets = await KnockoutBracket.findAll({
      where: whereClause,
      order: [
        ["roundNumber", "ASC"],
        ["bracketPosition", "ASC"],
      ],
    });

    if (brackets.length === 0) {
      throw new Error("No ready brackets found.");
    }

    const allocator = createAllocator(tournament, scheduleConfig);
    const { warning } = allocator.validate(
      brackets.length,
      tournament.numberOfTables,
    );

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
        const slot = allocator.getSlot(i, tournament.numberOfTables);

        const schedule = await Schedule.create(
          {
            categoryId,
            stage: "knockout" satisfies Stage,
            knockoutRound: bracket.roundName,
            scheduledAt: slot.scheduledAt,
            tableNumber: slot.tableNumber,
          },
          { transaction: t },
        );

        const match = await Match.create(
          {
            scheduleId: schedule.id,
            entryAId: bracket.entryAId!,
            entryBId: bracket.entryBId!,
            status: "scheduled",
          },
          { transaction: t },
        );

        await bracket.update(
          { matchId: match.id, scheduleId: schedule.id },
          { transaction: t },
        );

        await bulkCreateMatchReferees(
          match.id,
          assignReferees(workloads, refsPerMatch),
          t,
        );

        schedules.push(schedule);
        matches.push(match);
      }

      return { schedules, matches };
    });

    return {
      ...result,
      ...(warning !== undefined && { warning }),
    };
  }

  // ── 3. Assign trọng tài động khi match bắt đầu ───────────────────────────

  /**
   * Gọi từ match.service khi match chuyển sang in_progress.
   * Tìm trọng tài rảnh nhất (ít trận đang diễn ra nhất) và assign.
   */
  async assignRefereeDynamic(
    matchId: number,
    tournamentId: number,
    t: Transaction,
  ): Promise<void> {
    // Lấy danh sách trọng tài của giải
    const allReferees = await getTournamentReferees(tournamentId);
    if (allReferees.length === 0) return;

    // Đếm số trận đang in_progress của mỗi trọng tài
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

    // Build workload dựa trên số trận đang active
    const activeCount = new Map<number, number>();
    for (const a of activeAssignments) {
      activeCount.set(a.refereeId, (activeCount.get(a.refereeId) ?? 0) + 1);
    }

    const workloads: RefereeWorkload[] = allReferees.map((r) => ({
      refereeId: r.refereeId,
      assignedCount: activeCount.get(r.refereeId) ?? 0,
    }));

    // Xóa assignment cũ nếu có (trường hợp reassign)
    await MatchReferee.destroy({ where: { matchId }, transaction: t });

    // Assign trọng tài rảnh nhất
    const refsPerMatch = allReferees.length >= 2 ? 2 : 1;
    const selected = assignReferees(workloads, refsPerMatch);
    await bulkCreateMatchReferees(matchId, selected, t);
  }

  // ── 4. Queries ────────────────────────────────────────────────────────────

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
    } = {},
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
    data: Partial<Pick<Schedule, "scheduledAt" | "tableNumber">>,
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
