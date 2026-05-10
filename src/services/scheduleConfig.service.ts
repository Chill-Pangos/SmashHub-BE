// schedule-config.service.ts
import ScheduleConfig from "../models/scheduleConfig.model";
import Tournament from "../models/tournament.model";
import { BadRequestError, NotFoundError } from "../utils/errors";

// ─── Types ────────────────────────────────────────────────────────────────────
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

const SINGLE_DAY_THRESHOLD_HOURS = 20; // startDate - endDate < 20h = 1 ngày

// ─── Helper Functions ─────────────────────────────────────────────────────────

function isSingleDayTournament(config: ScheduleConfig): boolean {
  const diffHours =
    (config.endDate.getTime() - config.startDate.getTime()) /
    (1000 * 60 * 60);
  return diffHours < SINGLE_DAY_THRESHOLD_HOURS;
}

function calculateTournamentDayHours(config: ScheduleConfig): number {
  if (isSingleDayTournament(config)) {
    return (config.endDate.getTime() - config.startDate.getTime()) /
      (1000 * 60 * 60);
  }

  // Giải nhiều ngày: tính tổng giờ làm việc per day
  // (dailyEndHour - dailyStartHour) * number_of_days
  const diffDays = Math.ceil(
    (config.endDate.getTime() - config.startDate.getTime()) /
      (1000 * 60 * 60 * 24)
  );

  const dailyStartTotalMinutes =
    config.startDate.getHours() * 60 + config.startDate.getMinutes();
  const dailyEndTotalMinutes =
    config.endDate.getHours() * 60 + config.endDate.getMinutes();

  const dailyHours = (dailyEndTotalMinutes - dailyStartTotalMinutes) / 60;
  return dailyHours * diffDays;
}

function calculateTotalMatchDurationNeeded(
  totalMatches: number,
  matchDurationMinutes: number,
  breakDurationMinutes: number,
  numberOfTables: number
): number {
  const totalSlots = Math.ceil(totalMatches / numberOfTables);
  const slotDurationMinutes = matchDurationMinutes + breakDurationMinutes;
  return totalSlots * slotDurationMinutes;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export class ScheduleConfigService {
  /**
   * Tạo schedule config mới cho tournament
   */
  async createConfig(
    tournamentId: number,
    data: Partial<ScheduleConfig>
  ): Promise<ScheduleConfig> {
    const existing = await ScheduleConfig.findOne({
      where: { tournamentId },
    });

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
   * Lấy config của tournament
   */
  async getConfig(tournamentId: number): Promise<ScheduleConfig | null> {
    return await ScheduleConfig.findOne({
      where: { tournamentId },
    });
  }

  /**
   * Cập nhật config
   */
  async updateConfig(
    tournamentId: number,
    data: Partial<ScheduleConfig>
  ): Promise<ScheduleConfig> {
    const config = await this.getConfig(tournamentId);

    if (!config) {
      throw new NotFoundError("Schedule config not found");
    }

    return await config.update(data);
  }

  /**
   * Validate xem config fit với tournament không
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

  const availableMinutes = isSingleDayTournament(config)
    ? (endDate.getTime() - startDate.getTime()) / 60000
    : this._calculateAvailableMinutesMultiDay(
        config,
        dailyStartHour,
        dailyStartMinute,
        dailyEndHour,
        dailyEndMinute
      );

  const totalSlots = Math.ceil(totalMatches / numberOfTables);
  const neededMinutes = calculateTotalMatchDurationNeeded(
    totalMatches,
    matchDurationMinutes,
    breakDurationMinutes,
    numberOfTables
  );

  const estimatedEndTime = this._calculateLastMatchEndTime(
    config,
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
   * Tính available minutes cho multi-day tournament
   */
  private _calculateAvailableMinutesMultiDay(
    config: ScheduleConfig,
    dailyStartHour: number,
    dailyStartMinute: number,
    dailyEndHour: number,
    dailyEndMinute: number
  ): number {
    const diffDays = Math.ceil(
      (config.endDate.getTime() - config.startDate.getTime()) /
        (1000 * 60 * 60 * 24)
    );

    const dailyStartTotalMinutes = dailyStartHour * 60 + dailyStartMinute;
    const dailyEndTotalMinutes = dailyEndHour * 60 + dailyEndMinute;

    const dailyMinutes = dailyEndTotalMinutes - dailyStartTotalMinutes;

    return dailyMinutes * diffDays;
  }

  /**
   * Tính thời điểm kết thúc match cuối
   */
  private _calculateLastMatchEndTime(
    config: ScheduleConfig,
    totalMatches: number,
    matchDurationMinutes: number,
    breakDurationMinutes: number,
    numberOfTables: number
  ): Date {
    const totalSlots = Math.ceil(totalMatches / numberOfTables);
    const slotDurationMinutes = matchDurationMinutes + breakDurationMinutes;
    const totalMinutesNeeded = totalSlots * slotDurationMinutes;

    return new Date(config.startDate.getTime() + totalMinutesNeeded * 60000);
  }
}

export default new ScheduleConfigService();
