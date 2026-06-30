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
 *                     alerts:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         critical:
 *                           type: integer
 *                         warning:
 *                           type: integer
 *                         items:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               key:
 *                                 type: string
 *                                 example: cron_failed_24h
 *                               severity:
 *                                 type: string
 *                                 enum: [warning, critical]
 *                               message:
 *                                 type: string
 *                                 example: Cron failures in last 24h
 *                               createdAt:
 *                                 type: string
 *                                 format: date-time
 *                               data:
 *                                 type: object
 *                                 additionalProperties: true
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
 *     description: |
 *       Use `type=api` to fetch latest API request logs from `api_request_logs`.
 *
 *       For failed requests, public API responses may still hide internal 500 details,
 *       but api request logs keep the real `errorMessage` and optional
 *       `responseMeta.internalError` for admin diagnostics.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [error, alert, cron, api]
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
 *                   properties:
 *                     errors:
 *                       type: array
 *                       description: Present when type is omitted or type=error
 *                       items:
 *                         type: object
 *                         additionalProperties: true
 *                     alerts:
 *                       type: array
 *                       description: Present when type is omitted or type=alert
 *                       items:
 *                         type: object
 *                         additionalProperties: true
 *                     cronLogs:
 *                       type: array
 *                       description: Present when type is omitted or type=cron
 *                       items:
 *                         type: object
 *                         additionalProperties: true
 *                     apiRequestLogs:
 *                       type: array
 *                       description: Present when type is omitted or type=api
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                             example: 12
 *                           requestId:
 *                             type: string
 *                             nullable: true
 *                             example: "req_01J..."
 *                           userId:
 *                             type: integer
 *                             nullable: true
 *                             example: 13
 *                           method:
 *                             type: string
 *                             example: POST
 *                           path:
 *                             type: string
 *                             example: /api/schedules/generate-tournament
 *                           route:
 *                             type: string
 *                             nullable: true
 *                             example: /generate-tournament
 *                           statusCode:
 *                             type: integer
 *                             example: 500
 *                           success:
 *                             type: boolean
 *                             example: false
 *                           errorCode:
 *                             type: string
 *                             nullable: true
 *                             example: INTERNAL_ERROR
 *                           errorMessage:
 *                             type: string
 *                             nullable: true
 *                             description: Real server-side error message for admin diagnostics
 *                             example: "Column 'entryAId' cannot be null"
 *                           ip:
 *                             type: string
 *                             nullable: true
 *                             example: ::ffff:127.0.0.1
 *                           userAgent:
 *                             type: string
 *                             nullable: true
 *                           requestMeta:
 *                             type: object
 *                             nullable: true
 *                             additionalProperties: true
 *                             example:
 *                               query: {}
 *                               params: {}
 *                               body:
 *                                 tournamentId: 2
 *                           responseMeta:
 *                             type: object
 *                             nullable: true
 *                             additionalProperties: true
 *                             description: Captured response; failed requests may include internalError
 *                             properties:
 *                               response:
 *                                 type: object
 *                                 nullable: true
 *                                 additionalProperties: true
 *                               internalError:
 *                                 type: object
 *                                 nullable: true
 *                                 properties:
 *                                   details:
 *                                     nullable: true
 *                                     oneOf:
 *                                       - type: string
 *                                       - type: object
 *                                         additionalProperties: true
 *                                   stack:
 *                                     type: string
 *                                     nullable: true
 *                           startedAt:
 *                             type: string
 *                             format: date-time
 *                           finishedAt:
 *                             type: string
 *                             format: date-time
 *                           durationMs:
 *                             type: integer
 *                             example: 42
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                           updatedAt:
 *                             type: string
 *                             format: date-time
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
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *           minimum: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
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

/**
 * @swagger
 * /admin/system/audit-logs/{id}:
 *   get:
 *     tags: [Admin System]
 *     summary: Get audit log detail
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *     responses:
 *       200:
 *         description: Audit log detail
 *       400:
 *         description: Invalid id
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Missing admin_system:view permission
 *       404:
 *         description: Audit log not found
 */
router.get(
  "/audit-logs/:id",
  authenticate,
  checkPermission("admin_system:view"),
  adminSystemController.auditLogDetail.bind(adminSystemController),
);

/**
 * @swagger
 * /admin/system/api-request-logs/{id}:
 *   get:
 *     tags: [Admin System]
 *     summary: Get API request log detail
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *     responses:
 *       200:
 *         description: API request log detail
 *       400:
 *         description: Invalid id
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Missing admin_system:view permission
 *       404:
 *         description: API request log not found
 */
router.get(
  "/api-request-logs/:id",
  authenticate,
  checkPermission("admin_system:view"),
  adminSystemController.apiRequestLogDetail.bind(adminSystemController),
);

export default router;
