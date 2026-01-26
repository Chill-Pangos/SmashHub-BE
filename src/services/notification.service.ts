import { Server as SocketIOServer, Socket } from "socket.io";
import { Server as HTTPServer } from "http";
import { SendNotificationDto } from "../dto/notification.dto";

interface NotificationPayload {
  type: string;
  title: string;
  message: string;
  data?: any;
  timestamp?: Date;
}

class NotificationService {
  private static io: SocketIOServer;
  private static connectedUsers: Map<string, string> = new Map(); // userId -> socketId

  /**
   * Initialize Socket.IO server
   */
  static initialize(httpServer: HTTPServer): void {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: "*", // Configure this based on your frontend URL
        methods: ["GET", "POST"],
        credentials: true,
      },
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    this.setupConnectionHandlers();
    console.log("NotificationService initialized");
  }

  /**
   * Setup connection handlers for Socket.IO
   */
  private static setupConnectionHandlers(): void {
    this.io.on("connection", (socket: Socket) => {
      console.log(`Client connected: ${socket.id}`);

      // Handle user authentication/registration
      socket.on("register", (userId: string) => {
        if (userId) {
          this.connectedUsers.set(userId, socket.id);
          socket.join(`user:${userId}`);
          console.log(`User ${userId} registered with socket ${socket.id}`);
          
          // Send confirmation
          socket.emit("registered", {
            message: "Successfully registered for notifications",
            userId,
          });
        }
      });

      // Handle user unregistration
      socket.on("unregister", (userId: string) => {
        if (userId) {
          this.connectedUsers.delete(userId);
          socket.leave(`user:${userId}`);
          console.log(`User ${userId} unregistered`);
        }
      });

      // Handle join room (for group notifications)
      socket.on("join-room", (roomId: string) => {
        socket.join(roomId);
        console.log(`Socket ${socket.id} joined room ${roomId}`);
      });

      // Handle leave room
      socket.on("leave-room", (roomId: string) => {
        socket.leave(roomId);
        console.log(`Socket ${socket.id} left room ${roomId}`);
      });

      // Handle disconnection
      socket.on("disconnect", () => {
        // Remove user from connected users map
        for (const [userId, socketId] of this.connectedUsers.entries()) {
          if (socketId === socket.id) {
            this.connectedUsers.delete(userId);
            console.log(`User ${userId} disconnected`);
            break;
          }
        }
        console.log(`Client disconnected: ${socket.id}`);
      });
    });
  }

  /**
   * Send notification to a specific user
   */
  static sendToUser(userId: string, notification: NotificationPayload): void {
    if (!this.io) {
      console.error("Socket.IO not initialized");
      return;
    }

    const payload = {
      ...notification,
      timestamp: notification.timestamp || new Date(),
    };

    this.io.to(`user:${userId}`).emit("notification", payload);
    console.log(`Notification sent to user ${userId}:`, notification.type);
  }

  /**
   * Send notification to multiple users
   */
  static sendToUsers(userIds: string[], notification: NotificationPayload): void {
    if (!this.io) {
      console.error("Socket.IO not initialized");
      return;
    }

    const payload = {
      ...notification,
      timestamp: notification.timestamp || new Date(),
    };

    userIds.forEach((userId) => {
      this.io.to(`user:${userId}`).emit("notification", payload);
    });
    
    console.log(`Notification sent to ${userIds.length} users:`, notification.type);
  }

  /**
   * Send notification to a room/group
   */
  static sendToRoom(roomId: string, notification: NotificationPayload): void {
    if (!this.io) {
      console.error("Socket.IO not initialized");
      return;
    }

    const payload = {
      ...notification,
      timestamp: notification.timestamp || new Date(),
    };

    this.io.to(roomId).emit("notification", payload);
    console.log(`Notification sent to room ${roomId}:`, notification.type);
  }

  /**
   * Broadcast notification to all connected clients
   */
  static broadcast(notification: NotificationPayload): void {
    if (!this.io) {
      console.error("Socket.IO not initialized");
      return;
    }

    const payload = {
      ...notification,
      timestamp: notification.timestamp || new Date(),
    };

    this.io.emit("notification", payload);
    console.log(`Broadcast notification sent:`, notification.type);
  }

  /**
   * Send custom event to a specific user
   */
  static sendEventToUser(userId: string, event: string, data: any): void {
    if (!this.io) {
      console.error("Socket.IO not initialized");
      return;
    }

    this.io.to(`user:${userId}`).emit(event, data);
    console.log(`Event ${event} sent to user ${userId}`);
  }

  /**
   * Send custom event to a room
   */
  static sendEventToRoom(roomId: string, event: string, data: any): void {
    if (!this.io) {
      console.error("Socket.IO not initialized");
      return;
    }

    this.io.to(roomId).emit(event, data);
    console.log(`Event ${event} sent to room ${roomId}`);
  }

  /**
   * Get connected users count
   */
  static getConnectedUsersCount(): number {
    return this.connectedUsers.size;
  }

  /**
   * Check if user is connected
   */
  static isUserConnected(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }

  /**
   * Get all connected user IDs
   */
  static getConnectedUserIds(): string[] {
    return Array.from(this.connectedUsers.keys());
  }

  /**
   * Disconnect a specific user
   */
  static disconnectUser(userId: string): void {
    const socketId = this.connectedUsers.get(userId);
    if (socketId && this.io) {
      const socket = this.io.sockets.sockets.get(socketId);
      if (socket) {
        socket.disconnect(true);
        this.connectedUsers.delete(userId);
        console.log(`User ${userId} forcefully disconnected`);
      }
    }
  }
}

export default NotificationService;