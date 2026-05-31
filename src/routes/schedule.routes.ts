import { Router } from "express";
import scheduleController from "../controllers/schedule.controller";
import userController from "../controllers/user.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { checkPermission } from "../middlewares/permission.middleware";

const router = Router();


/**
 * @swagger
 * /schedules:
 *   post:
 *     tags: [Schedules]
 *     summary: Create a new schedule
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Schedule created successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *   get:
 *     tags: [Schedules]
 *     summary: Get all schedules
 *     parameters:
 *       - $ref: '#/components/parameters/pageParam'
 *       - $ref: '#/components/parameters/limitParam'
 *     responses:
 *       200:
 *         description: List of schedules ordered by scheduled time
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 */

/**
 * @swagger
 * /schedules/generate:
 *   post:
 *     tags: [Schedules]
 *     summary: Generate tournament schedules automatically
 *     description: |
 *       Automatically generates schedules for all matches in a tournament category.
 *       - Singles and Doubles matches: 20 minutes each
 *       - Team matches: 60 minutes each
 *       - Includes lunch break from 12:00 to 14:00 by default
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - categoryId
 *               - startDate
 *             properties:
 *               categoryId:
 *                 type: integer
 *                 description: Tournament category ID
 *                 example: 1
 *               startDate:
 *                 type: string
 *                 format: date
 *                 description: First day of the tournament
 *                 example: "2024-06-01"
 *               startTime:
 *                 type: string
 *                 description: Daily start time (HH:MM format)
 *                 default: "08:00"
 *                 example: "08:00"
 *               endTime:
 *                 type: string
 *                 description: Daily end time (HH:MM format)
 *                 default: "22:00"
 *                 example: "22:00"
 *               lunchBreakStart:
 *                 type: string
 *                 description: Lunch break start time (HH:MM format)
 *                 default: "12:00"
 *                 example: "12:00"
 *               lunchBreakEnd:
 *                 type: string
 *                 description: Lunch break end time (HH:MM format)
 *                 default: "14:00"
 *                 example: "14:00"
 *               roundNumber:
 *                 type: integer
 *                 description: Optional round number
 *                 example: 1
 *               groupName:
 *                 type: string
 *                 description: Optional group name (used when not in group stage mode)
 *                 example: "Group A"
 *               isGroupStage:
 *                 type: boolean
 *                 description: Enable group stage format (divides entries into multiple groups)
 *                 default: false
 *                 example: true
 *               numberOfGroups:
 *                 type: integer
 *                 description: Number of groups (auto-calculated if not provided)
 *                 example: 4
 *               teamsPerGroup:
 *                 type: integer
 *                 description: Number of teams per group (auto-calculated if not provided)
 *                 example: 4
 *               includeKnockout:
 *                 type: boolean
 *                 description: Generate knockout stage after group stage
 *                 default: false
 *                 example: true
 *               teamsAdvancePerGroup:
 *                 type: integer
 *                 description: Number of teams advancing from each group to knockout
 *                 default: 2
 *                 example: 2
 *               knockoutStartDate:
 *                 type: string
 *                 format: date
 *                 description: Start date for knockout stage (auto day after group stage if not provided)
 *                 example: "2024-06-10"
 *     responses:
 *       201:
 *         description: Schedules generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 totalMatches:
 *                   type: integer
 *                 schedules:
 *                   type: array
 *                   items:
 *                     type: object
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */
router.post("/generate",
  authenticate,
  checkPermission('schedules:create'),
  scheduleController.generateSchedule.bind(scheduleController)
);

/**
 * @swagger
 * /schedules/update-knockout:
 *   post:
 *     tags: [Schedules]
 *     summary: Update knockout stage match entries
 *     description: |
 *       Updates knockout stage matches with qualified teams from group stage.
 *       Call this endpoint after group stage results are finalized.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - categoryId
 *               - groupResults
 *             properties:
 *               categoryId:
 *                 type: integer
 *                 description: Tournament category ID
 *                 example: 1
 *               groupResults:
 *                 type: array
 *                 description: Array of group results with qualified teams
 *                 items:
 *                   type: object
 *                   properties:
 *                     groupName:
 *                       type: string
 *                       example: "Group A"
 *                     qualifiedEntryIds:
 *                       type: array
 *                       items:
 *                         type: integer
 *                       example: [1, 2]
 *     responses:
 *       200:
 *         description: Knockout entries updated successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */
router.post("/update-knockout",
  authenticate,
  checkPermission('schedules:update'),
  scheduleController.updateKnockoutEntries.bind(scheduleController)
);

/**
 * @swagger
 * /schedules/generate-group-stage:
 *   post:
 *     tags: [Schedules]
 *     summary: Generate group stage schedules
 *     description: |
 *       Tạo schedule cho vòng bảng dựa trên group standings đã có.
 *       Điều kiện:
 *       - Khung giờ: 8h-11h30 (sáng), 13h30-17h (chiều), 18h30-22h (tối)
 *       - Thời gian mỗi trận: Single/Double 30 phút, Team 60 phút
 *       - Các đội không đấu liên tiếp 2 trận trong cùng buổi
 *       - Round-robin: Tất cả đội đấu với nhau trong mỗi bảng
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - categoryId
 *               - startDate
 *             properties:
 *               categoryId:
 *                 type: integer
 *                 description: Tournament category ID
 *                 example: 1
 *               startDate:
 *                 type: string
 *                 format: date
 *                 description: Ngày bắt đầu thi đấu (YYYY-MM-DD)
 *                 example: "2026-02-01"
 *     responses:
 *       201:
 *         description: Group stage schedules generated successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */
router.post("/generate-group-stage",
  authenticate,
  checkPermission('schedules:create'),
  scheduleController.generateGroupStageSchedule.bind(scheduleController)
);

/**
 * @swagger
 * /schedules/{id}:
 *   get:
 *     tags: [Schedules]
 *     summary: Get schedule by ID
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       200:
 *         description: Schedule details
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   put:
 *     tags: [Schedules]
 *     summary: Update schedule
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       200:
 *         description: Schedule updated
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   delete:
 *     tags: [Schedules]
 *     summary: Delete schedule
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       204:
 *         $ref: '#/components/responses/NoContent'
 */
router.get("/:id", scheduleController.findById.bind(scheduleController));
router.put("/:id", scheduleController.update.bind(scheduleController));
router.delete("/:id", scheduleController.delete.bind(scheduleController));

/**
 * @swagger
 * /schedules/category/{categoryId}:
 *   get:
 *     tags: [Schedules]
 *     summary: Get schedules by tournament category ID
 *     description: Retrieve all schedules for a specific tournament category, with optional filtering by stage
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: number
 *         description: ID of the tournament category
 *       - in: query
 *         name: stage
 *         required: false
 *         schema:
 *           type: string
 *           enum: [group, knockout]
 *         description: Filter by stage (group or knockout)
 *       - $ref: '#/components/parameters/pageParam'
 *       - $ref: '#/components/parameters/limitParam'
 *     responses:
 *       200:
 *         description: List of schedules for the tournament category
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     schedules:
 *                       type: array
 *                       items:
 *                         type: object
 *                     count:
 *                       type: number
 *                     offset:
 *                       type: number
 *                     limit:
 *                       type: number
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */
router.get("/category/:categoryId", scheduleController.getSchedulesByCategoryId.bind(scheduleController));

export default router;
