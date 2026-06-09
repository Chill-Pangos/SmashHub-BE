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
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/SubMatch'
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
 *     description: |
 *       Start a scheduled sub-match.
 *       Only assigned umpire or assistant umpire can start.
 *       Match must be in_progress and both teams must have approved lineups.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       200:
 *         description: Sub-match started successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [message, subMatch, lineupReady]
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Sub-match started successfully
 *                 lineupReady:
 *                   type: boolean
 *                   example: true
 *                 subMatch:
 *                   type: object
 *               example:
 *                 message: Sub-match started successfully
 *                 lineupReady: true
 *                 subMatch:
 *                   id: 88
 *                   matchId: 42
 *                   subMatchNumber: 1
 *                   status: in_progress
 *                   winnerTeam: null
 *                   umpireId: 21
 *                   assistantUmpireId: 22
 *                   createdAt: "2026-06-09T08:00:00.000Z"
 *                   updatedAt: "2026-06-09T08:30:00.000Z"
 *                   matchSets: []
 *                   subMatchPlayers:
 *                     - id: 900
 *                       subMatchId: 88
 *                       entryMemberId: 301
 *                       team: A
 *                       entryMember:
 *                         id: 301
 *                         entryId: 101
 *                         userId: 11
 *                     - id: 901
 *                       subMatchId: 88
 *                       entryMemberId: 302
 *                       team: B
 *                       entryMember:
 *                         id: 302
 *                         entryId: 102
 *                         userId: 12
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
 *     description: |
 *       Complete a sub-match and determine winner based on sets won.
 *       Only assigned umpire or assistant umpire can finalize.
 *       This endpoint only finalizes sub-match. It does not submit/finalize match.
 *       When enough sub-matches are won, response returns matchReadyToFinalize = true.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       200:
 *         description: Sub-match finalized successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [message, subMatch, matchReadyToFinalize]
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Sub-match finalized. Match is ready to finalize.
 *                 matchReadyToFinalize:
 *                   type: boolean
 *                   example: true
 *                 subMatch:
 *                   type: object
 *               example:
 *                 message: Sub-match finalized. Match is ready to finalize.
 *                 matchReadyToFinalize: true
 *                 subMatch:
 *                   id: 88
 *                   matchId: 42
 *                   subMatchNumber: 1
 *                   status: completed
 *                   winnerTeam: A
 *                   umpireId: 21
 *                   assistantUmpireId: 22
 *                   createdAt: "2026-06-09T08:00:00.000Z"
 *                   updatedAt: "2026-06-09T08:45:00.000Z"
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
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/SubMatchPlayer'
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
 *     security:
 *       - bearerAuth: []
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [message, matchId, count, subMatches]
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Sub-matches retrieved successfully
 *                 matchId:
 *                   type: integer
 *                   example: 42
 *                 count:
 *                   type: integer
 *                   example: 2
 *                 subMatches:
 *                   type: array
 *                   items:
 *                     type: object
 *               example:
 *                 message: Sub-matches retrieved successfully
 *                 matchId: 42
 *                 count: 2
 *                 subMatches:
 *                   - id: 88
 *                     matchId: 42
 *                     subMatchNumber: 1
 *                     status: completed
 *                     winnerTeam: A
 *                     umpireId: 21
 *                     assistantUmpireId: 22
 *                     createdAt: "2026-06-09T08:00:00.000Z"
 *                     updatedAt: "2026-06-09T08:30:00.000Z"
 *                     umpire:
 *                       id: 21
 *                       firstName: Le
 *                       lastName: Referee
 *                       email: referee@example.com
 *                     assistantUmpire:
 *                       id: 22
 *                       firstName: Pham
 *                       lastName: Assistant
 *                       email: assistant@example.com
 *                     matchSets:
 *                       - id: 501
 *                         subMatchId: 88
 *                         setNumber: 1
 *                         entryAScore: 21
 *                         entryBScore: 18
 *                         createdAt: "2026-06-09T08:10:00.000Z"
 *                         updatedAt: "2026-06-09T08:10:00.000Z"
 *                     subMatchPlayers:
 *                       - id: 900
 *                         subMatchId: 88
 *                         entryMemberId: 301
 *                         team: A
 *                         entryMember:
 *                           id: 301
 *                           entryId: 101
 *                           userId: 11
 *                           user:
 *                             id: 11
 *                             firstName: Nguyen
 *                             lastName: An
 *                   - id: 89
 *                     matchId: 42
 *                     subMatchNumber: 2
 *                     status: scheduled
 *                     winnerTeam: null
 *                     umpireId: 21
 *                     assistantUmpireId: 22
 *                     matchSets: []
 *                     subMatchPlayers: []
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get(
  "/match/:matchId",
  authenticate,
  checkPermission('matches:view'),
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
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SubMatch'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get(
  "/:id",
  subMatchController.getById.bind(subMatchController)
);

export default router;
