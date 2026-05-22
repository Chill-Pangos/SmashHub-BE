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
 *             required: [tournamentId, startDate, endDate, registrationStartDate, registrationEndDate, bracketGenerationDate]
 *             properties:
 *               tournamentId:
 *                 type: integer
 *                 description: Tournament ID
 *               startDate:
 *                 type: string
 *                 format: date-time
 *                 description: Tournament start date and time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *                 description: Tournament end date and time
 *               numberOfTables:
 *                 type: integer
 *                 description: Number of tables available for matches
 *               registrationStartDate:
 *                 type: string
 *                 format: date-time
 *                 description: Start date for player registration
 *               registrationEndDate:
 *                 type: string
 *                 format: date-time
 *                 description: End date for player registration
 *               bracketGenerationDate:
 *                 type: string
 *                 format: date-time
 *                 description: Date when brackets will be generated
 *               matchDurationMinutes:
 *                 type: integer
 *                 minimum: 15
 *                 maximum: 120
 *                 description: Duration of each match in minutes
 *               breakDurationMinutes:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 60
 *                 description: Break duration between matches in minutes
 *               dailyStartHour:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 23
 *                 description: Tournament daily start hour (24-hour format)
 *               dailyStartMinute:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 59
 *                 description: Tournament daily start minute
 *               dailyEndHour:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 23
 *                 description: Tournament daily end hour (24-hour format)
 *               dailyEndMinute:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 59
 *                 description: Tournament daily end minute
 *               lunchBreakStartHour:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 23
 *                 nullable: true
 *                 description: Lunch break start hour (24-hour format)
 *               lunchBreakStartMinute:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 59
 *                 nullable: true
 *                 description: Lunch break start minute
 *               lunchBreakEndHour:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 23
 *                 nullable: true
 *                 description: Lunch break end hour (24-hour format)
 *               lunchBreakEndMinute:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 59
 *                 nullable: true
 *                 description: Lunch break end minute
 *               lunchBreakDurationMinutes:
 *                 type: integer
 *                 description: Duration of lunch break in minutes
 *               notes:
 *                 type: string
 *                 description: Additional notes about the schedule
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
 * /tournaments/{tournamentId}/schedule-config/preview-create:
 *   post:
 *     tags: [Schedule Config]
 *     summary: Preview creating a new schedule config
 *     description: Preview the schedule configuration without saving it. Useful for client-side validation before confirming creation.
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
 *             required: [totalMatches, startDate, endDate, registrationStartDate, registrationEndDate, bracketGenerationDate]
 *             properties:
 *               totalMatches:
 *                 type: integer
 *                 minimum: 1
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *               registrationStartDate:
 *                 type: string
 *                 format: date-time
 *               registrationEndDate:
 *                 type: string
 *                 format: date-time
 *               bracketGenerationDate:
 *                 type: string
 *                 format: date-time
 *               numberOfTables:
 *                 type: integer
 *                 minimum: 1
 *               matchDurationMinutes:
 *                 type: integer
 *               breakDurationMinutes:
 *                 type: integer
 *               dailyStartHour:
 *                 type: integer
 *               dailyStartMinute:
 *                 type: integer
 *               dailyEndHour:
 *                 type: integer
 *               dailyEndMinute:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Preview of schedule config creation
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SchedulePreviewResponse'
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
  "/:tournamentId/schedule-config/preview-create",
  authenticate,
  checkPermission("tournaments:view"),
  scheduleConfigController.previewCreate.bind(scheduleConfigController)
);

/**
 * @swagger
 * /tournaments/{tournamentId}/schedule-config/preview-update:
 *   post:
 *     tags: [Schedule Config]
 *     summary: Preview updating a schedule config
 *     description: Preview the updated schedule configuration without saving it. Useful for client-side validation before confirming update.
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
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *               registrationStartDate:
 *                 type: string
 *                 format: date-time
 *               registrationEndDate:
 *                 type: string
 *                 format: date-time
 *               bracketGenerationDate:
 *                 type: string
 *                 format: date-time
 *               numberOfTables:
 *                 type: integer
 *               matchDurationMinutes:
 *                 type: integer
 *               breakDurationMinutes:
 *                 type: integer
 *               dailyStartHour:
 *                 type: integer
 *               dailyStartMinute:
 *                 type: integer
 *               dailyEndHour:
 *                 type: integer
 *               dailyEndMinute:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Preview of schedule config update
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SchedulePreviewResponse'
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
  "/:tournamentId/schedule-config/preview-update",
  authenticate,
  checkPermission("tournaments:view"),
  scheduleConfigController.previewUpdate.bind(scheduleConfigController)
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
