// TournamentContent DTOs
export interface CreateTournamentContentDto {
  tournamentId: number;
  name: string;
  type: 'single' | 'team' | 'double';
  maxEntries: number;
  maxSets: number;
  numberOfSingles?: number;
  numberOfDoubles?: number;
  racketCheck: boolean;
  isGroupStage?: boolean;
}

export interface UpdateTournamentContentDto {
  name?: string;
  type?: 'single' | 'team' | 'double';
  maxEntries?: number;
  maxSets?: number;
  numberOfSingles?: number;
  numberOfDoubles?: number;
  racketCheck?: boolean;
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
  racketCheck: boolean;
  isGroupStage?: boolean;
  createdAt: Date;
  updatedAt: Date;
}
