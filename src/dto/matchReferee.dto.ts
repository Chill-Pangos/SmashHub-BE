// MatchReferee DTOs
export interface CreateMatchRefereeDto {
  matchId: number;
  refereeId: number;
}

export interface UpdateMatchRefereeDto {
  refereeId?: number;
}

export interface MatchRefereeResponseDto {
  id: number;
  matchId: number;
  refereeId: number;
  createdAt: Date;
  updatedAt: Date;
}
