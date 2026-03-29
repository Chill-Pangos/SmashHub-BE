// TournamentCategory DTOs
export interface CreateTournamentCategoryDto {
  tournamentId: number;
  name: string;
  type: 'single' | 'team' | 'double';
  maxEntries: number;
  maxSets: number;
  teamFormat?: string;
  minAge?: number;
  maxAge?: number;
  minElo?: number;
  maxElo?: number;
  maxMembersPerEntry?: number;
  gender?: 'male' | 'female' | 'mixed';
  isGroupStage?: boolean;
}

export interface UpdateTournamentCategoryDto {
  name?: string;
  type?: 'single' | 'team' | 'double';
  maxEntries?: number;
  maxSets?: number;
  teamFormat?: string;
  minAge?: number;
  maxAge?: number;
  minElo?: number;
  maxElo?: number;
  maxMembersPerEntry?: number;
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
  teamFormat?: string;
  minAge?: number;
  maxAge?: number;
  minElo?: number;
  maxElo?: number;
  maxMembersPerEntry?: number;
  gender?: 'male' | 'female' | 'mixed';
  isGroupStage?: boolean;
  createdAt: Date;
  updatedAt: Date;
}
