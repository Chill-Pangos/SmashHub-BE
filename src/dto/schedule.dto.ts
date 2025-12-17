// Schedule DTOs
export interface CreateScheduleDto {
  contentId: number;
  roundNumber?: number;
  groupName?: string;
  scheduledAt: Date;
}

export interface UpdateScheduleDto {
  roundNumber?: number;
  groupName?: string;
  scheduledAt?: Date;
}

export interface ScheduleResponseDto {
  id: number;
  contentId: number;
  roundNumber?: number;
  groupName?: string;
  scheduledAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
