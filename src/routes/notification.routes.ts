import { Router } from "express";
import notificationController from "../controllers/notification.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { checkPermission } from "../middlewares/permission.middleware";
import { PERMISSIONS } from "../constants/permissions";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: Real-time notification management with Socket.IO
 */

/**
 * @swagger
 * /notifications/send:
 *   post:
 *     tags: [Notifications]
 *     summary: Send notification to user(s) or room
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - title
 *               - message
 *             properties:
 *               userId:
 *                 type: string
 *                 description: Send to a specific user
 *               userIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Send to multiple users
 *               roomId:
 *                 type: string
 *                 description: Send to a specific room
 *               broadcast:
 *                 type: boolean
 *                 description: Broadcast to all connected users
 *               type:
 *                 type: string
 *                 description: Notification type (e.g., match_update, tournament_start)
 *               title:
 *                 type: string
 *                 description: Notification title
 *               message:
 *                 type: string
 *                 description: Notification message
 *               data:
 *                 type: object
 *                 description: Additional data payload
 *     responses:
 *       200:
 *         description: Notification sent successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post("/send",
  authenticate,
  checkPermission(PERMISSIONS.NOTIFICATIONS_SEND),
  notificationController.sendNotification
);

/**
 * @swagger
 * /notifications/event:
 *   post:
 *     tags: [Notifications]
 *     summary: Send custom event to user or room
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - event
 *               - data
 *             properties:
 *               userId:
 *                 type: string
 *                 description: Send to specific user
 *               roomId:
 *                 type: string
 *                 description: Send to specific room
 *               event:
 *                 type: string
 *                 description: Event name
 *               data:
 *                 type: object
 *                 description: Event data
 *     responses:
 *       200:
 *         description: Event sent successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post("/event",
  authenticate,
  checkPermission(PERMISSIONS.NOTIFICATIONS_SEND),
  notificationController.sendEvent
);

/**
 * @swagger
 * /notifications/connected-users:
 *   get:
 *     tags: [Notifications]
 *     summary: Get all connected users
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of connected users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalConnectedUsers:
 *                   type: number
 *                 connectedUserIds:
 *                   type: array
 *                   items:
 *                     type: string
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get("/connected-users", authenticate, notificationController.getConnectedUsers);

/**
 * @swagger
 * /notifications/status/{userId}:
 *   get:
 *     tags: [Notifications]
 *     summary: Check if a user is connected
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID to check
 *     responses:
 *       200:
 *         description: User connection status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 userId:
 *                   type: string
 *                 isConnected:
 *                   type: boolean
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get("/status/:userId", authenticate, notificationController.checkUserConnection);

/**
 * @swagger
 * /notifications/disconnect/{userId}:
 *   post:
 *     tags: [Notifications]
 *     summary: Disconnect a specific user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID to disconnect
 *     responses:
 *       200:
 *         description: User disconnected successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post("/disconnect/:userId", authenticate, notificationController.disconnectUser);

/**
 * @swagger
 * /notifications/status:
 *   get:
 *     tags: [Notifications]
 *     summary: Get notification service status
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Service status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 status:
 *                   type: string
 *                 connectedUsers:
 *                   type: number
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get("/status", authenticate, notificationController.getStatus);

export default router;
