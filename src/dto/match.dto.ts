// Match DTOs
export interface CreateMatchDto {
  scheduleId: number;
  entryAId: number;
  entryBId: number;
  status: "scheduled" | "in_progress" | "completed" | "cancelled";
  winnerEntryId?: number;
  umpire?: number;
  assistantUmpire?: number;
}

export interface UpdateMatchDto {
  status?: "scheduled" | "in_progress" | "completed" | "cancelled";
  winnerEntryId?: number;
  umpire?: number;
  assistantUmpire?: number;
}

export interface MatchResponseDto {
  id: number;
  scheduleId: number;
  entryAId: number;
  entryBId: number;
  status: string;
  winnerEntryId?: number;
  umpire?: number;
  assistantUmpire?: number;
  createdAt: Date;
  updatedAt: Date;
}
