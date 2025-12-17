// MatchSet DTOs
export interface CreateMatchSetDto {
  matchId: number;
  setNumber: number;
  entryAScore?: number;
  entryBScore?: number;
}

export interface UpdateMatchSetDto {
  entryAScore?: number;
  entryBScore?: number;
}

export interface MatchSetResponseDto {
  id: number;
  matchId: number;
  setNumber: number;
  entryAScore: number;
  entryBScore: number;
  createdAt: Date;
  updatedAt: Date;
}
