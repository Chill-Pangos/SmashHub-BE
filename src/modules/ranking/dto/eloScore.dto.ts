// EloScore DTOs
export interface CreateEloScoreDto {
  userId: number;
  score?: number;
}

export interface UpdateEloScoreDto {
  score?: number;
}

export interface EloScoreResponseDto {
  id: number;
  userId: number;
  score: number;
  createdAt: Date;
  updatedAt: Date;
}
