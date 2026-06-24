import { Request, Response, NextFunction } from "express";
import type { AuthRequest } from "../middlewares/auth.middleware";
import NotificationService from "../services/notification.service";
import { NOTIFICATION_TYPES, type NotificationType } from "../models/notification.model";
import {
  CreateNotificationDto,
  NotificationResponseDto,
  UserConnectionStatusDto,
  NotificationStatsDto,
  SendEventDto,
} from "../dto/notification.dto";
import { BadRequestError, UnauthorizedError } from "../utils/errors.helper";
import { parsePagination, parsePositiveInt } from "../utils/request.helper";

const NOTIFICATION_TYPE_SET = new Set<string>(NOTIFICATION_TYPES);

function parseBoolean(value: unknown, fieldName: string): boolean | undefined {
  if (value === undefined) return undefined;
  if (value === "true" || value === true) return true;
  if (value === "false" || value === false) return false;
  throw new BadRequestError(`${fieldName} must be true or false`);
}

export class NotificationController {
  /**
   * Get current user's notification inbox
   */
  async getMyNotifications(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.userId) throw new UnauthorizedError("Authentication required");

      const type = req.query.type ? String(req.query.type) : undefined;
      if (type && !NOTIFICATION_TYPE_SET.has(type)) {
        throw new BadRequestError("Invalid notification type");
      }

      const options: {
        offset?: number;
        limit?: number;
        isRead?: boolean;
        type?: NotificationType;
      } = {};
      const { offset, limit } = parsePagination(req.query);
      const isRead = parseBoolean(req.query.isRead, "isRead");

      options.offset = offset;
      options.limit = limit;
      if (isRead !== undefined) options.isRead = isRead;
      if (type) options.type = type as NotificationType;

      const result = await NotificationService.getByUser(req.userId, options);

      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mark one notification as read for current user
   */
  async markAsRead(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.userId) throw new UnauthorizedError("Authentication required");

      const notificationId = parsePositiveInt(req.params.notificationId, "notificationId");
      await NotificationService.markAsRead(notificationId, req.userId);

      res.status(200).json({
        success: true,
        message: "Notification marked as read",
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mark all notifications as read for current user
   */
  async markAllAsRead(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.userId) throw new UnauthorizedError("Authentication required");

      await NotificationService.markAllAsRead(req.userId);

      res.status(200).json({
        success: true,
        message: "All notifications marked as read",
      });
    } catch (error) {
      next(error);
    }
  }

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

      NotificationService.forceDisconnectUser(userId);

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
