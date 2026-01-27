import { Router } from "express";
import tournamentRefereeController from "../controllers/tournamentReferee.controller";

const router = Router();

/**
 * @swagger
 * /tournament-referees:
 *   post:
 *     tags: [Tournament Referees]
 *     summary: Create a tournament referee
 *     description: Add a referee to a tournament
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tournamentId
 *               - refereeId
 *               - role
 *             properties:
 *               tournamentId:
 *                 type: integer
 *                 description: Tournament ID
 *                 example: 1
 *               refereeId:
 *                 type: integer
 *                 description: Referee user ID
 *                 example: 5
 *               role:
 *                 type: string
 *                 enum: [main, assistant]
 *                 description: Referee role
 *                 example: main
 *     responses:
 *       201:
 *         description: Tournament referee created successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */
router.post(
  "/",
  tournamentRefereeController.create.bind(tournamentRefereeController)
);

/**
 * @swagger
 * /tournament-referees/assign:
 *   post:
 *     tags: [Tournament Referees]
 *     summary: Assign multiple referees to a tournament
 *     description: Assign multiple referees to a tournament at once
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tournamentId
 *               - refereeIds
 *             properties:
 *               tournamentId:
 *                 type: integer
 *                 description: Tournament ID
 *                 example: 1
 *               refereeIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: Array of referee user IDs
 *                 example: [5, 6, 7]
 *     responses:
 *       201:
 *         description: Referees assigned successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */
router.post(
  "/assign",
  tournamentRefereeController.assignReferees.bind(tournamentRefereeController)
);

/**
 * @swagger
 * /tournament-referees:
 *   get:
 *     tags: [Tournament Referees]
 *     summary: Get all tournament referees
 *     description: Get all tournament referees with optional tournament filter
 *     parameters:
 *       - in: query
 *         name: tournamentId
 *         schema:
 *           type: integer
 *         description: Filter by tournament ID
 *       - in: query
 *         name: skip
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of records to skip
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Maximum number of records to return
 *     responses:
 *       200:
 *         description: List of tournament referees
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get(
  "/",
  tournamentRefereeController.findAll.bind(tournamentRefereeController)
);

/**
 * @swagger
 * /tournament-referees/tournament/{tournamentId}:
 *   get:
 *     tags: [Tournament Referees]
 *     summary: Get referees by tournament ID
 *     description: Get all referees assigned to a specific tournament
 *     parameters:
 *       - in: path
 *         name: tournamentId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Tournament ID
 *       - in: query
 *         name: skip
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of records to skip
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Maximum number of records to return
 *     responses:
 *       200:
 *         description: List of tournament referees
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get(
  "/tournament/:tournamentId",
  tournamentRefereeController.findByTournamentId.bind(
    tournamentRefereeController
  )
);

/**
 * @swagger
 * /tournament-referees/tournament/{tournamentId}/available:
 *   get:
 *     tags: [Tournament Referees]
 *     summary: Get available referees for a tournament
 *     description: Get all available referees for a tournament, excluding specific IDs
 *     parameters:
 *       - in: path
 *         name: tournamentId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Tournament ID
 *       - in: query
 *         name: excludeIds
 *         schema:
 *           type: string
 *         description: Comma-separated referee IDs to exclude
 *         example: "1,2,3"
 *     responses:
 *       200:
 *         description: List of available referees
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get(
  "/tournament/:tournamentId/available",
  tournamentRefereeController.getAvailableReferees.bind(
    tournamentRefereeController
  )
);

/**
 * @swagger
 * /tournament-referees/{id}:
 *   get:
 *     tags: [Tournament Referees]
 *     summary: Get tournament referee by ID
 *     description: Get a specific tournament referee by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Tournament referee ID
 *     responses:
 *       200:
 *         description: Tournament referee details
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get(
  "/:id",
  tournamentRefereeController.findById.bind(tournamentRefereeController)
);

/**
 * @swagger
 * /tournament-referees/{id}:
 *   put:
 *     tags: [Tournament Referees]
 *     summary: Update tournament referee
 *     description: Update a tournament referee's information
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Tournament referee ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [main, assistant]
 *                 description: Referee role
 *               isAvailable:
 *                 type: boolean
 *                 description: Referee availability
 *     responses:
 *       200:
 *         description: Tournament referee updated successfully
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */
router.put(
  "/:id",
  tournamentRefereeController.update.bind(tournamentRefereeController)
);

/**
 * @swagger
 * /tournament-referees/{id}/availability:
 *   patch:
 *     tags: [Tournament Referees]
 *     summary: Update referee availability
 *     description: Update a referee's availability status for a tournament
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Tournament referee ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - isAvailable
 *             properties:
 *               isAvailable:
 *                 type: boolean
 *                 description: Referee availability
 *                 example: false
 *     responses:
 *       200:
 *         description: Availability updated successfully
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */
router.patch(
  "/:id/availability",
  tournamentRefereeController.updateAvailability.bind(
    tournamentRefereeController
  )
);

/**
 * @swagger
 * /tournament-referees/{id}:
 *   delete:
 *     tags: [Tournament Referees]
 *     summary: Delete tournament referee
 *     description: Remove a referee from a tournament
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Tournament referee ID
 *     responses:
 *       204:
 *         description: Tournament referee deleted successfully
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.delete(
  "/:id",
  tournamentRefereeController.delete.bind(tournamentRefereeController)
);

export default router;
