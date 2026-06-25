import { Router } from "express";
import subMatchPlayerController from "../controllers/subMatchPlayer.controller";
import { authenticate } from "../../../middlewares/auth.middleware";

const router = Router();

/**
 * @swagger
 * /sub-match-players/match/{matchId}/lineup-submit:
 *   post:
 *     tags: [Sub Match Players]
 *     summary: Captain submits team lineup for all sub-matches
 *     description: |
 *       Captain submits lineup for every sub-match in a match.
 *       Captain does not send team A/B; system detects team from match entryAId/entryBId.
 *       Submitted lineups are stored as pending requests in Redis.
 *       Data is written to sub_match_players only after umpire approval.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: matchId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Match ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [lineups]
 *             properties:
 *               lineups:
 *                 type: array
 *                 minItems: 1
 *                 items:
 *                   type: object
 *                   required: [subMatchId, entryMemberIds]
 *                   properties:
 *                     subMatchId:
 *                       type: integer
 *                       example: 88
 *                     entryMemberIds:
 *                       type: array
 *                       items:
 *                         type: integer
 *                       example: [301, 302]
 *           example:
 *             lineups:
 *               - subMatchId: 88
 *                 entryMemberIds: [301]
 *               - subMatchId: 89
 *                 entryMemberIds: [302, 303]
 *     responses:
 *       202:
 *         description: Lineups submitted and waiting for umpire approval
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [message, lineups]
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Lineups submitted. Waiting for umpire approval.
 *                 lineups:
 *                   type: array
 *                   items:
 *                     type: object
 *               example:
 *                 message: Lineups submitted. Waiting for umpire approval.
 *                 lineups:
 *                   - subMatchId: 88
 *                     matchId: 42
 *                     team: A
 *                     captainId: 11
 *                     umpireId: 21
 *                     entryId: 101
 *                     entryMemberIds: [301]
 *                     status: pending
 *                   - subMatchId: 89
 *                     matchId: 42
 *                     team: A
 *                     captainId: 11
 *                     umpireId: 21
 *                     entryId: 101
 *                     entryMemberIds: [302, 303]
 *                     status: pending
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post(
  "/match/:matchId/lineup-submit",
  authenticate,
  subMatchPlayerController.submitTeamLineup.bind(subMatchPlayerController)
);

/**
 * @swagger
 * /sub-match-players/lineup-requests/pending:
 *   get:
 *     tags: [Sub Match Players]
 *     summary: Umpire gets pending lineup requests
 *     description: Retrieve pending lineup requests assigned to current umpire.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Pending lineup requests
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [lineups]
 *               properties:
 *                 lineups:
 *                   type: array
 *                   items:
 *                     type: object
 *               example:
 *                 lineups:
 *                   - subMatchId: 88
 *                     matchId: 42
 *                     team: A
 *                     captainId: 11
 *                     umpireId: 21
 *                     entryId: 101
 *                     entryMemberIds: [301]
 *                     status: pending
 *                   - subMatchId: 88
 *                     matchId: 42
 *                     team: B
 *                     captainId: 12
 *                     umpireId: 21
 *                     entryId: 102
 *                     entryMemberIds: [401]
 *                     status: pending
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get(
  "/lineup-requests/pending",
  authenticate,
  subMatchPlayerController.getPendingLineupsForUmpire.bind(subMatchPlayerController)
);

/**
 * @swagger
 * /sub-match-players/match/{matchId}/lineup-approve:
 *   post:
 *     tags: [Sub Match Players]
 *     summary: Umpire approves pending lineups for a match
 *     description: |
 *       Umpire approves all pending lineups for this match.
 *       Approved lineups are persisted into sub_match_players table.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: matchId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Match ID
 *     responses:
 *       200:
 *         description: Lineups approved and saved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [message, players]
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Lineup approved and saved.
 *                 players:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/SubMatchPlayer'
 *               example:
 *                 message: Lineup approved and saved.
 *                 players:
 *                   - id: 900
 *                     subMatchId: 88
 *                     entryMemberId: 301
 *                     team: A
 *                   - id: 901
 *                     subMatchId: 88
 *                     entryMemberId: 401
 *                     team: B
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post(
  "/match/:matchId/lineup-approve",
  authenticate,
  subMatchPlayerController.approveTeamLineup.bind(subMatchPlayerController)
);

/**
 * @swagger
 * /sub-match-players/match/{matchId}/lineup-reject:
 *   post:
 *     tags: [Sub Match Players]
 *     summary: Umpire rejects pending lineups for a match
 *     description: |
 *       Umpire rejects pending lineup requests for this match.
 *       Pending requests are removed. Captain must submit updated lineup.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: matchId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Match ID
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reviewNotes:
 *                 type: string
 *                 example: Player order invalid. Please resubmit lineup.
 *     responses:
 *       200:
 *         description: Lineups rejected
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [message, rejected]
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Lineup rejected. Captain must submit updated lineup.
 *                 rejected:
 *                   type: array
 *                   items:
 *                     type: object
 *               example:
 *                 message: Lineup rejected. Captain must submit updated lineup.
 *                 rejected:
 *                   - subMatchId: 88
 *                     matchId: 42
 *                     team: A
 *                     captainId: 11
 *                     umpireId: 21
 *                     entryId: 101
 *                     entryMemberIds: [301]
 *                     status: rejected
 *                     reviewNotes: Player order invalid. Please resubmit lineup.
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post(
  "/match/:matchId/lineup-reject",
  authenticate,
  subMatchPlayerController.rejectTeamLineup.bind(subMatchPlayerController)
);

/**
 * @swagger
 * /sub-match-players/lineup-requests/rejected:
 *   get:
 *     tags: [Sub Match Players]
 *     summary: Captain gets rejected lineup requests
 *     description: Retrieve rejected lineup requests for current captain.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Rejected lineup requests
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [rejected]
 *               properties:
 *                 rejected:
 *                   type: array
 *                   items:
 *                     type: object
 *               example:
 *                 rejected:
 *                   - subMatchId: 88
 *                     matchId: 42
 *                     team: A
 *                     captainId: 11
 *                     umpireId: 21
 *                     entryId: 101
 *                     entryMemberIds: [301]
 *                     status: rejected
 *                     reviewNotes: Player order invalid. Please resubmit lineup.
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get(
  "/lineup-requests/rejected",
  authenticate,
  subMatchPlayerController.getRejectedLineupsForCaptain.bind(subMatchPlayerController)
);

/**
 * @swagger
 * /sub-match-players/sub-match/{subMatchId}:
 *   get:
 *     tags: [Sub Match Players]
 *     summary: Get all players in a sub-match
 *     description: Retrieve all players assigned to a specific sub-match with their team assignments
 *     parameters:
 *       - in: path
 *         name: subMatchId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the sub-match
 *     responses:
 *       200:
 *         description: List of players with team assignments
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 players:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/SubMatchPlayer'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get(
  "/sub-match/:subMatchId",
  subMatchPlayerController.getBySubMatchId.bind(subMatchPlayerController)
);

/**
 * @swagger
 * /sub-match-players/sub-match/{subMatchId}/team/{team}:
 *   get:
 *     tags: [Sub Match Players]
 *     summary: Get players by team
 *     description: Retrieve all players assigned to a specific team (A or B) in a sub-match
 *     parameters:
 *       - in: path
 *         name: subMatchId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the sub-match
 *       - in: path
 *         name: team
 *         required: true
 *         schema:
 *           type: string
 *           enum: [A, B]
 *         description: Team identifier (A or B)
 *     responses:
 *       200:
 *         description: List of players in the specified team
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 players:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/SubMatchPlayer'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       400:
 *         description: Invalid team parameter
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get(
  "/sub-match/:subMatchId/team/:team",
  subMatchPlayerController.getByTeam.bind(subMatchPlayerController)
);

/**
 * @swagger
 * /sub-match-players/entry-member/{entryMemberId}:
 *   get:
 *     tags: [Sub Match Players]
 *     summary: Get sub-match history by entry member
 *     description: Retrieve all sub-matches that an entry member has participated in
 *     parameters:
 *       - in: path
 *         name: entryMemberId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the entry member
 *       - $ref: '#/components/parameters/pageParam'
 *       - $ref: '#/components/parameters/limitParam'
 *     responses:
 *       200:
 *         description: List of sub-matches the member participated in
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 matches:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/SubMatchPlayer'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get(
  "/entry-member/:entryMemberId",
  subMatchPlayerController.getByEntryMemberId.bind(subMatchPlayerController)
);

export default router;
