// ComplaintWorkflow DTOs
export interface CreateComplaintWorkflowDto {
  complaintId: number;
  fromRole?: string;
  toRole?: string;
  fromUserId?: number;
  toUserId?: number;
  action: string;
  notes?: string;
}

export interface ComplaintWorkflowResponseDto {
  id: number;
  complaintId: number;
  fromRole?: string;
  toRole?: string;
  fromUserId?: number;
  toUserId?: number;
  action: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
