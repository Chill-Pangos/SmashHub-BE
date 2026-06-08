import { Router } from "express";
import knockoutBracketController from "../controllers/knockoutBracket.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { checkRole } from "../middlewares/permission.middleware";

const router = Router();

/**
 * @swagger
 * /knockout-brackets/preview-placeholders:
 *   post:
 *     tags: [Knockout Brackets]
 *     summary: Preview TBD placeholder bracket tree
 *     description: Preview bracket placeholders without saving to database. Use /knockout-brackets/save-assignments with categoryId only to persist after organizer review.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [categoryId]
 *             properties:
 *               categoryId:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       200:
 *         description: Bracket placeholder preview generated successfully
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
  "/preview-placeholders",
  authenticate,
  checkRole("organizer"),
  knockoutBracketController.previewPlaceholders.bind(knockoutBracketController),
);

/**
 * @swagger
 * /knockout-brackets/preview-fill-qualifiers:
 *   post:
 *     tags: [Knockout Brackets]
 *     summary: Preview filling qualifiers into brackets
 *     description: Preview shuffled qualifier placement without saving. Response includes entryIds; send same entryIds to /knockout-brackets/save-assignments to persist exactly what organizer reviewed.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [categoryId]
 *             properties:
 *               categoryId:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       200:
 *         description: Qualifier placement preview generated successfully. data.entryIds contains save order and data.bracketTree contains preview tree.
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
 *                     entryIds:
 *                       type: array
 *                       items:
 *                         type: integer
 *                       example: [5, 9, 2, 12]
 *                     bracketTree:
 *                       $ref: '#/components/schemas/BracketTreeDto'
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
  "/preview-fill-qualifiers",
  authenticate,
  checkRole("organizer"),
  knockoutBracketController.previewFillQualifiers.bind(knockoutBracketController),
);

/**
 * @swagger
 * /knockout-brackets/preview-from-entries:
 *   post:
 *     tags: [Knockout Brackets]
 *     summary: Preview knockout bracket from eligible entries
 *     description: Preview shuffled knockout bracket without saving. Response includes entryIds; send same entryIds to /knockout-brackets/save-assignments to persist exactly what organizer reviewed.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [categoryId]
 *             properties:
 *               categoryId:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       200:
 *         description: Knockout bracket preview generated successfully. data.entryIds contains save order and data.bracketTree contains preview tree.
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
 *                     entryIds:
 *                       type: array
 *                       items:
 *                         type: integer
 *                       example: [8, 3, 12, 6]
 *                     bracketTree:
 *                       $ref: '#/components/schemas/BracketTreeDto'
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
  "/preview-from-entries",
  authenticate,
  checkRole("organizer"),
  knockoutBracketController.previewFromEntries.bind(knockoutBracketController),
);

/**
 * @swagger
 * /knockout-brackets/save-assignments:
 *   post:
 *     tags: [Knockout Brackets]
 *     summary: Save knockout bracket assignments
 *     description: |
 *       Persist approved knockout preview to database after organizer confirmation.
 *
 *       **Workflow**:
 *       1. Preview TBD placeholders: gọi `/knockout-brackets/preview-placeholders`, rồi save body chỉ cần `categoryId`
 *       2. Preview qualifiers: gọi `/knockout-brackets/preview-fill-qualifiers`, rồi save body có `categoryId` + `entryIds`
 *       3. Preview direct knockout: gọi `/knockout-brackets/preview-from-entries`, rồi save body có `categoryId` + `entryIds`
 *
 *       **Validation**:
 *       - `categoryId` luôn bắt buộc
 *       - `entryIds` optional khi save placeholders
 *       - `entryIds` bắt buộc khi save qualifiers hoặc direct knockout
 *       - Nếu có `entryIds`, danh sách phải là positive integer và khớp các entry có thể preview
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
 *               entryIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: Optional for preview-placeholders save. Required order returned by preview-fill-qualifiers or preview-from-entries.
 *                 example: [8, 3, 12, 6]
 *               assignments:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: Backward-compatible alias for entryIds.
 *                 example: [8, 3, 12, 6]
 *           examples:
 *             savePlaceholders:
 *               summary: Save preview-placeholders
 *               value:
 *                 categoryId: 1
 *             saveQualifiers:
 *               summary: Save preview-fill-qualifiers
 *               value:
 *                 categoryId: 1
 *                 entryIds: [5, 9, 2, 12]
 *             saveFromEntries:
 *               summary: Save preview-from-entries
 *               value:
 *                 categoryId: 2
 *                 entryIds: [8, 3, 12, 6]
 *     responses:
 *       201:
 *         description: Knockout bracket assignments saved successfully
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
 *                   example: Knockout bracket assignments saved successfully
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
  "/save-assignments",
  authenticate,
  checkRole("organizer"),
  knockoutBracketController.saveAssignments.bind(knockoutBracketController),
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
  checkRole("organizer"),
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
  checkRole("organizer"),
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
 *                         $ref: '#/components/schemas/BracketDto'
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
