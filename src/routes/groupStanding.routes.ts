import { Router } from "express";
import groupStandingController from "../controllers/groupStanding.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { checkPermission } from "../middlewares/permission.middleware";

const router = Router();

/**
 * @swagger
 * /group-standings/generate-placeholders:
 *   post:
 *     tags: [Group Standings]
 *     summary: Generate group placeholders
 *     description: |
 *       Tạo danh sách bảng đấu placeholder cho tournament category.
 *       Số lượng bảng phải là lũy thừa của 2 (4, 8, 16, 32, 64) và tối thiểu là 4.
 *       Mỗi bảng có 3-5 đội.
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
 *                 description: Tournament category ID
 *                 example: 1
 *     responses:
 *       200:
 *         description: Placeholders generated successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */
router.post(
  "/generate-placeholders",
  authenticate,
  checkPermission('schedules:create'),
  groupStandingController.generatePlaceholders.bind(groupStandingController)
);

/**
 * @swagger
 * /group-standings/random-draw:
 *   post:
 *     tags: [Group Standings]
 *     summary: Random draw preview (alias)
 *     description: |
 *       Alias của endpoint generate-placeholders.
 *       Trả về preview phân bảng ngẫu nhiên (chưa lưu DB).
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
 *                 description: Tournament category ID
 *                 example: 1
 *     responses:
 *       200:
 *         description: Random draw completed successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */
router.post(
  "/random-draw",
  authenticate,
  checkPermission('schedules:create'),
  groupStandingController.randomDraw.bind(groupStandingController)
);

/**
 * @swagger
 * /group-standings/save-assignments:
 *   post:
 *     tags: [Group Standings]
 *     summary: Save group assignments
 *     description: Lưu kết quả phân bổ entries vào các bảng đấu vào database
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
 *                 description: Tournament category ID
 *                 example: 1
 *               groupAssignments:
 *                 type: array
 *                 description: Preferred field for assignments
 *                 items:
 *                   type: object
 *                   properties:
 *                     groupName:
 *                       type: string
 *                       example: "Group A"
 *                     entryIds:
 *                       type: array
 *                       items:
 *                         type: integer
 *                       example: [1, 2, 3, 4]
 *               assignments:
 *                 type: array
 *                 description: Backward-compatible alias of groupAssignments
 *                 items:
 *                   type: object
 *                   properties:
 *                     groupName:
 *                       type: string
 *                       example: "Group A"
 *                     entryIds:
 *                       type: array
 *                       items:
 *                         type: integer
 *                       example: [1, 2, 3, 4]
 *     responses:
 *       201:
 *         description: Assignments saved successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */
router.post(
  "/save-assignments",
  authenticate,
  checkPermission('schedules:create'),
  groupStandingController.saveAssignments.bind(groupStandingController)
);

/**
 * @swagger
 * /group-standings/calculate:
 *   post:
 *     tags: [Group Standings]
 *     summary: Recalculate group standings positions
 *     description: |
 *       Recalculate ranking positions from existing standings stats.
 *       Current tie-breaker order in service:
 *       1. matchesWon (desc)
 *       2. setsDiff (desc)
 *       3. head-to-head result
 *       Nếu không truyền groupName sẽ tính lại cho tất cả bảng trong category.
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
 *                 description: Tournament category ID
 *                 example: 1
 *               groupName:
 *                 type: string
 *                 description: Calculate for specific group (optional, all groups if not provided)
 *                 example: "Group A"
 *     responses:
 *       200:
 *         description: Standings calculated successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */
router.post(
  "/calculate",
  authenticate,
  checkPermission('schedules:update'),
  groupStandingController.calculateStandings.bind(groupStandingController)
);

/**
 * @swagger
 * /group-standings/matches/{matchId}/sync:
 *   post:
 *     tags: [Group Standings]
 *     summary: Sync standings after a completed group match
 *     description: |
 *       Cập nhật thống kê và thứ hạng của 2 entry trong bảng sau khi trận đấu group stage hoàn tất.
 *       Chỉ chief referee của tournament được phép thực hiện.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: matchId
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *         description: Match ID
 *     responses:
 *       200:
 *         description: Standings synced successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */
router.post(
  "/matches/:matchId/sync",
  authenticate,
  checkPermission('matches:approve_result'),
  groupStandingController.updateAfterMatch.bind(groupStandingController)
);

/**
 * @swagger
 * /group-standings/{categoryId}:
 *   get:
 *     tags: [Group Standings]
 *     summary: Get group standings
 *     description: Retrieve current standings for all groups or a specific group
 *     parameters:
 *       - name: categoryId
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *         description: Tournament category ID
 *       - name: groupName
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *         description: Filter by specific group name
 *     responses:
 *       200:
 *         description: Standings retrieved successfully
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get(
  "/:categoryId",
  groupStandingController.getStandings.bind(groupStandingController)
);

/**
 * @swagger
 * /group-standings/{categoryId}/qualified:
 *   get:
 *     tags: [Group Standings]
 *     summary: Get qualified teams from group stage
 *     description: Returns top N teams from each group based on standings
 *     parameters:
 *       - name: categoryId
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *         description: Tournament category ID
 *       - name: teamsPerGroup
 *         in: query
 *         required: false
 *         schema:
 *           type: integer
 *           default: 2
 *         description: Legacy alias of qualifiersPerGroup
 *       - name: qualifiersPerGroup
 *         in: query
 *         required: false
 *         schema:
 *           type: integer
 *           default: 2
 *         description: Number of teams to qualify from each group
 *     responses:
 *       200:
 *         description: Qualified teams retrieved successfully
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get(
  "/:categoryId/qualified",
  groupStandingController.getQualifiedTeams.bind(groupStandingController)
);

export default router;
