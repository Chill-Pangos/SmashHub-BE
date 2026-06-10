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
  checkPermission('matchsets:create'),
  matchSetController.createSet.bind(matchSetController)
);

/**
 * @swagger
 * /match-sets/live-score:
 *   put:
 *     tags: [Match Sets]
 *     summary: Update live set score
 *     description: Stores point-by-point score in Redis. System calculates current set number unless setNumber is provided. Sending the same setNumber again overwrites the live score, so referees can correct mistyped points. If the set was already persisted, this corrects the saved set while the sub-match is still in progress.
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
 *                 description: Optional set number to correct. Defaults to current unfinished set.
 *                 example: 1
 *               entryAScore:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 30
 *                 example: 8
 *               entryBScore:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 30
 *                 example: 5
 *     responses:
 *       200:
 *         description: Live score cached, set not completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: success
 *                 liveScore:
 *                   type: object
 *                   properties:
 *                     subMatchId:
 *                       type: integer
 *                       example: 1
 *                     setNumber:
 *                       type: integer
 *                       example: 2
 *                     entryAScore:
 *                       type: integer
 *                       example: 8
 *                     entryBScore:
 *                       type: integer
 *                       example: 5
 *                     updatedBy:
 *                       type: integer
 *                       example: 12
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2026-06-09T08:10:00.000Z"
 *                 isCompleted:
 *                   type: boolean
 *                   example: false
 *                 nextSetNumber:
 *                   type: integer
 *                   example: 2
 *             examples:
 *               liveScoreCached:
 *                 summary: Live score cached, set not completed
 *                 value:
 *                   message: success
 *                   liveScore:
 *                     subMatchId: 1
 *                     setNumber: 2
 *                     entryAScore: 8
 *                     entryBScore: 5
 *                     updatedBy: 12
 *                     updatedAt: "2026-06-09T08:10:00.000Z"
 *                   isCompleted: false
 *                   nextSetNumber: 2
 *               persistedSetReopened:
 *                 summary: Persisted set reopened as live score
 *                 value:
 *                   message: Persisted set reopened as live score.
 *                   liveScore:
 *                     subMatchId: 1
 *                     setNumber: 2
 *                     entryAScore: 10
 *                     entryBScore: 8
 *                     updatedBy: 12
 *                     updatedAt: "2026-06-09T08:19:00.000Z"
 *                   isCompleted: false
 *                   nextSetNumber: 2
 *       201:
 *         description: Set completed and persisted to DB; may require referee finalize/submit
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 liveScore:
 *                   type: object
 *                 isCompleted:
 *                   type: boolean
 *                 persistedSet:
 *                   $ref: '#/components/schemas/MatchSet'
 *                 nextSetNumber:
 *                   type: integer
 *                 subMatchReadyToFinalize:
 *                   type: boolean
 *                 winningTeam:
 *                   type: string
 *                   enum: [A, B]
 *                 finalizationNotice:
 *                   type: object
 *             examples:
 *               subMatchReadyToFinalize:
 *                 summary: Set completed, sub-match winner decided
 *                 value:
 *                   message: Set completed and saved. Referee must finalize sub-match.
 *                   liveScore:
 *                     subMatchId: 1
 *                     setNumber: 3
 *                     entryAScore: 11
 *                     entryBScore: 9
 *                     updatedBy: 12
 *                     updatedAt: "2026-06-09T08:25:00.000Z"
 *                   isCompleted: true
 *                   persistedSet:
 *                     id: 103
 *                     subMatchId: 1
 *                     setNumber: 3
 *                     entryAScore: 11
 *                     entryBScore: 9
 *                     createdAt: "2026-06-09T08:25:00.000Z"
 *                     updatedAt: "2026-06-09T08:25:00.000Z"
 *                   subMatchReadyToFinalize: true
 *                   winningTeam: A
 *                   finalizationNotice:
 *                     subMatchId: 1
 *                     matchId: 20
 *                     completedSetNumber: 3
 *                     entryAScore: 11
 *                     entryBScore: 9
 *                     entryASets: 2
 *                     entryBSets: 1
 *                     winningTeam: A
 *                     matchWillBeCompleted: false
 *               setCompletedStartNextSet:
 *                 summary: Set completed, sub-match continues
 *                 value:
 *                   message: Set completed and saved. Start next set.
 *                   liveScore:
 *                     subMatchId: 1
 *                     setNumber: 2
 *                     entryAScore: 11
 *                     entryBScore: 7
 *                     updatedBy: 12
 *                     updatedAt: "2026-06-09T08:15:00.000Z"
 *                   isCompleted: true
 *                   persistedSet:
 *                     id: 102
 *                     subMatchId: 1
 *                     setNumber: 2
 *                     entryAScore: 11
 *                     entryBScore: 7
 *                     createdAt: "2026-06-09T08:15:00.000Z"
 *                     updatedAt: "2026-06-09T08:15:00.000Z"
 *                   nextSetNumber: 3
 *                   subMatchReadyToFinalize: false
 *               persistedSetScoreCorrected:
 *                 summary: Persisted set score corrected
 *                 value:
 *                   message: Persisted set score corrected.
 *                   liveScore:
 *                     subMatchId: 1
 *                     setNumber: 2
 *                     entryAScore: 11
 *                     entryBScore: 8
 *                     updatedBy: 12
 *                     updatedAt: "2026-06-09T08:18:00.000Z"
 *                   isCompleted: true
 *                   persistedSet:
 *                     id: 102
 *                     subMatchId: 1
 *                     setNumber: 2
 *                     entryAScore: 11
 *                     entryBScore: 8
 *                     createdAt: "2026-06-09T08:15:00.000Z"
 *                     updatedAt: "2026-06-09T08:18:00.000Z"
 */
router.put(
  "/live-score",
  authenticate,
  checkPermission('matchsets:update'),
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
  checkPermission('matchsets:create'),
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
  checkPermission('matchsets:view'),
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
  checkPermission('matchsets:update'),
  matchSetController.updateSetScore.bind(matchSetController)
);
router.delete(
  "/:id",
  authenticate,
  checkPermission('matchsets:delete'),
  matchSetController.deleteSet.bind(matchSetController)
);

export default router;
