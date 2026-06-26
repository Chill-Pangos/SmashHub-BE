import type { TournamentStatus } from "./models/tournament.model";
import type {
  CategoryGender,
  CategoryType,
} from "./models/tournamentCategory.model";
import type { RefereeRole } from "./models/referee.constants";

export interface TournamentForElo {
  id: number;
  tier: number;
  status: TournamentStatus;
}

export interface TournamentRegistrationContext {
  id: number;
  name: string;
  tier: number;
  status: TournamentStatus;
  location: string;
  createdBy: number;
  [key: string]: unknown;
}

export interface TournamentCategoryRegistrationContext {
  id: number;
  tournamentId: number;
  name: string;
  type: CategoryType;
  maxEntries: number;
  maxSets: number;
  minAge?: number | null;
  maxAge?: number | null;
  minElo?: number | null;
  maxElo?: number | null;
  maxMembersPerEntry?: number | null;
  gender?: CategoryGender | null;
  isGroupStage: boolean;
  entryFee?: number | string | null;
  tournament: TournamentRegistrationContext;
  [key: string]: unknown;
}

export interface CompetitionTournamentContext extends TournamentRegistrationContext {
  categories?: CompetitionCategoryContext[];
}

export interface CompetitionCategoryContext {
  id: number;
  tournamentId: number;
  name: string;
  type: CategoryType;
  maxEntries: number;
  maxSets: number;
  teamFormat?: string | null;
  minAge?: number | null;
  maxAge?: number | null;
  minElo?: number | null;
  maxElo?: number | null;
  maxMembersPerEntry?: number | null;
  gender?: CategoryGender | null;
  isGroupStage: boolean;
  entryFee?: number | string | null;
  tournament: CompetitionTournamentContext;
  [key: string]: unknown;
}

export interface CompetitionRefereeAssignment {
  id: number;
  tournamentId: number;
  refereeId: number;
  role: RefereeRole;
}
