import { Router } from "express";
import knockoutBracketController from "../controllers/knockoutBracket.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { checkPermission } from "../middlewares/permission.middleware";
import { PERMISSIONS } from "../constants/permissions";

const router = Router();

/**
 * @swagger
 * /knockout-brackets/generate:
 *   post:
 *     tags: [Knockout Brackets]
 *     summary: Generate knockout bracket structure
 *     description: |
 *       Tạo cấu trúc nhánh đấu vòng loại trực tiếp với các điều kiện:
 *       1. Số nhánh phải là lũy thừa của 2 (16, 32, 64...)
 *       2. Entries cùng team không gặp nhau ở vòng đầu
 *       3. Bye matches được random ngẫu nhiên
 *       4. Cân bằng 2 nhánh đấu
 *       5. Tối thiểu 12 đội
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - contentId
 *             properties:
 *               contentId:
 *                 type: integer
 *                 description: Tournament content ID
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
  checkPermission(PERMISSIONS.SCHEDULES_CREATE),
  knockoutBracketController.generateBracket.bind(knockoutBracketController)
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
  checkPermission(PERMISSIONS.SCHEDULES_UPDATE),
  knockoutBracketController.advanceWinner.bind(knockoutBracketController)
);

/**
 * @swagger
 * /knockout-brackets/generate-from-groups:
 *   post:
 *     tags: [Knockout Brackets]
 *     summary: Generate knockout bracket from group stage results
 *     description: |
 *       Tạo nhánh đấu knockout từ kết quả vòng bảng:
 *       1. Lấy top 2 mỗi bảng (nhất và nhì)
 *       2. Chia đều bye matches vào 2 nhánh
 *       3. Tất cả bye matches dành cho đội nhất bảng
 *       4. Đội nhì bảng gặp đội nhất bảng khác (không cùng bảng)
 *       5. Cân bằng 2 nhánh đấu
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - contentId
 *             properties:
 *               contentId:
 *                 type: integer
 *                 description: Tournament content ID
 *                 example: 1
 *     responses:
 *       201:
 *         description: Bracket generated from groups successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */
router.post(
  "/generate-from-groups",
  authenticate,
  checkPermission(PERMISSIONS.SCHEDULES_CREATE),
  knockoutBracketController.generateFromGroups.bind(knockoutBracketController)
);

/**
 * @swagger
 * /knockout-brackets/content/{contentId}:
 *   get:
 *     tags: [Knockout Brackets]
 *     summary: Get all brackets by content ID
 *     description: Lấy toàn bộ cấu trúc nhánh đấu theo tournament content
 *     parameters:
 *       - name: contentId
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *         description: Tournament content ID
 *     responses:
 *       200:
 *         description: Brackets retrieved successfully
 *       500:
 *         description: Internal server error
 */
router.get(
  "/content/:contentId",
  knockoutBracketController.findByContentId.bind(knockoutBracketController)
);

/**
 * @swagger
 * /knockout-brackets/{id}:
 *   get:
 *     tags: [Knockout Brackets]
 *     summary: Get bracket by ID
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Bracket retrieved successfully
 *       404:
 *         description: Bracket not found
 */
router.get(
  "/:id",
  knockoutBracketController.findById.bind(knockoutBracketController)
);

/**
 * @swagger
 * /knockout-brackets:
 *   get:
 *     tags: [Knockout Brackets]
 *     summary: Get all brackets
 *     parameters:
 *       - name: skip
 *         in: query
 *         schema:
 *           type: integer
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Brackets retrieved successfully
 */
router.get(
  "/",
  knockoutBracketController.findAll.bind(knockoutBracketController)
);

/**
 * @swagger
 * /knockout-brackets:
 *   post:
 *     tags: [Knockout Brackets]
 *     summary: Create a new bracket
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Bracket created successfully
 */
router.post(
  "/",
  authenticate,
  checkPermission(PERMISSIONS.SCHEDULES_CREATE),
  knockoutBracketController.create.bind(knockoutBracketController)
);

/**
 * @swagger
 * /knockout-brackets/{id}:
 *   put:
 *     tags: [Knockout Brackets]
 *     summary: Update a bracket
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
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
 *         description: Bracket updated successfully
 */
router.put(
  "/:id",
  knockoutBracketController.update.bind(knockoutBracketController)
);

/**
 * @swagger
 * /knockout-brackets/{id}:
 *   delete:
 *     tags: [Knockout Brackets]
 *     summary: Delete a bracket
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Bracket deleted successfully
 */
router.delete(
  "/:id",
  knockoutBracketController.delete.bind(knockoutBracketController)
);

export default router;
