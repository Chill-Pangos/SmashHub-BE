// schedule-config.service.ts
import ScheduleConfig from "../models/scheduleConfig.model";
import Tournament from "../models/tournament.model";
import { BadRequestError, NotFoundError } from "../utils/errors";

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
    // Thông tin ngày tháng để user xác nhận
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

// ─── Constants ────────────────────────────────────────────────────────────────

const SINGLE_DAY_THRESHOLD_HOURS = 20;

// ─── Helper Functions ─────────────────────────────────────────────────────────

/**
 * Dùng được cho cả ScheduleConfig instance lẫn plain data object
 * nên nhận startDate/endDate trực tiếp.
 */
function isSingleDay(startDate: Date, endDate: Date): boolean {
  const diffHours =
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
  return diffHours < SINGLE_DAY_THRESHOLD_HOURS;
}

function calculateAvailableMinutesMultiDay(
  startDate: Date,
  endDate: Date,
  dailyStartHour: number,
  dailyStartMinute: number,
  dailyEndHour: number,
  dailyEndMinute: number
): number {
  const diffDays = Math.ceil(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const dailyStartTotal = dailyStartHour * 60 + dailyStartMinute;
  const dailyEndTotal = dailyEndHour * 60 + dailyEndMinute;
  return (dailyEndTotal - dailyStartTotal) * diffDays;
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
  return calculateAvailableMinutesMultiDay(
    startDate,
    endDate,
    dailyStartHour,
    dailyStartMinute,
    dailyEndHour,
    dailyEndMinute
  );
}

function calculateNeededMinutes(
  totalMatches: number,
  matchDurationMinutes: number,
  breakDurationMinutes: number,
  numberOfTables: number
): number {
  const totalSlots = Math.ceil(totalMatches / numberOfTables);
  return totalSlots * (matchDurationMinutes + breakDurationMinutes);
}

function calculateEstimatedEndTime(
  startDate: Date,
  totalMatches: number,
  matchDurationMinutes: number,
  breakDurationMinutes: number,
  numberOfTables: number
): Date {
  const totalSlots = Math.ceil(totalMatches / numberOfTables);
  const totalMinutes = totalSlots * (matchDurationMinutes + breakDurationMinutes);
  return new Date(startDate.getTime() + totalMinutes * 60000);
}

// ─── Service ──────────────────────────────────────────────────────────────────

export class ScheduleConfigService {
  // ─── Preview (validate chưa lưu) ─────────────────────────────────────────

  /**
   * Preview khi TẠO MỚI schedule config.
   * Validate toàn bộ config + tính estimated end time.
   * KHÔNG lưu vào DB — trả về để user xác nhận trước.
   */
  async previewCreate(
    tournamentId: number,
    data: Partial<ScheduleConfig>,
    totalMatches: number
  ): Promise<SchedulePreviewResponse> {
    const tournament = await Tournament.findByPk(tournamentId);
    if (!tournament) throw new NotFoundError("Tournament not found");

    // Không cho preview nếu config đã tồn tại
    const existing = await ScheduleConfig.findOne({ where: { tournamentId } });
    if (existing) {
      throw new BadRequestError(
        "Schedule config already exists for this tournament. Use update preview instead."
      );
    }

    return this._buildPreview(data, totalMatches);
  }

  /**
   * Preview khi CẬP NHẬT schedule config.
   * Validate config mới (merge với config hiện tại) + tính estimated end time.
   * KHÔNG lưu vào DB — trả về để user xác nhận trước.
   */
  async previewUpdate(
    tournamentId: number,
    data: Partial<ScheduleConfig>,
    totalMatches: number
  ): Promise<SchedulePreviewResponse> {
    const tournament = await Tournament.findByPk(tournamentId);
    if (!tournament) throw new NotFoundError("Tournament not found");

    const existing = await this.getConfig(tournamentId);
    if (!existing) throw new NotFoundError("Schedule config not found");

    // Merge config hiện tại với data mới để preview đúng trạng thái sau update
    const merged: Partial<ScheduleConfig> = {
      startDate: existing.startDate,
      endDate: existing.endDate,
      numberOfTables: existing.numberOfTables,
      registrationStartDate: existing.registrationStartDate,
      registrationEndDate: existing.registrationEndDate,
      bracketGenerationDate: existing.bracketGenerationDate,
      matchDurationMinutes: existing.matchDurationMinutes,
      breakDurationMinutes: existing.breakDurationMinutes,
      dailyStartHour: existing.dailyStartHour,
      dailyStartMinute: existing.dailyStartMinute,
      dailyEndHour: existing.dailyEndHour,
      dailyEndMinute: existing.dailyEndMinute,
      ...data, // data mới override config hiện tại
    };

    return this._buildPreview(merged, totalMatches);
  }

  // ─── CRUD thật (chỉ gọi sau khi user đã xác nhận preview) ───────────────

  /**
   * Tạo schedule config mới cho tournament.
   * Nên gọi sau khi user đã confirm từ previewCreate.
   */
  async createConfig(
    tournamentId: number,
    data: Partial<ScheduleConfig>
  ): Promise<ScheduleConfig> {
    const existing = await ScheduleConfig.findOne({ where: { tournamentId } });

    if (existing) {
      throw new BadRequestError(
        "Schedule config already exists for this tournament. Use update instead."
      );
    }

    return await ScheduleConfig.create({
      tournamentId,
      ...data,
    });
  }

  /**
   * Lấy config của tournament.
   */
  async getConfig(tournamentId: number): Promise<ScheduleConfig | null> {
    return await ScheduleConfig.findOne({ where: { tournamentId } });
  }

  /**
   * Cập nhật config.
   * Nên gọi sau khi user đã confirm từ previewUpdate.
   */
  async updateConfig(
    tournamentId: number,
    data: Partial<ScheduleConfig>
  ): Promise<ScheduleConfig> {
    const config = await this.getConfig(tournamentId);

    if (!config) throw new NotFoundError("Schedule config not found");

    return await config.update(data);
  }

  // ─── Validate sau khi đã lưu (dùng khi generate schedule) ───────────────

  /**
   * Validate xem config đã lưu có fit với số trận không.
   * Dùng nội bộ (vd: trước khi generate schedule).
   */
  async validateScheduleConfig(
    tournamentId: number,
    totalMatches: number
  ): Promise<ScheduleValidationResponse> {
    const tournament = await Tournament.findByPk(tournamentId);
    if (!tournament) throw new NotFoundError("Tournament not found");

    const config = await this.getConfig(tournamentId);
    if (!config) throw new NotFoundError("Schedule config not found");

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
      startDate,
      endDate,
      dailyStartHour,
      dailyStartMinute,
      dailyEndHour,
      dailyEndMinute
    );

    const totalSlots = Math.ceil(totalMatches / numberOfTables);
    const neededMinutes = calculateNeededMinutes(
      totalMatches,
      matchDurationMinutes,
      breakDurationMinutes,
      numberOfTables
    );
    const estimatedEndTime = calculateEstimatedEndTime(
      startDate,
      totalMatches,
      matchDurationMinutes,
      breakDurationMinutes,
      numberOfTables
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
        message: `Lịch thi đấu hợp lệ. Dự kiến kết thúc lúc ${estimatedEndTime.toISOString()}, trước deadline ${Math.floor((endDate.getTime() - estimatedEndTime.getTime()) / 60000)} phút.`,
        details,
      };
    }

    return {
      isValid: false,
      message: `Lịch thi đấu vượt quá thời gian cho phép. Dự kiến kết thúc lúc ${estimatedEndTime.toISOString()}, nhưng tournament kết thúc lúc ${endDate.toISOString()} (vượt ${neededMinutes - availableMinutes} phút).`,
      details,
    };
  }

  /**
   * Delete schedule config for a tournament
   */
  async deleteConfig(tournamentId: number): Promise<number> {
    return await ScheduleConfig.destroy({ where: { tournamentId } });
  }

  /**
   * Get default schedule config values
   * Used by clients to understand default values when creating schedule config
   */
  async getDefaultConfig(): Promise<{
    matchDurationMinutes: number;
    breakDurationMinutes: number;
    dailyStartHour: number;
    dailyStartMinute: number;
    dailyEndHour: number;
    dailyEndMinute: number;
    numberOfTables: number;
    lunchBreakStartHour?: number;
    lunchBreakStartMinute?: number;
    lunchBreakEndHour?: number;
    lunchBreakEndMinute?: number;
    lunchBreakDurationMinutes?: number;
  }> {
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

  // ─── Private helpers ──────────────────────────────────────────────────────

  /**
   * Build preview response từ raw data (chưa lưu).
   * Dùng chung cho cả previewCreate và previewUpdate.
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

    // Validate required fields
    if (!startDate || !endDate) {
      throw new BadRequestError("startDate and endDate are required");
    }
    if (!registrationStartDate || !registrationEndDate || !bracketGenerationDate) {
      throw new BadRequestError(
        "registrationStartDate, registrationEndDate, and bracketGenerationDate are required"
      );
    }

    const availableMinutes = calculateAvailableMinutes(
      startDate,
      endDate,
      dailyStartHour,
      dailyStartMinute,
      dailyEndHour,
      dailyEndMinute
    );

    const totalSlots = Math.ceil(totalMatches / numberOfTables);
    const neededMinutes = calculateNeededMinutes(
      totalMatches,
      matchDurationMinutes,
      breakDurationMinutes,
      numberOfTables
    );
    const estimatedEndTime = calculateEstimatedEndTime(
      startDate,
      totalMatches,
      matchDurationMinutes,
      breakDurationMinutes,
      numberOfTables
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
        message: `Config hợp lệ. Với ${totalMatches} trận, dự kiến kết thúc lúc ${estimatedEndTime.toISOString()}, còn dư ${Math.floor(availableMinutes - neededMinutes)} phút so với thời gian cho phép.`,
        preview,
      };
    }

    return {
      isValid: false,
      message: `Config không hợp lệ. Cần ${neededMinutes} phút nhưng chỉ có ${availableMinutes} phút (thiếu ${neededMinutes - availableMinutes} phút). Hãy điều chỉnh số bàn, thời lượng trận, hoặc ngày thi đấu.`,
      preview,
    };
  }
}

export default new ScheduleConfigService();