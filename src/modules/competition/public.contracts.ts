import type { Team } from "./models/subMatch.model";

export interface ApprovedTournamentMatch {
  id: number;
  entryA?: {
    members: Array<{ userId: number }>;
  };
  entryB?: {
    members: Array<{ userId: number }>;
  };
  subMatches: Array<{ winnerTeam?: Team | null }>;
}

export interface MatchSummary {
  id: number;
  status: string;
}

export interface RegistrationWindow {
  tournamentId: number;
  registrationStartDate: Date;
  registrationEndDate: Date;
}

export interface ScheduleDateCondition {
  lt?: Date;
  lte?: Date;
  gt?: Date;
  gte?: Date;
  between?: [Date, Date];
  notNull?: boolean;
}

export interface ScheduleConfigFilter {
  tournamentId?: {
    in?: number[];
    ne?: number;
  };
  startDate?: ScheduleDateCondition;
  endDate?: ScheduleDateCondition;
  registrationStartDate?: ScheduleDateCondition;
  registrationEndDate?: ScheduleDateCondition;
  bracketGenerationDate?: ScheduleDateCondition;
}

export interface TournamentScheduleConfig {
  id: number;
  tournamentId: number;
  startDate: Date;
  endDate: Date;
  registrationStartDate: Date;
  registrationEndDate: Date;
  bracketGenerationDate: Date;
  numberOfTables: number;
  matchDurationMinutes: number;
  breakDurationMinutes: number;
  dailyStartHour: number;
  dailyStartMinute: number;
  dailyEndHour: number;
  dailyEndMinute: number;
  lunchBreakStartHour: number | null;
  lunchBreakStartMinute: number | null;
  lunchBreakEndHour: number | null;
  lunchBreakEndMinute: number | null;
  lunchBreakDurationMinutes: number | null;
  notes: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TournamentScheduleConfigListItem {
  startDate: Date;
  endDate?: Date;
  registrationStartDate: Date;
  registrationEndDate: Date;
  bracketGenerationDate: Date;
  dailyStartHour?: number;
  dailyStartMinute?: number;
  dailyEndHour?: number;
  dailyEndMinute?: number;
  numberOfTables?: number;
}

export type ScheduleConfigDateField =
  | "registrationStartDate"
  | "registrationEndDate"
  | "bracketGenerationDate"
  | "startDate";

export interface GroupAwardStanding {
  categoryId: number;
  groupName: string;
  entryId: number;
  position: number;
}

export interface KnockoutStanding {
  champion?: number;
  runnerUp?: number;
  thirdPlace?: number[];
  eliminated: Array<{ entryId: number; eliminatedAt: string }>;
}
