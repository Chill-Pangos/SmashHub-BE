// SubMatch DTOs
export interface CreateSubMatchDto {
  matchId: number;
  subMatchNumber: number;
  status: "in_progress" | "completed";
  winnerTeam?: "A" | "B";
  umpireId?: number;
  assistantUmpireId?: number;
}

export interface UpdateSubMatchDto {
  status?: "in_progress" | "completed";
  winnerTeam?: "A" | "B";
  umpireId?: number;
  assistantUmpireId?: number;
}

export interface SubMatchResponseDto {
  id: number;
  matchId: number;
  subMatchNumber: number;
  status: string;
  winnerTeam?: string;
  umpireId?: number;
  assistantUmpireId?: number;
  createdAt: Date;
  updatedAt: Date;
}
