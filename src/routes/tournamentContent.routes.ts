import { Router } from "express";
import tournamentContentController from "../controllers/tournamentContent.controller";

const router = Router();

/**
 * @swagger
 * /tournament-contents:
 *   post:
 *     tags: [Tournament Contents]
 *     summary: Create a new tournament content
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Tournament content created successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *   get:
 *     tags: [Tournament Contents]
 *     summary: Get all tournament contents
 *     parameters:
 *       - $ref: '#/components/parameters/skipParam'
 *       - $ref: '#/components/parameters/limitParam'
 *     responses:
 *       200:
 *         description: List of tournament contents
 */
router.post(
  "/",
  tournamentContentController.create.bind(tournamentContentController)
);
router.get(
  "/",
  tournamentContentController.findAll.bind(tournamentContentController)
);

/**
 * @swagger
 * /tournament-contents/{id}:
 *   get:
 *     tags: [Tournament Contents]
 *     summary: Get tournament content by ID
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       200:
 *         description: Tournament content details
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   put:
 *     tags: [Tournament Contents]
 *     summary: Update tournament content
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       200:
 *         description: Tournament content updated
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   delete:
 *     tags: [Tournament Contents]
 *     summary: Delete tournament content
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       204:
 *         $ref: '#/components/responses/NoContent'
 */
router.get(
  "/:id",
  tournamentContentController.findById.bind(tournamentContentController)
);
router.put(
  "/:id",
  tournamentContentController.update.bind(tournamentContentController)
);
router.delete(
  "/:id",
  tournamentContentController.delete.bind(tournamentContentController)
);

/**
 * @swagger
 * /tournament-contents/tournament/{tournamentId}:
 *   get:
 *     tags: [Tournament Contents]
 *     summary: Get tournament contents by tournament ID
 *     parameters:
 *       - in: path
 *         name: tournamentId
 *         required: true
 *         schema:
 *           type: integer
 *       - $ref: '#/components/parameters/skipParam'
 *       - $ref: '#/components/parameters/limitParam'
 *     responses:
 *       200:
 *         description: List of tournament contents
 */
router.get(
  "/tournament/:tournamentId",
  tournamentContentController.findByTournamentId.bind(
    tournamentContentController
  )
);
router.put(
  "/:id",
  tournamentContentController.update.bind(tournamentContentController)
);
router.delete(
  "/:id",
  tournamentContentController.delete.bind(tournamentContentController)
);

export default router;
