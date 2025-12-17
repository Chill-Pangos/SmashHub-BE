// MatchFormat DTOs
export interface CreateMatchFormatDto {
  numberOfSingles: number;
  numberOfDoubles: number;
}

export interface UpdateMatchFormatDto {
  numberOfSingles?: number;
  numberOfDoubles?: number;
}

export interface MatchFormatResponseDto {
  id: number;
  numberOfSingles: number;
  numberOfDoubles: number;
  createdAt: Date;
  updatedAt: Date;
}
