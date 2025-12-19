import { Router } from "express";
import eloHistoryController from "../controllers/eloHistory.controller";

const router = Router();

/**
 * @swagger
 * /elo-histories:
 *   post:
 *     tags: [ELO Histories]
 *     summary: Create a new ELO history entry
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: ELO history entry created successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *   get:
 *     tags: [ELO Histories]
 *     summary: Get all ELO history entries
 *     description: Returns ELO history ordered by creation date (newest first)
 *     parameters:
 *       - $ref: '#/components/parameters/skipParam'
 *       - $ref: '#/components/parameters/limitParam'
 *     responses:
 *       200:
 *         description: List of ELO history entries
 */
router.post("/", eloHistoryController.create.bind(eloHistoryController));
router.get("/", eloHistoryController.findAll.bind(eloHistoryController));

/**
 * @swagger
 * /elo-histories/{id}:
 *   get:
 *     tags: [ELO Histories]
 *     summary: Get ELO history entry by ID
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       200:
 *         description: ELO history entry details
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   delete:
 *     tags: [ELO Histories]
 *     summary: Delete ELO history entry
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       204:
 *         $ref: '#/components/responses/NoContent'
 */
router.get("/:id", eloHistoryController.findById.bind(eloHistoryController));
router.delete("/:id", eloHistoryController.delete.bind(eloHistoryController));

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
 *       - $ref: '#/components/parameters/skipParam'
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
 *       - $ref: '#/components/parameters/skipParam'
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
