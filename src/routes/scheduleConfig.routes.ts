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
 *     summary: Create a new schedule configuration
 *     description: |
 *       Create a schedule configuration for a tournament. The configuration defines:
 *       - Tournament execution datetime window
 *       - Registration and bracket generation schedules
 *       - Match and break durations
 *       - Optional lunch break datetimes
 *
 *       **Time Slot Calculations:**
 *       - Available time = daily window from startDate/endDate time across tournament days
 *       - Total slots needed = ceil(total matches / number of tables)
 *       - Time needed = total slots × (match duration + break duration)
 *
 *       **Validation Rules:**
 *       - Match duration: 30-90 minutes (default 60)
 *       - Break duration: 5-30 minutes (default 10)
 *       - endDate must be after startDate
 *       - endDate time must be after startDate time
 *       - Number of tables: minimum 1
 *       - Registration must close before tournament starts
 *       - Bracket generation must be at least 2 days before tournament start
 *       - startLunchBreak/endLunchBreak must be provided together
 *       - Lunch break must be within tournament datetime window
 *
 *       **Schedule Fit Analysis:**
 *       After creation, verify the schedule can accommodate all matches using the
 *       validate endpoint (POST /schedule-configs/validate)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [startDate, endDate, registrationStartDate, registrationEndDate, bracketGenerationDate]
 *             properties:
 *               startDate:
 *                 type: string
 *                 format: date-time
 *                 example: "2026-06-15T08:00:00Z"
 *                 description: Tournament start date and time (cannot be in the past, ISO 8601 format)
 *               endDate:
 *                 type: string
 *                 format: date-time
 *                 example: "2026-06-20T22:00:00Z"
 *                 description: Tournament end date and time (must be after startDate, ISO 8601 format)
 *               registrationStartDate:
 *                 type: string
 *                 format: date-time
 *                 example: "2026-05-15T00:00:00Z"
 *                 description: Registration opening date (cannot be in the past, ISO 8601 format)
 *               registrationEndDate:
 *                 type: string
 *                 format: date-time
 *                 example: "2026-06-14T23:59:59Z"
 *                 description: Registration closing date (must be before tournament starts)
 *               bracketGenerationDate:
 *                 type: string
 *                 format: date-time
 *                 example: "2026-06-13T00:00:00Z"
 *                 description: Bracket generation date (must be after registration ends and at least 2 days before start)
 *               numberOfTables:
 *                 type: integer
 *                 minimum: 1
 *                 default: 1
 *                 example: 4
 *                 description: Number of tournament tables for parallel matches. More tables = faster completion
 *               matchDurationMinutes:
 *                 type: integer
 *                 minimum: 30
 *                 maximum: 90
 *                 default: 30
 *                 example: 30
 *                 description: Duration of each match in minutes (30-90, default 30)
 *               breakDurationMinutes:
 *                 type: integer
 *                 minimum: 5
 *                 maximum: 30
 *                 default: 10
 *                 example: 10
 *                 description: Break duration between matches in minutes (5-30, for table/player setup and rest)
 *               startLunchBreak:
 *                 type: string
 *                 format: date-time
 *                 nullable: true
 *                 example: "2026-06-15T12:00:00Z"
 *                 description: Lunch break start datetime. Provide with endLunchBreak, or null to disable lunch break
 *               endLunchBreak:
 *                 type: string
 *                 format: date-time
 *                 nullable: true
 *                 example: "2026-06-15T13:00:00Z"
 *                 description: Lunch break end datetime. Must be after startLunchBreak and inside tournament window
 *               notes:
 *                 type: string
 *                 nullable: true
 *                 example: "Main tournament at Convention Center. Use gymnasium for additional tables if needed."
 *                 description: Additional notes or special instructions for schedule management
 *           examples:
 *             weeklong_tournament:
 *               summary: Week-long tournament with multiple tables and lunch break
 *               value:
 *                 startDate: "2026-06-15T08:00:00Z"
 *                 endDate: "2026-06-20T22:00:00Z"
 *                 registrationStartDate: "2026-05-15T00:00:00Z"
 *                 registrationEndDate: "2026-06-14T23:59:59Z"
 *                 bracketGenerationDate: "2026-06-13T00:00:00Z"
 *                 numberOfTables: 4
 *                 matchDurationMinutes: 30
 *                 breakDurationMinutes: 10
 *                 startLunchBreak: "2026-06-15T12:00:00Z"
 *                 endLunchBreak: "2026-06-15T13:00:00Z"
 *                 notes: "Main venue tournament at Convention Center"
 *             single_day:
 *               summary: Single-day tournament with aggressive timing
 *               value:
 *                 startDate: "2026-06-20T09:00:00Z"
 *                 endDate: "2026-06-20T17:00:00Z"
 *                 registrationStartDate: "2026-06-01T00:00:00Z"
 *                 registrationEndDate: "2026-06-19T23:59:59Z"
 *                 bracketGenerationDate: "2026-06-18T00:00:00Z"
 *                 numberOfTables: 6
 *                 matchDurationMinutes: 45
 *                 breakDurationMinutes: 5
 *                 notes: "Fast-paced single day event"
 *     responses:
 *       201:
 *         description: Schedule configuration created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ScheduleConfig'
 *             example:
 *               id: 1
 *               tournamentId: 1
 *               startDate: "2026-06-15T08:00:00Z"
 *               endDate: "2026-06-20T22:00:00Z"
 *               registrationStartDate: "2026-05-15T00:00:00Z"
 *               registrationEndDate: "2026-06-14T23:59:59Z"
 *               bracketGenerationDate: "2026-06-13T00:00:00Z"
 *               numberOfTables: 4
 *               matchDurationMinutes: 30
 *               breakDurationMinutes: 10
 *               startLunchBreak: "2026-06-15T12:00:00Z"
 *               endLunchBreak: "2026-06-15T13:00:00Z"
 *               notes: "Main venue tournament"
 *               createdAt: "2026-05-28T10:00:00Z"
 *               updatedAt: "2026-05-28T10:00:00Z"
 *       400:
 *         description: Validation error (invalid dates, time ranges, overlapping lunch break, or configuration)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               invalid_time_range:
 *                 summary: End time before start time
 *                 value:
 *                   message: "End time must be after start time"
 *               lunch_overlap:
 *                 summary: Lunch break outside tournament window
 *                 value:
 *                   message: "Lunch break times must be within the tournament schedule range"
 *               invalid_dates:
 *                 summary: Registration after tournament start
 *                 value:
 *                   message: "registrationEndDate must be before startDate"
 *       401:
 *         $ref: '#/components/responses/Unauthorized401'
 *       403:
 *         description: Only the tournament organizer can perform this action
 *         $ref: '#/components/responses/Forbidden403'
 *       500:
 *         $ref: '#/components/responses/InternalError500'
 */
router.post(
  "/",
  authenticate,
  checkPermission("schedules:create"),
  scheduleConfigController.create.bind(scheduleConfigController)
);

/**
 * @swagger
 * /schedule-configs/defaults:
 *   get:
 *     tags: [Schedule Config]
 *     summary: Get default schedule configuration values
 *     description: |
 *       Retrieve the default values for schedule configuration. These values can be used
 *       to pre-populate the schedule creation form on the client side, providing reasonable
 *       baseline values for most tournament scenarios.
 *
 *       **Default Values (Standard Tournament):**
 *       - Match duration: 60 minutes (typical competitive match)
 *       - Break duration: 10 minutes (for table/player setup and rest)
 *       - Number of tables: 1 (single-table tournament)
 *
 *       **Use Case:**
 *       Use these defaults to populate form fields in the client UI. Users can then
 *       adjust these values based on their tournament needs. For aggressive schedules,
 *       consider reducing match duration to 45 min or increasing table count.
 *     responses:
 *       200:
 *         description: Default configuration values retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [matchDurationMinutes, breakDurationMinutes, numberOfTables]
 *               properties:
 *                 matchDurationMinutes:
 *                   type: integer
 *                   example: 30
 *                   description: Default match duration in minutes (30-90 allowed)
 *                 breakDurationMinutes:
 *                   type: integer
 *                   example: 10
 *                   description: Default break duration in minutes (5-30 allowed)
 *                 numberOfTables:
 *                   type: integer
 *                   minimum: 1
 *                   example: 1
 *                   description: Default number of tournament tables
 *             example:
 *               matchDurationMinutes: 30
 *               breakDurationMinutes: 10
 *               numberOfTables: 1
 *       500:
 *         $ref: '#/components/responses/InternalError500'
 */
router.get(
  "/defaults",
  scheduleConfigController.getDefaults.bind(scheduleConfigController)
);

/**
 * @swagger
 * /schedule-configs/{tournamentId}/schedule-config:
 *   get:
 *     tags: [Schedule Config]
 *     summary: Get schedule configuration for a tournament
 *     description: |
 *       Retrieve the schedule configuration for a specific tournament.
 *       Returns all configuration details including dates, time windows, and optional lunch breaks.
 *     parameters:
 *       - in: path
 *         name: tournamentId
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Tournament ID
 *         example: 1
 *     responses:
 *       200:
 *         description: Schedule configuration retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ScheduleConfig'
 *       404:
 *         description: Tournament or schedule configuration not found
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
 * /schedule-configs/{tournamentId}/schedule-config:
 *   patch:
 *     tags: [Schedule Config]
 *     summary: Update schedule configuration
 *     description: |
 *       Update an existing schedule configuration for a tournament.
 *       Only specified fields will be updated, others retain current values.
 *
 *       **Update Rules:**
 *       - All datetime updates are validated against existing tournament dates
 *       - Lunch break can be added, modified, or removed
 *       - All time and date constraints are enforced (see POST /schedule-configs for rules)
 *       - If schedules already exist and schedule-affecting fields are changed,
 *         call preview-update first, then send regenerateSchedule=true with the returned regenerationKey
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tournamentId
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Tournament ID
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               startDate:
 *                 type: string
 *                 format: date-time
 *                 example: "2026-06-15T08:00:00Z"
 *                 description: Tournament start date and time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *                 example: "2026-06-20T22:00:00Z"
 *                 description: Tournament end date and time
 *               registrationStartDate:
 *                 type: string
 *                 format: date-time
 *                 description: Registration opening date
 *               registrationEndDate:
 *                 type: string
 *                 format: date-time
 *                 description: Registration closing date
 *               bracketGenerationDate:
 *                 type: string
 *                 format: date-time
 *                 description: Bracket generation date
 *               numberOfTables:
 *                 type: integer
 *                 minimum: 1
 *                 example: 4
 *                 description: Number of tournament tables
 *               matchDurationMinutes:
 *                 type: integer
 *                 minimum: 30
 *                 maximum: 90
 *                 example: 30
 *                 description: Match duration in minutes
 *               breakDurationMinutes:
 *                 type: integer
 *                 minimum: 5
 *                 maximum: 30
 *                 example: 10
 *                 description: Break duration between matches in minutes
 *               startLunchBreak:
 *                 type: string
 *                 format: date-time
 *                 nullable: true
 *                 description: Lunch break start datetime (null with endLunchBreak to remove)
 *               endLunchBreak:
 *                 type: string
 *                 format: date-time
 *                 nullable: true
 *                 description: Lunch break end datetime (null with startLunchBreak to remove)
 *               notes:
 *                 type: string
 *                 nullable: true
 *                 description: Additional notes
 *               regenerateSchedule:
 *                 type: boolean
 *                 description: Required when schedule-affecting changes must regenerate existing schedules
 *               regenerationKey:
 *                 type: string
 *                 description: Key returned by preview-update for confirmed regeneration
 *           examples:
 *             partial_update:
 *               summary: Update only time window
 *               value:
 *                 matchDurationMinutes: 45
 *                 breakDurationMinutes: 15
 *             full_update:
 *               summary: Update complete configuration
 *               value:
 *                 startDate: "2026-06-16T08:00:00Z"
 *                 endDate: "2026-06-20T22:00:00Z"
 *                 numberOfTables: 6
 *                 matchDurationMinutes: 50
 *                 breakDurationMinutes: 15
 *                 startLunchBreak: "2026-06-16T12:00:00Z"
 *                 endLunchBreak: "2026-06-16T13:00:00Z"
 *             regenerate_existing_schedule:
 *               summary: Update and regenerate existing schedules
 *               value:
 *                 matchDurationMinutes: 45
 *                 regenerateSchedule: true
 *                 regenerationKey: "sha256-key-from-preview-update"
 *     responses:
 *       200:
 *         description: Schedule configuration updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ScheduleConfig'
 *       400:
 *         description: Validation error in updated configuration
 *         $ref: '#/components/responses/BadRequest400'
 *       401:
 *         $ref: '#/components/responses/Unauthorized401'
 *       403:
 *         description: Only the tournament organizer can perform this action
 *         $ref: '#/components/responses/Forbidden403'
 *       404:
 *         $ref: '#/components/responses/NotFound404'
 *       500:
 *         $ref: '#/components/responses/InternalError500'
 */
router.patch(
  "/:tournamentId/schedule-config",
  authenticate,
  checkPermission("schedules:update"),
  scheduleConfigController.update.bind(scheduleConfigController)
);

/**
 * @swagger
 * /schedule-configs/validate:
 *   post:
 *     tags: [Schedule Config]
 *     summary: Validate schedule configuration
 *     description: |
 *       Validate an unsaved schedule configuration against a category input.
 *       This endpoint checks if the configured schedule (tables, durations, tournament time window) can
 *       accommodate all matches calculated from category.maxEntries and category.isGroupStage.
 *
 *       **Validation Checks:**
 *       - Available time = daily window from startDate/endDate time across tournament days
 *       - Total matches calculated from category information
 *       - Total slots needed = ceil(calculatedMatches / numberOfTables)
 *       - Time needed = totalSlots × (matchDuration + breakDuration)
 *       - Valid if: timeNeeded <= availableTime
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [category, scheduleConfig]
 *             properties:
 *               category:
 *                 type: object
 *                 required: [maxEntries]
 *                 properties:
 *                   maxEntries:
 *                     type: integer
 *                     minimum: 1
 *                     example: 32
 *                     description: Maximum entries for the category
 *                   isGroupStage:
 *                     type: boolean
 *                     default: false
 *                     example: false
 *                     description: Whether category uses group stage before knockout
 *               scheduleConfig:
 *                 type: object
 *                 required: [startDate, endDate, registrationStartDate, registrationEndDate, bracketGenerationDate]
 *                 properties:
 *                   startDate:
 *                     type: string
 *                     format: date-time
 *                     example: "2026-06-15T08:00:00Z"
 *                   endDate:
 *                     type: string
 *                     format: date-time
 *                     example: "2026-06-20T22:00:00Z"
 *                   registrationStartDate:
 *                     type: string
 *                     format: date-time
 *                     example: "2026-05-15T00:00:00Z"
 *                   registrationEndDate:
 *                     type: string
 *                     format: date-time
 *                     example: "2026-06-12T23:59:59Z"
 *                   bracketGenerationDate:
 *                     type: string
 *                     format: date-time
 *                     example: "2026-06-13T00:00:00Z"
 *                   numberOfTables:
 *                     type: integer
 *                     minimum: 1
 *                     default: 1
 *                   matchDurationMinutes:
 *                     type: integer
 *                     minimum: 30
 *                     maximum: 90
 *                     default: 30
 *                   breakDurationMinutes:
 *                     type: integer
 *                     minimum: 5
 *                     maximum: 30
 *                     default: 10
 *                   startLunchBreak:
 *                     type: string
 *                     format: date-time
 *                     nullable: true
 *                     example: "2026-06-15T12:00:00Z"
 *                   endLunchBreak:
 *                     type: string
 *                     format: date-time
 *                     nullable: true
 *                     example: "2026-06-15T13:00:00Z"
 *                   notes:
 *                     type: string
 *                     nullable: true
 *                     example: "Main hall schedule"
 *           examples:
 *             example1:
 *               summary: Validate category and unsaved schedule config
 *               value:
 *                 category:
 *                   maxEntries: 32
 *                   isGroupStage: false
 *                 scheduleConfig:
 *                   startDate: "2026-06-15T08:00:00Z"
 *                   endDate: "2026-06-20T22:00:00Z"
 *                   registrationStartDate: "2026-05-15T00:00:00Z"
 *                   registrationEndDate: "2026-06-12T23:59:59Z"
 *                   bracketGenerationDate: "2026-06-13T00:00:00Z"
 *                   numberOfTables: 4
 *                   matchDurationMinutes: 30
 *                   breakDurationMinutes: 10
 *                   startLunchBreak: "2026-06-15T12:00:00Z"
 *                   endLunchBreak: "2026-06-15T13:00:00Z"
 *                   notes: "Main hall schedule"
 *     responses:
 *       200:
 *         description: Validation result with schedule fit analysis
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ScheduleValidationResponse'
 *       400:
 *         description: Invalid input or schedule configuration not found
 *         $ref: '#/components/responses/BadRequest400'
 *       401:
 *         $ref: '#/components/responses/Unauthorized401'
 *       403:
 *         description: Only the tournament organizer can perform this action
 *         $ref: '#/components/responses/Forbidden403'
 *       404:
 *         $ref: '#/components/responses/NotFound404'
 *       500:
 *         $ref: '#/components/responses/InternalError500'
 */
router.post(
  "/validate",
  authenticate,
  checkPermission("schedules:update"),
  scheduleConfigController.validate.bind(scheduleConfigController)
);

/**
 * @swagger
 * /schedule-configs/{tournamentId}/schedule-config/preview-create:
 *   post:
 *     tags: [Schedule Config]
 *     summary: Preview schedule configuration before creation
 *     description: |
 *       Preview a new schedule configuration WITHOUT saving to database.
 *       This endpoint validates the proposed configuration and calculates scheduling metrics
 *       to help determine if it can accommodate all matches.
 *
 *       **Preview Calculations:**
 *       - Available time windows within tournament dates
 *       - Total match slots needed
 *       - Estimated completion time
 *       - Time buffer or overflow if applicable
 *
 *       **Use Case:** Client-side validation before user confirms schedule creation.
 *       The client can show match fit analysis and ask for confirmation before saving.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tournamentId
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Tournament ID
 *         example: 1
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
 *                 example: 127
 *                 description: Total number of matches (required for preview calculation)
 *               startDate:
 *                 type: string
 *                 format: date-time
 *                 example: "2026-06-15T08:00:00Z"
 *               endDate:
 *                 type: string
 *                 format: date-time
 *                 example: "2026-06-20T22:00:00Z"
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
 *                 default: 1
 *                 example: 4
 *               matchDurationMinutes:
 *                 type: integer
 *                 minimum: 30
 *                 maximum: 90
 *                 default: 30
 *               breakDurationMinutes:
 *                 type: integer
 *                 minimum: 5
 *                 maximum: 30
 *                 default: 10
 *               startLunchBreak:
 *                 type: string
 *                 format: date-time
 *                 nullable: true
 *               endLunchBreak:
 *                 type: string
 *                 format: date-time
 *                 nullable: true
 *           examples:
 *             valid_schedule:
 *               summary: Valid schedule with buffer time
 *               value:
 *                 totalMatches: 127
 *                 startDate: "2026-06-15T08:00:00Z"
 *                 endDate: "2026-06-20T22:00:00Z"
 *                 registrationStartDate: "2026-05-15T00:00:00Z"
 *                 registrationEndDate: "2026-06-14T23:59:59Z"
 *                 bracketGenerationDate: "2026-06-13T00:00:00Z"
 *                 numberOfTables: 4
 *                 matchDurationMinutes: 30
 *                 breakDurationMinutes: 10
 *                 startLunchBreak: "2026-06-15T12:00:00Z"
 *                 endLunchBreak: "2026-06-15T13:00:00Z"
 *     responses:
 *       200:
 *         description: Schedule preview with fit analysis
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SchedulePreviewResponse'
 *       400:
 *         description: Invalid configuration or missing tournament categories
 *         $ref: '#/components/responses/BadRequest400'
 *       401:
 *         $ref: '#/components/responses/Unauthorized401'
 *       403:
 *         description: Only the tournament organizer can perform this action
 *         $ref: '#/components/responses/Forbidden403'
 *       404:
 *         $ref: '#/components/responses/NotFound404'
 *       500:
 *         $ref: '#/components/responses/InternalError500'
 */
router.post(
  "/:tournamentId/schedule-config/preview-create",
  authenticate,
  checkPermission("schedules:create"),
  scheduleConfigController.previewCreate.bind(scheduleConfigController)
);

/**
 * @swagger
 * /schedule-configs/{tournamentId}/schedule-config/preview-update:
 *   post:
 *     tags: [Schedule Config]
 *     summary: Preview schedule configuration update
 *     description: |
 *       Preview updates to an existing schedule configuration WITHOUT saving changes to database.
 *       This endpoint merges the proposed changes with current configuration and validates the result.
 *
 *       **Behavior:**
 *       - Merges provided fields with current configuration
 *       - Calculates impact on match scheduling
 *       - Returns updated metrics without persisting to database
 *       - Returns regenerationKey when existing schedules must be regenerated
 *
 *       **Use Case:** Allow users to experiment with configuration changes and see impact
 *       before confirming the update. If requiresRegeneration=true, pass the regenerationKey
 *       to PATCH with regenerateSchedule=true.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tournamentId
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Tournament ID
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               totalMatches:
 *                 type: integer
 *                 minimum: 1
 *                 example: 127
 *                 description: Optional override; if omitted, total matches are calculated from tournament categories
 *               startDate:
 *                 type: string
 *                 format: date-time
 *                 description: Updated start date (optional)
 *               endDate:
 *                 type: string
 *                 format: date-time
 *                 description: Updated end date (optional)
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
 *                 description: Updated table count (optional)
 *               matchDurationMinutes:
 *                 type: integer
 *                 minimum: 30
 *                 maximum: 90
 *                 description: Updated match duration (optional)
 *               breakDurationMinutes:
 *                 type: integer
 *                 minimum: 5
 *                 maximum: 30
 *                 description: Updated break duration (optional)
 *               startLunchBreak:
 *                 type: string
 *                 format: date-time
 *                 nullable: true
 *               endLunchBreak:
 *                 type: string
 *                 format: date-time
 *                 nullable: true
 *           examples:
 *             add_tables:
 *               summary: Preview adding more tables
 *               value:
 *                 totalMatches: 127
 *                 numberOfTables: 6
 *             adjust_times:
 *               summary: Preview adjusting tournament datetime window and breaks
 *               value:
 *                 totalMatches: 127
 *                 startDate: "2026-06-15T09:00:00Z"
 *                 endDate: "2026-06-20T21:00:00Z"
 *                 matchDurationMinutes: 50
 *                 breakDurationMinutes: 15
 *                 startLunchBreak: "2026-06-15T12:00:00Z"
 *                 endLunchBreak: "2026-06-15T13:00:00Z"
 *     responses:
 *       200:
 *         description: Updated schedule preview with fit analysis
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SchedulePreviewResponse'
 *       400:
 *         description: Invalid configuration or schedule not found
 *         $ref: '#/components/responses/BadRequest400'
 *       401:
 *         $ref: '#/components/responses/Unauthorized401'
 *       403:
 *         description: Only the tournament organizer can perform this action
 *         $ref: '#/components/responses/Forbidden403'
 *       404:
 *         $ref: '#/components/responses/NotFound404'
 *       500:
 *         $ref: '#/components/responses/InternalError500'
 */
router.post(
  "/:tournamentId/schedule-config/preview-update",
  authenticate,
  checkPermission("schedules:update"),
  scheduleConfigController.previewUpdate.bind(scheduleConfigController)
);

/**
 * @swagger
 * /schedule-configs/{tournamentId}/schedule-config:
 *   delete:
 *     tags: [Schedule Config]
 *     summary: Delete schedule configuration
 *     description: |
 *       Delete the schedule configuration for a tournament.
 *       This operation is permanent and cannot be undone.
 *
 *       **Note:** The associated tournament and its data remain unchanged;
 *       only the schedule configuration is removed.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tournamentId
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Tournament ID
 *         example: 1
 *     responses:
 *       204:
 *         description: Schedule configuration deleted successfully (no content)
 *       400:
 *         description: Invalid tournament ID
 *         $ref: '#/components/responses/BadRequest400'
 *       401:
 *         $ref: '#/components/responses/Unauthorized401'
 *       403:
 *         description: Only the tournament organizer can perform this action
 *         $ref: '#/components/responses/Forbidden403'
 *       404:
 *         description: Tournament or schedule configuration not found
 *         $ref: '#/components/responses/NotFound404'
 *       500:
 *         $ref: '#/components/responses/InternalError500'
 */
router.delete(
  "/:tournamentId/schedule-config",
  authenticate,
  checkPermission("schedules:delete"),
  scheduleConfigController.delete.bind(scheduleConfigController)
);

export default router;
