// ComplaintMessage DTOs
export interface CreateComplaintMessageDto {
  complaintId: number;
  senderId: number;
  receiverId?: number;
  message: string;
  isRead?: boolean;
}

export interface UpdateComplaintMessageDto {
  isRead?: boolean;
}

export interface ComplaintMessageResponseDto {
  id: number;
  complaintId: number;
  senderId: number;
  receiverId?: number;
  message: string;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}
