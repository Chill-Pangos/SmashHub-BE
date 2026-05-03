import { Router } from "express";
import scheduleConfigController from "../controllers/scheduleConfig.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { checkPermission } from "../middlewares/permission.middleware";

const router = Router({ mergeParams: true });

/**
 * @swagger
 * /schedule-configs:
 *   post:
 *     tags: [Schedule Config]
 *     summary: Create a new schedule config
 *     description: Create a schedule configuration for a tournament
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [tournamentId]
 *             properties:
 *               tournamentId:
 *                 type: integer
 *                 description: Tournament ID
 *               matchDurationMinutes:
 *                 type: integer
 *                 minimum: 15
 *                 maximum: 120
 *                 default: 60
 *               breakDurationMinutes:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 60
 *                 default: 10
 *               dailyStartHour:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 23
 *                 default: 8
 *               dailyStartMinute:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 59
 *                 default: 0
 *               dailyEndHour:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 23
 *                 default: 22
 *               dailyEndMinute:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 59
 *                 default: 0
 *               lunchBreakStartHour:
 *                 type: integer
 *                 nullable: true
 *               lunchBreakStartMinute:
 *                 type: integer
 *               lunchBreakEndHour:
 *                 type: integer
 *                 nullable: true
 *               lunchBreakEndMinute:
 *                 type: integer
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Schedule config created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ScheduleConfig'
 *       400:
 *         $ref: '#/components/responses/BadRequest400'
 *       401:
 *         $ref: '#/components/responses/Unauthorized401'
 *       500:
 *         $ref: '#/components/responses/InternalError500'
 */
router.post(
  "/",
  authenticate,
  checkPermission("tournaments:create"),
  scheduleConfigController.create.bind(scheduleConfigController)
);

/**
 * @swagger
 * /schedule-configs/defaults:
 *   get:
 *     tags: [Schedule Config]
 *     summary: Get default schedule config
 *     responses:
 *       200:
 *         description: Default config values
 *       500:
 *         $ref: '#/components/responses/InternalError500'
 */
router.get(
  "/defaults",
  scheduleConfigController.getDefaults.bind(scheduleConfigController)
);

/**
 * @swagger
 * /tournaments/{tournamentId}/schedule-config:
 *   get:
 *     tags: [Schedule Config]
 *     summary: Get schedule config
 *     parameters:
 *       - in: path
 *         name: tournamentId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Schedule config
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ScheduleConfig'
 *       404:
 *         $ref: '#/components/responses/NotFound404'
 *       500:
 *         $ref: '#/components/responses/InternalError500'
 */
router.get(
  "/:tournamentId/schedule-config",
  scheduleConfigController.getByTournament.bind(scheduleConfigController)
);

/**
 * @swagger
 * /tournaments/{tournamentId}/schedule-config:
 *   patch:
 *     tags: [Schedule Config]
 *     summary: Update schedule config
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tournamentId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ScheduleConfig'
 *       400:
 *         $ref: '#/components/responses/BadRequest400'
 *       401:
 *         $ref: '#/components/responses/Unauthorized401'
 *       404:
 *         $ref: '#/components/responses/NotFound404'
 *       500:
 *         $ref: '#/components/responses/InternalError500'
 */
router.patch(
  "/:tournamentId/schedule-config",
  authenticate,
  checkPermission("tournaments:update"),
  scheduleConfigController.update.bind(scheduleConfigController)
);

/**
 * @swagger
 * /tournaments/{tournamentId}/schedule-config/validate:
 *   post:
 *     tags: [Schedule Config]
 *     summary: Validate schedule config
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tournamentId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [totalMatches]
 *             properties:
 *               totalMatches:
 *                 type: integer
 *                 minimum: 1
 *     responses:
 *       200:
 *         description: Validation result
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ScheduleValidationResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequest400'
 *       401:
 *         $ref: '#/components/responses/Unauthorized401'
 *       404:
 *         $ref: '#/components/responses/NotFound404'
 *       500:
 *         $ref: '#/components/responses/InternalError500'
 */
router.post(
  "/:tournamentId/schedule-config/validate",
  authenticate,
  checkPermission("tournaments:view"),
  scheduleConfigController.validate.bind(scheduleConfigController)
);

/**
 * @swagger
 * /tournaments/{tournamentId}/schedule-config:
 *   delete:
 *     tags: [Schedule Config]
 *     summary: Delete schedule config
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tournamentId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Deleted
 *       400:
 *         $ref: '#/components/responses/BadRequest400'
 *       401:
 *         $ref: '#/components/responses/Unauthorized401'
 *       404:
 *         $ref: '#/components/responses/NotFound404'
 *       500:
 *         $ref: '#/components/responses/InternalError500'
 */
router.delete(
  "/:tournamentId/schedule-config",
  authenticate,
  checkPermission("tournaments:delete"),
  scheduleConfigController.delete.bind(scheduleConfigController)
);

export default router;
