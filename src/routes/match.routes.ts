import { Router } from "express";
import matchController from "../controllers/match.controller";

const router = Router();

/**
 * @swagger
 * /matches:
 *   post:
 *     tags: [Matches]
 *     summary: Create a new match
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Match created successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *   get:
 *     tags: [Matches]
 *     summary: Get all matches
 *     parameters:
 *       - $ref: '#/components/parameters/skipParam'
 *       - $ref: '#/components/parameters/limitParam'
 *     responses:
 *       200:
 *         description: List of matches
 */
router.post("/", matchController.create.bind(matchController));
router.get("/", matchController.findAll.bind(matchController));

/**
 * @swagger
 * /matches/{id}:
 *   get:
 *     tags: [Matches]
 *     summary: Get match by ID
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       200:
 *         description: Match details
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   put:
 *     tags: [Matches]
 *     summary: Update match
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       200:
 *         description: Match updated
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   delete:
 *     tags: [Matches]
 *     summary: Delete match
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       204:
 *         $ref: '#/components/responses/NoContent'
 */
router.get("/:id", matchController.findById.bind(matchController));
router.put("/:id", matchController.update.bind(matchController));
router.delete("/:id", matchController.delete.bind(matchController));

/**
 * @swagger
 * /matches/schedule/{scheduleId}:
 *   get:
 *     tags: [Matches]
 *     summary: Get matches by schedule ID
 *     parameters:
 *       - in: path
 *         name: scheduleId
 *         required: true
 *         schema:
 *           type: integer
 *       - $ref: '#/components/parameters/skipParam'
 *       - $ref: '#/components/parameters/limitParam'
 *     responses:
 *       200:
 *         description: List of matches for schedule
 */
router.get(
  "/schedule/:scheduleId",
  matchController.findByScheduleId.bind(matchController)
);

/**
 * @swagger
 * /matches/status/{status}:
 *   get:
 *     tags: [Matches]
 *     summary: Get matches by status
 *     parameters:
 *       - in: path
 *         name: status
 *         required: true
 *         schema:
 *           type: string
 *       - $ref: '#/components/parameters/skipParam'
 *       - $ref: '#/components/parameters/limitParam'
 *     responses:
 *       200:
 *         description: List of matches with specified status
 */
router.get(
  "/status/:status",
  matchController.findByStatus.bind(matchController)
);

/**
 * @swagger
 * /matches/{id}/start:
 *   post:
 *     tags: [Matches]
 *     summary: Start a match
 *     description: Automatically assign 2 available referees and change match status from scheduled to in_progress
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       200:
 *         description: Match started successfully with referees assigned
 *       400:
 *         description: Bad request - Match is not in scheduled status or not enough available referees
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.post("/:id/start", matchController.startMatch.bind(matchController));

/**
 * @swagger
 * /matches/{id}/finalize:
 *   post:
 *     tags: [Matches]
 *     summary: Finalize match result
 *     description: |
 *       Finalize match by checking set scores to determine winner and update standings/brackets:
 *       - Check if a team has won enough sets (maxSets/2 + 1)
 *       - For group stage: update group standings with match and set statistics
 *       - For knockout stage: update bracket with winner and create next match if both entries are ready
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       200:
 *         description: Match finalized successfully, standings/brackets updated
 *       400:
 *         description: Bad request - Match not in_progress, not enough sets completed, or no clear winner
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.post("/:id/finalize", matchController.finalizeMatch.bind(matchController));

export default router;
