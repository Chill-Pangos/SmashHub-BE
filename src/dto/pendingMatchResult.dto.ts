export interface ApprovePendingMatchResultDto {
	reviewNotes?: string;
}

export interface PendingMatchResultQueryDto {
	offset?: number;
	limit?: number;
}

export interface PendingMatchResultResponseDto {
	id: number;
	scheduleId: number;
	entryAId: number;
	entryBId: number;
	status: "scheduled" | "in_progress" | "completed" | "cancelled";
	resultStatus?: "pending" | "approved";
	winnerEntryId?: number;
	reviewNotes?: string;
	createdAt: Date;
	updatedAt: Date;
}
