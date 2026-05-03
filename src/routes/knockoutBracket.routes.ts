import { Router } from "express";
import knockoutBracketController from "../controllers/knockoutBracket.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { checkPermission } from "../middlewares/permission.middleware";

const router = Router();

/**
 * @swagger
 * /knockout-brackets/generate:
 *   post:
 *     tags: [Knockout Brackets]
 *     summary: Generate knockout bracket from entries (no group stage)
 *     description: |
 *       Tạo cấu trúc nhánh đấu vòng loại trực tiếp từ danh sách entries.
 *       Dùng cho giải đấu không có vòng bảng.
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
 *       201:
 *         description: Bracket generated successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */
router.post(
  "/generate",
  authenticate,
  checkPermission('schedules:create'),
  knockoutBracketController.generateFromEntries.bind(knockoutBracketController)
);

/**
 * @swagger
 * /knockout-brackets/advance-winner:
 *   post:
 *     tags: [Knockout Brackets]
 *     summary: Advance winner to next round
 *     description: Cập nhật winner và tự động advance sang bracket tiếp theo
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - bracketId
 *               - winnerEntryId
 *             properties:
 *               bracketId:
 *                 type: integer
 *                 description: ID của bracket hiện tại
 *                 example: 1
 *               winnerEntryId:
 *                 type: integer
 *                 description: ID của entry thắng
 *                 example: 5
 *     responses:
 *       200:
 *         description: Winner advanced successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */
router.post(
  "/advance-winner",
  authenticate,
  checkPermission('schedules:update'),
  knockoutBracketController.advanceWinner.bind(knockoutBracketController)
);

/**
 * @swagger
 * /knockout-brackets/generate-from-group-stage:
 *   post:
 *     tags: [Knockout Brackets]
 *     summary: Generate knockout bracket from group stage results
 *     description: |
 *       Tạo nhánh đấu knockout từ kết quả vòng bảng:
 *       1. Lấy top 2 mỗi bảng (nhất và nhì)
 *       2. Chia đều bye matches vào 2 nhánh
 *       3. Cân bằng 2 nhánh đấu
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
 *               qualifiersPerGroup:
 *                 type: integer
 *                 description: Number of qualifiers per group (default 2)
 *                 example: 2
 *     responses:
 *       201:
 *         description: Bracket generated from groups successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */
router.post(
  "/generate-from-group-stage",
  authenticate,
  checkPermission('schedules:create'),
  knockoutBracketController.generateFromGroupStage.bind(knockoutBracketController)
);

/**
 * @swagger
 * /knockout-brackets/validate:
 *   post:
 *     tags: [Knockout Brackets]
 *     summary: Validate bracket integrity
 *     description: |
 *       Kiểm tra bracket tree có hợp lệ:
 *       - Tất cả bracket round 1 đã có đủ entries hoặc là bye
 *       - Không có entry nào xuất hiện 2 lần
 *       - Bracket tree liên kết đúng
 *       - Số lượng brackets đúng với bracket size
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
 *         description: Validation result
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */
router.post(
  "/validate",
  authenticate,
  checkPermission('schedules:update'),
  knockoutBracketController.validateBracketIntegrity.bind(knockoutBracketController)
);

/**
 * @swagger
 * /knockout-brackets/category/{categoryId}/tree:
 *   get:
 *     tags: [Knockout Brackets]
 *     summary: Get full bracket tree structure
 *     description: Lấy toàn bộ cấu trúc nhánh đấu theo tournament category
 *     parameters:
 *       - name: categoryId
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *         description: Tournament category ID
 *     responses:
 *       200:
 *         description: Bracket tree retrieved successfully
 *       400:
 *         description: Bad request - no brackets found
 */
router.get(
  "/category/:categoryId/tree",
  knockoutBracketController.getBracketTree.bind(knockoutBracketController)
);

/**
 * @swagger
 * /knockout-brackets/category/{categoryId}/standings:
 *   get:
 *     tags: [Knockout Brackets]
 *     summary: Get tournament standings
 *     description: |
 *       Lấy kết quả xếp hạng cuối giải knockout:
 *       - Vô địch: winner của Final
 *       - Á quân: loser của Final
 *       - Hạng 3: loser của Semi-final (đồng hạng 3)
 *     parameters:
 *       - name: categoryId
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *         description: Tournament category ID
 *     responses:
 *       200:
 *         description: Standings retrieved successfully
 *       400:
 *         description: Tournament not completed yet
 */
router.get(
  "/category/:categoryId/standings",
  knockoutBracketController.getStandings.bind(knockoutBracketController)
);

/**
 * @swagger
 * /knockout-brackets/category/{categoryId}/entry:
 *   get:
 *     tags: [Knockout Brackets]
 *     summary: Get brackets by entry ID or entry name
 *     description: Lấy tất cả brackets liên quan đến 1 entry theo ID hoặc tên
 *     parameters:
 *       - name: categoryId
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *         description: Tournament category ID
 *       - name: entryId
 *         in: query
 *         schema:
 *           type: integer
 *         description: Entry ID
 *       - name: entryName
 *         in: query
 *         schema:
 *           type: string
 *         description: Entry name (team name)
 *     responses:
 *       200:
 *         description: Brackets retrieved successfully
 *       400:
 *         description: Bad request (missing entryId or entryName)
 */
router.get(
  "/category/:categoryId/entry",
  knockoutBracketController.getBracketsByEntry.bind(knockoutBracketController)
);

export default router;
