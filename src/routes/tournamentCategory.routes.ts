import { Router } from "express";
import TournamentCategoryController from "../controllers/tournamentCategory.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { checkPermission } from "../middlewares/permission.middleware";
import { PERMISSIONS } from "../constants/permissions";

const router = Router();

/**
 * @swagger
 * /tournament-categories:
 *   post:
 *     tags: [Tournament Categories]
 *     summary: Create a new tournament category
 *     description: "Note: gender = mixed is only valid when type = double"
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
 *               minAge:
 *                 type: integer
 *                 example: 16
 *               maxAge:
 *                 type: integer
 *                 example: 35
 *               minElo:
 *                 type: integer
 *                 example: 1000
 *               maxElo:
 *                 type: integer
 *                 example: 2200
 *               gender:
 *                 type: string
 *                 enum: [male, female, mixed]
 *                 example: "male"
 *               isGroupStage:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       201:
 *         description: Tournament category created successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *   get:
 *     tags: [Tournament Categories]
 *     summary: Get all tournament categories
 *     parameters:
 *       - $ref: '#/components/parameters/skipParam'
 *       - $ref: '#/components/parameters/limitParam'
 *     responses:
 *       200:
 *         description: List of tournament categories
 */
router.post(
  "/",
  authenticate,
  checkPermission(PERMISSIONS.CONTENT_CREATE),
  TournamentCategoryController.create.bind(TournamentCategoryController)
);
router.get(
  "/",
  TournamentCategoryController.findAll.bind(TournamentCategoryController)
);

/**
 * @swagger
 * /tournament-categories/{id}:
 *   get:
 *     tags: [Tournament Categories]
 *     summary: Get tournament category by ID
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       200:
 *         description: Tournament category details
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   put:
 *     tags: [Tournament Categories]
 *     summary: Update tournament category
 *     description: "Note: gender = mixed is only valid when type = double"
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
 *               minAge:
 *                 type: integer
 *                 example: 16
 *               maxAge:
 *                 type: integer
 *                 example: 35
 *               minElo:
 *                 type: integer
 *                 example: 1000
 *               maxElo:
 *                 type: integer
 *                 example: 2200
 *               gender:
 *                 type: string
 *                 enum: [male, female, mixed]
 *                 example: "female"
 *               isGroupStage:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       200:
 *         description: Tournament category updated
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   delete:
 *     tags: [Tournament Categories]
 *     summary: Delete tournament category
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
  TournamentCategoryController.findById.bind(TournamentCategoryController)
);
router.put(
  "/:id",
  authenticate,
  checkPermission(PERMISSIONS.CONTENT_UPDATE),
  TournamentCategoryController.update.bind(TournamentCategoryController)
);
router.delete(
  "/:id",
  authenticate,
  checkPermission(PERMISSIONS.CONTENT_DELETE),
  TournamentCategoryController.delete.bind(TournamentCategoryController)
);

/**
 * @swagger
 * /tournament-categories/tournament/{tournamentId}:
 *   get:
 *     tags: [Tournament Categories]
 *     summary: Get tournament categories by tournament ID
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
 *         description: List of tournament categories
 */
router.get(
  "/tournament/:tournamentId",
  TournamentCategoryController.findByTournamentId.bind(
    TournamentCategoryController
  )
);

export default router;
