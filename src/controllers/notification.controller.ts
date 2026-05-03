import { Request, Response, NextFunction } from "express";
import NotificationService from "../services/notification.service";
import {
  CreateNotificationDto,
  NotificationResponseDto,
  ConnectedUsersDto,
  UserConnectionStatusDto,
  SendEventDto,
  NotificationStatsDto,
} from "../dto/notification.dto";
import { BadRequestError } from "../utils/errors";

export class NotificationController {
  /**
   * Send notification
   */
  async sendNotification(req: Request, res: Response, next: NextFunction): Promise<void> {
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
        throw new BadRequestError("Must specify userId, userIds, roomId, or broadcast: true");
      }

      const response: NotificationResponseDto = {
        success: true,
        message: "Notification sent successfully",
        recipientCount,
        timestamp: new Date(),
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Send custom event
   */
  async sendEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId, roomId, event, data } = req.body as SendEventDto;

      if (!event) {
        throw new BadRequestError("Event name is required");
      }

      if (userId) {
        NotificationService.sendEventToUser(userId, event, data);
      } else if (roomId) {
        NotificationService.sendEventToRoom(roomId, event, data);
      } else {
        throw new BadRequestError("Must specify userId or roomId");
      }

      res.status(200).json({
        success: true,
        message: "Event sent successfully",
        timestamp: new Date(),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get connected users statistics
   */
  async getConnectedUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const connectedUserIds = NotificationService.getConnectedUserIds();
      const count = NotificationService.getConnectedUsersCount();

      const response: NotificationStatsDto = {
        totalConnectedUsers: count,
        connectedUserIds,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Check if user is connected
   */
  async checkUserConnection(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params;

      if (!userId || typeof userId !== 'string') {
        throw new BadRequestError("userId is required");
      }

      const isConnected = NotificationService.isUserConnected(userId);

      const response: UserConnectionStatusDto = {
        userId,
        isConnected,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Disconnect a user
   */
  async disconnectUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params;

      if (!userId || typeof userId !== 'string') {
        throw new BadRequestError("userId is required");
      }

      NotificationService.disconnectUser(userId);

      res.status(200).json({
        success: true,
        message: `User ${userId} disconnected successfully`,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get notification service status
   */
  async getStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const connectedUsers = NotificationService.getConnectedUsersCount();

      res.status(200).json({
        success: true,
        status: "running",
        connectedUsers,
        timestamp: new Date(),
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new NotificationController();
