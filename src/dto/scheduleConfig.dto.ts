export interface CreateScheduleConfigDto {
  tournamentId: number;
  // Tournament dates & tables 
  startDate: Date | string;
  endDate: Date | string;
  numberOfTables?: number;
  registrationStartDate: Date;
  registrationEndDate: Date;
  bracketGenerationDate: Date;
  // Match configuration
  matchDurationMinutes?: number;
  breakDurationMinutes?: number;
  // Daily schedule
  dailyStartHour?: number;
  dailyStartMinute?: number;
  dailyEndHour?: number;
  dailyEndMinute?: number;
  // Lunch break
  lunchBreakStartHour?: number | null;
  lunchBreakStartMinute?: number | null;
  lunchBreakEndHour?: number | null;
  lunchBreakEndMinute?: number | null;
  lunchBreakDurationMinutes?: number | null;
  notes?: string | null;
}

export interface UpdateScheduleConfigDto {
  // Tournament dates & tables (optional for updates)
  startDate?: Date | string;
  endDate?: Date | string;
  numberOfTables?: number;
  registrationStartDate?: Date;
  registrationEndDate?: Date;
  bracketGenerationDate?: Date;
  // Match configuration
  matchDurationMinutes?: number;
  breakDurationMinutes?: number;
  // Daily schedule
  dailyStartHour?: number;
  dailyStartMinute?: number;
  dailyEndHour?: number;
  dailyEndMinute?: number;
  // Lunch break
  lunchBreakStartHour?: number | null;
  lunchBreakStartMinute?: number | null;
  lunchBreakEndHour?: number | null;
  lunchBreakEndMinute?: number | null;
  lunchBreakDurationMinutes?: number | null;
  notes?: string | null;
  regenerateSchedule?: boolean;
  regenerationKey?: string;
}

export interface ScheduleConfigResponseDto {
  id: number;
  tournamentId: number;
  // Tournament dates & tables
  startDate: Date;
  endDate: Date;
  numberOfTables: number;
  registrationStartDate: Date;
  registrationEndDate: Date;
  bracketGenerationDate: Date;
  // Match configuration
  matchDurationMinutes: number;
  breakDurationMinutes: number;
  // Daily schedule
  dailyStartHour: number;
  dailyStartMinute: number;
  dailyEndHour: number;
  dailyEndMinute: number;
  timeZone: string;
  // Lunch break
  lunchBreakStartHour?: number | null;
  lunchBreakStartMinute?: number | null;
  lunchBreakEndHour?: number | null;
  lunchBreakEndMinute?: number | null;
  lunchBreakDurationMinutes?: number | null;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ValidateScheduleConfigDto {
  category: {
    maxEntries: number;
    isGroupStage?: boolean;
  };
  scheduleConfig: Omit<CreateScheduleConfigDto, "tournamentId">;
}

export interface ScheduleValidationResponseDto {
  isValid: boolean;
  message: string;
  requiresRegeneration?: boolean;
  regenerationKey?: string;
  affectedScheduleCount?: number;
  details: {
    totalMatches: number;
    totalSlots: number;
    estimatedEndTime: Date;      // thời gian kết thúc dự kiến theo config
    tournamentEndTime: Date;     // deadline của tournament
    overflowMinutes?: number;    // chỉ có khi isValid = false
  };
}
