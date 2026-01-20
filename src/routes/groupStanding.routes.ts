import { Router } from "express";
import groupStandingController from "../controllers/groupStanding.controller";

const router = Router();

/**
 * @swagger
 * /group-standings/generate-placeholders:
 *   post:
 *     tags: [Group Standings]
 *     summary: Generate group placeholders
 *     description: |
 *       Tạo danh sách bảng đấu placeholder cho tournament content.
 *       Số lượng bảng phải là lũy thừa của 2 (4, 8, 16, 32, 64) và tối thiểu là 4.
 *       Mỗi bảng có 3-5 đội.
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
 *       200:
 *         description: Placeholders generated successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */
router.post(
  "/generate-placeholders",
  groupStandingController.generatePlaceholders.bind(groupStandingController)
);

/**
 * @swagger
 * /group-standings/random-draw:
 *   post:
 *     tags: [Group Standings]
 *     summary: Random draw entries into groups
 *     description: |
 *       Bốc thăm ngẫu nhiên các entries vào các bảng đấu.
 *       Đảm bảo các entry cùng team không vào cùng bảng (nếu số entry của team < số bảng).
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
 *       200:
 *         description: Random draw completed successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */
router.post(
  "/random-draw",
  groupStandingController.randomDraw.bind(groupStandingController)
);

/**
 * @swagger
 * /group-standings/save-assignments:
 *   post:
 *     tags: [Group Standings]
 *     summary: Save group assignments
 *     description: Lưu kết quả phân bổ entries vào các bảng đấu vào database
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - contentId
 *               - groupAssignments
 *             properties:
 *               contentId:
 *                 type: integer
 *                 description: Tournament content ID
 *                 example: 1
 *               groupAssignments:
 *                 type: array
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
  groupStandingController.saveAssignments.bind(groupStandingController)
);

/**
 * @swagger
 * /group-standings/random-draw-and-save:
 *   post:
 *     tags: [Group Standings]
 *     summary: Random draw and save
 *     description: Bốc thăm ngẫu nhiên và lưu luôn kết quả vào database
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
 *         description: Random draw and save completed successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */
router.post(
  "/random-draw-and-save",
  groupStandingController.randomDrawAndSave.bind(groupStandingController)
);

/**
 * @swagger
 * /group-standings/calculate:
 *   post:
 *     tags: [Group Standings]
 *     summary: Calculate group stage standings
 *     description: |
 *       Calculates standings based on completed matches in group stage.
 *       Uses the following tiebreaker rules:
 *       1. Match points (Win=3, Draw=1, Loss=0)
 *       2. Head-to-head result
 *       3. Games (sets) difference
 *       4. Games won
 *       5. Points difference
 *       6. Points won
 *       7. Random draw if still tied
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
  groupStandingController.calculateStandings.bind(groupStandingController)
);

/**
 * @swagger
 * /group-standings/{contentId}:
 *   get:
 *     tags: [Group Standings]
 *     summary: Get group standings
 *     description: Retrieve current standings for all groups or a specific group
 *     parameters:
 *       - name: contentId
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *         description: Tournament content ID
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
  "/:contentId",
  groupStandingController.getStandings.bind(groupStandingController)
);

/**
 * @swagger
 * /group-standings/{contentId}/qualified:
 *   get:
 *     tags: [Group Standings]
 *     summary: Get qualified teams from group stage
 *     description: Returns top N teams from each group based on standings
 *     parameters:
 *       - name: contentId
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *         description: Tournament content ID
 *       - name: teamsPerGroup
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
  "/:contentId/qualified",
  groupStandingController.getQualifiedTeams.bind(groupStandingController)
);

export default router;
