// TournamentCategory DTOs
export interface CreateTournamentCategoryDto {
  tournamentId: number;
  name: string;
  type: 'single' | 'team' | 'double';
  maxEntries: number;
  maxSets: number;
  numberOfSingles?: number;
  numberOfDoubles?: number;
  minAge?: number;
  maxAge?: number;
  minElo?: number;
  maxElo?: number;
  gender?: 'male' | 'female' | 'mixed';
  isGroupStage?: boolean;
}

export interface UpdateTournamentCategoryDto {
  name?: string;
  type?: 'single' | 'team' | 'double';
  maxEntries?: number;
  maxSets?: number;
  numberOfSingles?: number;
  numberOfDoubles?: number;
  minAge?: number;
  maxAge?: number;
  minElo?: number;
  maxElo?: number;
  gender?: 'male' | 'female' | 'mixed';
  isGroupStage?: boolean;
}

export interface TournamentCategoryResponseDto {
  id: number;
  tournamentId: number;
  name: string;
  type: 'single' | 'team' | 'double';
  maxEntries: number;
  maxSets: number;
  numberOfSingles?: number;
  numberOfDoubles?: number;
  minAge?: number;
  maxAge?: number;
  minElo?: number;
  maxElo?: number;
  gender?: 'male' | 'female' | 'mixed';
  isGroupStage?: boolean;
  createdAt: Date;
  updatedAt: Date;
}
