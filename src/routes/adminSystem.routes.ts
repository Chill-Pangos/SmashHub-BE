import { Router } from "express";
import adminSystemController from "../controllers/adminSystem.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { checkPermission } from "../middlewares/permission.middleware";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Admin System
 *   description: Admin-only system health, runtime metrics, events, and audit logs
 */

/**
 * @swagger
 * /admin/system/summary:
 *   get:
 *     tags: [Admin System]
 *     summary: Get concise FE-friendly system summary
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Concise system summary
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       enum: [ok, warning, critical]
 *                     resources:
 *                       type: object
 *                       properties:
 *                         cpu:
 *                           type: object
 *                           properties:
 *                             percent:
 *                               type: number
 *                               example: 12.4
 *                             status:
 *                               type: string
 *                               enum: [ok, warning, critical]
 *                             label:
 *                               type: string
 *                               example: "12.4%"
 *                         ram:
 *                           type: object
 *                           properties:
 *                             percent:
 *                               type: number
 *                               example: 63.8
 *                             status:
 *                               type: string
 *                               enum: [ok, warning, critical]
 *                             label:
 *                               type: string
 *                               example: "63.8%"
 *                             usedGb:
 *                               type: number
 *                               example: 2.8
 *                             totalGb:
 *                               type: number
 *                               example: 8
 *                         disk:
 *                           type: object
 *                           properties:
 *                             percent:
 *                               type: number
 *                               nullable: true
 *                               example: 41.2
 *                             status:
 *                               type: string
 *                               enum: [ok, warning, critical]
 *                             label:
 *                               type: string
 *                               example: "41.2%"
 *                             path:
 *                               type: string
 *                               nullable: true
 *                             usedGb:
 *                               type: number
 *                               nullable: true
 *                               example: 24.5
 *                             totalGb:
 *                               type: number
 *                               nullable: true
 *                               example: 100
 *                     services:
 *                       type: object
 *                       properties:
 *                         db:
 *                           type: string
 *                           enum: [up, down, degraded]
 *                         redis:
 *                           type: string
 *                           enum: [up, down, degraded]
 *                         socket:
 *                           type: string
 *                           enum: [up, down, degraded]
 *                         cron:
 *                           type: string
 *                           enum: [up, down, degraded]
 *                     traffic:
 *                       type: object
 *                       properties:
 *                         window:
 *                           type: string
 *                           example: 5m
 *                         requestCount:
 *                           type: integer
 *                         errorPercent:
 *                           type: number
 *                         p95LatencyMs:
 *                           type: number
 *                     realtime:
 *                       type: object
 *                       properties:
 *                         connectedUsers:
 *                           type: integer
 *                         roomCount:
 *                           type: integer
 *                     alerts:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         critical:
 *                           type: integer
 *                         warning:
 *                           type: integer
 *                     uptimeSeconds:
 *                       type: integer
 *                     generatedAt:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Missing admin_system:view permission
 */
router.get(
  "/summary",
  authenticate,
  checkPermission("admin_system:view"),
  adminSystemController.summary.bind(adminSystemController),
);

/**
 * @swagger
 * /admin/system/health:
 *   get:
 *     tags: [Admin System]
 *     summary: Get current system health status
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: System health status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     app:
 *                       type: string
 *                       enum: [up, down, degraded]
 *                     db:
 *                       type: string
 *                       enum: [up, down, degraded]
 *                     redis:
 *                       type: string
 *                       enum: [up, down, degraded]
 *                     socket:
 *                       type: string
 *                       enum: [up, down, degraded]
 *                     cron:
 *                       type: string
 *                       enum: [up, down, degraded]
 *                     generatedAt:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Missing admin_system:view permission
 */
router.get(
  "/health",
  authenticate,
  checkPermission("admin_system:view"),
  adminSystemController.health.bind(adminSystemController),
);

/**
 * @swagger
 * /admin/system/metrics:
 *   get:
 *     tags: [Admin System]
 *     summary: Get API runtime metrics for a rolling window
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: window
 *         schema:
 *           type: string
 *           enum: [1m, 5m, 15m]
 *           default: 5m
 *         description: Rolling metrics window
 *     responses:
 *       200:
 *         description: Runtime metrics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     window:
 *                       type: string
 *                     requestCount:
 *                       type: integer
 *                     statusGroups:
 *                       type: object
 *                     errorCount:
 *                       type: integer
 *                     errorRate:
 *                       type: number
 *                     latency:
 *                       type: object
 *                     slowRoutes:
 *                       type: array
 *                       items:
 *                         type: object
 *                     generatedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Invalid window
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Missing admin_system:view permission
 */
router.get(
  "/metrics",
  authenticate,
  checkPermission("admin_system:view"),
  adminSystemController.metrics.bind(adminSystemController),
);

/**
 * @swagger
 * /admin/system/events:
 *   get:
 *     tags: [Admin System]
 *     summary: Get recent system events
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [error, alert, cron]
 *         description: Event type filter
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *           minimum: 1
 *           maximum: 100
 *         description: Maximum events returned
 *     responses:
 *       200:
 *         description: Recent system events
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *       400:
 *         description: Invalid query
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Missing admin_system:view permission
 */
router.get(
  "/events",
  authenticate,
  checkPermission("admin_system:view"),
  adminSystemController.events.bind(adminSystemController),
);

/**
 * @swagger
 * /admin/system/audit-logs:
 *   get:
 *     tags: [Admin System]
 *     summary: Get admin audit logs
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *           enum: [create, update, delete]
 *         description: Action filter
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *           minimum: 0
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *           minimum: 1
 *           maximum: 100
 *     responses:
 *       200:
 *         description: Admin audit logs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     rows:
 *                       type: array
 *                       items:
 *                         type: object
 *                     pagination:
 *                       type: object
 *       400:
 *         description: Invalid query
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Missing admin_system:view permission
 */
router.get(
  "/audit-logs",
  authenticate,
  checkPermission("admin_system:view"),
  adminSystemController.auditLogs.bind(adminSystemController),
);

export default router;
