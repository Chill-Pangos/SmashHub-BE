// JoinRequest DTOs
export interface CreateJoinRequestDto {
  entryId: number;
  userId: number;
}

export interface UpdateJoinRequestDto {
  status: "approved" | "rejected";
  rejectionReason?: string;
}

export interface JoinRequestResponseDto {
  id: number;
  entryId: number;
  userId: number;
  status: "pending" | "approved" | "rejected";
  rejectionReason?: string;
  respondedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
