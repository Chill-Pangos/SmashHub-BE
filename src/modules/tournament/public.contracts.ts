import type { TournamentStatus } from "./models/tournament.model";
import type {
  CategoryGender,
  CategoryType,
} from "./models/tournamentCategory.model";

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
