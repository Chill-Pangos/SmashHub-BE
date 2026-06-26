export interface PublicUserSummary {
  id: number;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
}

export interface RegistrationUserSummary extends PublicUserSummary {
  email?: string;
  gender?: "male" | "female";
  dob?: Date | string;
}

export interface TournamentUserSummary extends PublicUserSummary {
  email: string;
  gender?: "male" | "female";
}

export interface TournamentUserSearchInput {
  includeIds: number[];
  excludeIds?: number[];
  search?: string;
  offset?: number;
  limit?: number;
}

export interface TournamentUserSearchResult {
  users: TournamentUserSummary[];
  total: number;
}
