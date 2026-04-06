import { Router } from "express";
import subMatchPlayerController from "../controllers/subMatchPlayer.controller";

const router = Router();

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
 *       - $ref: '#/components/parameters/skipParam'
 *       - $ref: '#/components/parameters/limitParam'
 *     responses:
 *       200:
 *         description: List of sub-matches the member participated in
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get(
  "/entry-member/:entryMemberId",
  subMatchPlayerController.getByEntryMemberId.bind(subMatchPlayerController)
);

export default router;
