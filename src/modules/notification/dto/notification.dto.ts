export interface CreateNotificationDto {
  userId?: string;
  userIds?: string[];
  roomId?: string;
  type: string;
  title: string;
  message: string;
  data?: any;
  broadcast?: boolean;
}

export interface SendNotificationDto {
  type: string;
  title: string;
  message: string;
  data?: any;
}

export interface NotificationResponseDto {
  success: boolean;
  message: string;
  recipientCount?: number;
  timestamp: Date;
}

export interface ConnectedUsersDto {
  connectedUsers: number;
  userIds: string[];
}

export interface UserConnectionStatusDto {
  userId: string;
  isConnected: boolean;
}

export interface SendEventDto {
  userId?: string;
  roomId?: string;
  event: string;
  data: any;
}

export interface NotificationStatsDto {
  totalConnectedUsers: number;
  connectedUserIds: string[];
}
