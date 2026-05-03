// schedule-config.service.ts
import ScheduleConfig from "../models/scheduleConfig.model";
import Tournament from "../models/tournament.model";
import { BadRequestError, NotFoundError } from "../utils/errors";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ValidationResult {
  isValid: boolean;
  message?: string;
  details?: {
    totalMatches: number;
    totalSlots: number;
    lastMatchEndTime: Date;
    tournamentEndTime: Date;
    overflowMinutes?: number;
  };
}

export interface OptimizationSuggestion {
  type:
    | "increase_tables"
    | "reduce_match_duration"
    | "reduce_break_duration"
    | "extend_schedule";
  description: string;
  impact: {
    matchDurationMinutes?: number;
    breakDurationMinutes?: number;
    numberOfTables?: number;
    newEndDate?: Date;
  };
  priority: "high" | "medium" | "low";
}

export interface ScheduleValidationResponse {
  isValid: boolean;
  message: string;
  details?: ValidationResult["details"];
  suggestions?: OptimizationSuggestion[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SINGLE_DAY_THRESHOLD_HOURS = 20; // startDate - endDate < 20h = 1 ngày

// ─── Helper Functions ─────────────────────────────────────────────────────────

function isSingleDayTournament(tournament: Tournament): boolean {
  const diffHours =
    (tournament.endDate.getTime() - tournament.startDate.getTime()) /
    (1000 * 60 * 60);
  return diffHours < SINGLE_DAY_THRESHOLD_HOURS;
}

function calculateTournamentDayHours(tournament: Tournament): number {
  if (isSingleDayTournament(tournament)) {
    return (tournament.endDate.getTime() - tournament.startDate.getTime()) /
      (1000 * 60 * 60);
  }

  // Giải nhiều ngày: tính tổng giờ làm việc per day
  // (dailyEndHour - dailyStartHour) * number_of_days
  const diffDays = Math.ceil(
    (tournament.endDate.getTime() - tournament.startDate.getTime()) /
      (1000 * 60 * 60 * 24)
  );

  const dailyStartTotalMinutes =
    tournament.startDate.getHours() * 60 + tournament.startDate.getMinutes();
  const dailyEndTotalMinutes =
    tournament.endDate.getHours() * 60 + tournament.endDate.getMinutes();

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
    if (!tournament) {
      throw new NotFoundError("Tournament not found");
    }

    const config = await this.getConfig(tournamentId);
    if (!config) {
      throw new NotFoundError("Schedule config not found");
    }

    const {
      matchDurationMinutes,
      breakDurationMinutes,
      dailyStartHour,
      dailyStartMinute,
      dailyEndHour,
      dailyEndMinute,
    } = config;

    const numberOfTables = tournament.numberOfTables;

    // Calculate available time (in minutes)
    const availableMinutes = isSingleDayTournament(tournament)
      ? (tournament.endDate.getTime() - tournament.startDate.getTime()) / 60000
      : this._calculateAvailableMinutesMultiDay(
          tournament,
          dailyStartHour,
          dailyStartMinute,
          dailyEndHour,
          dailyEndMinute
        );

    // Calculate total time needed
    const neededMinutes = calculateTotalMatchDurationNeeded(
      totalMatches,
      matchDurationMinutes,
      breakDurationMinutes,
      numberOfTables
    );

    const isValid = neededMinutes <= availableMinutes;

    if (isValid) {
      return {
        isValid: true,
        message: "Schedule config fits within tournament timeframe",
        details: {
          totalMatches,
          totalSlots: Math.ceil(totalMatches / numberOfTables),
          lastMatchEndTime: this._calculateLastMatchEndTime(
            tournament,
            totalMatches,
            matchDurationMinutes,
            breakDurationMinutes,
            numberOfTables
          ),
          tournamentEndTime: tournament.endDate,
        },
      };
    }

    // Generate suggestions
    const suggestions = this._generateSuggestions(
      totalMatches,
      matchDurationMinutes,
      breakDurationMinutes,
      numberOfTables,
      neededMinutes,
      availableMinutes,
      tournament
    );

    return {
      isValid: false,
      message: `Schedule config does NOT fit tournament timeframe. Need ${neededMinutes} minutes but only have ${availableMinutes} minutes available (overflow: ${neededMinutes - availableMinutes} minutes)`,
      details: {
        totalMatches,
        totalSlots: Math.ceil(totalMatches / numberOfTables),
        lastMatchEndTime: this._calculateLastMatchEndTime(
          tournament,
          totalMatches,
          matchDurationMinutes,
          breakDurationMinutes,
          numberOfTables
        ),
        tournamentEndTime: tournament.endDate,
        overflowMinutes: neededMinutes - availableMinutes,
      },
      suggestions,
    };
  }

  /**
   * Tính available minutes cho multi-day tournament
   */
  private _calculateAvailableMinutesMultiDay(
    tournament: Tournament,
    dailyStartHour: number,
    dailyStartMinute: number,
    dailyEndHour: number,
    dailyEndMinute: number
  ): number {
    const diffDays = Math.ceil(
      (tournament.endDate.getTime() - tournament.startDate.getTime()) /
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
    tournament: Tournament,
    totalMatches: number,
    matchDurationMinutes: number,
    breakDurationMinutes: number,
    numberOfTables: number
  ): Date {
    const totalSlots = Math.ceil(totalMatches / numberOfTables);
    const slotDurationMinutes = matchDurationMinutes + breakDurationMinutes;
    const totalMinutesNeeded = totalSlots * slotDurationMinutes;

    return new Date(tournament.startDate.getTime() + totalMinutesNeeded * 60000);
  }

  /**
   * Sinh suggestions để fix
   */
  private _generateSuggestions(
    totalMatches: number,
    matchDurationMinutes: number,
    breakDurationMinutes: number,
    numberOfTables: number,
    neededMinutes: number,
    availableMinutes: number,
    tournament: Tournament
  ): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];
    const overflowMinutes = neededMinutes - availableMinutes;

    // 1. Tăng số bàn
    const newTables = numberOfTables + 1;
    const newNeededMinutes1 = calculateTotalMatchDurationNeeded(
      totalMatches,
      matchDurationMinutes,
      breakDurationMinutes,
      newTables
    );

    if (newNeededMinutes1 <= availableMinutes) {
      suggestions.push({
        type: "increase_tables",
        description: `Increase number of tables from ${numberOfTables} to ${newTables} tables. This will allow ${Math.ceil(totalMatches / newTables)} time slots instead of ${Math.ceil(totalMatches / numberOfTables)}.`,
        impact: { numberOfTables: newTables },
        priority: "high",
      });
    }

    // 2. Giảm match duration
    const reducedMatchDuration = Math.max(15, matchDurationMinutes - 15);
    const newNeededMinutes2 = calculateTotalMatchDurationNeeded(
      totalMatches,
      reducedMatchDuration,
      breakDurationMinutes,
      numberOfTables
    );

    if (newNeededMinutes2 <= availableMinutes && reducedMatchDuration !== matchDurationMinutes) {
      suggestions.push({
        type: "reduce_match_duration",
        description: `Reduce match duration from ${matchDurationMinutes} to ${reducedMatchDuration} minutes per match.`,
        impact: { matchDurationMinutes: reducedMatchDuration },
        priority: "medium",
      });
    }

    // 3. Giảm break duration
    const reducedBreakDuration = Math.max(0, breakDurationMinutes - 5);
    const newNeededMinutes3 = calculateTotalMatchDurationNeeded(
      totalMatches,
      matchDurationMinutes,
      reducedBreakDuration,
      numberOfTables
    );

    if (newNeededMinutes3 <= availableMinutes && reducedBreakDuration !== breakDurationMinutes) {
      suggestions.push({
        type: "reduce_break_duration",
        description: `Reduce break duration from ${breakDurationMinutes} to ${reducedBreakDuration} minutes between matches.`,
        impact: { breakDurationMinutes: reducedBreakDuration },
        priority: "medium",
      });
    }

    // 4. Kéo dài tournament
    const newEndDate = new Date(
      tournament.endDate.getTime() + overflowMinutes * 60000
    );

    suggestions.push({
      type: "extend_schedule",
      description: `Extend tournament end date from ${tournament.endDate.toISOString()} to ${newEndDate.toISOString()} (add ${Math.ceil(overflowMinutes / 60)} hours).`,
      impact: { newEndDate },
      priority: "low",
    });

    return suggestions;
  }

  /**
   * Lấy config mặc định
   */
  async getDefaultConfig(): Promise<Partial<ScheduleConfig>> {
    return {
      matchDurationMinutes: 60,
      breakDurationMinutes: 10,
      dailyStartHour: 8,
      dailyStartMinute: 0,
      dailyEndHour: 22,
      dailyEndMinute: 0,
    };
  }

  /**
   * Xóa config
   */
  async deleteConfig(tournamentId: number): Promise<boolean> {
    const config = await this.getConfig(tournamentId);
    if (!config) {
      return false;
    }

    await config.destroy();
    return true;
  }
}

export default new ScheduleConfigService();
