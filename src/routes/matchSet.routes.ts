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
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MatchSet'
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
 * /match-sets/live-score:
 *   put:
 *     tags: [Match Sets]
 *     summary: Update live set score
 *     description: Stores point-by-point score in Redis. System calculates current set number. When score completes a set, persists it to DB and returns details if referee must finalize/submit.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [subMatchId, entryAScore, entryBScore]
 *             properties:
 *               subMatchId:
 *                 type: integer
 *                 example: 1
 *               entryAScore:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 30
 *                 example: 7
 *               entryBScore:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 30
 *                 example: 5
 *     responses:
 *       200:
 *         description: Live score cached, set not completed
 *       201:
 *         description: Set completed and persisted to DB; may require referee finalize/submit
 */
router.put(
  "/live-score",
  authenticate,
  checkPermission('matches:update'),
  matchSetController.updateLiveSetScore.bind(matchSetController)
);

/**
 * @swagger
 * /match-sets/final-score:
 *   post:
 *     tags: [Match Sets]
 *     summary: Submit final set score
 *     description: Fallback API when Redis live score is missing. Validates final score and persists to DB.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [subMatchId, entryAScore, entryBScore]
 *             properties:
 *               subMatchId:
 *                 type: integer
 *                 example: 1
 *               setNumber:
 *                 type: integer
 *                 description: Optional current set number. Defaults to next unfinished set.
 *                 example: 1
 *               entryAScore:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 30
 *                 example: 11
 *               entryBScore:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 30
 *                 example: 9
 *     responses:
 *       201:
 *         description: Final set score persisted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MatchSet'
 */
router.post(
  "/final-score",
  authenticate,
  checkPermission('matches:update'),
  matchSetController.submitFinalSetScore.bind(matchSetController)
);

/**
 * @swagger
 * /match-sets/sub-match/{subMatchId}/live-score:
 *   get:
 *     tags: [Match Sets]
 *     summary: Get live set score from Redis
 *     parameters:
 *       - in: path
 *         name: subMatchId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: setNumber
 *         schema:
 *           type: integer
 *         description: Optional set number. Defaults to next unfinished set.
 *     responses:
 *       200:
 *         description: Current live score or null if cache missing
 */
router.get(
  "/sub-match/:subMatchId/live-score",
  matchSetController.getLiveSetScore.bind(matchSetController)
);

/**
 * @swagger
 * /match-sets/sub-match/{subMatchId}:
 *   get:
 *     tags: [Match Sets]
 *     summary: Get match sets by sub-match ID
 *     description: Retrieve all sets for a specific sub-match ordered by set number
 *     security:
 *       - bearerAuth: []
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [message, subMatchId, count, sets]
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Match sets retrieved successfully
 *                 subMatchId:
 *                   type: integer
 *                   example: 88
 *                 count:
 *                   type: integer
 *                   example: 2
 *                 sets:
 *                   type: array
 *                   items:
 *                     type: object
 *               example:
 *                 message: Match sets retrieved successfully
 *                 subMatchId: 88
 *                 count: 2
 *                 sets:
 *                   - id: 501
 *                     subMatchId: 88
 *                     setNumber: 1
 *                     entryAScore: 21
 *                     entryBScore: 18
 *                     createdAt: "2026-06-09T08:10:00.000Z"
 *                     updatedAt: "2026-06-09T08:10:00.000Z"
 *                   - id: 502
 *                     subMatchId: 88
 *                     setNumber: 2
 *                     entryAScore: 19
 *                     entryBScore: 21
 *                     createdAt: "2026-06-09T08:20:00.000Z"
 *                     updatedAt: "2026-06-09T08:20:00.000Z"
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get(
  "/sub-match/:subMatchId",
  authenticate,
  checkPermission('matches:view'),
  matchSetController.getBySubMatchId.bind(matchSetController)
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
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MatchSet'
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
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MatchSet'
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

export default router;
