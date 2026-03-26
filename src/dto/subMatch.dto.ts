// SubMatch DTOs
export interface CreateSubMatchDto {
  matchId: number;
  subMatchNumber: number;
  status: "in_progress" | "completed";
  winnerTeam?: "A" | "B";
}

export interface UpdateSubMatchDto {
  status?: "in_progress" | "completed";
  winnerTeam?: "A" | "B";
}

export interface SubMatchResponseDto {
  id: number;
  matchId: number;
  subMatchNumber: number;
  status: string;
  winnerTeam?: string;
  createdAt: Date;
  updatedAt: Date;
}
