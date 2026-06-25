// EloHistory DTOs
export interface CreateEloHistoryDto {
  matchId: number;
  userId: number;
  previousElo: number;
  newElo: number;
  eloDelta: number;
  tournamentId?: number | null;
  changeReason: string;
}

export interface EloHistoryResponseDto {
  id: number;
  matchId: number;
  userId: number;
  previousElo: number;
  newElo: number;
  eloDelta: number;
  tournamentId?: number | null;
  changeReason: string;
  createdAt: Date;
  updatedAt: Date;
}
