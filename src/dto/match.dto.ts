// Match DTOs
export interface CreateMatchDto {
  scheduleId: number;
  entryAId: number;
  entryBId: number;
  status: "scheduled" | "in_progress" | "completed" | "cancelled";
  winnerEntryId?: number;
  umpire?: number;
  assistantUmpire?: number;
  coachAId?: number;
  coachBId?: number;
}

export interface UpdateMatchDto {
  status?: "scheduled" | "in_progress" | "completed" | "cancelled";
  winnerEntryId?: number;
  umpire?: number;
  assistantUmpire?: number;
  coachAId?: number;
  coachBId?: number;
  isConfirmedByWinner?: boolean;
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
  coachAId?: number;
  coachBId?: number;
  isConfirmedByWinner?: boolean;
  createdAt: Date;
  updatedAt: Date;
}
