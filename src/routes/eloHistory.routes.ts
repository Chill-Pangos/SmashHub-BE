import { Router } from "express";
import eloHistoryController from "../controllers/eloHistory.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { checkPermission } from "../middlewares/permission.middleware";

const router = Router();

/**
 * @swagger
 * /elo-histories/user/{userId}:
 *   get:
 *     tags: [ELO Histories]
 *     summary: Get ELO history by user ID
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *       - $ref: '#/components/parameters/pageParam'
 *       - $ref: '#/components/parameters/limitParam'
 *     responses:
 *       200:
 *         description: User's ELO history
 */
router.get(
  "/user/:userId",
  eloHistoryController.findByUserId.bind(eloHistoryController)
);

/**
 * @swagger
 * /elo-histories/match/{matchId}:
 *   get:
 *     tags: [ELO Histories]
 *     summary: Get ELO history by match ID
 *     parameters:
 *       - in: path
 *         name: matchId
 *         required: true
 *         schema:
 *           type: integer
 *       - $ref: '#/components/parameters/pageParam'
 *       - $ref: '#/components/parameters/limitParam'
 *     responses:
 *       200:
 *         description: ELO history for match
 */
router.get(
  "/match/:matchId",
  eloHistoryController.findByMatchId.bind(eloHistoryController)
);

export default router;
