// TournamentContent DTOs
export interface CreateTournamentContentDto {
  tournamentId: number;
  name: string;
  type: 'single' | 'team' | 'double';
  maxEntries: number;
  maxSets: number;
  numberOfSingles?: number;
  numberOfDoubles?: number;
  gender?: 'male' | 'female' | 'mixed';
  isGroupStage?: boolean;
}

export interface UpdateTournamentContentDto {
  name?: string;
  type?: 'single' | 'team' | 'double';
  maxEntries?: number;
  maxSets?: number;
  numberOfSingles?: number;
  numberOfDoubles?: number;
  gender?: 'male' | 'female' | 'mixed';
  isGroupStage?: boolean;
}

export interface TournamentContentResponseDto {
  id: number;
  tournamentId: number;
  name: string;
  type: 'single' | 'team' | 'double';
  maxEntries: number;
  maxSets: number;
  numberOfSingles?: number;
  numberOfDoubles?: number;
  gender?: 'male' | 'female' | 'mixed';
  isGroupStage?: boolean;
  createdAt: Date;
  updatedAt: Date;
}
