// schedule-config.service.ts
import crypto from "crypto";
import { Op } from "sequelize";
import ScheduleConfig from "../models/scheduleConfig.model";
import Tournament from "../models/tournament.model";
import TournamentCategory from "../models/tournamentCategory.model";
import Schedule from "../models/schedule.model";
import Match from "../models/match.model";
import Entry from "../models/entry.model";
import KnockoutBracket from "../models/knockoutBracket.model";
import scheduleService from "./schedule.service";
import { BadRequestError, NotFoundError } from "../utils/errors.helper";
import { toUtcDate } from "../utils/date.helper";
import { publishTournamentStatusScheduleRefresh } from "../utils/tournamentStatusScheduler.helper";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SchedulePreviewResponse {
  isValid: boolean;
  message: string;
  requiresRegeneration?: boolean;
  regenerationKey?: string;
  affectedScheduleCount?: number;
  preview: {
    totalMatches: number;
    totalSlots: number;
    estimatedEndTime: Date;
    tournamentEndTime: Date;
    availableMinutes: number;
    neededMinutes: number;
    overflowMinutes?: number;
    startDate: Date;
    endDate: Date;
    registrationStartDate: Date;
    registrationEndDate: Date;
    bracketGenerationDate: Date;
    numberOfTables: number;
    matchDurationMinutes: number;
    breakDurationMinutes: number;
  };
}

export interface ScheduleValidationResponse {
  isValid: boolean;
  message: string;
  details: {
    totalMatches: number;
    totalSlots: number;
    estimatedEndTime: Date;
    tournamentEndTime: Date;
    overflowMinutes?: number;
  };
}

export interface ScheduleValidationCategoryInput {
  maxEntries: number;
  isGroupStage?: boolean;
}

interface MatchBreakdown {
  groupMatches: number;
  knockoutMatches: number;
  totalMatches: number;
  groupEntryCounts: number[];
  knockoutEntryCounts: number[];
  plainMatchCount?: number;
}

interface ScheduleEstimate {
  totalSlots: number;
  estimatedEndTime: Date;
  neededMinutes: number;
}

interface UpdateControlFields {
  regenerateSchedule?: boolean;
  regenerationKey?: string;
}

interface ScheduleConfigUpdateContext {
  categoryIds: number[];
  entryCount: number;
  scheduleCount: number;
  bracketCount: number;
  activeMatchCount: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

/**
 * Số đội đi tiếp từ group stage sang knockout.
 * Mặc định 2 đội đầu bảng.
 */
const DEFAULT_QUALIFIERS_PER_GROUP = 2;

/**
 * Số đội tối thiểu trong 1 bảng round-robin.
 * Phải chia đều từ maxEntries → dùng làm kích thước bảng mặc định.
 */
const DEFAULT_ENTRIES_PER_GROUP = 4;
const POSSIBLE_BRACKET_SIZES = [4, 8, 16, 32, 64, 128, 256];
const CONFIG_UPDATE_FIELDS = [
  "startDate",
  "endDate",
  "numberOfTables",
  "registrationStartDate",
  "registrationEndDate",
  "bracketGenerationDate",
  "matchDurationMinutes",
  "breakDurationMinutes",
  "startLunchBreak",
  "endLunchBreak",
  "notes",
] as const;
type ConfigUpdateField = (typeof CONFIG_UPDATE_FIELDS)[number];

const UPDATE_CONTROL_FIELDS = ["regenerateSchedule", "regenerationKey"] as const;
const SCHEDULE_AFFECTING_FIELDS = new Set<ConfigUpdateField>([
  "startDate",
  "endDate",
  "numberOfTables",
  "matchDurationMinutes",
  "breakDurationMinutes",
  "startLunchBreak",
  "endLunchBreak",
]);
const REGISTRATION_FIELDS = new Set<ConfigUpdateField>([
  "registrationStartDate",
  "registrationEndDate",
]);

function assertOrganizer(userId: number, tournament: Tournament): void {
  if (tournament.createdBy !== userId) {
    throw new BadRequestError("Only the tournament organizer can perform this action");
  }
}

// ─── Match Count Calculator ───────────────────────────────────────────────────

/**
 * Tính số trận của 1 category.
 *
 * Knockout:
 *   totalMatches = bracketSize(maxEntries) - 1
 *
 * Group stage + knockout:
 *   numberOfGroups  = maxEntries / DEFAULT_ENTRIES_PER_GROUP
 *   groupMatches    = numberOfGroups × C(entriesPerGroup, 2)   ← round-robin
 *   qualifiers      = numberOfGroups × DEFAULT_QUALIFIERS_PER_GROUP
 *   knockoutMatches = bracketSize(qualifiers) - 1
 *   totalMatches    = groupMatches + knockoutMatches
 */
export function calculateMatchesForCategory(
  category: Pick<TournamentCategory, "maxEntries" | "isGroupStage">
): number {
  return calculateMatchBreakdownForCategory(category).totalMatches;
}

function calculateMatchBreakdownForCategory(
  category: Pick<TournamentCategory, "maxEntries" | "isGroupStage">
): MatchBreakdown {
  const { maxEntries, isGroupStage } = category;

  if (!isGroupStage) {
    const knockoutMatches = calculateBracketSize(maxEntries) - 1;
    return {
      groupMatches: 0,
      knockoutMatches,
      totalMatches: knockoutMatches,
      groupEntryCounts: [],
      knockoutEntryCounts: [maxEntries],
    };
  }

  const numberOfGroups = Math.floor(maxEntries / DEFAULT_ENTRIES_PER_GROUP);
  const entriesPerGroup = Math.floor(maxEntries / numberOfGroups);

  // C(n, 2) = n*(n-1)/2
  const matchesPerGroup = (entriesPerGroup * (entriesPerGroup - 1)) / 2;
  const groupMatches = numberOfGroups * matchesPerGroup;

  const qualifiers = numberOfGroups * DEFAULT_QUALIFIERS_PER_GROUP;
  const knockoutMatches = calculateBracketSize(qualifiers) - 1;

  return {
    groupMatches,
    knockoutMatches,
    totalMatches: groupMatches + knockoutMatches,
    groupEntryCounts: Array(numberOfGroups).fill(entriesPerGroup),
    knockoutEntryCounts: [qualifiers],
  };
}

/**
 * Tổng số trận của toàn bộ tournament = tổng từng category.
 */
export function calculateTotalMatchesFromCategories(
  categories: Array<Pick<TournamentCategory, "maxEntries" | "isGroupStage">>
): number {
  return calculateMatchBreakdownFromCategories(categories).totalMatches;
}

function calculateMatchBreakdownFromCategories(
  categories: Array<Pick<TournamentCategory, "maxEntries" | "isGroupStage">>
): MatchBreakdown {
  const initial: MatchBreakdown = {
    groupMatches: 0,
    knockoutMatches: 0,
    totalMatches: 0,
    groupEntryCounts: [],
    knockoutEntryCounts: [],
  };

  return categories.reduce(
    (sum, category) => {
      const breakdown = calculateMatchBreakdownForCategory(category);
      return {
        groupMatches: sum.groupMatches + breakdown.groupMatches,
        knockoutMatches: sum.knockoutMatches + breakdown.knockoutMatches,
        totalMatches: sum.totalMatches + breakdown.totalMatches,
        groupEntryCounts: [...sum.groupEntryCounts, ...breakdown.groupEntryCounts],
        knockoutEntryCounts: [...sum.knockoutEntryCounts, ...breakdown.knockoutEntryCounts],
      };
    },
    initial
  );
}

function createManualMatchBreakdown(totalMatches: number): MatchBreakdown {
  return {
    groupMatches: 0,
    knockoutMatches: totalMatches,
    totalMatches,
    groupEntryCounts: [],
    knockoutEntryCounts: [totalMatches + 1],
    plainMatchCount: totalMatches,
  };
}

// ─── Schedule Math Helpers ────────────────────────────────────────────────────

function dateOnlyTime(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function calendarDayCount(startDate: Date, endDate: Date): number {
  const dayMs = 24 * 60 * 60 * 1000;
  return Math.floor((dateOnlyTime(endDate) - dateOnlyTime(startDate)) / dayMs) + 1;
}

function minutesOfDay(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

function isSingleDay(startDate: Date, endDate: Date): boolean {
  return dateOnlyTime(startDate) === dateOnlyTime(endDate);
}

function withTimeFrom(date: Date, timeSource: Date): Date {
  const result = new Date(date);
  result.setHours(timeSource.getHours(), timeSource.getMinutes(), 0, 0);
  return result;
}

function calculateAvailableMinutes(
  startDate: Date,
  endDate: Date
): number {
  const dailyMinutes =
    minutesOfDay(endDate) - minutesOfDay(startDate);

  if (dailyMinutes <= 0) {
    throw new BadRequestError("End time must be after start time");
  }

  return dailyMinutes * Math.max(0, calendarDayCount(startDate, endDate));
}

function calculateBracketSize(entryCount: number): number {
  for (const size of POSSIBLE_BRACKET_SIZES) {
    if (size >= entryCount) return size;
  }
  throw new BadRequestError(`Too many entries: ${entryCount}. Maximum supported: 256`);
}

function calculateRoundRobinSlotCount(
  entryCount: number,
  numberOfTables: number
): number {
  if (entryCount < 2) return 0;

  const playerCount = entryCount % 2 === 0 ? entryCount : entryCount + 1;
  const rounds = playerCount - 1;
  const matchesPerRound = Math.floor(entryCount / 2);

  return rounds * Math.ceil(matchesPerRound / numberOfTables);
}

function calculateKnockoutSlotCount(
  entryCount: number,
  numberOfTables: number
): number {
  const bracketSize = calculateBracketSize(entryCount);
  let slots = 0;

  for (let matchesInRound = bracketSize / 2; matchesInRound >= 1; matchesInRound /= 2) {
    slots += Math.ceil(matchesInRound / numberOfTables);
  }

  return slots;
}

function nextDayStart(date: Date, startDate: Date): Date {
  return withTimeFrom(
    new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1),
    startDate
  );
}

function calculateEndTimeFromSlots(
  startDate: Date,
  endDate: Date,
  totalSlots: number,
  slotDuration: number
): Date {
  let remainingSlots = totalSlots;
  let current = new Date(startDate);
  const finalDay = dateOnlyTime(endDate);

  while (remainingSlots > 0) {
    const dayEnd = withTimeFrom(current, endDate);
    const availableMinutes = Math.max(
      0,
      Math.floor((dayEnd.getTime() - current.getTime()) / 60000)
    );
    const slotsToday = Math.floor(availableMinutes / slotDuration);

    if (remainingSlots <= slotsToday) {
      return new Date(current.getTime() + remainingSlots * slotDuration * 60000);
    }

    remainingSlots -= slotsToday;
    current = nextDayStart(current, startDate);

    if (slotsToday === 0 && dateOnlyTime(current) > finalDay) {
      return current;
    }
  }

  return current;
}

function calculateScheduleEstimate(
  startDate: Date,
  endDate: Date,
  breakdown: MatchBreakdown,
  matchDurationMinutes: number,
  breakDurationMinutes: number,
  numberOfTables: number
): ScheduleEstimate {
  const slotDuration = matchDurationMinutes + breakDurationMinutes;
  const tournamentStart = new Date(startDate);

  if (breakdown.plainMatchCount != null) {
    const totalSlots = Math.ceil(breakdown.plainMatchCount / numberOfTables);
    return {
      totalSlots,
      estimatedEndTime: calculateEndTimeFromSlots(
        tournamentStart,
        endDate,
        totalSlots,
        slotDuration
      ),
      neededMinutes: totalSlots * slotDuration,
    };
  }

  const groupSlots = breakdown.groupEntryCounts.reduce(
    (sum, entryCount) => sum + calculateRoundRobinSlotCount(entryCount, numberOfTables),
    0
  );
  const knockoutSlots = breakdown.knockoutEntryCounts.reduce(
    (sum, entryCount) => sum + calculateKnockoutSlotCount(entryCount, numberOfTables),
    0
  );

  const groupEndTime = calculateEndTimeFromSlots(
    tournamentStart,
    endDate,
    groupSlots,
    slotDuration
  );
  const knockoutStartDate = groupSlots === 0
    ? tournamentStart
    : isSingleDay(startDate, endDate)
      ? groupEndTime
      : nextDayStart(groupEndTime, startDate);
  const estimatedEndTime = calculateEndTimeFromSlots(
    knockoutStartDate,
    endDate,
    knockoutSlots,
    slotDuration
  );
  const totalSlots = groupSlots + knockoutSlots;

  return {
    totalSlots,
    estimatedEndTime,
    neededMinutes: totalSlots * slotDuration,
  };
}

function getEffectiveTournamentEndTime(
  startDate: Date,
  endDate: Date
): Date {
  return new Date(endDate);
}

// ─── Model Validator ─────────────────────────────────────────────────────────

/**
 * Chạy Sequelize @BeforeValidate hooks trên instance trước khi lưu.
 * Dùng chung cho create và update.
 */
async function runModelValidation(
  tournamentId: number,
  data: Partial<ScheduleConfig>,
  options: { isUpdate?: boolean } = {}
): Promise<void> {
  const instance = ScheduleConfig.build(
    { tournamentId, ...data },
    { isNewRecord: !options.isUpdate },
  );
  try {
    await instance.validate();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Schedule config is invalid";
    throw new BadRequestError(message);
  }
}

function assertValidCategoryInput(
  category: ScheduleValidationCategoryInput
): void {
  const { maxEntries, isGroupStage = false } = category;

  if (!Number.isInteger(maxEntries) || maxEntries <= 0) {
    throw new BadRequestError("category.maxEntries must be a positive integer");
  }
  if (
    category.isGroupStage !== undefined &&
    typeof category.isGroupStage !== "boolean"
  ) {
    throw new BadRequestError("category.isGroupStage must be a boolean");
  }

  if (maxEntries % 4 !== 0) {
    throw new BadRequestError("category.maxEntries must be a multiple of 4");
  }

  const minEntries = isGroupStage ? 16 : 32;
  if (maxEntries < minEntries) {
    throw new BadRequestError(
      `category.maxEntries must be at least ${minEntries} for ${isGroupStage ? "group stage" : "knockout"} categories`
    );
  }
}

function normalizeScheduleConfigDates(
  data: Partial<ScheduleConfig>
): Partial<ScheduleConfig> {
  const normalized = { ...data } as any;
  const dateFields = [
    "startDate",
    "endDate",
    "registrationStartDate",
    "registrationEndDate",
    "bracketGenerationDate",
    "startLunchBreak",
    "endLunchBreak",
  ];

  for (const field of dateFields) {
    const value = normalized[field];
    if (value == null) continue;

    normalized[field] = toUtcDate(value, field);
  }

  return normalized;
}

function removeUndefinedFields(
  data: Partial<ScheduleConfig>
): Partial<ScheduleConfig> {
  const cleaned: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    if (value !== undefined) {
      cleaned[key] = value;
    }
  }

  return cleaned as Partial<ScheduleConfig>;
}

function assertKnownUpdateFields(data: Record<string, unknown>): void {
  const allowed = new Set<string>([...CONFIG_UPDATE_FIELDS, ...UPDATE_CONTROL_FIELDS]);
  const unknown = Object.keys(data).filter((key) => !allowed.has(key));
  if (unknown.length > 0) {
    throw new BadRequestError(`Unknown schedule config update fields: ${unknown.join(", ")}`);
  }
}

function splitUpdatePayload(
  data: Record<string, unknown>,
): { configData: Partial<ScheduleConfig>; controls: UpdateControlFields } {
  assertKnownUpdateFields(data);

  const configData: Record<string, unknown> = {};
  const controls: UpdateControlFields = {};

  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) continue;

    if (key === "regenerateSchedule") {
      if (typeof value !== "boolean") {
        throw new BadRequestError("regenerateSchedule must be a boolean");
      }
      controls.regenerateSchedule = value;
      continue;
    }
    if (key === "regenerationKey") {
      if (value != null && typeof value !== "string") {
        throw new BadRequestError("regenerationKey must be a string");
      }
      if (value != null) controls.regenerationKey = value;
      continue;
    }

    configData[key] = value;
  }

  return {
    configData: configData as Partial<ScheduleConfig>,
    controls,
  };
}

function pickConfigFields(source: Partial<ScheduleConfig>): Partial<ScheduleConfig> {
  const picked: Record<string, unknown> = {};
  const raw = source as Record<string, unknown>;

  for (const field of CONFIG_UPDATE_FIELDS) {
    if (raw[field] !== undefined) {
      picked[field] = raw[field];
    }
  }

  return picked as Partial<ScheduleConfig>;
}

function buildMergedConfig(
  config: ScheduleConfig,
  updateData: Partial<ScheduleConfig>,
): Partial<ScheduleConfig> {
  return {
    startDate:              config.startDate,
    endDate:                config.endDate,
    numberOfTables:         config.numberOfTables,
    registrationStartDate:  config.registrationStartDate,
    registrationEndDate:    config.registrationEndDate,
    bracketGenerationDate:  config.bracketGenerationDate,
    matchDurationMinutes:   config.matchDurationMinutes,
    breakDurationMinutes:   config.breakDurationMinutes,
    startLunchBreak:        config.startLunchBreak,
    endLunchBreak:          config.endLunchBreak,
    notes:                  config.notes,
    ...updateData,
  } as Partial<ScheduleConfig>;
}

function normalizeComparableValue(value: unknown): unknown {
  if (value instanceof Date) return value.toISOString();
  return value ?? null;
}

function getChangedFields(
  config: ScheduleConfig,
  updateData: Partial<ScheduleConfig>,
): ConfigUpdateField[] {
  const changed: ConfigUpdateField[] = [];
  const current = config as unknown as Record<string, unknown>;
  const incoming = updateData as Record<string, unknown>;

  for (const field of CONFIG_UPDATE_FIELDS) {
    if (!(field in incoming)) continue;
    if (normalizeComparableValue(current[field]) !== normalizeComparableValue(incoming[field])) {
      changed.push(field);
    }
  }

  return changed;
}

function hasScheduleAffectingChange(changedFields: ConfigUpdateField[]): boolean {
  return changedFields.some((field) => SCHEDULE_AFFECTING_FIELDS.has(field));
}

function isNotesOnlyChange(changedFields: ConfigUpdateField[]): boolean {
  return changedFields.length > 0 && changedFields.every((field) => field === "notes");
}

function isOngoingTableIncrease(
  tournament: Tournament,
  config: ScheduleConfig,
  changedFields: ConfigUpdateField[],
  updateData: Partial<ScheduleConfig>,
): boolean {
  return (
    tournament.status === "ongoing" &&
    changedFields.length === 1 &&
    changedFields[0] === "numberOfTables" &&
    updateData.numberOfTables != null &&
    updateData.numberOfTables > config.numberOfTables
  );
}

function getDateValue(value: unknown): Date | null {
  return value instanceof Date ? value : null;
}

function assertUpdateDateNotMovedToPast(
  changedFields: ConfigUpdateField[],
  mergedConfig: Partial<ScheduleConfig>,
): void {
  const now = new Date();

  if (changedFields.includes("startDate")) {
    const startDate = getDateValue(mergedConfig.startDate);
    if (startDate && startDate < now) {
      throw new BadRequestError("Start date cannot be moved to the past");
    }
  }

  if (changedFields.includes("registrationStartDate")) {
    const registrationStartDate = getDateValue(mergedConfig.registrationStartDate);
    if (registrationStartDate && registrationStartDate < now) {
      throw new BadRequestError("Registration start date cannot be moved to the past");
    }
  }
}

function assertLifecycleUpdateAllowed(
  tournament: Tournament,
  config: ScheduleConfig,
  changedFields: ConfigUpdateField[],
  updateData: Partial<ScheduleConfig>,
  mergedConfig: Partial<ScheduleConfig>,
  context: ScheduleConfigUpdateContext,
): void {
  if (changedFields.length === 0 || isNotesOnlyChange(changedFields)) return;

  const now = new Date();
  const hasRegistrationChange = changedFields.some((field) => REGISTRATION_FIELDS.has(field));
  const hasScheduleChange = hasScheduleAffectingChange(changedFields);

  assertUpdateDateNotMovedToPast(changedFields, mergedConfig);

  if (tournament.status === "completed" || tournament.status === "cancelled") {
    throw new BadRequestError("Only notes can be updated after tournament is completed or cancelled");
  }

  if (tournament.status === "ongoing") {
    if (isOngoingTableIncrease(tournament, config, changedFields, updateData)) return;
    throw new BadRequestError("Only notes or increasing numberOfTables can be updated while tournament is ongoing");
  }

  if (context.entryCount > 0 && changedFields.includes("registrationStartDate")) {
    throw new BadRequestError("registrationStartDate cannot be updated after entries exist");
  }

  if (context.entryCount > 0 && changedFields.includes("registrationEndDate")) {
    const registrationEndDate = getDateValue(mergedConfig.registrationEndDate);
    if (registrationEndDate && registrationEndDate < now) {
      throw new BadRequestError("registrationEndDate cannot be moved to the past after entries exist");
    }
  }

  if (tournament.status === "registration_open") {
    if (changedFields.includes("registrationStartDate")) {
      throw new BadRequestError("registrationStartDate cannot be updated after registration opens");
    }
    if (changedFields.includes("registrationEndDate")) {
      const registrationEndDate = getDateValue(mergedConfig.registrationEndDate);
      if (registrationEndDate && registrationEndDate <= now) {
        throw new BadRequestError("registrationEndDate must be in the future while registration is open");
      }
    }
  }

  if (tournament.status === "registration_closed") {
    if (hasRegistrationChange) {
      throw new BadRequestError("Registration dates cannot be updated after registration closes");
    }
    if (changedFields.includes("bracketGenerationDate")) {
      if (context.bracketCount > 0 || context.scheduleCount > 0) {
        throw new BadRequestError("bracketGenerationDate cannot be updated after brackets or schedules exist");
      }
      const bracketGenerationDate = getDateValue(mergedConfig.bracketGenerationDate);
      if (bracketGenerationDate && bracketGenerationDate < now) {
        throw new BadRequestError("bracketGenerationDate cannot be moved to the past");
      }
    }
  }

  if (tournament.status === "brackets_generated") {
    if (hasRegistrationChange || changedFields.includes("bracketGenerationDate")) {
      throw new BadRequestError("Registration dates and bracketGenerationDate are locked after brackets are generated");
    }
  }

  if (context.scheduleCount > 0 && hasScheduleChange) {
    if (context.activeMatchCount > 0) {
      throw new BadRequestError("Cannot regenerate schedules after matches are in progress or completed");
    }
    if (tournament.status !== "brackets_generated") {
      throw new BadRequestError("Schedule regeneration is only allowed when tournament status is brackets_generated");
    }
  }
}

function requiresScheduleRegeneration(
  tournament: Tournament,
  config: ScheduleConfig,
  changedFields: ConfigUpdateField[],
  updateData: Partial<ScheduleConfig>,
  context: ScheduleConfigUpdateContext,
): boolean {
  if (context.scheduleCount === 0) return false;
  if (!hasScheduleAffectingChange(changedFields)) return false;
  if (isOngoingTableIncrease(tournament, config, changedFields, updateData)) return false;
  return true;
}

function serializeConfigForRegenerationKey(config: Partial<ScheduleConfig>): Record<string, unknown> {
  const output: Record<string, unknown> = {};
  const raw = config as Record<string, unknown>;

  for (const field of CONFIG_UPDATE_FIELDS) {
    const value = raw[field];
    if (value instanceof Date) {
      output[field] = value.toISOString();
    } else {
      output[field] = value ?? null;
    }
  }

  return output;
}

function buildRegenerationKey(
  tournamentId: number,
  configUpdatedAt: Date,
  mergedConfig: Partial<ScheduleConfig>,
  affectedScheduleCount: number,
): string {
  const payload = {
    tournamentId,
    configUpdatedAt: configUpdatedAt.toISOString(),
    mergedConfig: serializeConfigForRegenerationKey(mergedConfig),
    affectedScheduleCount,
  };

  return crypto
    .createHash("sha256")
    .update(JSON.stringify(payload))
    .digest("hex");
}

async function getScheduleConfigUpdateContext(
  tournament: Tournament,
): Promise<ScheduleConfigUpdateContext> {
  const categoryIds = (tournament.categories ?? []).map((category) => category.id);

  if (categoryIds.length === 0) {
    return {
      categoryIds,
      entryCount: 0,
      scheduleCount: 0,
      bracketCount: 0,
      activeMatchCount: 0,
    };
  }

  const [entryCount, scheduleCount, bracketCount, activeMatchCount] = await Promise.all([
    Entry.count({ where: { categoryId: { [Op.in]: categoryIds } } }),
    Schedule.count({ where: { categoryId: { [Op.in]: categoryIds } } }),
    KnockoutBracket.count({ where: { categoryId: { [Op.in]: categoryIds } } }),
    Match.count({
      where: { status: { [Op.in]: ["in_progress", "completed"] } },
      include: [
        {
          model: Schedule,
          as: "schedule",
          where: { categoryId: { [Op.in]: categoryIds } },
          required: true,
        },
      ],
    }),
  ]);

  return {
    categoryIds,
    entryCount,
    scheduleCount,
    bracketCount,
    activeMatchCount,
  };
}

// ─── Service ─────────────────────────────────────────────────────────────────

export class ScheduleConfigService {
  // ─── Preview (không lưu DB) ─────────────────────────────────────────────────

  /**
   * Preview khi TẠO MỚI schedule config.
   *
   * totalMatches:
   *  - Nếu truyền vào → dùng giá trị đó.
   *  - Nếu không → tự tính từ categories của tournament.
   *
   * KHÔNG lưu vào DB.
   */
  async previewCreate(
    tournamentId: number,
    data: Partial<ScheduleConfig>,
    totalMatches?: number,
    organizerId?: number
  ): Promise<SchedulePreviewResponse> {
    const tournament = await Tournament.findByPk(tournamentId, {
      include: [{ model: TournamentCategory, as: "categories" }],
    });
    if (!tournament) throw new NotFoundError("Tournament not found");
    if (organizerId != null) assertOrganizer(organizerId, tournament);

    const existing = await ScheduleConfig.findOne({ where: { tournamentId } });
    if (existing) {
      throw new BadRequestError(
        "Schedule config already exists for this tournament. Use update preview instead."
      );
    }

    const breakdown = totalMatches != null
      ? createManualMatchBreakdown(totalMatches)
      : this._resolveMatchBreakdown(tournament);
    return this._buildPreview(normalizeScheduleConfigDates(data), breakdown);
  }

  /**
   * Preview khi CẬP NHẬT schedule config.
   * Merge config hiện tại với data mới để preview đúng trạng thái sau update.
   * KHÔNG lưu vào DB.
   */
  async previewUpdate(
    tournamentId: number,
    data: Partial<ScheduleConfig>,
    totalMatches?: number,
    organizerId?: number
  ): Promise<SchedulePreviewResponse> {
    const tournament = await Tournament.findByPk(tournamentId, {
      include: [{ model: TournamentCategory, as: "categories" }],
    });
    if (!tournament) throw new NotFoundError("Tournament not found");
    if (organizerId != null) assertOrganizer(organizerId, tournament);

    const existing = await this.getConfig(tournamentId);
    if (!existing) throw new NotFoundError("Schedule config not found");
    const { configData } = splitUpdatePayload(data as Record<string, unknown>);
    const updateData = normalizeScheduleConfigDates(removeUndefinedFields(configData));
    const merged = buildMergedConfig(existing, updateData);
    const changedFields = getChangedFields(existing, updateData);
    const context = await getScheduleConfigUpdateContext(tournament);

    assertLifecycleUpdateAllowed(
      tournament,
      existing,
      changedFields,
      updateData,
      merged,
      context,
    );

    const breakdown = totalMatches != null
      ? createManualMatchBreakdown(totalMatches)
      : this._resolveMatchBreakdown(tournament);
    const preview = this._buildPreview(merged, breakdown);
    const needsRegeneration = requiresScheduleRegeneration(
      tournament,
      existing,
      changedFields,
      updateData,
      context,
    );

    if (!needsRegeneration) return preview;

    const metadata = {
      requiresRegeneration: true,
      affectedScheduleCount: context.scheduleCount,
    };

    if (!preview.isValid || context.activeMatchCount > 0) {
      return { ...preview, ...metadata };
    }

    return {
      ...preview,
      ...metadata,
      regenerationKey: buildRegenerationKey(
        tournamentId,
        new Date((existing as any).updatedAt),
        merged,
        context.scheduleCount,
      ),
    };
  }

  // ─── CRUD thật (gọi sau khi user xác nhận preview) ─────────────────────────

  /**
   * Tạo schedule config mới.
   * Re-validate model trước khi lưu.
   */
  async createConfig(
    tournamentId: number,
    data: Partial<ScheduleConfig>,
    organizerId?: number
  ): Promise<ScheduleConfig> {
    if (organizerId != null) {
      const tournament = await Tournament.findByPk(tournamentId);
      if (!tournament) throw new NotFoundError("Tournament not found");
      assertOrganizer(organizerId, tournament);
    }

    const existing = await ScheduleConfig.findOne({ where: { tournamentId } });
    if (existing) {
      throw new BadRequestError(
        "Schedule config already exists for this tournament. Use update instead."
      );
    }

    // Re-validate toàn bộ model trước khi persist
    const createData = normalizeScheduleConfigDates(data);

    await runModelValidation(tournamentId, createData);

    const config = await ScheduleConfig.create({ tournamentId, ...createData });
    await publishTournamentStatusScheduleRefresh();
    return config;
  }

  /**
   * Lấy config của tournament.
   */
  async getConfig(tournamentId: number): Promise<ScheduleConfig | null> {
    return await ScheduleConfig.findOne({ where: { tournamentId } });
  }

  /**
   * Cập nhật config.
   * Re-validate trạng thái SAU KHI merge (không chỉ validate phần được gửi lên).
   */
  async updateConfig(
    tournamentId: number,
    data: Partial<ScheduleConfig> & UpdateControlFields,
    organizerId?: number
  ): Promise<ScheduleConfig> {
    const tournament = await Tournament.findByPk(tournamentId, {
      include: [{ model: TournamentCategory, as: "categories" }],
    });

    if (organizerId != null) {
      if (!tournament) throw new NotFoundError("Tournament not found");
      assertOrganizer(organizerId, tournament);
    } else if (!tournament) {
      throw new NotFoundError("Tournament not found");
    }

    const config = await this.getConfig(tournamentId);
    if (!config) throw new NotFoundError("Schedule config not found");
    const { configData, controls } = splitUpdatePayload(data as Record<string, unknown>);
    const updateData = normalizeScheduleConfigDates(removeUndefinedFields(configData));

    if (Object.keys(updateData).length === 0) {
      return config;
    }

    const changedFields = getChangedFields(config, updateData);
    if (changedFields.length === 0) {
      return config;
    }

    const mergedForValidation = buildMergedConfig(config, updateData);
    const context = await getScheduleConfigUpdateContext(tournament);

    assertLifecycleUpdateAllowed(
      tournament,
      config,
      changedFields,
      updateData,
      mergedForValidation,
      context,
    );

    await runModelValidation(tournamentId, mergedForValidation, { isUpdate: true });

    const needsRegeneration = requiresScheduleRegeneration(
      tournament,
      config,
      changedFields,
      updateData,
      context,
    );

    if (needsRegeneration) {
      if (controls.regenerateSchedule !== true) {
        throw new BadRequestError("regenerateSchedule=true is required when updating schedule-affecting fields after schedules exist");
      }

      const breakdown = this._resolveMatchBreakdown(tournament);
      const preview = this._buildPreview(mergedForValidation, breakdown);
      if (!preview.isValid) {
        throw new BadRequestError("Updated schedule config does not fit in the tournament time window. Run preview-update and adjust the config first.");
      }

      const expectedKey = buildRegenerationKey(
        tournamentId,
        new Date((config as any).updatedAt),
        mergedForValidation,
        context.scheduleCount,
      );
      if (!controls.regenerationKey || controls.regenerationKey !== expectedKey) {
        throw new BadRequestError("Invalid or stale regenerationKey. Run preview-update again before updating schedule config.");
      }
    }

    const previousData = pickConfigFields(config);
    const updatedConfig = await config.update(updateData);

    if (!needsRegeneration) {
      await publishTournamentStatusScheduleRefresh();
      return updatedConfig;
    }

    try {
      await scheduleService.generateTournamentSchedule(organizerId ?? tournament.createdBy, tournamentId);
    } catch (error) {
      await updatedConfig.update(previousData);
      const message = error instanceof Error ? error.message : "Unknown schedule regeneration error";
      throw new BadRequestError(`Schedule config update rolled back because regeneration failed: ${message}`);
    }

    await publishTournamentStatusScheduleRefresh();
    return updatedConfig;
  }

  /**
   * Validate xem config đã lưu có fit với số trận không.
   * Tự động tính totalMatches từ categories nếu không truyền.
   */
  async validateScheduleConfig(
    tournamentId: number,
    totalMatches?: number,
    organizerId?: number
  ): Promise<ScheduleValidationResponse> {
    const tournament = await Tournament.findByPk(tournamentId, {
      include: [{ model: TournamentCategory, as: "categories" }],
    });
    if (!tournament) throw new NotFoundError("Tournament not found");
    if (organizerId != null) assertOrganizer(organizerId, tournament);

    const config = await this.getConfig(tournamentId);
    if (!config) throw new NotFoundError("Schedule config not found");

    const breakdown = totalMatches != null
      ? createManualMatchBreakdown(totalMatches)
      : this._resolveMatchBreakdown(tournament);

    const {
      matchDurationMinutes,
      breakDurationMinutes,
      numberOfTables,
      startDate,
      endDate,
    } = config;

    const availableMinutes = calculateAvailableMinutes(
      startDate, endDate
    );
    const estimate = calculateScheduleEstimate(
      startDate,
      endDate,
      breakdown,
      matchDurationMinutes,
      breakDurationMinutes,
      numberOfTables
    );
    const { totalSlots, estimatedEndTime } = estimate;
    const tournamentEndTime = getEffectiveTournamentEndTime(
      startDate,
      endDate
    );

    const overflowMinutes = Math.max(
      0,
      Math.ceil((estimatedEndTime.getTime() - tournamentEndTime.getTime()) / 60000)
    );
    const isValid = overflowMinutes === 0;
    const details = {
      totalMatches: breakdown.totalMatches,
      totalSlots,
      estimatedEndTime,
      tournamentEndTime,
      ...(!isValid && { overflowMinutes }),
    };

    if (isValid) {
      return {
        isValid: true,
        message: `Schedule is valid. It is expected to finish at ${estimatedEndTime.toISOString()}, ${Math.floor((tournamentEndTime.getTime() - estimatedEndTime.getTime()) / 60000)} minutes before the deadline.`,
        details,
      };
    }

    return {
      isValid: false,
      message: `Schedule exceeds the allowed time. It is expected to finish at ${estimatedEndTime.toISOString()}, but the tournament ends at ${tournamentEndTime.toISOString()} (exceeds by ${overflowMinutes} minutes).`,
      details,
    };
  }

  /**
   * Validate raw category + unsaved schedule config from client input.
   * Does not require tournamentId and does not read persisted schedule config.
   */
  async validateScheduleConfigInput(
    category: ScheduleValidationCategoryInput,
    scheduleConfig: Partial<ScheduleConfig>
  ): Promise<ScheduleValidationResponse> {
    assertValidCategoryInput(category);
    const normalizedConfig = normalizeScheduleConfigDates(scheduleConfig);
    await runModelValidation(1, normalizedConfig);

    const breakdown = calculateMatchBreakdownForCategory({
      maxEntries: category.maxEntries,
      isGroupStage: category.isGroupStage ?? false,
    });

    return this._buildValidation(normalizedConfig, breakdown);
  }

  /**
   * Xóa schedule config.
   */
  async deleteConfig(tournamentId: number, organizerId?: number): Promise<number> {
    if (organizerId != null) {
      const tournament = await Tournament.findByPk(tournamentId);
      if (!tournament) throw new NotFoundError("Tournament not found");
      assertOrganizer(organizerId, tournament);
    }

    const deleted = await ScheduleConfig.destroy({ where: { tournamentId } });
    if (deleted > 0) {
      await publishTournamentStatusScheduleRefresh();
    }
    return deleted;
  }

  /**
   * Trả về các giá trị default để client hiển thị form tạo config.
   */
  async getDefaultConfig() {
    return {
      matchDurationMinutes: 30,
      breakDurationMinutes: 10,
      numberOfTables: 1,
    };
  }

  // ─── Private helpers ────────────────────────────────────────────────────────

  /**
   * Tính totalMatches từ categories của tournament.
   * Ném BadRequestError nếu tournament chưa có category.
   */
  private _resolveMatchBreakdown(tournament: Tournament): MatchBreakdown {
    const categories = tournament.categories ?? [];

    if (categories.length === 0) {
      throw new BadRequestError(
        "Tournament has no categories. Cannot calculate totalMatches automatically. " +
        "Please provide totalMatches manually or add categories to the tournament first."
      );
    }

    return calculateMatchBreakdownFromCategories(categories);
  }

  private _buildValidation(
    data: Partial<ScheduleConfig>,
    breakdown: MatchBreakdown
  ): ScheduleValidationResponse {
    const {
      matchDurationMinutes = 30,
      breakDurationMinutes = 10,
      numberOfTables = 1,
      startDate,
      endDate,
    } = data;

    if (!startDate || !endDate) {
      throw new BadRequestError("startDate and endDate are required");
    }

    const availableMinutes = calculateAvailableMinutes(
      startDate, endDate
    );
    const estimate = calculateScheduleEstimate(
      startDate,
      endDate,
      breakdown,
      matchDurationMinutes,
      breakDurationMinutes,
      numberOfTables
    );
    const { totalSlots, estimatedEndTime } = estimate;
    const tournamentEndTime = getEffectiveTournamentEndTime(
      startDate,
      endDate
    );

    const overflowMinutes = Math.max(
      0,
      Math.ceil((estimatedEndTime.getTime() - tournamentEndTime.getTime()) / 60000)
    );
    const isValid = overflowMinutes === 0;
    const details = {
      totalMatches: breakdown.totalMatches,
      totalSlots,
      estimatedEndTime,
      tournamentEndTime,
      ...(!isValid && { overflowMinutes }),
    };

    if (isValid) {
      return {
        isValid: true,
        message: `Schedule is valid. It is expected to finish at ${estimatedEndTime.toISOString()}, ${Math.floor((tournamentEndTime.getTime() - estimatedEndTime.getTime()) / 60000)} minutes before the deadline.`,
        details,
      };
    }

    return {
      isValid: false,
      message: `Schedule exceeds the allowed time. It is expected to finish at ${estimatedEndTime.toISOString()}, but the tournament ends at ${tournamentEndTime.toISOString()} (exceeds by ${overflowMinutes} minutes).`,
      details,
    };
  }

  /**
   * Build preview response từ raw data (chưa lưu).
   * Dùng chung cho previewCreate và previewUpdate.
   */
  private _buildPreview(
    data: Partial<ScheduleConfig>,
    breakdown: MatchBreakdown
  ): SchedulePreviewResponse {
    const {
      startDate,
      endDate,
      numberOfTables = 1,
      registrationStartDate,
      registrationEndDate,
      bracketGenerationDate,
      matchDurationMinutes = 30,
      breakDurationMinutes = 10,
    } = data;

    if (!startDate || !endDate) {
      throw new BadRequestError("startDate and endDate are required");
    }
    if (!registrationStartDate || !registrationEndDate || !bracketGenerationDate) {
      throw new BadRequestError(
        "registrationStartDate, registrationEndDate, and bracketGenerationDate are required"
      );
    }

    // Validate duration constraints
    if (matchDurationMinutes < 30 || matchDurationMinutes > 90) {
      throw new BadRequestError("matchDurationMinutes must be between 30 and 90");
    }
    if (breakDurationMinutes < 5 || breakDurationMinutes > 30) {
      throw new BadRequestError("breakDurationMinutes must be between 5 and 30");
    }

    const availableMinutes = calculateAvailableMinutes(
      startDate, endDate
    );
    const estimate = calculateScheduleEstimate(
      startDate,
      endDate,
      breakdown,
      matchDurationMinutes,
      breakDurationMinutes,
      numberOfTables
    );
    const { totalSlots, neededMinutes, estimatedEndTime } = estimate;
    const tournamentEndTime = getEffectiveTournamentEndTime(
      startDate,
      endDate
    );

    const overflowMinutes = Math.max(
      0,
      Math.ceil((estimatedEndTime.getTime() - tournamentEndTime.getTime()) / 60000)
    );
    const isValid = overflowMinutes === 0;

    const preview = {
      totalMatches: breakdown.totalMatches,
      totalSlots,
      estimatedEndTime,
      tournamentEndTime,
      availableMinutes,
      neededMinutes,
      startDate,
      endDate,
      registrationStartDate,
      registrationEndDate,
      bracketGenerationDate,
      numberOfTables,
      matchDurationMinutes,
      breakDurationMinutes,
      ...(!isValid && { overflowMinutes }),
    };

    if (isValid) {
      return {
        isValid: true,
        message:
          `Config is valid. With ${breakdown.totalMatches} matches, it is expected to finish at ` +
          `${estimatedEndTime.toISOString()}, leaving ` +
          `${Math.floor((tournamentEndTime.getTime() - estimatedEndTime.getTime()) / 60000)} minutes of buffer within the allowed time.`,
        preview,
      };
    }

    return {
      isValid: false,
      message:
        `Config is invalid. It needs ${neededMinutes} minutes but only ${availableMinutes} minutes are available ` +
        `(missing ${overflowMinutes} minutes). ` +
        `Please adjust the number of tables, match duration, or tournament dates.`,
      preview,
    };
  }
}

export default new ScheduleConfigService();
