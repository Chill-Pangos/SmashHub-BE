export interface ApprovePendingMatchResultDto {
	reviewNotes?: string;
}

export interface RejectPendingMatchResultDto {
	reviewNotes: string;
}

export interface PendingMatchResultQueryDto {
	skip?: number;
	limit?: number;
}

export interface PendingMatchResultResponseDto {
	id: number;
	scheduleId: number;
	entryAId: number;
	entryBId: number;
	status: "scheduled" | "in_progress" | "completed" | "cancelled";
	resultStatus?: "pending" | "approved" | "rejected";
	winnerEntryId?: number;
	reviewNotes?: string;
	createdAt: Date;
	updatedAt: Date;
}
