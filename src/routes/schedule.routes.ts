import { Router } from "express";
import scheduleController from "../controllers/schedule.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { checkPermission } from "../middlewares/permission.middleware";

const router = Router();

/**
 * @swagger
 * /schedules/generate-tournament:
 *   post:
 *     tags: [Schedules]
 *     summary: Generate full tournament schedule (group + knockout)
 *     description: |
 *       Authorization: Only the tournament organizer can perform this action.
 *
 *       Tạo lịch toàn bộ tournament theo thứ tự: xong hết category này mới đến category khác.
 *       Trong mỗi category: group stage trước, knockout sau (kể cả TBD placeholders).
 *       Slot time được tính liên tục theo scheduleConfig của tournament.
 *       tableNumber KHÔNG được gán ở đây — sẽ gán động khi trận bắt đầu.
 *
 *       Yêu cầu:
 *       - Tournament status must be brackets_generated
 *       - scheduleConfig.bracketGenerationDate must be reached
 *       - scheduleConfig đã được tạo cho tournament
 *       - groupStandings đã có (nếu category có vòng bảng)
 *       - knockoutBrackets đã được generate (generatePlaceholders hoặc generateFromEntries)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tournamentId
 *             properties:
 *               tournamentId:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       201:
 *         description: Tournament schedule generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                 warnings:
 *                   type: array
 *                   items:
 *                     type: string
 *                   description: Overflow warnings nếu lịch vượt quá thời gian cho phép
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       categoryId:
 *                         type: integer
 *                       totalSchedules:
 *                         type: integer
 *                       totalMatches:
 *                         type: integer
 *       400:
 *         $ref: '#/components/responses/BadRequest400'
 *       401:
 *         $ref: '#/components/responses/Unauthorized401'
 *       403:
 *         $ref: '#/components/responses/Forbidden403'
 *       500:
 *         $ref: '#/components/responses/InternalError500'
 */
router.post(
  "/generate-tournament",
  authenticate,
  checkPermission("schedules:create"),
  scheduleController.generateTournamentSchedule.bind(scheduleController),
);

/**
 * @swagger
 * /schedules/generate-group-stage:
 *   post:
 *     tags: [Schedules]
 *     summary: Generate group stage schedule for a category
 *     description: |
 *       Authorization: Only the tournament organizer can perform this action.
 *
 *       Tạo lịch vòng bảng (round-robin) cho 1 category dựa trên groupStandings.
 *       Slot time tính từ scheduleConfig của tournament.
 *       tableNumber KHÔNG được gán — sẽ gán động khi trận bắt đầu.
 *
 *       Yêu cầu:
 *       - Tournament status must be brackets_generated
 *       - scheduleConfig.bracketGenerationDate must be reached
 *       - scheduleConfig đã được tạo
 *       - groupStandings đã có (saveGroupAssignments đã chạy)
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
 *             properties:
 *               categoryId:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       201:
 *         description: Group stage schedule generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                 warning:
 *                   type: string
 *                   description: Có nếu lịch vượt quá thời gian cho phép
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalSchedules:
 *                       type: integer
 *                     totalMatches:
 *                       type: integer
 *                     schedules:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Schedule'
 *                     matches:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Match'
 *       400:
 *         $ref: '#/components/responses/BadRequest400'
 *       401:
 *         $ref: '#/components/responses/Unauthorized401'
 *       403:
 *         $ref: '#/components/responses/Forbidden403'
 *       500:
 *         $ref: '#/components/responses/InternalError500'
 */
router.post(
  "/generate-group-stage",
  authenticate,
  checkPermission("schedules:create"),
  scheduleController.generateGroupStageSchedule.bind(scheduleController),
);

/**
 * @swagger
 * /schedules/generate-knockout:
 *   post:
 *     tags: [Schedules]
 *     summary: Generate knockout schedule for a category
 *     description: |
 *       Authorization: Only the tournament organizer can perform this action.
 *
 *       Tạo lịch knockout cho 1 category dựa trên knockoutBrackets.
 *       Lấy tất cả brackets kể cả TBD placeholder (trừ bye matches).
 *       Match với TBD sẽ có entryAId / entryBId = null — fill sau khi fillQualifiers().
 *
 *       Nếu truyền roundName → chỉ tạo lịch cho vòng đó (không xóa vòng khác).
 *       Nếu không truyền → tạo lịch cho tất cả vòng, xóa lịch knockout cũ.
 *
 *       Yêu cầu:
 *       - knockoutBrackets đã được generate (generatePlaceholders hoặc generateFromEntries)
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
 *             properties:
 *               categoryId:
 *                 type: integer
 *                 example: 1
 *               roundName:
 *                 type: string
 *                 enum: [Round of 64, Round of 32, Round of 16, Quarter-final, Semi-final, Final]
 *                 description: Chỉ generate cho vòng này (optional)
 *                 example: Quarter-final
 *     responses:
 *       201:
 *         description: Knockout schedule generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                 warning:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalSchedules:
 *                       type: integer
 *                     totalMatches:
 *                       type: integer
 *                     schedules:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Schedule'
 *                     matches:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Match'
 *       400:
 *         $ref: '#/components/responses/BadRequest400'
 *       401:
 *         $ref: '#/components/responses/Unauthorized401'
 *       403:
 *         $ref: '#/components/responses/Forbidden403'
 *       500:
 *         $ref: '#/components/responses/InternalError500'
 */
router.post(
  "/generate-knockout",
  authenticate,
  checkPermission("schedules:create"),
  scheduleController.generateKnockoutSchedule.bind(scheduleController),
);

/**
 * @swagger
 * /schedules/sync-match-entries:
 *   post:
 *     tags: [Schedules]
 *     summary: Sync match entries from brackets after fillQualifiers
 *     description: |
 *       Authorization: Only the tournament organizer can perform this action.
 *
 *       Sau khi fillQualifiers() fill entryId thật vào knockoutBrackets,
 *       gọi endpoint này để cập nhật lại entryAId / entryBId trong match tương ứng.
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
 *             properties:
 *               categoryId:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       200:
 *         description: Match entries synced successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *       400:
 *         $ref: '#/components/responses/BadRequest400'
 *       401:
 *         $ref: '#/components/responses/Unauthorized401'
 *       403:
 *         $ref: '#/components/responses/Forbidden403'
 *       500:
 *         $ref: '#/components/responses/InternalError500'
 */
router.post(
  "/sync-match-entries",
  authenticate,
  checkPermission("schedules:update"),
  scheduleController.syncMatchEntries.bind(scheduleController),
);

/**
 * @swagger
 * /schedules/category/{categoryId}:
 *   get:
 *     tags: [Schedules]
 *     summary: Get schedules by category
 *     description: |
 *       Lấy danh sách schedules của 1 category, có pagination và filter.
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: stage
 *         schema:
 *           type: string
 *           enum: [group, knockout]
 *       - in: query
 *         name: groupName
 *         schema:
 *           type: string
 *         description: "Filter theo tên bảng (vd: Group A)"
 *       - in: query
 *         name: knockoutRound
 *         schema:
 *           type: string
 *           enum: [Round of 64, Round of 32, Round of 16, Quarter-final, Semi-final, Final]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: List of schedules
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
 *                     schedules:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Schedule'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *       400:
 *         $ref: '#/components/responses/BadRequest400'
 *       500:
 *         $ref: '#/components/responses/InternalError500'
 */
router.get(
  "/category/:categoryId",
  scheduleController.getSchedulesByCategoryId.bind(scheduleController),
);

/**
 * @swagger
 * /schedules/{id}:
 *   get:
 *     tags: [Schedules]
 *     summary: Get schedule by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Schedule details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Schedule'
 *       404:
 *         $ref: '#/components/responses/NotFound404'
 *       500:
 *         $ref: '#/components/responses/InternalError500'
 *   put:
 *     tags: [Schedules]
 *     summary: Update schedule (scheduledAt or tableNumber)
 *     description: Only the tournament organizer can perform this action.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               scheduledAt:
 *                 type: string
 *                 format: date-time
 *               tableNumber:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Schedule updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Schedule'
 *       401:
 *         $ref: '#/components/responses/Unauthorized401'
 *       403:
 *         $ref: '#/components/responses/Forbidden403'
 *       404:
 *         $ref: '#/components/responses/NotFound404'
 *       500:
 *         $ref: '#/components/responses/InternalError500'
 *   delete:
 *     tags: [Schedules]
 *     summary: Delete schedule
 *     description: Only the tournament organizer can perform this action.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         $ref: '#/components/responses/NoContent204'
 *       401:
 *         $ref: '#/components/responses/Unauthorized401'
 *       403:
 *         $ref: '#/components/responses/Forbidden403'
 *       404:
 *         $ref: '#/components/responses/NotFound404'
 *       500:
 *         $ref: '#/components/responses/InternalError500'
 */
router.get("/:id", scheduleController.findById.bind(scheduleController));
router.put(
  "/:id",
  authenticate,
  checkPermission("schedules:update"),
  scheduleController.update.bind(scheduleController),
);
router.delete(
  "/:id",
  authenticate,
  checkPermission("schedules:delete"),
  scheduleController.delete.bind(scheduleController),
);

export default router;
