// MatchSet DTOs
export interface CreateMatchSetDto {
  subMatchId?: number;
  matchId?: number;
  setNumber: number;
  entryAScore?: number;
  entryBScore?: number;
}

export interface UpdateMatchSetDto {
  entryAScore?: number;
  entryBScore?: number;
}

export interface UpdateMatchSetScoreDto {
  matchId: number;
  entryAScore: number;
  entryBScore: number;
}

export interface MatchSetResponseDto {
  id: number;
  subMatchId?: number;
  matchId?: number;
  setNumber: number;
  entryAScore: number;
  entryBScore: number;
  createdAt: Date;
  updatedAt: Date;
}
