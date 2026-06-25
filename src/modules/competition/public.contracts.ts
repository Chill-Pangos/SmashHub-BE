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
