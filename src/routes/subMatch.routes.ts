import { Router } from "express";
import subMatchController from "../controllers/subMatch.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { checkPermission } from "../middlewares/permission.middleware";

const router = Router();

/**
 * @swagger
 * /sub-matches/create-from-format:
 *   post:
 *     tags: [Sub Matches]
 *     summary: Create sub-matches from team format
 *     description: Create sub-matches based on category's team format (e.g., "S-D-S" creates 3 sub-matches)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - matchId
 *               - teamFormat
 *             properties:
 *               matchId:
 *                 type: integer
 *                 description: ID of the match
 *                 example: 1
 *               teamFormat:
 *                 type: string
 *                 description: Team format string (e.g., "S-D-S" for Singles-Doubles-Singles)
 *                 example: "S-D-S"
 *     responses:
 *       201:
 *         description: Sub-matches created successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */
router.post(
  "/create-from-format",
  authenticate,
  checkPermission('matches:update'),
  subMatchController.createFromFormat.bind(subMatchController)
);

/**
 * @swagger
 * /sub-matches/{id}/start:
 *   post:
 *     tags: [Sub Matches]
 *     summary: Start a sub-match
 *     description: Start a sub-match and assign the requesting referee as umpire
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       200:
 *         description: Sub-match started successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */
router.post(
  "/:id/start",
  authenticate,
  checkPermission('matches:update'),
  subMatchController.start.bind(subMatchController)
);

/**
 * @swagger
 * /sub-matches/{id}/finalize:
 *   post:
 *     tags: [Sub Matches]
 *     summary: Finalize a sub-match
 *     description: Complete a sub-match and determine winner based on sets won
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       200:
 *         description: Sub-match finalized successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */
router.post(
  "/:id/finalize",
  authenticate,
  checkPermission('matches:update'),
  subMatchController.finalize.bind(subMatchController)
);

/**
 * @swagger
 * /sub-matches/{id}/assign-players:
 *   post:
 *     tags: [Sub Matches]
 *     summary: Assign players to sub-match
 *     description: Assign entry members to teams A and B for a sub-match
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - players
 *             properties:
 *               players:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - entryMemberId
 *                     - team
 *                   properties:
 *                     entryMemberId:
 *                       type: integer
 *                       example: 1
 *                     team:
 *                       type: string
 *                       enum: [A, B]
 *                       example: "A"
 *     responses:
 *       200:
 *         description: Players assigned successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */
router.post(
  "/:id/assign-players",
  authenticate,
  checkPermission('matches:update'),
  subMatchController.assignPlayers.bind(subMatchController)
);

/**
 * @swagger
 * /sub-matches/match/{matchId}:
 *   get:
 *     tags: [Sub Matches]
 *     summary: Get sub-matches by match ID
 *     description: Retrieve all sub-matches for a specific match with sets and player assignments
 *     parameters:
 *       - in: path
 *         name: matchId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the match
 *     responses:
 *       200:
 *         description: List of sub-matches
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get(
  "/match/:matchId",
  subMatchController.getByMatchId.bind(subMatchController)
);

/**
 * @swagger
 * /sub-matches/{id}:
 *   get:
 *     tags: [Sub Matches]
 *     summary: Get sub-match by ID
 *     description: Get detailed information about a specific sub-match
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       200:
 *         description: Sub-match details
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get(
  "/:id",
  subMatchController.getById.bind(subMatchController)
);

export default router;
