import { Router } from "express";
import matchController from "../controllers/match.controller";

const router = Router();

/**
 * @swagger
 * /matches:
 *   post:
 *     tags: [Matches]
 *     summary: Create a new match
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Match created successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *   get:
 *     tags: [Matches]
 *     summary: Get all matches
 *     parameters:
 *       - $ref: '#/components/parameters/skipParam'
 *       - $ref: '#/components/parameters/limitParam'
 *     responses:
 *       200:
 *         description: List of matches
 */
router.post("/", matchController.create.bind(matchController));
router.get("/", matchController.findAll.bind(matchController));

/**
 * @swagger
 * /matches/pending:
 *   get:
 *     tags: [Matches]
 *     summary: Get all pending matches waiting for approval (Chief Referee)
 *     description: |
 *       Get list of matches with resultStatus = 'pending' that need chief referee approval.
 *       These are matches where referees have submitted results but not yet approved.
 *     parameters:
 *       - $ref: '#/components/parameters/skipParam'
 *       - $ref: '#/components/parameters/limitParam'
 *     responses:
 *       200:
 *         description: List of pending matches
 */
router.get("/pending", matchController.findPendingMatches.bind(matchController));

/**
 * @swagger
 * /matches/{id}:
 *   get:
 *     tags: [Matches]
 *     summary: Get match by ID
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       200:
 *         description: Match details
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   put:
 *     tags: [Matches]
 *     summary: Update match
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       200:
 *         description: Match updated
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   delete:
 *     tags: [Matches]
 *     summary: Delete match
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       204:
 *         $ref: '#/components/responses/NoContent'
 */
router.get("/:id", matchController.findById.bind(matchController));
router.put("/:id", matchController.update.bind(matchController));
router.delete("/:id", matchController.delete.bind(matchController));

/**
 * @swagger
 * /matches/schedule/{scheduleId}:
 *   get:
 *     tags: [Matches]
 *     summary: Get matches by schedule ID
 *     parameters:
 *       - in: path
 *         name: scheduleId
 *         required: true
 *         schema:
 *           type: integer
 *       - $ref: '#/components/parameters/skipParam'
 *       - $ref: '#/components/parameters/limitParam'
 *     responses:
 *       200:
 *         description: List of matches for schedule
 */
router.get(
  "/schedule/:scheduleId",
  matchController.findByScheduleId.bind(matchController)
);

/**
 * @swagger
 * /matches/status/{status}:
 *   get:
 *     tags: [Matches]
 *     summary: Get matches by status
 *     parameters:
 *       - in: path
 *         name: status
 *         required: true
 *         schema:
 *           type: string
 *       - $ref: '#/components/parameters/skipParam'
 *       - $ref: '#/components/parameters/limitParam'
 *     responses:
 *       200:
 *         description: List of matches with specified status
 */
router.get(
  "/status/:status",
  matchController.findByStatus.bind(matchController)
);

/**
 * @swagger
 * /matches/{id}/start:
 *   post:
 *     tags: [Matches]
 *     summary: Start a match
 *     description: Automatically assign 2 available referees and change match status from scheduled to in_progress
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       200:
 *         description: Match started successfully with referees assigned
 *       400:
 *         description: Bad request - Match is not in scheduled status or not enough available referees
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.post("/:id/start", matchController.startMatch.bind(matchController));

/**
 * @swagger
 * /matches/{id}/pending-with-elo:
 *   get:
 *     tags: [Matches]
 *     summary: Get pending match with ELO preview (Chief Referee)
 *     description: |
 *       Get match details with pending status and preview of ELO changes.
 *       This helps chief referee review the result and see how ELO will change before approval.
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       200:
 *         description: Pending match with ELO preview
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 match:
 *                   type: object
 *                   description: Match details
 *                 eloPreview:
 *                   type: object
 *                   description: Preview of ELO changes for all players
 *       400:
 *         description: Bad request - Match is not in pending status
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get("/:id/pending-with-elo", matchController.getPendingMatchWithEloPreview.bind(matchController));

/**
 * @swagger
 * /matches/{id}/finalize:
 *   post:
 *     tags: [Matches]
 *     summary: Submit match result for approval (Referee)
 *     description: |
 *       Referee submits match result which will be in pending status:
 *       - Check if a team has won enough sets (maxSets/2 + 1)
 *       - Set match status to completed with resultStatus = pending
 *       - Chief referee must approve before standings/brackets and Elo are updated
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       200:
 *         description: Match result submitted, waiting for chief referee approval
 *       400:
 *         description: Bad request - Match not in_progress or not enough sets completed
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.post("/:id/finalize", matchController.finalizeMatch.bind(matchController));

/**
 * @swagger
 * /matches/{id}/approve:
 *   post:
 *     tags: [Matches]
 *     summary: Approve match result (Chief Referee only)
 *     description: |
 *       Chief referee approves the pending match result:
 *       - Update resultStatus to approved
 *       - Update group standings or knockout brackets
 *       - Calculate and update Elo scores for all players
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reviewNotes:
 *                 type: string
 *                 description: Optional review notes from chief referee
 *     responses:
 *       200:
 *         description: Match result approved, standings/brackets and Elo updated
 *       400:
 *         description: Bad request - Invalid match state
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.post("/:id/approve", matchController.approveMatchResult.bind(matchController));

/**
 * @swagger
 * /matches/{id}/reject:
 *   post:
 *     tags: [Matches]
 *     summary: Reject match result (Chief Referee only)
 *     description: |
 *       Chief referee rejects the pending match result:
 *       - Update resultStatus to rejected
 *       - Reset match to in_progress status
 *       - Clear winner so referee can resubmit
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
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
 *                 description: Required notes explaining why the result was rejected
 *     responses:
 *       200:
 *         description: Match result rejected, referee needs to resubmit
 *       400:
 *         description: Bad request - Review notes required or invalid state
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.post("/:id/reject", matchController.rejectMatchResult.bind(matchController));

/**
 * @swagger
 * /matches/{id}/elo-preview:
 *   get:
 *     tags: [Matches]
 *     summary: Preview Elo changes for a match
 *     description: |
 *       Calculate and preview how Elo scores will change for all players after match completion.
 *       Useful for checking expected Elo changes before finalizing the match.
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       200:
 *         description: Elo changes preview
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 entryA:
 *                   type: object
 *                   properties:
 *                     averageElo:
 *                       type: number
 *                     expectedScore:
 *                       type: number
 *                     actualScore:
 *                       type: number
 *                 entryB:
 *                   type: object
 *                   properties:
 *                     averageElo:
 *                       type: number
 *                     expectedScore:
 *                       type: number
 *                     actualScore:
 *                       type: number
 *                 marginMultiplier:
 *                   type: number
 *                 changes:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       userId:
 *                         type: number
 *                       currentElo:
 *                         type: number
 *                       expectedElo:
 *                         type: number
 *                       change:
 *                         type: number
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get("/:id/elo-preview", matchController.previewEloChanges.bind(matchController));

/**
 * @swagger
 * /matches/entry/{entryId}/available-coaches:
 *   get:
 *     tags: [Matches]
 *     summary: Get available coaches for an entry
 *     description: |
 *       Get list of coaches (members) of an entry who are not currently managing any other active matches.
 *       Returns coaches who are not assigned to any match with status 'in_progress' or 'scheduled'.
 *     parameters:
 *       - in: path
 *         name: entryId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the entry
 *     responses:
 *       200:
 *         description: List of available coaches
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: number
 *                   username:
 *                     type: string
 *                   email:
 *                     type: string
 *                   avatarUrl:
 *                     type: string
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get("/entry/:entryId/available-coaches", matchController.getAvailableCoachesForEntry.bind(matchController));

/**
 * @swagger
 * /matches/athlete/{userId}/upcoming:
 *   get:
 *     tags: [Matches]
 *     summary: Get upcoming matches for an athlete
 *     description: Get list of scheduled and in-progress matches that an athlete is participating in
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: number
 *         description: ID of the athlete/user
 *       - $ref: '#/components/parameters/skipParam'
 *       - $ref: '#/components/parameters/limitParam'
 *     responses:
 *       200:
 *         description: List of upcoming matches
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 matches:
 *                   type: array
 *                   items:
 *                     type: object
 *                 count:
 *                   type: number
 *                 skip:
 *                   type: number
 *                 limit:
 *                   type: number
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */
router.get("/athlete/:userId/upcoming", matchController.getUpcomingMatchesByAthlete.bind(matchController));

/**
 * @swagger
 * /matches/athlete/{userId}/history:
 *   get:
 *     tags: [Matches]
 *     summary: Get match history for an athlete
 *     description: Get list of completed matches that an athlete has participated in
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: number
 *         description: ID of the athlete/user
 *       - $ref: '#/components/parameters/skipParam'
 *       - $ref: '#/components/parameters/limitParam'
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
 *                   items:
 *                     type: object
 *                 count:
 *                   type: number
 *                 skip:
 *                   type: number
 *                 limit:
 *                   type: number
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */
router.get("/athlete/:userId/history", matchController.getMatchHistoryByAthlete.bind(matchController));

/**
 * @swagger
 * /matches/coach/{userId}:
 *   get:
 *     tags: [Matches]
 *     summary: Get all matches for a coach's team(s)
 *     description: Get list of all matches (upcoming, in progress, and completed) that coach's team(s) have participated in. User must be a coach or team_manager.
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: number
 *         description: ID of the coach/team manager
 *       - in: query
 *         name: status
 *         required: false
 *         schema:
 *           type: string
 *           enum: [scheduled, in_progress, completed, cancelled]
 *         description: Filter matches by status
 *       - $ref: '#/components/parameters/skipParam'
 *       - $ref: '#/components/parameters/limitParam'
 *     responses:
 *       200:
 *         description: List of team matches
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 matches:
 *                   type: array
 *                   items:
 *                     type: object
 *                 count:
 *                   type: number
 *                 skip:
 *                   type: number
 *                 limit:
 *                   type: number
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */
router.get("/coach/:userId", matchController.getMatchesByTeam.bind(matchController));

export default router;
