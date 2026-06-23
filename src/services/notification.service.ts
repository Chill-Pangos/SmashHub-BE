// notification.service.ts
import { Server as SocketIOServer, Socket } from "socket.io";
import { Server as HTTPServer } from "http";
import { createAdapter } from "@socket.io/redis-adapter";
import Notification, { NotificationType } from "../models/notification.model";
import { Op } from "sequelize";
import redisClient, { connectRedis } from "../config/redis";
import type CronLog from "../models/cronLog.model";
import User from "../models/user.model";
import Role from "../models/role.model";
import authService from "./auth.service";
import { NotFoundError } from "../utils/errors.helper";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface NotificationPayload {
  type: string;
  title: string;
  message: string;
  data?: unknown;
  timestamp?: Date;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CORS_ORIGIN = process.env.FRONTEND_URL ?? "*";
const PING_TIMEOUT = 60_000;
const PING_INTERVAL = 25_000;
const REALTIME_NOTIFICATION_CHANNEL = "realtime:notifications";
const REALTIME_CRON_LOG_CHANNEL = "realtime:cron-logs";
const SOCKET_DEBUG_LOGS = process.env.SOCKET_DEBUG_LOGS !== "false";

function socketLog(
  level: "info" | "warn" | "error",
  message: string,
  meta?: Record<string, unknown>,
): void {
  if (!SOCKET_DEBUG_LOGS) return;
  const payload = meta ? ` ${JSON.stringify(meta)}` : "";
  console[level](`[socket] ${message}${payload}`);
}

function userRoom(userId: string): string {
  return `user:${userId}`;
}

function withTimestamp(payload: NotificationPayload): NotificationPayload {
  return { ...payload, timestamp: payload.timestamp ?? new Date() };
}

function assertInitialized(io: SocketIOServer | null): asserts io is SocketIOServer {
  if (!io) throw new Error("NotificationService is not initialized. Call initialize() first.");
}

function getSocketToken(socket: Socket): string | null {
  const authToken = socket.handshake.auth?.token;
  if (typeof authToken === "string" && authToken.trim()) {
    return authToken.startsWith("Bearer ") ? authToken.slice(7) : authToken;
  }

  const authorization = socket.handshake.headers.authorization;
  if (typeof authorization === "string" && authorization.startsWith("Bearer ")) {
    return authorization.slice(7);
  }

  return null;
}

function maskToken(token: string | null): string | null {
  if (!token) return null;
  if (token.length <= 12) return "***";
  return `${token.slice(0, 6)}...${token.slice(-4)}`;
}

function getSocketRequestMeta(socket: Socket): Record<string, unknown> {
  return {
    socketId: socket.id,
    origin: socket.handshake.headers.origin ?? null,
    referer: socket.handshake.headers.referer ?? null,
    userAgent: socket.handshake.headers["user-agent"] ?? null,
    transport: socket.conn.transport.name,
    address: socket.handshake.address,
  };
}

// ─── Notification builders ────────────────────────────────────────────────────
// Tập trung tất cả message template ở 1 chỗ

export const NotificationTemplates = {
  joinRequest: (requesterName: string, entryName: string) => ({
    type: "join_request" as NotificationType,
    title: "New Join Request",
    message: `${requesterName} wants to join your team "${entryName}"`,
  }),

  joinRequestApproved: (entryName: string) => ({
    type: "join_request_approved" as NotificationType,
    title: "Join Request Approved",
    message: `Your request to join "${entryName}" has been approved`,
  }),

  joinRequestRejected: (entryName: string) => ({
    type: "join_request_rejected" as NotificationType,
    title: "Join Request Rejected",
    message: `Your request to join "${entryName}" has been rejected`,
  }),

  paymentConfirmed: (categoryName: string) => ({
    type: "payment_confirmed" as NotificationType,
    title: "Payment Confirmed",
    message: `Your payment for "${categoryName}" has been confirmed`,
  }),

  paymentRejected: (categoryName: string) => ({
    type: "payment_rejected" as NotificationType,
    title: "Payment Rejected",
    message: `Your payment for "${categoryName}" has been rejected`,
  }),

  paymentRefunded: (categoryName: string) => ({
    type: "payment_refunded" as NotificationType,
    title: "Payment Refunded",
    message: `Your payment for "${categoryName}" has been refunded`,
  }),

  matchScheduled: (opponent: string, scheduledAt: Date) => ({
    type: "match_scheduled" as NotificationType,
    title: "Match Scheduled",
    message: `Your match against "${opponent}" is scheduled for ${scheduledAt.toLocaleString()}`,
  }),

  matchStartingSoon: (opponent: string, minutesLeft: number) => ({
    type: "match_starting_soon" as NotificationType,
    title: "Match Starting Soon",
    message: `Your match against "${opponent}" starts in ${minutesLeft} minutes`,
  }),

  matchResult: (opponent: string, won: boolean) => ({
    type: "match_result" as NotificationType,
    title: won ? "Match Won" : "Match Lost",
    message: `You ${won ? "won" : "lost"} your match against "${opponent}"`,
  }),

  tournamentAnnouncement: (tournamentName: string, announcement: string) => ({
    type: "tournament_announcement" as NotificationType,
    title: `[${tournamentName}] Announcement`,
    message: announcement,
  }),

  refereeInvitation: (tournamentName: string) => ({
    type: "referee_invitation" as NotificationType,
    title: "Referee Invitation",
    message: `You have been invited to referee at "${tournamentName}"`,
  }),

  tournamentStatusChanged: (tournamentName: string, statusLabel: string) => ({
    type: "tournament_status_changed" as NotificationType,
    title: `Tournament status updated: ${tournamentName}`,
    message: `"${tournamentName}" is now ${statusLabel}`,
  }),
};

// ─── Service ──────────────────────────────────────────────────────────────────

class NotificationService {
  private io: SocketIOServer | null = null;
  private lastSocketError: string | null = null;

  // socketId → userId (reverse map để disconnect lookup O(1))
  private socketToUser = new Map<string, string>();

  // userId → socketId
  private userToSocket = new Map<string, string>();
  private realtimeSubscriber: ReturnType<typeof redisClient.duplicate> | null = null;

  // ── Init ───────────────────────────────────────────────────────────────────

  initialize(httpServer: HTTPServer): void {
    if (this.io) {
      console.warn("NotificationService already initialized");
      return;
    }

    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: CORS_ORIGIN,
        methods: ["GET", "POST"],
        credentials: true,
      },
      transports: ["websocket"],
      pingTimeout: PING_TIMEOUT,
      pingInterval: PING_INTERVAL,
    });

    socketLog("info", "initialized", {
      corsOrigin: CORS_ORIGIN,
      transports: ["websocket"],
      pingTimeout: PING_TIMEOUT,
      pingInterval: PING_INTERVAL,
      debugLogs: SOCKET_DEBUG_LOGS,
    });

    this.setupEngineDebugHandlers();
    this.setupRedisAdapter().catch((error) => {
      this.lastSocketError = error instanceof Error ? error.message : String(error);
      socketLog("error", "redis adapter failed", { error: this.lastSocketError });
      console.error("Socket.IO Redis adapter failed:", error);
    });
    this.setupConnectionHandlers();
    this.startRealtimeSubscriber().catch((error) => {
      socketLog("error", "realtime subscriber failed", {
        error: error instanceof Error ? error.message : String(error),
      });
      console.error("Realtime subscriber failed:", error);
    });
  }

  private setupEngineDebugHandlers(): void {
    assertInitialized(this.io);

    this.io.engine.on("connection_error", (error) => {
      socketLog("warn", "engine connection error", {
        code: error.code,
        message: error.message,
        context: error.context,
        origin: error.req?.headers.origin ?? null,
        referer: error.req?.headers.referer ?? null,
        userAgent: error.req?.headers["user-agent"] ?? null,
        url: error.req?.url,
      });
    });
  }

  private async setupRedisAdapter(): Promise<void> {
    assertInitialized(this.io);
    await connectRedis();
    if (!redisClient.isReady) {
      socketLog("warn", "redis adapter skipped because redis is not ready");
      return;
    }

    const pubClient = redisClient.duplicate();
    const subClient = redisClient.duplicate();
    await Promise.all([pubClient.connect(), subClient.connect()]);
    this.io.adapter(createAdapter(pubClient, subClient));
    socketLog("info", "redis adapter ready");
  }

  private setupConnectionHandlers(): void {
    assertInitialized(this.io);

    this.io.on("connection", async (socket: Socket) => {
      const token = getSocketToken(socket);
      socketLog("info", "connection attempt", {
        ...getSocketRequestMeta(socket),
        token: maskToken(token),
        hasAuthToken: typeof socket.handshake.auth?.token === "string",
        hasAuthorizationHeader: typeof socket.handshake.headers.authorization === "string",
      });

      if (!token) {
        socketLog("warn", "disconnect missing token", getSocketRequestMeta(socket));
        socket.disconnect(true);
        return;
      }

      let authenticatedUserId: string;
      try {
        const decoded = await authService.verifyToken(token);
        authenticatedUserId = String(decoded.userId);
        socketLog("info", "authenticated", {
          ...getSocketRequestMeta(socket),
          userId: authenticatedUserId,
        });
      } catch (error) {
        socketLog("warn", "disconnect invalid token", {
          ...getSocketRequestMeta(socket),
          error: error instanceof Error ? error.message : String(error),
        });
        socket.disconnect(true);
        return;
      }

      socket.on("register", (userId: string) => {
        socketLog("info", "register requested", {
          socketId: socket.id,
          requestedUserId: userId || null,
          authenticatedUserId,
        });

        if (userId && userId !== authenticatedUserId) {
          socketLog("warn", "register denied different user", {
            socketId: socket.id,
            requestedUserId: userId,
            authenticatedUserId,
          });
          socket.emit("registration_error", { message: "Cannot register another user" });
          return;
        }

        // Kick previous session nếu user đăng nhập từ thiết bị khác
        const prevSocketId = this.userToSocket.get(authenticatedUserId);
        if (prevSocketId && prevSocketId !== socket.id) {
          socketLog("info", "replace previous socket", {
            userId: authenticatedUserId,
            previousSocketId: prevSocketId,
            newSocketId: socket.id,
          });
          this.userToSocket.delete(authenticatedUserId);
          this.socketToUser.delete(prevSocketId);
        }

        this.userToSocket.set(authenticatedUserId, socket.id);
        this.socketToUser.set(socket.id, authenticatedUserId);
        socket.join(userRoom(authenticatedUserId));

        socket.emit("registered", { userId: authenticatedUserId });
        socketLog("info", "registered", {
          socketId: socket.id,
          userId: authenticatedUserId,
          room: userRoom(authenticatedUserId),
          connectedUsers: this.getConnectedUsersCount(),
        });
      });

      socket.on("unregister", (userId: string) => {
        if (userId && userId !== authenticatedUserId) {
          socketLog("warn", "unregister ignored different user", {
            socketId: socket.id,
            requestedUserId: userId,
            authenticatedUserId,
          });
          return;
        }
        this.removeUser(authenticatedUserId);
        socket.leave(userRoom(authenticatedUserId));
        socketLog("info", "unregistered", {
          socketId: socket.id,
          userId: authenticatedUserId,
          connectedUsers: this.getConnectedUsersCount(),
        });
      });

      socket.on("join-room", async (roomId: string) => {
        if (!roomId) {
          socketLog("warn", "join-room ignored empty room", {
            socketId: socket.id,
            userId: authenticatedUserId,
          });
          return;
        }

        socketLog("info", "join-room requested", {
          socketId: socket.id,
          userId: authenticatedUserId,
          roomId,
        });

        if (roomId === "admin:system") {
          try {
            const adminUserIds = await this.getAdminUserIds();
            if (!adminUserIds.includes(Number(authenticatedUserId))) {
              socketLog("warn", "join-room denied admin required", {
                socketId: socket.id,
                userId: authenticatedUserId,
                roomId,
              });
              socket.emit("room_join_error", { roomId, message: "Admin access required" });
              return;
            }
          } catch (error) {
            socketLog("error", "join-room admin check failed", {
              socketId: socket.id,
              userId: authenticatedUserId,
              roomId,
              error: error instanceof Error ? error.message : String(error),
            });
            socket.emit("room_join_error", { roomId, message: "Admin access check failed" });
            return;
          }
        }

        socket.join(roomId);
        socketLog("info", "joined room", {
          socketId: socket.id,
          userId: authenticatedUserId,
          roomId,
        });
      });

      socket.on("leave-room", (roomId: string) => {
        if (roomId) {
          socket.leave(roomId);
          socketLog("info", "left room", {
            socketId: socket.id,
            userId: authenticatedUserId,
            roomId,
          });
        }
      });

      socket.on("disconnect", (reason) => {
        const userId = this.socketToUser.get(socket.id);
        if (userId) {
          this.removeUser(userId);
        }
        socketLog("info", "disconnected", {
          socketId: socket.id,
          userId: userId ?? authenticatedUserId,
          reason,
          connectedUsers: this.getConnectedUsersCount(),
        });
      });

      socket.on("error", (error) => {
        this.lastSocketError = error instanceof Error ? error.message : String(error);
        socketLog("error", "socket error", {
          socketId: socket.id,
          userId: authenticatedUserId,
          error: this.lastSocketError,
        });
      });
    });
  }

  private removeUser(userId: string): void {
    const socketId = this.userToSocket.get(userId);
    if (socketId) this.socketToUser.delete(socketId);
    this.userToSocket.delete(userId);
  }

  // ── Send helpers ───────────────────────────────────────────────────────────

  sendToUser(userId: string, payload: NotificationPayload): void {
    assertInitialized(this.io);
    this.io.to(userRoom(userId)).emit("notification", withTimestamp(payload));
  }

  sendToUsers(userIds: string[], payload: NotificationPayload): void {
    assertInitialized(this.io);
    const stamped = withTimestamp(payload);
    for (const userId of userIds) {
      this.io.to(userRoom(userId)).emit("notification", stamped);
    }
  }

  sendToRoom(roomId: string, payload: NotificationPayload): void {
    assertInitialized(this.io);
    this.io.to(roomId).emit("notification", withTimestamp(payload));
  }

  broadcast(payload: NotificationPayload): void {
    assertInitialized(this.io);
    this.io.emit("notification", withTimestamp(payload));
  }

  sendEventToUser(userId: string, event: string, data: unknown): void {
    assertInitialized(this.io);
    this.io.to(userRoom(userId)).emit(event, data);
  }

  sendEventToRoom(roomId: string, event: string, data: unknown): void {
    assertInitialized(this.io);
    this.io.to(roomId).emit(event, data);
  }

  private sendLocalToUsers(userIds: string[], payload: NotificationPayload): void {
    if (!this.io) return;
    const stamped = withTimestamp(payload);
    for (const userId of userIds) {
      this.io.local.to(userRoom(userId)).emit("notification", stamped);
    }
  }

  private sendLocalCronLog(userIds: string[], log: unknown): void {
    if (!this.io) return;
    for (const userId of userIds) {
      this.io.local.to(userRoom(userId)).emit("cron_logs_created", { logs: [log] });
    }
  }

  private async startRealtimeSubscriber(): Promise<void> {
    if (!this.io || this.realtimeSubscriber?.isOpen) return;

    await connectRedis();
    this.realtimeSubscriber = redisClient.duplicate();
    await this.realtimeSubscriber.connect();

    await this.realtimeSubscriber.subscribe(REALTIME_NOTIFICATION_CHANNEL, (message) => {
      try {
        const payload = JSON.parse(message) as {
          userIds: string[];
          notification: NotificationPayload;
        };
        this.sendLocalToUsers(payload.userIds, payload.notification);
      } catch (error) {
        console.error("Invalid realtime notification payload:", error);
      }
    });

    await this.realtimeSubscriber.subscribe(REALTIME_CRON_LOG_CHANNEL, (message) => {
      try {
        const payload = JSON.parse(message) as { userIds: string[]; log: unknown };
        this.sendLocalCronLog(payload.userIds, payload.log);
      } catch (error) {
        console.error("Invalid realtime cron log payload:", error);
      }
    });
  }

  private async publishRealtimeNotification(
    userIds: string[],
    payload: NotificationPayload,
  ): Promise<void> {
    if (userIds.length === 0) return;

    await connectRedis();
    if (!redisClient.isReady) return;

    await redisClient.publish(
      REALTIME_NOTIFICATION_CHANNEL,
      JSON.stringify({ userIds, notification: withTimestamp(payload) }),
    );
  }

  async publishCronLog(log: CronLog): Promise<void> {
    await connectRedis();
    if (!redisClient.isReady) return;

    const userIds = await this.getAdminUserIds();
    if (userIds.length === 0) return;

    await redisClient.publish(
      REALTIME_CRON_LOG_CHANNEL,
      JSON.stringify({
        userIds: userIds.map(String),
        log: log.get ? log.get({ plain: true }) : log,
      }),
    );
  }

  private async getAdminUserIds(): Promise<number[]> {
    const admins = await User.findAll({
      attributes: ["id"],
      include: [
        {
          model: Role,
          as: "roles",
          where: { name: "admin" },
          through: { attributes: [] },
          required: true,
        },
      ],
    });

    return admins.map((admin) => admin.id);
  }

  // ── User state ─────────────────────────────────────────────────────────────

  isUserConnected(userId: string): boolean {
    return this.userToSocket.has(userId);
  }

  getConnectedUsersCount(): number {
    return this.userToSocket.size;
  }

  getConnectedUserIds(): string[] {
    return Array.from(this.userToSocket.keys());
  }

  getRoomCount(): number {
    if (!this.io) return 0;
    return this.io.sockets.adapter.rooms.size;
  }

  getAdapterMode(): "memory" | "redis" {
    if (!this.io) return "memory";
    const adapterName = this.io.sockets.adapter.constructor.name.toLowerCase();
    return adapterName.includes("redis") ? "redis" : "memory";
  }

  getLastSocketError(): string | null {
    return this.lastSocketError;
  }

  forceDisconnectUser(userId: string): void {
    assertInitialized(this.io);
    const socketId = this.userToSocket.get(userId);
    if (!socketId) return;

    const socket = this.io.sockets.sockets.get(socketId);
    socket?.disconnect(true);
    this.removeUser(userId);
  }

  /**
   * Tạo notification và gửi realtime đồng thời
   */
  async create(
    userId: number,
    payload: {
      type: NotificationType;
      title: string;
      message: string;
      referenceId?: number;
      referenceType?: string;
      data?: unknown;
    }
  ): Promise<Notification> {
    const notification = await Notification.create({
      userId,
      ...payload,
      isRead: false,
    });

    const realtimePayload = {
      type: payload.type,
      title: payload.title,
      message: payload.message,
      data: {
        notificationId: notification.id,
        referenceId: payload.referenceId,
        referenceType: payload.referenceType,
        ...(payload.data !== undefined ? { payload: payload.data } : {}),
      },
    };

    if (this.io) {
      this.sendToUser(String(userId), realtimePayload);
    } else {
      await this.publishRealtimeNotification([String(userId)], realtimePayload);
    }

    return notification;
  }

  /**
   * Gửi cho nhiều users cùng lúc
   */
  async createBulk(
    userIds: number[],
    payload: {
      type: NotificationType;
      title: string;
      message: string;
      referenceId?: number;
      referenceType?: string;
      data?: unknown;
    }
  ): Promise<void> {
    const notifications = await Notification.bulkCreate(
      userIds.map((userId) => ({ userId, ...payload, isRead: false }))
    );

    const notificationPayload = {
      type: payload.type,
      title: payload.title,
      message: payload.message,
      data: {
        referenceId: payload.referenceId,
        referenceType: payload.referenceType,
        notificationIds: notifications.map((notification) => notification.id),
        ...(payload.data !== undefined ? { payload: payload.data } : {}),
      },
    };

    const stringUserIds = userIds.map(String);
    if (this.io) {
      this.sendToUsers(stringUserIds, notificationPayload);
    } else {
      await this.publishRealtimeNotification(stringUserIds, notificationPayload);
    }
  }

  /**
   * Đánh dấu đã đọc
   */
  async markAsRead(notificationId: number, userId: number): Promise<void> {
    const notification = await Notification.findOne({
      where: { id: notificationId, userId },
    });
    if (!notification) throw new NotFoundError("Notification not found");
    if (notification.isRead) return; // idempotent

    await notification.update({ isRead: true, readAt: new Date() });
  }

  /**
   * Đánh dấu tất cả đã đọc
   */
  async markAllAsRead(userId: number): Promise<void> {
    await Notification.update(
      { isRead: true, readAt: new Date() },
      { where: { userId, isRead: false } }
    );
  }

  /**
   * Lấy danh sách notifications của user
   */
  async getByUser(
    userId: number,
    options: {
      offset?: number;
      limit?: number;
      isRead?: boolean;
      type?: NotificationType;
    } = {}
  ): Promise<{ rows: Notification[]; count: number; unreadCount: number }> {
    const { offset = 0, limit = 20, isRead, type } = options;

    const where: Record<string, unknown> = { userId };
    if (isRead !== undefined) where.isRead = isRead;
    if (type) where.type = type;

    const [{ rows, count }, unreadCount] = await Promise.all([
      Notification.findAndCountAll({
        where,
        order: [["createdAt", "DESC"]],
        offset,
        limit,
        distinct: true,
      }),
      Notification.count({ where: { userId, isRead: false } }),
    ]);

    return { rows, count, unreadCount };
  }

  /**
   * Xóa notifications cũ (cleanup job)
   * Xóa notifications đã đọc sau 30 ngày
   */
  async cleanup(daysOld = 30): Promise<number> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - daysOld);

    return await Notification.destroy({
      where: {
        isRead: true,
        readAt: { [Op.lt]: cutoff },
      },
    });
  }
}

export default new NotificationService();
