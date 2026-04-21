// schedule-config.dto.ts

export interface CreateScheduleConfigDto {
  tournamentId: number;
  matchDurationMinutes?: number; // default: 60
  breakDurationMinutes?: number; // default: 10
  dailyStartHour?: number; // default: 8
  dailyStartMinute?: number; // default: 0
  dailyEndHour?: number; // default: 22
  dailyEndMinute?: number; // default: 0
  lunchBreakStartHour?: number;
  lunchBreakStartMinute?: number;
  lunchBreakEndHour?: number;
  lunchBreakEndMinute?: number;
  notes?: string;
}

export interface UpdateScheduleConfigDto {
  matchDurationMinutes?: number;
  breakDurationMinutes?: number;
  dailyStartHour?: number;
  dailyStartMinute?: number;
  dailyEndHour?: number;
  dailyEndMinute?: number;
  lunchBreakStartHour?: number;
  lunchBreakStartMinute?: number;
  lunchBreakEndHour?: number;
  lunchBreakEndMinute?: number;
  notes?: string;
}

export interface ScheduleConfigResponseDto {
  id: number;
  tournamentId: number;
  matchDurationMinutes: number;
  breakDurationMinutes: number;
  dailyStartHour: number;
  dailyStartMinute: number;
  dailyEndHour: number;
  dailyEndMinute: number;
  lunchBreakStartHour?: number;
  lunchBreakStartMinute?: number;
  lunchBreakEndHour?: number;
  lunchBreakEndMinute?: number;
  lunchBreakDurationMinutes?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ValidateScheduleConfigDto {
  totalMatches: number;
}

export interface ScheduleValidationResponseDto {
  isValid: boolean;
  message: string;
  details?: {
    totalMatches: number;
    totalSlots: number;
    lastMatchEndTime: Date;
    tournamentEndTime: Date;
    overflowMinutes?: number;
  };
  suggestions?: OptimizationSuggestionDto[];
}

export interface OptimizationSuggestionDto {
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
