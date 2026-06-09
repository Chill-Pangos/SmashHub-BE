import { Router } from "express";
import matchController from "../controllers/match.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { checkPermission, checkRole } from "../middlewares/permission.middleware";

const router = Router();

/**
 * @swagger
 * /matches/pending:
 *   get:
 *     tags: [Matches]
 *     summary: Get all pending matches awaiting chief referee approval
 *     description: |
 *       Retrieve list of matches with resultStatus = 'pending' that require chief referee approval.
 *       These matches have been completed by referees and submitted for review but not yet approved.
 *
 *       Business Logic:
 *       - Only returns matches where status = 'completed' AND resultStatus = 'pending'
 *       - Chief referee can then approve or reject these results
 *       - Approval updates standings/brackets and Elo scores
 *       - Rejection resets match to 'in_progress' for referee resubmission
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: tournamentId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Tournament ID used to verify chief referee permission
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination (1-indexed)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Maximum number of records per page
 *     responses:
 *       200:
 *         description: Successfully retrieved pending matches with pagination
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 matches:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 42
 *                       scheduleId:
 *                         type: integer
 *                         example: 15
 *                       entryAId:
 *                         type: integer
 *                         example: 101
 *                       entryBId:
 *                         type: integer
 *                         example: 102
 *                       status:
 *                         type: string
 *                         enum: [scheduled, in_progress, completed, cancelled]
 *                         example: completed
 *                       winnerEntryId:
 *                         type: integer
 *                         example: 101
 *                       resultStatus:
 *                         type: string
 *                         enum: [pending, approved, rejected]
 *                         example: pending
 *                       reviewNotes:
 *                         type: string
 *                         nullable: true
 *                         example: null
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *                 count:
 *                   type: integer
 *                   example: 5
 *       400:
 *         $ref: '#/components/responses/BadRequest400'
 *       401:
 *         $ref: '#/components/responses/Unauthorized401'
 *       403:
 *         $ref: '#/components/responses/Forbidden403'
 *       500:
 *         $ref: '#/components/responses/InternalError500'
 */
router.get("/pending", authenticate, checkPermission('matches:approve_result'), matchController.findPendingMatches.bind(matchController));

/**
 * @swagger
 * /matches/category/{categoryId}:
 *   get:
 *     tags: [Matches]
 *     summary: Get schedules and matches by category for chief referee
 *     description: |
 *       Chief referee retrieves all schedules in a category with their matches.
 *       Only chief referee assigned to the category tournament can access this endpoint.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: stage
 *         schema:
 *           type: string
 *           enum: [group, knockout]
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [scheduled, in_progress, completed, cancelled]
 *       - in: query
 *         name: resultStatus
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Schedules with nested matches
 *       400:
 *         $ref: '#/components/responses/BadRequest400'
 *       401:
 *         $ref: '#/components/responses/Unauthorized401'
 *       403:
 *         $ref: '#/components/responses/Forbidden403'
 *       404:
 *         $ref: '#/components/responses/NotFound404'
 *       500:
 *         $ref: '#/components/responses/InternalError500'
 */
router.get(
  "/category/:categoryId",
  authenticate,
  checkRole('chief_referee'),
  matchController.findCategorySchedulesAndMatchesForChiefReferee.bind(matchController),
);

/**
 * @swagger
 * /matches/bulk-start:
 *   post:
 *     tags: [Matches]
 *     summary: Start multiple matches
 *     description: |
 *       Start many scheduled matches in one request.
 *       Each match is processed independently; failed matches are returned with reasons.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - matchIds
 *             properties:
 *               matchIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 minItems: 1
 *           example:
 *             matchIds: [1, 2, 3]
 *     responses:
 *       200:
 *         description: Bulk start completed
 *       400:
 *         $ref: '#/components/responses/BadRequest400'
 *       401:
 *         $ref: '#/components/responses/Unauthorized401'
 *       403:
 *         $ref: '#/components/responses/Forbidden403'
 *       500:
 *         $ref: '#/components/responses/InternalError500'
 */
router.post(
  "/bulk-start",
  authenticate,
  checkPermission('matches:start'),
  matchController.bulkStartMatches.bind(matchController),
);

/**
 * @swagger
 * /matches/referee/my:
 *   get:
 *     tags: [Matches]
 *     summary: Get matches assigned to current referee
 *     description: |
 *       Referee retrieves matches assigned to them.
 *       If status is omitted, returns all statuses.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Filter matches by tournament category
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           example: in_progress,completed
 *         description: Optional comma-separated statuses
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Assigned matches with schedule, entries, referees, sub-matches, and sets
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [message, categoryId, statuses, matches, count, offset, limit]
 *               properties:
 *                 message:
 *                   type: string
 *                 categoryId:
 *                   type: integer
 *                 statuses:
 *                   type: array
 *                   nullable: true
 *                   items:
 *                     type: string
 *                     enum: [scheduled, in_progress, completed, cancelled]
 *                 matches:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       scheduleId:
 *                         type: integer
 *                       entryAId:
 *                         type: integer
 *                       entryBId:
 *                         type: integer
 *                       winnerEntryId:
 *                         type: integer
 *                         nullable: true
 *                       status:
 *                         type: string
 *                         enum: [scheduled, in_progress, completed, cancelled]
 *                       resultStatus:
 *                         type: string
 *                         enum: [pending, approved, rejected]
 *                         nullable: true
 *                       reviewNotes:
 *                         type: string
 *                         nullable: true
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *                       schedule:
 *                         type: object
 *                         nullable: true
 *                       entryA:
 *                         type: object
 *                         nullable: true
 *                       entryB:
 *                         type: object
 *                         nullable: true
 *                       winnerEntry:
 *                         type: object
 *                         nullable: true
 *                       matchReferees:
 *                         type: array
 *                         items:
 *                           type: object
 *                       subMatches:
 *                         type: array
 *                         items:
 *                           type: object
 *                 count:
 *                   type: integer
 *                 offset:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *             example:
 *               message: Assigned matches retrieved successfully
 *               categoryId: 1
 *               statuses: null
 *               count: 1
 *               offset: 0
 *               limit: 10
 *               matches:
 *                 - id: 42
 *                   scheduleId: 15
 *                   entryAId: 101
 *                   entryBId: 102
 *                   winnerEntryId: null
 *                   status: in_progress
 *                   resultStatus: null
 *                   reviewNotes: null
 *                   createdAt: "2026-06-09T08:00:00.000Z"
 *                   updatedAt: "2026-06-09T08:30:00.000Z"
 *                   schedule:
 *                     id: 15
 *                     tournamentId: 3
 *                     categoryId: 1
 *                     stage: group
 *                     scheduledAt: "2026-06-09T09:00:00.000Z"
 *                     tournamentCategory:
 *                       id: 1
 *                       tournamentId: 3
 *                       categoryType: singles
 *                       name: Men's Singles
 *                       maxSets: 3
 *                       teamFormat: null
 *                   entryA:
 *                     id: 101
 *                     tournamentId: 3
 *                     categoryId: 1
 *                     seed: 1
 *                     members:
 *                       - id: 301
 *                         entryId: 101
 *                         userId: 11
 *                         user:
 *                           id: 11
 *                           firstName: Nguyen
 *                           lastName: An
 *                           email: an@example.com
 *                           avatarUrl: null
 *                   entryB:
 *                     id: 102
 *                     tournamentId: 3
 *                     categoryId: 1
 *                     seed: 2
 *                     members:
 *                       - id: 302
 *                         entryId: 102
 *                         userId: 12
 *                         user:
 *                           id: 12
 *                           firstName: Tran
 *                           lastName: Binh
 *                           email: binh@example.com
 *                           avatarUrl: null
 *                   winnerEntry: null
 *                   matchReferees:
 *                     - id: 7
 *                       matchId: 42
 *                       refereeId: 21
 *                       referee:
 *                         id: 21
 *                         firstName: Le
 *                         lastName: Referee
 *                         email: referee@example.com
 *                   subMatches:
 *                     - id: 88
 *                       matchId: 42
 *                       subMatchNumber: 1
 *                       status: in_progress
 *                       winnerTeam: null
 *                       umpireId: 21
 *                       assistantUmpireId: 22
 *                       matchSets:
 *                         - id: 501
 *                           subMatchId: 88
 *                           setNumber: 1
 *                           entryAScore: 21
 *                           entryBScore: 18
 *       401:
 *         $ref: '#/components/responses/Unauthorized401'
 *       403:
 *         $ref: '#/components/responses/Forbidden403'
 *       500:
 *         $ref: '#/components/responses/InternalError500'
 */
router.get(
  "/referee/my",
  authenticate,
  checkPermission('matches:view'),
  matchController.findAssignedMatchesForReferee.bind(matchController),
);

router.get(
  "/:id/finalize-summary",
  authenticate,
  checkPermission('matches:report_result'),
  matchController.getFinalizeSummary.bind(matchController),
);

/**
 * @swagger
 * /matches/{id}/start:
 *   post:
 *     tags: [Matches]
 *     summary: Start a match and assign referees dynamically
 *     description: |
 *       Transition match from 'scheduled' to 'in_progress' status.
 *       Automatically assigns a table (if available) and dynamically assigns available referees from tournament pool.
 *
 *       Business Logic:
 *       - Match must be in 'scheduled' status
 *       - Assigns available table dynamically (rotates through assigned tables)
 *       - Assigns 1-2 available referees from tournament referee pool (least busy first)
 *       - Only assigned referees can finalize the match result
 *       - Changes match status to 'in_progress'
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Match ID to start
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *           example: {}
 *     responses:
 *       200:
 *         description: Match started successfully with referees and table assigned
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 42
 *                 scheduleId:
 *                   type: integer
 *                   example: 15
 *                 entryAId:
 *                   type: integer
 *                   example: 101
 *                 entryBId:
 *                   type: integer
 *                   example: 102
 *                 status:
 *                   type: string
 *                   enum: [scheduled, in_progress, completed, cancelled]
 *                   example: in_progress
 *                 winnerEntryId:
 *                   type: integer
 *                   nullable: true
 *                   example: null
 *                 resultStatus:
 *                   type: string
 *                   enum: [pending, approved, rejected]
 *                   nullable: true
 *                   example: null
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Bad request - Match not in scheduled status or insufficient referees available
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 message: "Cannot start match. Status is \"in_progress\", must be \"scheduled\""
 *       401:
 *         $ref: '#/components/responses/Unauthorized401'
 *       403:
 *         $ref: '#/components/responses/Forbidden403'
 *       404:
 *         $ref: '#/components/responses/NotFound404'
 *       500:
 *         $ref: '#/components/responses/InternalError500'
 */
router.post("/:id/start",
  authenticate,
  checkPermission('matches:start'),
  matchController.startMatch.bind(matchController)
);

/**
 * @swagger
 * /matches/{id}/finalize:
 *   post:
 *     tags: [Matches]
 *     summary: Submit match result for chief referee approval
 *     description: |
 *       Assigned referee submits the final match result. Match transitions to 'completed' with 'pending' resultStatus.
 *       Result will be reviewed and approved/rejected by chief referee before affecting standings and Elo.
 *
 *       Business Logic:
 *       - Match must be in 'in_progress' status
 *       - Only assigned referees can finalize
 *       - Validates that at least one team won enough sets: floor(maxSets/2) + 1
 *       - Sets winner automatically based on sets won
 *       - Changes match status to 'completed', resultStatus to 'pending'
 *       - Chief referee must approve before standings/ELO are updated
 *       - If rejected by chief referee, match returns to 'in_progress' for re-submission
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Match ID to finalize
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *           example: {}
 *     responses:
 *       200:
 *         description: Match result submitted successfully, awaiting chief referee approval
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Match result submitted successfully. Waiting for chief referee approval."
 *                 match:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 42
 *                     scheduleId:
 *                       type: integer
 *                       example: 15
 *                     entryAId:
 *                       type: integer
 *                       example: 101
 *                     entryBId:
 *                       type: integer
 *                       example: 102
 *                     status:
 *                       type: string
 *                       enum: [scheduled, in_progress, completed, cancelled]
 *                       example: completed
 *                     winnerEntryId:
 *                       type: integer
 *                       example: 101
 *                     resultStatus:
 *                       type: string
 *                       enum: [pending, approved, rejected]
 *                       example: pending
 *                     reviewNotes:
 *                       type: string
 *                       nullable: true
 *                       example: null
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Bad request - Match not in_progress status or not enough sets completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 message: "Match not complete. Need 2 sets to win. Entry A: 1, Entry B: 1"
 *       401:
 *         $ref: '#/components/responses/Unauthorized401'
 *       403:
 *         $ref: '#/components/responses/Forbidden403'
 *       404:
 *         $ref: '#/components/responses/NotFound404'
 *       500:
 *         $ref: '#/components/responses/InternalError500'
 */
router.post("/:id/finalize",
  authenticate,
  checkPermission('matches:report_result'),
  matchController.finalizeMatch.bind(matchController)
);

/**
 * @swagger
 * /matches/{id}/approve:
 *   post:
 *     tags: [Matches]
 *     summary: Approve match result (Chief Referee only)
 *     description: |
 *       Chief referee approves a pending match result. This triggers final updates to standings/brackets and Elo scores.
 *
 *       Business Logic:
 *       - Match must be in 'completed' status with resultStatus = 'pending'
 *       - Only chief referee of the tournament can approve
 *       - Changes resultStatus to 'approved'
 *       - For group stage: Updates group standings (win/loss counts, sets won/lost)
 *       - For knockout stage: Advances winner to next round bracket
 *       - Calculates and updates Elo scores for all participating players
 *       - Approved results are permanent and affect tournament progression
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Match ID to approve
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reviewNotes:
 *                 type: string
 *                 maxLength: 1000
 *                 description: Optional review notes from chief referee
 *           example:
 *             reviewNotes: "Match approved. Set scores verified."
 *     responses:
 *       200:
 *         description: Match result approved successfully, standings/brackets and Elo updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Match result approved successfully. Standings and Elo scores updated."
 *                 match:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 42
 *                     scheduleId:
 *                       type: integer
 *                       example: 15
 *                     entryAId:
 *                       type: integer
 *                       example: 101
 *                     entryBId:
 *                       type: integer
 *                       example: 102
 *                     status:
 *                       type: string
 *                       enum: [scheduled, in_progress, completed, cancelled]
 *                       example: completed
 *                     winnerEntryId:
 *                       type: integer
 *                       example: 101
 *                     resultStatus:
 *                       type: string
 *                       enum: [pending, approved, rejected]
 *                       example: approved
 *                     reviewNotes:
 *                       type: string
 *                       example: "Match approved. Set scores verified."
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Bad request - Invalid match state (must be completed with pending result)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 message: "Cannot approve. Result status is \"approved\", must be \"pending\""
 *       401:
 *         $ref: '#/components/responses/Unauthorized401'
 *       403:
 *         description: Forbidden - User is not the chief referee of the tournament
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 message: "Only the chief referee can perform this action"
 *       404:
 *         $ref: '#/components/responses/NotFound404'
 *       500:
 *         $ref: '#/components/responses/InternalError500'
 */
router.post("/:id/approve",
  authenticate,
  checkPermission('matches:approve_result'),
  matchController.approveMatchResult.bind(matchController)
);

/**
 * @swagger
 * /matches/{id}/reject:
 *   post:
 *     tags: [Matches]
 *     summary: Reject match result (Chief Referee only)
 *     description: |
 *       Chief referee rejects a pending match result and sends it back for resubmission.
 *
 *       Business Logic:
 *       - Match must be in 'completed' status with resultStatus = 'pending'
 *       - Only chief referee of the tournament can reject
 *       - Changes resultStatus to 'rejected'
 *       - Resets match status to 'in_progress' so referee can resubmit
 *       - Clears winner entry so referee must resubmit scores
 *       - Review notes explaining rejection are recorded
 *       - Referee must submit the match result again after rejection
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Match ID to reject
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reviewNotes
 *             properties:
 *               reviewNotes:
 *                 type: string
 *                 maxLength: 1000
 *                 description: Required explanation for why the result was rejected
 *           example:
 *             reviewNotes: "Set scores don't match the recorded points. Please resubmit with correct scores."
 *     responses:
 *       200:
 *         description: Match result rejected successfully, match returned to in_progress status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Match result rejected. Referee needs to resubmit the result."
 *                 match:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 42
 *                     scheduleId:
 *                       type: integer
 *                       example: 15
 *                     entryAId:
 *                       type: integer
 *                       example: 101
 *                     entryBId:
 *                       type: integer
 *                       example: 102
 *                     status:
 *                       type: string
 *                       enum: [scheduled, in_progress, completed, cancelled]
 *                       example: in_progress
 *                     winnerEntryId:
 *                       type: integer
 *                       nullable: true
 *                       example: null
 *                     resultStatus:
 *                       type: string
 *                       enum: [pending, approved, rejected]
 *                       example: rejected
 *                     reviewNotes:
 *                       type: string
 *                       example: "Set scores don't match the recorded points. Please resubmit with correct scores."
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Bad request - Invalid match state or missing review notes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 message: "Review notes are required when rejecting a match result"
 *       401:
 *         $ref: '#/components/responses/Unauthorized401'
 *       403:
 *         description: Forbidden - User is not the chief referee of the tournament
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 message: "Only the chief referee can perform this action"
 *       404:
 *         $ref: '#/components/responses/NotFound404'
 *       500:
 *         $ref: '#/components/responses/InternalError500'
 */
router.post("/:id/reject",
  authenticate,
  checkPermission('matches:approve_result'),
  matchController.rejectMatchResult.bind(matchController)
);

/**
 * @swagger
 * /matches/athlete/{userId}/upcoming:
 *   get:
 *     tags: [Matches]
 *     summary: Get upcoming matches for an athlete
 *     description: |
 *       Retrieve list of matches that an athlete is participating in with status 'scheduled' or 'in_progress'.
 *       These are matches the athlete will compete in soon or are currently being played.
 *
 *       Business Logic:
 *       - Returns matches where user is member of either entryA or entryB
 *       - Only includes matches with status 'scheduled' or 'in_progress'
 *       - Sorted chronologically by scheduled time (ascending)
 *       - Includes full match details: schedule, both entries with members, assigned referees
 *       - Useful for athlete dashboard to see what matches are coming up
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the athlete/user
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination (1-indexed)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Maximum number of records per page
 *     responses:
 *       200:
 *         description: List of upcoming matches for the athlete
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 matches:
 *                   type: array
 *                   description: Array of upcoming matches (scheduled or in_progress)
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 42
 *                       scheduleId:
 *                         type: integer
 *                       entryAId:
 *                         type: integer
 *                       entryBId:
 *                         type: integer
 *                       status:
 *                         type: string
 *                         enum: [scheduled, in_progress, completed, cancelled]
 *                         example: scheduled
 *                       winnerEntryId:
 *                         type: integer
 *                         nullable: true
 *                       resultStatus:
 *                         type: string
 *                         enum: [pending, approved, rejected]
 *                         nullable: true
 *                       schedule:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           scheduledAt:
 *                             type: string
 *                             format: date-time
 *                       entryA:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           members:
 *                             type: array
 *                             items:
 *                               type: object
 *                       entryB:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           members:
 *                             type: array
 *                             items:
 *                               type: object
 *                       matchReferees:
 *                         type: array
 *                         description: Assigned referees for the match
 *                         items:
 *                           type: object
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *                 count:
 *                   type: integer
 *                   description: Total count of upcoming matches for this user
 *                   example: 5
 *                 offset:
 *                   type: integer
 *                   description: Records offset for this page
 *                   example: 0
 *                 limit:
 *                   type: integer
 *                   description: Maximum records per page
 *                   example: 10
 *       400:
 *         $ref: '#/components/responses/BadRequest400'
 *       401:
 *         $ref: '#/components/responses/Unauthorized401'
 *       404:
 *         $ref: '#/components/responses/NotFound404'
 *       500:
 *         $ref: '#/components/responses/InternalError500'
 */
router.get("/athlete/:userId/upcoming", authenticate, matchController.getUpcomingMatchesByAthlete.bind(matchController));

/**
 * @swagger
 * /matches/athlete/{userId}/history:
 *   get:
 *     tags: [Matches]
 *     summary: Get match history for an athlete
 *     description: |
 *       Retrieve list of completed and approved matches that an athlete has participated in.
 *       Provides a complete history of all finished matches with final results and winners.
 *
 *       Business Logic:
 *       - Returns matches where user is member of either entryA or entryB
 *       - Only includes matches with status 'completed' AND resultStatus 'approved'
 *       - Sorted by most recent first (newest matches first)
 *       - Includes complete match details: all entries with members, set information, winner details
 *       - Useful for athlete profile to show career history and past results
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the athlete/user
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination (1-indexed)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Maximum number of records per page
 *     responses:
 *       200:
 *         description: List of completed matches (match history)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 matches:
 *                   type: array
 *                   description: Array of completed and approved matches
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 42
 *                       scheduleId:
 *                         type: integer
 *                       entryAId:
 *                         type: integer
 *                       entryBId:
 *                         type: integer
 *                       status:
 *                         type: string
 *                         enum: [scheduled, in_progress, completed, cancelled]
 *                         example: completed
 *                       winnerEntryId:
 *                         type: integer
 *                         example: 101
 *                       resultStatus:
 *                         type: string
 *                         enum: [pending, approved, rejected]
 *                         example: approved
 *                       reviewNotes:
 *                         type: string
 *                         nullable: true
 *                       schedule:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           scheduledAt:
 *                             type: string
 *                             format: date-time
 *                           roundNumber:
 *                             type: integer
 *                           stage:
 *                             type: string
 *                             enum: [group, knockout]
 *                       entryA:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           members:
 *                             type: array
 *                             items:
 *                               type: object
 *                       entryB:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           members:
 *                             type: array
 *                             items:
 *                               type: object
 *                       winnerEntry:
 *                         type: object
 *                         description: The winning entry with members
 *                         properties:
 *                           id:
 *                             type: integer
 *                           members:
 *                             type: array
 *                             items:
 *                               type: object
 *                       subMatches:
 *                         type: array
 *                         description: Sub-matches with all sets played in this match
 *                         items:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: integer
 *                             matchSets:
 *                               type: array
 *                               items:
 *                                 $ref: '#/components/schemas/MatchSet'
 *                       matchReferees:
 *                         type: array
 *                         description: Referees who officiated the match
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *                 count:
 *                   type: integer
 *                   description: Total count of history matches for this user
 *                   example: 15
 *                 offset:
 *                   type: integer
 *                   description: Records offset for this page
 *                   example: 0
 *                 limit:
 *                   type: integer
 *                   description: Maximum records per page
 *                   example: 10
 *       400:
 *         $ref: '#/components/responses/BadRequest400'
 *       401:
 *         $ref: '#/components/responses/Unauthorized401'
 *       404:
 *         $ref: '#/components/responses/NotFound404'
 *       500:
 *         $ref: '#/components/responses/InternalError500'
 */
router.get("/athlete/:userId/history", authenticate, matchController.getMatchHistoryByAthlete.bind(matchController));

export default router;
