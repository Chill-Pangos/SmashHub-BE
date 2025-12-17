// TournamentContent DTOs
export interface CreateTournamentContentDto {
  tournamentId: number;
  name: string;
  formatTypeId: number;
}

export interface UpdateTournamentContentDto {
  name?: string;
  formatTypeId?: number;
}

export interface TournamentContentResponseDto {
  id: number;
  tournamentId: number;
  name: string;
  formatTypeId: number;
  createdAt: Date;
  updatedAt: Date;
}
