// Complaint DTOs
export interface CreateComplaintDto {
  createdBy: number;
  tournamentId: number;
  matchId?: number;
  topic: string;
  description: string;
  status?: "pending" | "in_progress" | "resolved" | "rejected";
  priority?: "low" | "medium" | "high";
}

export interface UpdateComplaintDto {
  topic?: string;
  description?: string;
  status?: "pending" | "in_progress" | "resolved" | "rejected";
  priority?: "low" | "medium" | "high";
  resolvedAt?: Date;
  resolvedBy?: number;
}

export interface ComplaintResponseDto {
  id: number;
  createdBy: number;
  tournamentId: number;
  matchId?: number;
  topic: string;
  description: string;
  status: string;
  priority: string;
  resolvedAt?: Date;
  resolvedBy?: number;
  createdAt: Date;
  updatedAt: Date;
}
