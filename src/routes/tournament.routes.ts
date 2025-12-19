import { Router } from "express";
import tournamentController from "../controllers/tournament.controller";

const router = Router();

/**
 * @swagger
 * /tournaments:
 *   post:
 *     tags: [Tournaments]
 *     summary: Create a new tournament
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Tournament created successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *   get:
 *     tags: [Tournaments]
 *     summary: Get all tournaments
 *     parameters:
 *       - $ref: '#/components/parameters/skipParam'
 *       - $ref: '#/components/parameters/limitParam'
 *     responses:
 *       200:
 *         description: List of tournaments
 */
router.post("/", tournamentController.create.bind(tournamentController));
router.get("/", tournamentController.findAll.bind(tournamentController));

/**
 * @swagger
 * /tournaments/{id}:
 *   get:
 *     tags: [Tournaments]
 *     summary: Get tournament by ID
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       200:
 *         description: Tournament details
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   put:
 *     tags: [Tournaments]
 *     summary: Update tournament
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       200:
 *         description: Tournament updated
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   delete:
 *     tags: [Tournaments]
 *     summary: Delete tournament
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       204:
 *         $ref: '#/components/responses/NoContent'
 */
router.get("/:id", tournamentController.findById.bind(tournamentController));
router.put("/:id", tournamentController.update.bind(tournamentController));
router.delete("/:id", tournamentController.delete.bind(tournamentController));

/**
 * @swagger
 * /tournaments/status/{status}:
 *   get:
 *     tags: [Tournaments]
 *     summary: Get tournaments by status
 *     parameters:
 *       - in: path
 *         name: status
 *         required: true
 *         schema:
 *           type: string
 *           enum: [upcoming, ongoing, completed]
 *       - $ref: '#/components/parameters/skipParam'
 *       - $ref: '#/components/parameters/limitParam'
 *     responses:
 *       200:
 *         description: List of tournaments with specified status
 */
router.get(
  "/status/:status",
  tournamentController.findByStatus.bind(tournamentController)
);

export default router;
