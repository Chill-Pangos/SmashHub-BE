import { BadRequestError } from "./errors.helper";

export interface ScheduleSlotConfig {
  startDate: Date;
  endDate: Date;
  matchDurationMinutes: number;
  breakDurationMinutes: number;
  numberOfTables: number;
  dailyStartHour: number;
  dailyStartMinute: number;
  dailyEndHour: number;
  dailyEndMinute: number;
  lunchBreakStartHour?: number | null;
  lunchBreakStartMinute?: number | null;
  lunchBreakEndHour?: number | null;
  lunchBreakEndMinute?: number | null;
}

export type ScheduleJobStage = "group" | "knockout";

export interface OptimizableScheduleJob {
  stage: ScheduleJobStage;
  roundNumber: number;
  entryAId?: number | null;
  entryBId?: number | null;
  groupName?: string;
  groupSequenceKey?: string;
  categoryId?: number;
}

export interface ScheduleSlotPlan<T> {
  slots: Map<T, Date>;
  endTime: Date;
  totalSlots: number;
}

interface ScheduleSlotCandidate {
  index: number;
  startTime: Date;
  matchEndTime: Date;
  slotEndTime: Date;
}

interface ScheduleAssignment<T> extends ScheduleSlotCandidate {
  item: T;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const SINGLE_DAY_DAILY_END_ERROR =
  "Match cannot finish before dailyEnd in a single-day tournament. Adjust dailyEnd, matchDurationMinutes, numberOfTables, or tournament dates.";

export function getScheduleDateOnlyTime(date: Date): number {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

export function getScheduleCalendarDayCount(startDate: Date, endDate: Date): number {
  return Math.floor((getScheduleDateOnlyTime(endDate) - getScheduleDateOnlyTime(startDate)) / DAY_MS) + 1;
}

export function isSingleDaySchedule(
  config: Pick<ScheduleSlotConfig, "startDate" | "endDate">,
): boolean {
  return getScheduleDateOnlyTime(config.startDate) === getScheduleDateOnlyTime(config.endDate);
}

export function withScheduleTime(date: Date, hour: number, minute: number): Date {
  return new Date(Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    hour,
    minute,
    0,
    0,
  ));
}

export function getNextScheduleDayStart(
  date: Date,
  config: Pick<ScheduleSlotConfig, "dailyStartHour" | "dailyStartMinute">,
): Date {
  return new Date(Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate() + 1,
    config.dailyStartHour,
    config.dailyStartMinute,
    0,
    0,
  ));
}

export function getScheduleSlotDurationMinutes(
  config: Pick<ScheduleSlotConfig, "matchDurationMinutes" | "breakDurationMinutes">,
): number {
  return config.matchDurationMinutes + config.breakDurationMinutes;
}

export function getScheduleSlotDurationMs(
  config: Pick<ScheduleSlotConfig, "matchDurationMinutes" | "breakDurationMinutes">,
): number {
  return getScheduleSlotDurationMinutes(config) * 60_000;
}

export function getScheduleMatchDurationMs(
  config: Pick<ScheduleSlotConfig, "matchDurationMinutes">,
): number {
  return config.matchDurationMinutes * 60_000;
}

export function getScheduleDailyStart(
  date: Date,
  config: Pick<ScheduleSlotConfig, "dailyStartHour" | "dailyStartMinute">,
): Date {
  return withScheduleTime(date, config.dailyStartHour, config.dailyStartMinute);
}

export function getScheduleDailyEnd(
  date: Date,
  config: Pick<ScheduleSlotConfig, "dailyEndHour" | "dailyEndMinute">,
): Date {
  return withScheduleTime(date, config.dailyEndHour, config.dailyEndMinute);
}

export function getScheduleTournamentEndTime(
  config: Pick<ScheduleSlotConfig, "endDate" | "dailyEndHour" | "dailyEndMinute">,
): Date {
  return withScheduleTime(config.endDate, config.dailyEndHour, config.dailyEndMinute);
}

export function getScheduleLunchBreakRange(
  date: Date,
  config: Pick<
    ScheduleSlotConfig,
    "lunchBreakStartHour" | "lunchBreakStartMinute" | "lunchBreakEndHour" | "lunchBreakEndMinute"
  >,
): { start: Date; end: Date } | null {
  if (config.lunchBreakStartHour == null || config.lunchBreakEndHour == null) {
    return null;
  }

  return {
    start: withScheduleTime(date, config.lunchBreakStartHour, config.lunchBreakStartMinute ?? 0),
    end: withScheduleTime(date, config.lunchBreakEndHour, config.lunchBreakEndMinute ?? 0),
  };
}

export function overlapsScheduleLunchBreak(
  start: Date,
  config: Pick<
    ScheduleSlotConfig,
    | "matchDurationMinutes"
    | "lunchBreakStartHour"
    | "lunchBreakStartMinute"
    | "lunchBreakEndHour"
    | "lunchBreakEndMinute"
  >,
): { start: Date; end: Date } | null {
  const lunch = getScheduleLunchBreakRange(start, config);
  if (!lunch) return null;

  const matchEnd = new Date(start.getTime() + getScheduleMatchDurationMs(config));
  return start < lunch.end && matchEnd > lunch.start ? lunch : null;
}

export function getNextValidScheduleMatchStart(
  config: ScheduleSlotConfig,
  candidate: Date,
): Date {
  let current = new Date(candidate);

  for (let attempts = 0; attempts < 10_000; attempts++) {
    const dailyStart = getScheduleDailyStart(current, config);
    if (current < dailyStart) {
      current = dailyStart;
    }

    const lunch = overlapsScheduleLunchBreak(current, config);
    if (lunch) {
      current = new Date(lunch.end);
      continue;
    }

    const dailyEnd = getScheduleDailyEnd(current, config);
    const matchEnd = new Date(current.getTime() + getScheduleMatchDurationMs(config));
    if (matchEnd > dailyEnd) {
      if (isSingleDaySchedule(config)) {
        throw new BadRequestError(SINGLE_DAY_DAILY_END_ERROR);
      }
      current = getNextScheduleDayStart(current, config);
      continue;
    }

    return current;
  }

  throw new BadRequestError("Unable to find a valid schedule slot with current schedule configuration");
}

export function buildValidScheduleSlots(
  config: ScheduleSlotConfig,
  phaseStart: Date,
  slotCount: number,
): Date[] {
  if (slotCount <= 0) return [];

  const slots: Date[] = [];
  let current = getNextValidScheduleMatchStart(config, phaseStart);
  const slotDurationMs = getScheduleSlotDurationMs(config);

  for (let i = 0; i < slotCount; i++) {
    slots.push(current);
    if (i < slotCount - 1) {
      current = getNextValidScheduleMatchStart(
        config,
        new Date(current.getTime() + slotDurationMs),
      );
    }
  }

  return slots;
}

export function getScheduleEndTimeFromSlots(
  config: Pick<ScheduleSlotConfig, "matchDurationMinutes" | "breakDurationMinutes">,
  phaseStart: Date,
  slots: Date[],
): Date {
  if (slots.length === 0) return phaseStart;
  return new Date(slots[slots.length - 1]!.getTime() + getScheduleSlotDurationMs(config));
}

export function getSchedulePhaseEndTime(
  config: ScheduleSlotConfig,
  phaseStart: Date,
  slotCount: number,
): Date {
  return getScheduleEndTimeFromSlots(
    config,
    phaseStart,
    buildValidScheduleSlots(config, phaseStart, slotCount),
  );
}

function minutesFromTime(hour: number, minute: number): number {
  return hour * 60 + minute;
}

export function calculateScheduleAvailableMinutes(config: ScheduleSlotConfig): number {
  const dailyStart = minutesFromTime(config.dailyStartHour, config.dailyStartMinute);
  const dailyEnd = minutesFromTime(config.dailyEndHour, config.dailyEndMinute);
  const dailyMinutes = Math.max(0, dailyEnd - dailyStart);
  let lunchMinutes = 0;

  if (config.lunchBreakStartHour != null && config.lunchBreakEndHour != null) {
    const lunchStart = minutesFromTime(
      config.lunchBreakStartHour,
      config.lunchBreakStartMinute ?? 0,
    );
    const lunchEnd = minutesFromTime(
      config.lunchBreakEndHour,
      config.lunchBreakEndMinute ?? 0,
    );
    lunchMinutes = Math.max(0, Math.min(dailyEnd, lunchEnd) - Math.max(dailyStart, lunchStart));
  }

  return Math.max(0, dailyMinutes - lunchMinutes) *
    Math.max(0, getScheduleCalendarDayCount(config.startDate, config.endDate));
}

function getJobEntryIds(job: OptimizableScheduleJob): number[] {
  return [job.entryAId, job.entryBId].filter(
    (entryId): entryId is number => entryId != null,
  );
}

function shareEntry(a: OptimizableScheduleJob, b: OptimizableScheduleJob): boolean {
  const bEntries = new Set(getJobEntryIds(b));
  return getJobEntryIds(a).some((entryId) => bEntries.has(entryId));
}

function getJobGroupKey(job: OptimizableScheduleJob): string {
  return job.groupSequenceKey ?? job.groupName ?? "";
}

function sortJobsByPriority<T extends OptimizableScheduleJob>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    if (a.roundNumber !== b.roundNumber) return a.roundNumber - b.roundNumber;

    const groupCompare = getJobGroupKey(a).localeCompare(getJobGroupKey(b));
    if (groupCompare !== 0) return groupCompare;

    return (a.categoryId ?? 0) - (b.categoryId ?? 0);
  });
}

function buildScheduleSlotCandidates(
  config: ScheduleSlotConfig,
  phaseStart: Date,
  slotCount: number,
): ScheduleSlotCandidate[] {
  const slotDurationMs = getScheduleSlotDurationMs(config);
  const matchDurationMs = getScheduleMatchDurationMs(config);

  return buildValidScheduleSlots(config, phaseStart, slotCount).map((startTime, index) => ({
    index,
    startTime,
    matchEndTime: new Date(startTime.getTime() + matchDurationMs),
    slotEndTime: new Date(startTime.getTime() + slotDurationMs),
  }));
}

function isSlotCapacityAvailable<T extends OptimizableScheduleJob>(
  slot: ScheduleSlotCandidate,
  assignments: Map<T, ScheduleAssignment<T>>,
  config: ScheduleSlotConfig,
): boolean {
  let assignedAtStart = 0;

  for (const assignment of assignments.values()) {
    if (assignment.startTime.getTime() === slot.startTime.getTime()) {
      assignedAtStart += 1;
    }
  }

  return assignedAtStart < config.numberOfTables;
}

function satisfiesRoundDependency<T extends OptimizableScheduleJob>(
  item: T,
  slot: ScheduleSlotCandidate,
  assignments: Map<T, ScheduleAssignment<T>>,
): boolean {
  if (item.stage !== "knockout") return true;

  for (const assignment of assignments.values()) {
    if (
      assignment.item.stage === "knockout" &&
      assignment.item.roundNumber < item.roundNumber &&
      slot.startTime < assignment.slotEndTime
    ) {
      return false;
    }
  }

  return true;
}

function hasEnoughEntryRest<T extends OptimizableScheduleJob>(
  item: T,
  slot: ScheduleSlotCandidate,
  assignments: Map<T, ScheduleAssignment<T>>,
  config: ScheduleSlotConfig,
): boolean {
  const restMs = config.breakDurationMinutes * 60_000;

  for (const assignment of assignments.values()) {
    if (!shareEntry(item, assignment.item)) continue;

    const tooClose =
      slot.startTime.getTime() < assignment.matchEndTime.getTime() + restMs &&
      assignment.startTime.getTime() < slot.matchEndTime.getTime() + restMs;

    if (tooClose) return false;
  }

  return true;
}

function canAssignSlot<T extends OptimizableScheduleJob>(
  item: T,
  slot: ScheduleSlotCandidate,
  assignments: Map<T, ScheduleAssignment<T>>,
  config: ScheduleSlotConfig,
): boolean {
  return (
    isSlotCapacityAvailable(slot, assignments, config) &&
    satisfiesRoundDependency(item, slot, assignments) &&
    hasEnoughEntryRest(item, slot, assignments, config)
  );
}

function getAssignedAtSlotCount<T extends OptimizableScheduleJob>(
  slot: ScheduleSlotCandidate,
  assignments: Map<T, ScheduleAssignment<T>>,
): number {
  let count = 0;
  for (const assignment of assignments.values()) {
    if (assignment.startTime.getTime() === slot.startTime.getTime()) count += 1;
  }
  return count;
}

function getIdleTimePenalty<T extends OptimizableScheduleJob>(
  item: T,
  slot: ScheduleSlotCandidate,
  assignments: Map<T, ScheduleAssignment<T>>,
): number {
  let lastMatchEnd: number | null = null;

  for (const assignment of assignments.values()) {
    if (!shareEntry(item, assignment.item)) continue;
    if (assignment.matchEndTime <= slot.startTime) {
      lastMatchEnd = Math.max(lastMatchEnd ?? 0, assignment.matchEndTime.getTime());
    }
  }

  if (lastMatchEnd == null) return 0;
  return Math.floor((slot.startTime.getTime() - lastMatchEnd) / 60_000);
}

function getSameGroupNearSlotPenalty<T extends OptimizableScheduleJob>(
  item: T,
  slot: ScheduleSlotCandidate,
  assignments: Map<T, ScheduleAssignment<T>>,
  config: ScheduleSlotConfig,
): number {
  const groupKey = getJobGroupKey(item);
  if (!groupKey) return 0;

  const nearWindowMs = getScheduleSlotDurationMs(config) * 2;
  let count = 0;

  for (const assignment of assignments.values()) {
    if (getJobGroupKey(assignment.item) !== groupKey) continue;
    if (Math.abs(slot.startTime.getTime() - assignment.startTime.getTime()) <= nearWindowMs) {
      count += 1;
    }
  }

  return count * 3;
}

function scoreSlot<T extends OptimizableScheduleJob>(
  item: T,
  slot: ScheduleSlotCandidate,
  assignments: Map<T, ScheduleAssignment<T>>,
  config: ScheduleSlotConfig,
): number {
  let score = 0;

  score += slot.index * 5;
  score += getAssignedAtSlotCount(slot, assignments) * 2;
  score += getIdleTimePenalty(item, slot, assignments);
  score += getSameGroupNearSlotPenalty(item, slot, assignments, config);

  return score;
}

export function getOptimizedScheduleSlotPlan<T extends OptimizableScheduleJob>(
  config: ScheduleSlotConfig,
  phaseStart: Date,
  items: T[],
): ScheduleSlotPlan<T> {
  const slots = new Map<T, Date>();
  if (items.length === 0) {
    return { slots, endTime: phaseStart, totalSlots: 0 };
  }

  let candidateSlotCount = Math.max(1, Math.ceil(items.length / config.numberOfTables));
  const maxCandidateSlotCount = Math.max(
    items.length * 3,
    candidateSlotCount + items.length,
  );
  let candidates = buildScheduleSlotCandidates(config, phaseStart, candidateSlotCount);
  const assignments = new Map<T, ScheduleAssignment<T>>();
  const sortedItems = sortJobsByPriority(items);

  for (const item of sortedItems) {
    let best = candidates
      .filter((slot) => canAssignSlot(item, slot, assignments, config))
      .map((slot) => ({ slot, score: scoreSlot(item, slot, assignments, config) }))
      .sort((a, b) => a.score - b.score)[0];

    while (!best && candidateSlotCount < maxCandidateSlotCount) {
      candidateSlotCount += 1;
      candidates = buildScheduleSlotCandidates(config, phaseStart, candidateSlotCount);
      best = candidates
        .filter((slot) => canAssignSlot(item, slot, assignments, config))
        .map((slot) => ({ slot, score: scoreSlot(item, slot, assignments, config) }))
        .sort((a, b) => a.score - b.score)[0];
    }

    if (!best) {
      throw new BadRequestError("Unable to find a valid schedule slot with current schedule configuration");
    }

    assignments.set(item, { ...best.slot, item });
    slots.set(item, best.slot.startTime);
  }

  const endTime = Array.from(assignments.values()).reduce(
    (latest, assignment) => (
      assignment.slotEndTime > latest ? assignment.slotEndTime : latest
    ),
    phaseStart,
  );
  const totalSlots = new Set(
    Array.from(assignments.values()).map((assignment) => assignment.startTime.getTime()),
  ).size;

  return { slots, endTime, totalSlots };
}
