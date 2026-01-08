import { Router } from "express";
import matchSetController from "../controllers/matchSet.controller";

const router = Router();

/**
 * @swagger
 * /match-sets:
 *   post:
 *     tags: [Match Sets]
 *     summary: Create a new match set
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Match set created successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *   get:
 *     tags: [Match Sets]
 *     summary: Get all match sets
 *     parameters:
 *       - $ref: '#/components/parameters/skipParam'
 *       - $ref: '#/components/parameters/limitParam'
 *     responses:
 *       200:
 *         description: List of match sets
 */
router.post("/", matchSetController.create.bind(matchSetController));
router.get("/", matchSetController.findAll.bind(matchSetController));

/**
 * @swagger
 * /match-sets/{id}:
 *   get:
 *     tags: [Match Sets]
 *     summary: Get match set by ID
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       200:
 *         description: Match set details
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   put:
 *     tags: [Match Sets]
 *     summary: Update match set
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       200:
 *         description: Match set updated
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   delete:
 *     tags: [Match Sets]
 *     summary: Delete match set
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       204:
 *         $ref: '#/components/responses/NoContent'
 */
router.get("/:id", matchSetController.findById.bind(matchSetController));
router.put("/:id", matchSetController.update.bind(matchSetController));
router.delete("/:id", matchSetController.delete.bind(matchSetController));

/**
 * @swagger
 * /match-sets/match/{matchId}:
 *   get:
 *     tags: [Match Sets]
 *     summary: Get match sets by match ID
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
 *         description: List of match sets ordered by set number
 */
router.get(
  "/match/:matchId",
  matchSetController.findByMatchId.bind(matchSetController)
);

export default router;
