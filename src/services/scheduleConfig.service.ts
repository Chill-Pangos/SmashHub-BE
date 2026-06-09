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

// ─── Constants ────────────────────────────────────────────────────────────────

const SINGLE_DAY_THRESHOLD_HOURS = 20;

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
  const { maxEntries, isGroupStage } = category;

  if (!isGroupStage) {
    return maxEntries - 1;
  }

  const numberOfGroups = Math.floor(maxEntries / DEFAULT_ENTRIES_PER_GROUP);
  const entriesPerGroup = Math.floor(maxEntries / numberOfGroups);

  // C(n, 2) = n*(n-1)/2
  const matchesPerGroup = (entriesPerGroup * (entriesPerGroup - 1)) / 2;
  const groupMatches = numberOfGroups * matchesPerGroup;

  const qualifiers = numberOfGroups * DEFAULT_QUALIFIERS_PER_GROUP;
  const knockoutMatches = qualifiers - 1;

  return groupMatches + knockoutMatches;
}

/**
 * Tổng số trận của toàn bộ tournament = tổng từng category.
 */
export function calculateTotalMatchesFromCategories(
  categories: Array<Pick<TournamentCategory, "maxEntries" | "isGroupStage">>
): number {
  return categories.reduce(
    (sum, cat) => sum + calculateMatchesForCategory(cat),
    0
  );
}

// ─── Schedule Math Helpers ────────────────────────────────────────────────────

function isSingleDay(startDate: Date, endDate: Date): boolean {
  return (
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60) <
    SINGLE_DAY_THRESHOLD_HOURS
  );
}

function calculateAvailableMinutes(
  startDate: Date,
  endDate: Date,
  dailyStartHour: number,
  dailyStartMinute: number,
  dailyEndHour: number,
  dailyEndMinute: number
): number {
  if (isSingleDay(startDate, endDate)) {
    return (endDate.getTime() - startDate.getTime()) / 60000;
  }

  const diffDays = Math.ceil(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const dailyMinutes =
    dailyEndHour * 60 + dailyEndMinute - (dailyStartHour * 60 + dailyStartMinute);
  return dailyMinutes * diffDays;
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

function calculateEstimatedEndTime(
  startDate: Date,
  totalMatches: number,
  matchDurationMinutes: number,
  breakDurationMinutes: number,
  numberOfTables: number
): Date {
  return new Date(
    startDate.getTime() +
      calculateNeededMinutes(
        totalMatches,
        matchDurationMinutes,
        breakDurationMinutes,
        numberOfTables
      ) *
        60000
  );
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

    const resolvedMatches = totalMatches ?? this._resolveMatchCount(tournament);
    return this._buildPreview(data, resolvedMatches);
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

    const resolvedMatches = totalMatches ?? this._resolveMatchCount(tournament);
    return this._buildPreview(merged, resolvedMatches);
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

    const resolvedMatches = totalMatches ?? this._resolveMatchCount(tournament);

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
    const totalSlots = Math.ceil(resolvedMatches / numberOfTables);
    const neededMinutes = calculateNeededMinutes(
      resolvedMatches, matchDurationMinutes, breakDurationMinutes, numberOfTables
    );
    const estimatedEndTime = calculateEstimatedEndTime(
      startDate, resolvedMatches, matchDurationMinutes, breakDurationMinutes, numberOfTables
    );

    const isValid = neededMinutes <= availableMinutes;
    const details = {
      totalMatches: resolvedMatches,
      totalSlots,
      estimatedEndTime,
      tournamentEndTime: endDate,
      ...(!isValid && { overflowMinutes: neededMinutes - availableMinutes }),
    };

    if (isValid) {
      return {
        isValid: true,
        message: `Schedule is valid. It is expected to finish at ${estimatedEndTime.toISOString()}, ${Math.floor((endDate.getTime() - estimatedEndTime.getTime()) / 60000)} minutes before the deadline.`,
        details,
      };
    }

    return {
      isValid: false,
      message: `Schedule exceeds the allowed time. It is expected to finish at ${estimatedEndTime.toISOString()}, but the tournament ends at ${endDate.toISOString()} (exceeds by ${neededMinutes - availableMinutes} minutes).`,
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

    const totalMatches = calculateMatchesForCategory({
      maxEntries: category.maxEntries,
      isGroupStage: category.isGroupStage ?? false,
    });

    return this._buildValidation(normalizedConfig, totalMatches);
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
  private _resolveMatchCount(tournament: Tournament): number {
    const categories = tournament.categories ?? [];

    if (categories.length === 0) {
      throw new BadRequestError(
        "Tournament has no categories. Cannot calculate totalMatches automatically. " +
        "Please provide totalMatches manually or add categories to the tournament first."
      );
    }

    return calculateTotalMatchesFromCategories(categories);
  }

  private _buildValidation(
    data: Partial<ScheduleConfig>,
    totalMatches: number
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
    const totalSlots = Math.ceil(totalMatches / numberOfTables);
    const neededMinutes = calculateNeededMinutes(
      totalMatches, matchDurationMinutes, breakDurationMinutes, numberOfTables
    );
    const estimatedEndTime = calculateEstimatedEndTime(
      startDate, totalMatches, matchDurationMinutes, breakDurationMinutes, numberOfTables
    );

    const isValid = neededMinutes <= availableMinutes;
    const details = {
      totalMatches,
      totalSlots,
      estimatedEndTime,
      tournamentEndTime: endDate,
      ...(!isValid && { overflowMinutes: neededMinutes - availableMinutes }),
    };

    if (isValid) {
      return {
        isValid: true,
        message: `Schedule is valid. It is expected to finish at ${estimatedEndTime.toISOString()}, ${Math.floor((endDate.getTime() - estimatedEndTime.getTime()) / 60000)} minutes before the deadline.`,
        details,
      };
    }

    return {
      isValid: false,
      message: `Schedule exceeds the allowed time. It is expected to finish at ${estimatedEndTime.toISOString()}, but the tournament ends at ${endDate.toISOString()} (exceeds by ${neededMinutes - availableMinutes} minutes).`,
      details,
    };
  }

  /**
   * Build preview response từ raw data (chưa lưu).
   * Dùng chung cho previewCreate và previewUpdate.
   */
  private _buildPreview(
    data: Partial<ScheduleConfig>,
    totalMatches: number
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
    const totalSlots = Math.ceil(totalMatches / numberOfTables);
    const neededMinutes = calculateNeededMinutes(
      totalMatches, matchDurationMinutes, breakDurationMinutes, numberOfTables
    );
    const estimatedEndTime = calculateEstimatedEndTime(
      startDate, totalMatches, matchDurationMinutes, breakDurationMinutes, numberOfTables
    );

    const isValid = neededMinutes <= availableMinutes;

    const preview = {
      totalMatches,
      totalSlots,
      estimatedEndTime,
      tournamentEndTime: endDate,
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
      ...(!isValid && { overflowMinutes: neededMinutes - availableMinutes }),
    };

    if (isValid) {
      return {
        isValid: true,
        message:
          `Config is valid. With ${totalMatches} matches, it is expected to finish at ` +
          `${estimatedEndTime.toISOString()}, leaving ` +
          `${Math.floor(availableMinutes - neededMinutes)} minutes of buffer within the allowed time.`,
        preview,
      };
    }

    return {
      isValid: false,
      message:
        `Config is invalid. It needs ${neededMinutes} minutes but only ${availableMinutes} minutes are available ` +
        `(missing ${neededMinutes - availableMinutes} minutes). ` +
        `Please adjust the number of tables, match duration, or tournament dates.`,
      preview,
    };
  }
}

export default new ScheduleConfigService();
