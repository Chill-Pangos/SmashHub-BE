import { Router } from "express";
import knockoutBracketController from "../controllers/knockoutBracket.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { checkPermission } from "../middlewares/permission.middleware";

const router = Router();

/**
 * @swagger
 * /knockout-brackets/placeholders:
 *   post:
 *     tags: [Knockout Brackets]
 *     summary: Generate TBD placeholders based on number of groups
 *     description: |
 *       Tạo bracket với toàn bộ slots là TBD dựa trên số bảng hiện có.
 *       Dùng để tạo schedule trước khi vòng bảng kết thúc.
 *       Số slots = số bảng × 2 (nhất + nhì mỗi bảng).
 *       Sau khi vòng bảng kết thúc, gọi /fill-qualifiers để fill entryId thật.
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
 *         description: Bracket placeholders generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/BracketTreeDto'
 *                 message:
 *                   type: string
 *                   example: Bracket placeholders generated successfully
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
  "/placeholders",
  authenticate,
  checkPermission("schedules:create"),
  knockoutBracketController.generatePlaceholders.bind(knockoutBracketController),
);

/**
 * @swagger
 * /knockout-brackets/fill-qualifiers:
 *   post:
 *     tags: [Knockout Brackets]
 *     summary: Fill real qualifiers into TBD placeholder brackets
 *     description: |
 *       Fill entryId thật vào bracket round 1 sau khi vòng bảng kết thúc.
 *       Yêu cầu tất cả bảng đã có đủ kết quả xếp hạng (nhất + nhì).
 *       Đội nhất các bảng vào top half, đội nhì vào bottom half
 *       để đảm bảo đội nhất và nhì cùng bảng không gặp nhau trước Final.
 *       Bracket bye sẽ được tự động fill vào vòng tiếp theo.
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
 *         description: Qualifiers filled into bracket successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/BracketTreeDto'
 *                 message:
 *                   type: string
 *                   example: Qualifiers filled into bracket successfully
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
  "/fill-qualifiers",
  authenticate,
  checkPermission("schedules:create"),
  knockoutBracketController.fillQualifiers.bind(knockoutBracketController),
);

/**
 * @swagger
 * /knockout-brackets/from-entries:
 *   post:
 *     tags: [Knockout Brackets]
 *     summary: Generate knockout bracket from eligible entries (no group stage)
 *     description: |
 *       Tạo bracket trực tiếp từ danh sách entry đủ điều kiện.
 *       Chỉ dùng cho giải đấu không có vòng bảng (isGroupStage = false).
 *       Tự động tính bracket size (lũy thừa 2), phân bổ bye đều 2 nửa.
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
 *         description: Knockout bracket generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/BracketTreeDto'
 *                 message:
 *                   type: string
 *                   example: Knockout bracket generated successfully
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
  "/from-entries",
  authenticate,
  checkPermission("schedules:create"),
  knockoutBracketController.generateFromEntries.bind(knockoutBracketController),
);

/**
 * @swagger
 * /knockout-brackets/{id}/advance-winner:
 *   post:
 *     tags: [Knockout Brackets]
 *     summary: Advance winner to next round
 *     description: |
 *       Ghi nhận kết quả trận đấu và fill winner vào bracket vòng tiếp theo.
 *       Bracket tiếp theo sẽ chuyển sang "ready" khi cả 2 slot đã có entry.
 *       Bracket phải đang ở trạng thái "ready" hoặc "in_progress".
 *       Winner phải là entryA hoặc entryB của bracket hiện tại.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *         description: Bracket ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - winnerEntryId
 *             properties:
 *               winnerEntryId:
 *                 type: integer
 *                 example: 5
 *     responses:
 *       200:
 *         description: Winner advanced successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/KnockoutBracket'
 *                 message:
 *                   type: string
 *                   example: Winner advanced to the next round successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest400'
 *       401:
 *         $ref: '#/components/responses/Unauthorized401'
 *       403:
 *         $ref: '#/components/responses/Forbidden403'
 *       404:
 *         $ref: '#/components/responses/NotFound404'
 *       500:
 *         $ref: '#/components/responses/InternalError500'
 */
router.post(
  "/:id/advance-winner",
  authenticate,
  checkPermission("schedules:update"),
  knockoutBracketController.advanceWinner.bind(knockoutBracketController),
);

/**
 * @swagger
 * /knockout-brackets/validate/{categoryId}:
 *   get:
 *     tags: [Knockout Brackets]
 *     summary: Validate bracket tree integrity
 *     description: |
 *       Kiểm tra bracket tree hợp lệ trước khi bắt đầu giải.
 *       Các check bao gồm:
 *       - Số lượng brackets đúng với bracket size (2^n - 1)
 *       - Round 1 không còn TBD (fillQualifiers đã chạy)
 *       - Không có entry trùng lặp
 *       - nextBracketId / previousBracketId liên kết đúng
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: categoryId
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Validation result
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
 *                     valid:
 *                       type: boolean
 *                       example: true
 *                     errors:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: []
 *       401:
 *         $ref: '#/components/responses/Unauthorized401'
 *       403:
 *         $ref: '#/components/responses/Forbidden403'
 *       500:
 *         $ref: '#/components/responses/InternalError500'
 */
router.get(
  "/validate/:categoryId",
  authenticate,
  checkPermission("schedules:update"),
  knockoutBracketController.validateBracketIntegrity.bind(knockoutBracketController),
);

/**
 * @swagger
 * /knockout-brackets/tree/{categoryId}:
 *   get:
 *     tags: [Knockout Brackets]
 *     summary: Get complete bracket tree
 *     description: |
 *       Lấy toàn bộ bracket tree phân tầng theo từng round.
 *       Slots chưa có entry sẽ hiện entryName = "TBD".
 *     parameters:
 *       - name: categoryId
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Bracket tree retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/BracketTreeDto'
 *       404:
 *         $ref: '#/components/responses/NotFound404'
 *       500:
 *         $ref: '#/components/responses/InternalError500'
 */
router.get(
  "/tree/:categoryId",
  knockoutBracketController.getBracketTree.bind(knockoutBracketController),
);

/**
 * @swagger
 * /knockout-brackets/standings/{categoryId}:
 *   get:
 *     tags: [Knockout Brackets]
 *     summary: Get final tournament standings
 *     description: |
 *       Lấy xếp hạng cuối giải sau khi Final hoàn thành.
 *       - Champion: winner của Final
 *       - Runner-up: loser của Final
 *       - Third place: 2 loser của Semi-final (đồng hạng 3)
 *       - Eliminated: danh sách bị loại theo từng vòng
 *     parameters:
 *       - name: categoryId
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Standings retrieved successfully
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
 *                     champion:
 *                       type: integer
 *                       example: 5
 *                     runnerUp:
 *                       type: integer
 *                       example: 8
 *                     thirdPlace:
 *                       type: array
 *                       items:
 *                         type: integer
 *                       example: [3, 7]
 *                     eliminated:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           entryId:
 *                             type: integer
 *                           eliminatedAt:
 *                             type: string
 *                             example: Quarter-final
 *       400:
 *         description: Tournament not completed yet
 *       404:
 *         $ref: '#/components/responses/NotFound404'
 *       500:
 *         $ref: '#/components/responses/InternalError500'
 */
router.get(
  "/standings/:categoryId",
  knockoutBracketController.getStandings.bind(knockoutBracketController),
);

/**
 * @swagger
 * /knockout-brackets/category/{categoryId}/entry:
 *   get:
 *     tags: [Knockout Brackets]
 *     summary: Get brackets for a specific entry
 *     description: |
 *       Lấy tất cả brackets liên quan đến 1 entry.
 *       Filter theo entryId (exact) hoặc entryName (partial match).
 *     parameters:
 *       - name: categoryId
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *       - name: entryId
 *         in: query
 *         schema:
 *           type: integer
 *       - name: entryName
 *         in: query
 *         schema:
 *           type: string
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *           default: 1
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Entry brackets retrieved successfully
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
 *                     brackets:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/KnockoutBracket'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *       400:
 *         $ref: '#/components/responses/BadRequest400'
 *       404:
 *         $ref: '#/components/responses/NotFound404'
 *       500:
 *         $ref: '#/components/responses/InternalError500'
 */
router.get(
  "/category/:categoryId/entry",
  knockoutBracketController.getBracketsByEntry.bind(knockoutBracketController),
);

export default router;