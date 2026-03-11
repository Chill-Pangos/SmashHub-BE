import { Router } from "express";
import tournamentContentController from "../controllers/tournamentContent.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { checkPermission } from "../middlewares/permission.middleware";
import { PERMISSIONS } from "../constants/permissions";

const router = Router();

/**
 * @swagger
 * /tournament-contents:
 *   post:
 *     tags: [Tournament Contents]
 *     summary: Create a new tournament content
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tournamentId
 *               - name
 *               - type
 *               - maxEntries
 *               - maxSets
 *             properties:
 *               tournamentId:
 *                 type: integer
 *                 example: 1
 *               name:
 *                 type: string
 *                 example: "Men's Singles"
 *               type:
 *                 type: string
 *                 enum: [single, team, double]
 *                 example: "single"
 *               maxEntries:
 *                 type: integer
 *                 example: 32
 *               maxSets:
 *                 type: integer
 *                 example: 3
 *               numberOfSingles:
 *                 type: integer
 *                 example: 3
 *               numberOfDoubles:
 *                 type: integer
 *                 example: 2
 *               gender:
 *                 type: string
 *                 enum: [male, female, mixed]
 *                 example: "male"
 *               isGroupStage:
 *                 type: boolean
 *                 example: false
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
  authenticate,
  checkPermission(PERMISSIONS.CONTENT_CREATE),
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
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Women's Singles"
 *               type:
 *                 type: string
 *                 enum: [single, team, double]
 *                 example: "single"
 *               maxEntries:
 *                 type: integer
 *                 example: 32
 *               maxSets:
 *                 type: integer
 *                 example: 3
 *               numberOfSingles:
 *                 type: integer
 *                 example: 3
 *               numberOfDoubles:
 *                 type: integer
 *                 example: 2
 *               gender:
 *                 type: string
 *                 enum: [male, female, mixed]
 *                 example: "female"
 *               isGroupStage:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       200:
 *         description: Tournament content updated
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   delete:
 *     tags: [Tournament Contents]
 *     summary: Delete tournament content
 *     security:
 *       - bearerAuth: []
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
  authenticate,
  checkPermission(PERMISSIONS.CONTENT_UPDATE),
  tournamentContentController.update.bind(tournamentContentController)
);
router.delete(
  "/:id",
  authenticate,
  checkPermission(PERMISSIONS.CONTENT_DELETE),
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

export default router;
