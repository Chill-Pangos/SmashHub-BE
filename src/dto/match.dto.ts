// Match DTOs
export interface CreateMatchDto {
  scheduleId: number;
  entryAId: number;
  entryBId: number;
  status: "scheduled" | "in_progress" | "completed" | "cancelled";
  winnerEntryId?: number;
  umpire?: number;
  assistantUmpire?: number;
  resultStatus?: "pending" | "approved" | "rejected";
  reviewNotes?: string;
}

export interface UpdateMatchDto {
  status?: "scheduled" | "in_progress" | "completed" | "cancelled";
  winnerEntryId?: number;
  umpire?: number;
  assistantUmpire?: number;
  resultStatus?: "pending" | "approved" | "rejected";
  reviewNotes?: string;
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
  resultStatus?: "pending" | "approved" | "rejected";
  reviewNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}
