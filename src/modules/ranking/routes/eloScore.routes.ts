import { Router } from "express";
import eloScoreController from "../controllers/eloScore.controller";

const router = Router();

/**
 * @swagger
 * /elo-scores/leaderboard:
 *   get:
 *     tags: [ELO Scores]
 *     summary: Get ELO leaderboard
 *     description: Returns ELO scores sorted by score in descending order
 *     parameters:
 *       - $ref: '#/components/parameters/pageParam'
 *       - $ref: '#/components/parameters/limitParam'
 *     responses:
 *       200:
 *         description: Leaderboard data ordered by score
 */
router.get(
  "/leaderboard",
  eloScoreController.getLeaderboard.bind(eloScoreController)
);

export default router;
