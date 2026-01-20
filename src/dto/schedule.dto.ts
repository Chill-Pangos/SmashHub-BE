// Schedule DTOs
export interface CreateScheduleDto {
  contentId: number;
  roundNumber?: number;
  groupName?: string;
  stage?: 'group' | 'knockout';
  knockoutRound?: string;
  scheduledAt: Date;
}

export interface UpdateScheduleDto {
  roundNumber?: number;
  groupName?: string;
  stage?: 'group' | 'knockout';
  knockoutRound?: string;
  scheduledAt?: Date;
}

export interface ScheduleResponseDto {
  id: number;
  contentId: number;
  roundNumber?: number;
  groupName?: string;
  stage?: 'group' | 'knockout';
  knockoutRound?: string;
  scheduledAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface GenerateScheduleDto {
  contentId: number;
  startDate: Date;
  startTime?: string; // HH:MM format, default "08:00"
  endTime?: string; // HH:MM format, default "22:00"
  lunchBreakStart?: string; // HH:MM format, default "12:00"
  lunchBreakEnd?: string; // HH:MM format, default "14:00"
  roundNumber?: number;
  groupName?: string;
  // Group stage options
  isGroupStage?: boolean; // If true, divide entries into groups
  numberOfGroups?: number; // Number of groups (auto-calculated if not provided)
  teamsPerGroup?: number; // Teams per group (auto-calculated if not provided)
  // Knockout stage options
  includeKnockout?: boolean; // If true, create knockout stage after group stage
  teamsAdvancePerGroup?: number; // Number of teams advancing from each group (default: 2)
  knockoutStartDate?: Date; // Start date for knockout stage (default: day after group stage ends)
}

