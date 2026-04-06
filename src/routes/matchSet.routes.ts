import { Router } from "express";
import matchSetController from "../controllers/matchSet.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { checkPermission } from "../middlewares/permission.middleware";

const router = Router();

/**
 * @swagger
 * /match-sets:
 *   post:
 *     tags: [Match Sets]
 *     summary: Create a new match set with score
 *     description: Create a new set with validated score following badminton/table tennis rules
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - subMatchId
 *               - entryAScore
 *               - entryBScore
 *             properties:
 *               subMatchId:
 *                 type: integer
 *                 description: ID of the sub-match
 *                 example: 1
 *               entryAScore:
 *                 type: integer
 *                 minimum: 0
 *                 description: Final score of Entry A
 *                 example: 11
 *               entryBScore:
 *                 type: integer
 *                 minimum: 0
 *                 description: Final score of Entry B
 *                 example: 9
 *     responses:
 *       201:
 *         description: Match set created successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */
router.post(
  "/",
  authenticate,
  checkPermission('matches:update'),
  matchSetController.createSet.bind(matchSetController)
);

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
 *     summary: Update match set score
 *     description: Update scores for an existing set (only allowed during sub-match in progress)
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
 *             required:
 *               - entryAScore
 *               - entryBScore
 *             properties:
 *               entryAScore:
 *                 type: integer
 *                 minimum: 0
 *                 example: 11
 *               entryBScore:
 *                 type: integer
 *                 minimum: 0
 *                 example: 9
 *     responses:
 *       200:
 *         description: Match set updated
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   delete:
 *     tags: [Match Sets]
 *     summary: Delete match set
 *     description: Delete the latest set (only allowed during sub-match in progress)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       204:
 *         $ref: '#/components/responses/NoContent'
 */
router.get("/:id", matchSetController.getById.bind(matchSetController));
router.put(
  "/:id",
  authenticate,
  checkPermission('matches:update'),
  matchSetController.updateSetScore.bind(matchSetController)
);
router.delete(
  "/:id",
  authenticate,
  checkPermission('matches:update'),
  matchSetController.deleteSet.bind(matchSetController)
);

/**
 * @swagger
 * /match-sets/sub-match/{subMatchId}:
 *   get:
 *     tags: [Match Sets]
 *     summary: Get match sets by sub-match ID
 *     description: Retrieve all sets for a specific sub-match ordered by set number
 *     parameters:
 *       - in: path
 *         name: subMatchId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the sub-match
 *     responses:
 *       200:
 *         description: List of match sets ordered by set number
 */
router.get(
  "/sub-match/:subMatchId",
  matchSetController.getBySubMatchId.bind(matchSetController)
);

export default router;
