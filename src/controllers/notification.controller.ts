import { Request, Response } from "express";
import NotificationService from "../services/notification.service";
import {
  CreateNotificationDto,
  NotificationResponseDto,
  ConnectedUsersDto,
  UserConnectionStatusDto,
  SendEventDto,
  NotificationStatsDto,
} from "../dto/notification.dto";

export class NotificationController {
  /**
   * Send notification
   */
  async sendNotification(req: Request, res: Response): Promise<void> {
    try {
      const {
        userId,
        userIds,
        roomId,
        type,
        title,
        message,
        data,
        broadcast,
      } = req.body as CreateNotificationDto;

      const notificationPayload = {
        type,
        title,
        message,
        data,
        timestamp: new Date(),
      };

      let recipientCount = 0;

      if (broadcast) {
        // Broadcast to all
        NotificationService.broadcast(notificationPayload);
        recipientCount = NotificationService.getConnectedUsersCount();
      } else if (userId) {
        // Send to single user
        NotificationService.sendToUser(userId, notificationPayload);
        recipientCount = 1;
      } else if (userIds && userIds.length > 0) {
        // Send to multiple users
        NotificationService.sendToUsers(userIds, notificationPayload);
        recipientCount = userIds.length;
      } else if (roomId) {
        // Send to room
        NotificationService.sendToRoom(roomId, notificationPayload);
        recipientCount = -1; // Unknown for rooms
      } else {
        res.status(400).json({
          success: false,
          message: "Must specify userId, userIds, roomId, or broadcast: true",
        });
        return;
      }

      const response: NotificationResponseDto = {
        success: true,
        message: "Notification sent successfully",
        recipientCount,
        timestamp: new Date(),
      };

      res.status(200).json(response);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error sending notification",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Send custom event
   */
  async sendEvent(req: Request, res: Response): Promise<void> {
    try {
      const { userId, roomId, event, data } = req.body as SendEventDto;

      if (!event) {
        res.status(400).json({
          success: false,
          message: "Event name is required",
        });
        return;
      }

      if (userId) {
        NotificationService.sendEventToUser(userId, event, data);
      } else if (roomId) {
        NotificationService.sendEventToRoom(roomId, event, data);
      } else {
        res.status(400).json({
          success: false,
          message: "Must specify userId or roomId",
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: "Event sent successfully",
        timestamp: new Date(),
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error sending event",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Get connected users statistics
   */
  async getConnectedUsers(req: Request, res: Response): Promise<void> {
    try {
      const connectedUserIds = NotificationService.getConnectedUserIds();
      const count = NotificationService.getConnectedUsersCount();

      const response: NotificationStatsDto = {
        totalConnectedUsers: count,
        connectedUserIds,
      };

      res.status(200).json(response);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error fetching connected users",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Check if user is connected
   */
  async checkUserConnection(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;

      if (!userId || typeof userId !== 'string') {
        res.status(400).json({
          success: false,
          message: "userId is required",
        });
        return;
      }

      const isConnected = NotificationService.isUserConnected(userId);

      const response: UserConnectionStatusDto = {
        userId,
        isConnected,
      };

      res.status(200).json(response);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error checking user connection",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Disconnect a user
   */
  async disconnectUser(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;

      if (!userId || typeof userId !== 'string') {
        res.status(400).json({
          success: false,
          message: "userId is required",
        });
        return;
      }

      NotificationService.disconnectUser(userId);

      res.status(200).json({
        success: true,
        message: `User ${userId} disconnected successfully`,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error disconnecting user",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Get notification service status
   */
  async getStatus(req: Request, res: Response): Promise<void> {
    try {
      const connectedUsers = NotificationService.getConnectedUsersCount();
      
      res.status(200).json({
        success: true,
        status: "running",
        connectedUsers,
        timestamp: new Date(),
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error getting service status",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
}

export default new NotificationController();
