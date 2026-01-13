// MatchFormat DTOs
export interface CreateMatchFormatDto {
  numberOfSingles: number;
  numberOfDoubles: number;
  description: string;
}

export interface UpdateMatchFormatDto {
  numberOfSingles?: number;
  numberOfDoubles?: number;
  description?: string;
}

export interface MatchFormatResponseDto {
  id: number;
  numberOfSingles: number;
  numberOfDoubles: number;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}
