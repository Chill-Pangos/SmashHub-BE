// schedule-config.service.ts
import ScheduleConfig from "../models/scheduleConfig.model";
import Tournament from "../models/tournament.model";
import TournamentCategory from "../models/tournamentCategory.model";
import { BadRequestError, NotFoundError } from "../utils/errors.helper";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SchedulePreviewResponse {
  isValid: boolean;
  message: string;
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
 *   totalMatches = maxEntries - 1
 *
 * Group stage + knockout:
 *   numberOfGroups  = maxEntries / DEFAULT_ENTRIES_PER_GROUP
 *   groupMatches    = numberOfGroups × C(entriesPerGroup, 2)   ← round-robin
 *   qualifiers      = numberOfGroups × DEFAULT_QUALIFIERS_PER_GROUP
 *   knockoutMatches = qualifiers - 1
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
    return {
      groupMatches: 0,
      knockoutMatches: maxEntries - 1,
      totalMatches: maxEntries - 1,
    };
  }

  const numberOfGroups = Math.floor(maxEntries / DEFAULT_ENTRIES_PER_GROUP);
  const entriesPerGroup = Math.floor(maxEntries / numberOfGroups);

  // C(n, 2) = n*(n-1)/2
  const matchesPerGroup = (entriesPerGroup * (entriesPerGroup - 1)) / 2;
  const groupMatches = numberOfGroups * matchesPerGroup;

  const qualifiers = numberOfGroups * DEFAULT_QUALIFIERS_PER_GROUP;
  const knockoutMatches = qualifiers - 1;

  return {
    groupMatches,
    knockoutMatches,
    totalMatches: groupMatches + knockoutMatches,
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
  return categories.reduce(
    (sum, category) => {
      const breakdown = calculateMatchBreakdownForCategory(category);
      return {
        groupMatches: sum.groupMatches + breakdown.groupMatches,
        knockoutMatches: sum.knockoutMatches + breakdown.knockoutMatches,
        totalMatches: sum.totalMatches + breakdown.totalMatches,
      };
    },
    { groupMatches: 0, knockoutMatches: 0, totalMatches: 0 }
  );
}

// ─── Schedule Math Helpers ────────────────────────────────────────────────────

function dateOnlyTime(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function calendarDayCount(startDate: Date, endDate: Date): number {
  const dayMs = 24 * 60 * 60 * 1000;
  return Math.floor((dateOnlyTime(endDate) - dateOnlyTime(startDate)) / dayMs) + 1;
}

function isSingleDay(startDate: Date, endDate: Date): boolean {
  return dateOnlyTime(startDate) === dateOnlyTime(endDate);
}

function withTime(date: Date, hour: number, minute: number): Date {
  const result = new Date(date);
  result.setHours(hour, minute, 0, 0);
  return result;
}

function calculateAvailableMinutes(
  startDate: Date,
  endDate: Date,
  dailyStartHour: number,
  dailyStartMinute: number,
  dailyEndHour: number,
  dailyEndMinute: number
): number {
  const dailyMinutes =
    dailyEndHour * 60 + dailyEndMinute - (dailyStartHour * 60 + dailyStartMinute);

  return dailyMinutes * Math.max(0, calendarDayCount(startDate, endDate));
}

function calculateNeededMinutes(
  totalMatches: number,
  matchDurationMinutes: number,
  breakDurationMinutes: number,
  numberOfTables: number
): number {
  return (
    Math.ceil(totalMatches / numberOfTables) *
    (matchDurationMinutes + breakDurationMinutes)
  );
}

function nextDayStart(date: Date, dailyStartHour: number, dailyStartMinute: number): Date {
  return withTime(
    new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1),
    dailyStartHour,
    dailyStartMinute
  );
}

function calculateEstimatedEndTime(
  startDate: Date,
  totalMatches: number,
  matchDurationMinutes: number,
  breakDurationMinutes: number,
  numberOfTables: number,
  dailyStartHour: number,
  dailyStartMinute: number,
  endDate: Date,
  dailyEndHour: number,
  dailyEndMinute: number
): Date {
  const slotDuration = matchDurationMinutes + breakDurationMinutes;
  let remainingSlots = Math.ceil(totalMatches / numberOfTables);
  let current = withTime(startDate, dailyStartHour, dailyStartMinute);
  const finalDay = dateOnlyTime(endDate);

  while (remainingSlots > 0) {
    const dayEnd = withTime(current, dailyEndHour, dailyEndMinute);
    const availableMinutes = Math.max(
      0,
      Math.floor((dayEnd.getTime() - current.getTime()) / 60000)
    );
    const slotsToday = Math.floor(availableMinutes / slotDuration);

    if (remainingSlots <= slotsToday) {
      return new Date(current.getTime() + remainingSlots * slotDuration * 60000);
    }

    remainingSlots -= slotsToday;
    current = withTime(
      new Date(current.getFullYear(), current.getMonth(), current.getDate() + 1),
      dailyStartHour,
      dailyStartMinute
    );

    if (slotsToday === 0 && dateOnlyTime(current) > finalDay) {
      return current;
    }
  }

  return current;
}

function calculatePhasedEstimatedEndTime(
  startDate: Date,
  endDate: Date,
  breakdown: MatchBreakdown,
  matchDurationMinutes: number,
  breakDurationMinutes: number,
  numberOfTables: number,
  dailyStartHour: number,
  dailyStartMinute: number,
  dailyEndHour: number,
  dailyEndMinute: number
): Date {
  if (breakdown.groupMatches === 0) {
    return calculateEstimatedEndTime(
      startDate,
      breakdown.knockoutMatches,
      matchDurationMinutes,
      breakDurationMinutes,
      numberOfTables,
      dailyStartHour,
      dailyStartMinute,
      endDate,
      dailyEndHour,
      dailyEndMinute
    );
  }

  const groupEndTime = calculateEstimatedEndTime(
    startDate,
    breakdown.groupMatches,
    matchDurationMinutes,
    breakDurationMinutes,
    numberOfTables,
    dailyStartHour,
    dailyStartMinute,
    endDate,
    dailyEndHour,
    dailyEndMinute
  );

  const knockoutStartDate = isSingleDay(startDate, endDate)
    ? groupEndTime
    : nextDayStart(groupEndTime, dailyStartHour, dailyStartMinute);

  return calculateEstimatedEndTime(
    knockoutStartDate,
    breakdown.knockoutMatches,
    matchDurationMinutes,
    breakDurationMinutes,
    numberOfTables,
    dailyStartHour,
    dailyStartMinute,
    endDate,
    dailyEndHour,
    dailyEndMinute
  );
}

function calculatePhaseNeededMinutes(
  breakdown: MatchBreakdown,
  matchDurationMinutes: number,
  breakDurationMinutes: number,
  numberOfTables: number
): number {
  const slotDuration = matchDurationMinutes + breakDurationMinutes;
  const groupSlots = Math.ceil(breakdown.groupMatches / numberOfTables);
  const knockoutSlots = Math.ceil(breakdown.knockoutMatches / numberOfTables);
  return (groupSlots + knockoutSlots) * slotDuration;
}

function getEffectiveTournamentEndTime(
  startDate: Date,
  endDate: Date,
  dailyEndHour: number,
  dailyEndMinute: number
): Date {
  return withTime(endDate, dailyEndHour, dailyEndMinute);
}

// ─── Model Validator ─────────────────────────────────────────────────────────

/**
 * Chạy Sequelize @BeforeValidate hooks trên instance trước khi lưu.
 * Dùng chung cho create và update.
 */
async function runModelValidation(
  tournamentId: number,
  data: Partial<ScheduleConfig>
): Promise<void> {
  const instance = ScheduleConfig.build({ tournamentId, ...data });
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
  ];

  for (const field of dateFields) {
    const value = normalized[field];
    if (value == null || value instanceof Date) continue;

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestError(`${field} must be a valid date`);
    }
    normalized[field] = date;
  }

  return normalized;
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
      ? { groupMatches: 0, knockoutMatches: totalMatches, totalMatches }
      : this._resolveMatchBreakdown(tournament);
    return this._buildPreview(data, breakdown);
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

    const merged = {
      startDate:              existing.startDate,
      endDate:                existing.endDate,
      numberOfTables:         existing.numberOfTables,
      registrationStartDate:  existing.registrationStartDate,
      registrationEndDate:    existing.registrationEndDate,
      bracketGenerationDate:  existing.bracketGenerationDate,
      matchDurationMinutes:   existing.matchDurationMinutes,
      breakDurationMinutes:   existing.breakDurationMinutes,
      dailyStartHour:         existing.dailyStartHour,
      dailyStartMinute:       existing.dailyStartMinute,
      dailyEndHour:           existing.dailyEndHour,
      dailyEndMinute:         existing.dailyEndMinute,
      lunchBreakStartHour:    existing.lunchBreakStartHour,
      lunchBreakStartMinute:  existing.lunchBreakStartMinute,
      lunchBreakEndHour:      existing.lunchBreakEndHour,
      lunchBreakEndMinute:    existing.lunchBreakEndMinute,
      ...data,
    } as Partial<ScheduleConfig>;

    const breakdown = totalMatches != null
      ? { groupMatches: 0, knockoutMatches: totalMatches, totalMatches }
      : this._resolveMatchBreakdown(tournament);
    return this._buildPreview(merged, breakdown);
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
    await runModelValidation(tournamentId, data);

    return await ScheduleConfig.create({ tournamentId, ...data });
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
    data: Partial<ScheduleConfig>,
    organizerId?: number
  ): Promise<ScheduleConfig> {
    if (organizerId != null) {
      const tournament = await Tournament.findByPk(tournamentId);
      if (!tournament) throw new NotFoundError("Tournament not found");
      assertOrganizer(organizerId, tournament);
    }

    const config = await this.getConfig(tournamentId);
    if (!config) throw new NotFoundError("Schedule config not found");

    // Merge existing → incoming để validate toàn trạng thái cuối
    const mergedForValidation = {
      startDate:              config.startDate,
      endDate:                config.endDate,
      numberOfTables:         config.numberOfTables,
      registrationStartDate:  config.registrationStartDate,
      registrationEndDate:    config.registrationEndDate,
      bracketGenerationDate:  config.bracketGenerationDate,
      matchDurationMinutes:   config.matchDurationMinutes,
      breakDurationMinutes:   config.breakDurationMinutes,
      dailyStartHour:         config.dailyStartHour,
      dailyStartMinute:       config.dailyStartMinute,
      dailyEndHour:           config.dailyEndHour,
      dailyEndMinute:         config.dailyEndMinute,
      lunchBreakStartHour:    config.lunchBreakStartHour,
      lunchBreakStartMinute:  config.lunchBreakStartMinute,
      lunchBreakEndHour:      config.lunchBreakEndHour,
      lunchBreakEndMinute:    config.lunchBreakEndMinute,
      ...data,
    } as Partial<ScheduleConfig>;

    await runModelValidation(tournamentId, mergedForValidation);

    return await config.update(data);
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
      ? { groupMatches: 0, knockoutMatches: totalMatches, totalMatches }
      : this._resolveMatchBreakdown(tournament);

    const {
      matchDurationMinutes,
      breakDurationMinutes,
      dailyStartHour,
      dailyStartMinute,
      dailyEndHour,
      dailyEndMinute,
      numberOfTables,
      startDate,
      endDate,
    } = config;

    const availableMinutes = calculateAvailableMinutes(
      startDate, endDate,
      dailyStartHour, dailyStartMinute,
      dailyEndHour, dailyEndMinute
    );
    const totalSlots = Math.ceil(breakdown.totalMatches / numberOfTables);
    const neededMinutes = calculatePhaseNeededMinutes(
      breakdown, matchDurationMinutes, breakDurationMinutes, numberOfTables
    );
    const estimatedEndTime = calculatePhasedEstimatedEndTime(
      startDate,
      endDate,
      breakdown,
      matchDurationMinutes,
      breakDurationMinutes,
      numberOfTables,
      dailyStartHour,
      dailyStartMinute,
      dailyEndHour,
      dailyEndMinute
    );
    const tournamentEndTime = getEffectiveTournamentEndTime(
      startDate,
      endDate,
      dailyEndHour,
      dailyEndMinute
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

    return await ScheduleConfig.destroy({ where: { tournamentId } });
  }

  /**
   * Trả về các giá trị default để client hiển thị form tạo config.
   */
  async getDefaultConfig() {
    return {
      matchDurationMinutes: 60,
      breakDurationMinutes: 10,
      dailyStartHour: 8,
      dailyStartMinute: 0,
      dailyEndHour: 22,
      dailyEndMinute: 0,
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
      matchDurationMinutes = 60,
      breakDurationMinutes = 10,
      dailyStartHour = 8,
      dailyStartMinute = 0,
      dailyEndHour = 22,
      dailyEndMinute = 0,
      numberOfTables = 1,
      startDate,
      endDate,
    } = data;

    if (!startDate || !endDate) {
      throw new BadRequestError("startDate and endDate are required");
    }

    const availableMinutes = calculateAvailableMinutes(
      startDate, endDate,
      dailyStartHour, dailyStartMinute,
      dailyEndHour, dailyEndMinute
    );
    const totalSlots = Math.ceil(breakdown.totalMatches / numberOfTables);
    const neededMinutes = calculatePhaseNeededMinutes(
      breakdown, matchDurationMinutes, breakDurationMinutes, numberOfTables
    );
    const estimatedEndTime = calculatePhasedEstimatedEndTime(
      startDate,
      endDate,
      breakdown,
      matchDurationMinutes,
      breakDurationMinutes,
      numberOfTables,
      dailyStartHour,
      dailyStartMinute,
      dailyEndHour,
      dailyEndMinute
    );
    const tournamentEndTime = getEffectiveTournamentEndTime(
      startDate,
      endDate,
      dailyEndHour,
      dailyEndMinute
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
      matchDurationMinutes = 60,
      breakDurationMinutes = 10,
      dailyStartHour = 8,
      dailyStartMinute = 0,
      dailyEndHour = 22,
      dailyEndMinute = 0,
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
      startDate, endDate,
      dailyStartHour, dailyStartMinute,
      dailyEndHour, dailyEndMinute
    );
    const totalSlots = Math.ceil(breakdown.totalMatches / numberOfTables);
    const neededMinutes = calculatePhaseNeededMinutes(
      breakdown, matchDurationMinutes, breakDurationMinutes, numberOfTables
    );
    const estimatedEndTime = calculatePhasedEstimatedEndTime(
      startDate,
      endDate,
      breakdown,
      matchDurationMinutes,
      breakDurationMinutes,
      numberOfTables,
      dailyStartHour,
      dailyStartMinute,
      dailyEndHour,
      dailyEndMinute
    );
    const tournamentEndTime = getEffectiveTournamentEndTime(
      startDate,
      endDate,
      dailyEndHour,
      dailyEndMinute
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
