import { Router } from "express";
import eloScoreController from "../controllers/eloScore.controller";

const router = Router();

/**
 * @swagger
 * /elo-scores:
 *   post:
 *     tags: [ELO Scores]
 *     summary: Create a new ELO score
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: ELO score created successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *   get:
 *     tags: [ELO Scores]
 *     summary: Get all ELO scores
 *     parameters:
 *       - $ref: '#/components/parameters/skipParam'
 *       - $ref: '#/components/parameters/limitParam'
 *     responses:
 *       200:
 *         description: List of ELO scores
 */
router.post("/", eloScoreController.create.bind(eloScoreController));
router.get("/", eloScoreController.findAll.bind(eloScoreController));

/**
 * @swagger
 * /elo-scores/leaderboard:
 *   get:
 *     tags: [ELO Scores]
 *     summary: Get ELO leaderboard
 *     description: Returns ELO scores sorted by score in descending order
 *     parameters:
 *       - $ref: '#/components/parameters/skipParam'
 *       - $ref: '#/components/parameters/limitParam'
 *     responses:
 *       200:
 *         description: Leaderboard data ordered by score
 */
router.get(
  "/leaderboard",
  eloScoreController.getLeaderboard.bind(eloScoreController)
);

/**
 * @swagger
 * /elo-scores/{id}:
 *   get:
 *     tags: [ELO Scores]
 *     summary: Get ELO score by ID
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       200:
 *         description: ELO score details
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   put:
 *     tags: [ELO Scores]
 *     summary: Update ELO score
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       200:
 *         description: ELO score updated
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   delete:
 *     tags: [ELO Scores]
 *     summary: Delete ELO score
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       204:
 *         $ref: '#/components/responses/NoContent'
 */
router.get("/:id", eloScoreController.findById.bind(eloScoreController));
router.put("/:id", eloScoreController.update.bind(eloScoreController));
router.delete("/:id", eloScoreController.delete.bind(eloScoreController));

export default router;
