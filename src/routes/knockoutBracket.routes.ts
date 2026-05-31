import { Router } from "express";
import knockoutBracketController from "../controllers/knockoutBracket.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { checkPermission } from "../middlewares/permission.middleware";

const router = Router();

/**
 * @swagger
 * /knockout-brackets/from-entries:
 *   post:
 *     tags: [Knockout Brackets]
 *     summary: Generate knockout bracket from eligible entries
 *     description: |
 *       Create knockout bracket structure from eligible entries list.
 *       Use for tournaments without group stage.
 *
 *       Process:
 *       - Validates chief referee authorization
 *       - Calculates bracket size (power of 2)
 *       - Creates Round 1 matches with proper bye handling
 *       - Builds complete bracket tree through finals
 *       - Balances byes across both halves for fairness
 *
 *       Bracket Status: pending (awaiting match), ready (both entries assigned), in_progress, completed
 *       Round Names: R16, QF (Quarter-final), SF (Semi-final), Final
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - categoryId
 *             properties:
 *               categoryId:
 *                 type: integer
 *                 description: Tournament category ID
 *                 example: 1
 *           examples:
 *             directBracket:
 *               summary: Direct bracket generation (no group stage)
 *               value:
 *                 categoryId: 1
 *     responses:
 *       201:
 *         description: Knockout bracket generated successfully from entries
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     categoryId:
 *                       type: integer
 *                       example: 1
 *                     totalRounds:
 *                       type: integer
 *                       description: Total number of rounds (log2 of bracket size)
 *                       example: 4
 *                     totalBrackets:
 *                       type: integer
 *                       description: Total brackets across all rounds
 *                       example: 15
 *                     rounds:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           roundNumber:
 *                             type: integer
 *                             example: 1
 *                           roundName:
 *                             type: string
 *                             enum: [Round of 64, Round of 32, Round of 16, Quarter-final, Semi-final, Final]
 *                             example: Round of 16
 *                           brackets:
 *                             type: array
 *                             items:
 *                               $ref: '#/components/schemas/KnockoutBracket'
 *                 message:
 *                   type: string
 *                   example: Knockout bracket generated successfully
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
  "/from-entries",
  authenticate,
  checkPermission('schedules:create'),
  knockoutBracketController.generateFromEntries.bind(knockoutBracketController)
);

/**
 * @swagger
 * /knockout-brackets/from-group-stage:
 *   post:
 *     tags: [Knockout Brackets]
 *     summary: Generate knockout bracket from group stage results
 *     description: |
 *       Create knockout bracket from group stage qualified entries.
 *
 *       Process:
 *       - Retrieves top qualifiers from each group (default: top 2)
 *       - Separates first-place and second-place finishers
 *       - Alternates placement to prevent early rematches
 *       - Distributes byes evenly across bracket halves
 *       - Creates complete tree linking to finals
 *
 *       Example seeding:
 *       - Top half: Group A 1st, Group C 1st, Group B 2nd, Group D 2nd (alternating)
 *       - Bottom half: Group B 1st, Group D 1st, Group A 2nd, Group C 2nd
 *
 *       Business Logic:
 *       - First-place finishers seeded to top positions
 *       - Groups distributed across both halves
 *       - Bye matches automatically advance to next round
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - categoryId
 *             properties:
 *               categoryId:
 *                 type: integer
 *                 description: Tournament category ID
 *                 example: 1
 *               qualifiersPerGroup:
 *                 type: integer
 *                 description: Number of qualifiers per group (default 2). Typically 1 or 2.
 *                 example: 2
 *           examples:
 *             groupStageToKnockout:
 *               summary: Convert group stage results to knockout
 *               value:
 *                 categoryId: 1
 *                 qualifiersPerGroup: 2
 *     responses:
 *       201:
 *         description: Knockout bracket generated successfully from group stage
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     categoryId:
 *                       type: integer
 *                       example: 1
 *                     totalRounds:
 *                       type: integer
 *                       example: 3
 *                     totalBrackets:
 *                       type: integer
 *                       example: 7
 *                     rounds:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           roundNumber:
 *                             type: integer
 *                             example: 1
 *                           roundName:
 *                             type: string
 *                             example: Quarter-final
 *                           brackets:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 id:
 *                                   type: integer
 *                                 roundNumber:
 *                                   type: integer
 *                                 bracketPosition:
 *                                   type: integer
 *                                 entryAId:
 *                                   type: integer
 *                                 entryBId:
 *                                   type: integer
 *                                 status:
 *                                   type: string
 *                                   enum: [pending, ready, in_progress, completed]
 *                                 isByeMatch:
 *                                   type: boolean
 *                 message:
 *                   type: string
 *                   example: Knockout bracket generated from group stage results successfully
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
  "/from-group-stage",
  authenticate,
  checkPermission('schedules:create'),
  knockoutBracketController.generateFromGroupStage.bind(knockoutBracketController)
);

/**
 * @swagger
 * /knockout-brackets/{id}/advance-winner:
 *   post:
 *     tags: [Knockout Brackets]
 *     summary: Advance winner to next round
 *     description: |
 *       Record match result and advance winner to next round.
 *
 *       Process:
 *       - Validates chief referee authorization
 *       - Marks current bracket as completed
 *       - Advances winner to next bracket in progression
 *       - Handles bye match scenarios automatically
 *       - Updates next bracket status based on opponent availability
 *
 *       Bracket Linking:
 *       - Winner fills next bracket slot (A or B based on previous position)
 *       - Status becomes "ready" when both slots filled
 *       - Status remains "pending" if waiting for other semifinal result
 *
 *       Validation:
 *       - Winner must be either entryA or entryB from current bracket
 *       - Bracket must be in "ready" or "in_progress" status
 *       - Cannot update if already completed
 *       - For bye matches, winner auto-advances from prior round
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *         description: Bracket ID to update result for
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - winnerEntryId
 *             properties:
 *               winnerEntryId:
 *                 type: integer
 *                 description: Entry ID of the match winner
 *                 example: 5
 *           examples:
 *             matchResult:
 *               summary: Recording a match result
 *               value:
 *                 winnerEntryId: 5
 *     responses:
 *       200:
 *         description: Winner advanced to next round successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Winner updated and advanced to the next round successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     categoryId:
 *                       type: integer
 *                       example: 1
 *                     roundNumber:
 *                       type: integer
 *                       example: 1
 *                     bracketPosition:
 *                       type: integer
 *                       example: 0
 *                     entryAId:
 *                       type: integer
 *                       example: 3
 *                     entryBId:
 *                       type: integer
 *                       example: 5
 *                     winnerEntryId:
 *                       type: integer
 *                       example: 5
 *                       description: Winning entry ID
 *                     status:
 *                       type: string
 *                       enum: [pending, ready, in_progress, completed]
 *                       example: completed
 *                     nextBracketId:
 *                       type: integer
 *                       description: ID of next bracket in progression
 *                       example: 8
 *                     roundName:
 *                       type: string
 *                       example: Round of 16
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
router.post(
  "/:id/advance-winner",
  authenticate,
  checkPermission('schedules:update'),
  knockoutBracketController.advanceWinner.bind(knockoutBracketController)
);

/**
 * @swagger
 * /knockout-brackets/validate/{categoryId}:
 *   get:
 *     tags: [Knockout Brackets]
 *     summary: Validate bracket tree integrity
 *     description: |
 *       Comprehensive validation of knockout bracket structure before tournament starts.
 *
 *       Validation Checks:
 *       1. Total brackets count matches expected tree size (2^n - 1)
 *       2. Round 1 brackets have entries or are marked as bye
 *       3. No duplicate entries across bracket positions
 *       4. Bracket linking is correct (nextBracketId, previousBracketAId, previousBracketBId)
 *       5. Final bracket should not have nextBracketId
 *       6. All non-final brackets have valid nextBracketId
 *       7. Previous bracket references point back correctly
 *
 *       Returns detailed error list if validation fails, allowing
 *       debugging of bracket structure issues before tournament starts.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: categoryId
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *         description: Tournament category ID to validate
 *     responses:
 *       200:
 *         description: Bracket validation result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     valid:
 *                       type: boolean
 *                       description: Whether bracket tree is valid
 *                       example: true
 *                     errors:
 *                       type: array
 *                       items:
 *                         type: string
 *                       description: List of validation errors (empty if valid)
 *                       example: []
 *             examples:
 *               validBracket:
 *                 summary: Valid bracket structure
 *                 value:
 *                   success: true
 *                   data:
 *                     valid: true
 *                     errors: []
 *               invalidBracket:
 *                 summary: Invalid bracket with errors
 *                 value:
 *                   success: true
 *                   data:
 *                     valid: false
 *                     errors:
 *                       - "Expected 15 brackets for bracket size 16, found 14"
 *                       - "Bracket [round=1, position=3] has no entries assigned"
 *                       - "Duplicate entries found: [5, 7]"
 *       400:
 *         $ref: '#/components/responses/BadRequest400'
 *       401:
 *         $ref: '#/components/responses/Unauthorized401'
 *       403:
 *         $ref: '#/components/responses/Forbidden403'
 *       500:
 *         $ref: '#/components/responses/InternalError500'
 */
router.get(
  "/validate/:categoryId",
  authenticate,
  checkPermission('schedules:update'),
  knockoutBracketController.validateBracketIntegrity.bind(knockoutBracketController)
);

/**
 * @swagger
 * /knockout-brackets/tree/{categoryId}:
 *   get:
 *     tags: [Knockout Brackets]
 *     summary: Get complete bracket tree structure
 *     description: |
 *       Retrieve entire knockout bracket tree organized by rounds.
 *
 *       Response Structure:
 *       - Rounds sorted from Round 1 (most matches) to Final (1 match)
 *       - Each round contains all brackets for that round sorted by position
 *       - Brackets linked via nextBracketId (to next round) and previousBracketAId/previousBracketBId (from previous round)
 *
 *       Bracket Information:
 *       - entryAId/entryBId: Competitor IDs (null for byes)
 *       - winnerEntryId: Result of completed match
 *       - status: pending (awaiting entries), ready (both entries assigned), in_progress, completed
 *       - isByeMatch: Match automatically advanced to next round
 *       - bracketPosition: Position within round (0-indexed)
 *
 *       Use Cases:
 *       - Display full bracket visualization
 *       - Track tournament progress
 *       - Find specific matches by round/position
 *     parameters:
 *       - name: categoryId
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *         description: Tournament category ID
 *     responses:
 *       200:
 *         description: Complete bracket tree retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     categoryId:
 *                       type: integer
 *                       example: 1
 *                     totalRounds:
 *                       type: integer
 *                       description: Number of rounds (log2 of bracket size)
 *                       example: 4
 *                     totalBrackets:
 *                       type: integer
 *                       description: Total number of brackets in tree
 *                       example: 15
 *                     rounds:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           roundNumber:
 *                             type: integer
 *                             example: 1
 *                           roundName:
 *                             type: string
 *                             enum: [Round of 64, Round of 32, Round of 16, Quarter-final, Semi-final, Final]
 *                             example: Round of 16
 *                           brackets:
 *                             type: array
 *                             items:
 *                               $ref: '#/components/schemas/KnockoutBracket'
 *             examples:
 *               completeBracket:
 *                 summary: Complete 16-player bracket structure
 *                 value:
 *                   success: true
 *                   data:
 *                     categoryId: 1
 *                     totalRounds: 4
 *                     totalBrackets: 15
 *                     rounds:
 *                       - roundNumber: 1
 *                         roundName: Round of 16
 *                         brackets:
 *                           - id: 1
 *                             roundNumber: 1
 *                             roundName: Round of 16
 *                             bracketPosition: 0
 *                             entryAId: 3
 *                             entryBId: 5
 *                             winnerEntryId: null
 *                             status: ready
 *                             isByeMatch: false
 *                             nextBracketId: 9
 *                           - id: 2
 *                             roundNumber: 1
 *                             bracketPosition: 1
 *                             entryAId: 2
 *                             entryBId: null
 *                             winnerEntryId: 2
 *                             status: completed
 *                             isByeMatch: true
 *                             nextBracketId: 9
 *                       - roundNumber: 2
 *                         roundName: Quarter-final
 *                         brackets:
 *                           - id: 9
 *                             roundNumber: 2
 *                             bracketPosition: 0
 *                             entryAId: null
 *                             entryBId: 2
 *                             status: pending
 *                             previousBracketAId: 1
 *                             previousBracketBId: 2
 *       400:
 *         $ref: '#/components/responses/BadRequest400'
 *       404:
 *         $ref: '#/components/responses/NotFound404'
 *       500:
 *         $ref: '#/components/responses/InternalError500'
 */
router.get(
  "/tree/:categoryId",
  knockoutBracketController.getBracketTree.bind(knockoutBracketController)
);

/**
 * @swagger
 * /knockout-brackets/standings/{categoryId}:
 *   get:
 *     tags: [Knockout Brackets]
 *     summary: Get tournament final standings
 *     description: |
 *       Retrieve final tournament rankings after knockout completion.
 *
 *       Rankings Structure:
 *       - Champion: Winner of Final bracket
 *       - Runner-up: Loser of Final bracket
 *       - Third Place: Losers of both Semi-final brackets (shared third)
 *       - Eliminated: Players eliminated in earlier rounds with round information
 *
 *       Uses knockout bracket results to determine placement:
 *       - Tracks winner through each round
 *       - Identifies final four (semifinals) and final two (final)
 *       - Records elimination round for each player
 *
 *       Note: Returns error if tournament not yet completed (Final not finished).
 *       Requires Final bracket to have status "completed".
 *     parameters:
 *       - name: categoryId
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *         description: Tournament category ID
 *     responses:
 *       200:
 *         description: Final standings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     champion:
 *                       type: integer
 *                       description: Entry ID of tournament champion
 *                       example: 5
 *                     runnerUp:
 *                       type: integer
 *                       description: Entry ID of runner-up (2nd place)
 *                       example: 8
 *                     thirdPlace:
 *                       type: array
 *                       items:
 *                         type: integer
 *                       description: Entry IDs of shared third place (semifinal losers)
 *                       example: [3, 7]
 *                     eliminated:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           entryId:
 *                             type: integer
 *                           eliminatedAt:
 *                             type: string
 *                             description: Round name where eliminated
 *                             enum: [Round of 16, Quarter-final, Semi-final]
 *                       example:
 *                         - entryId: 2
 *                           eliminatedAt: Quarter-final
 *                         - entryId: 4
 *                           eliminatedAt: Round of 16
 *             examples:
 *               completedTournament:
 *                 summary: Completed tournament standings
 *                 value:
 *                   success: true
 *                   data:
 *                     champion: 5
 *                     runnerUp: 8
 *                     thirdPlace: [3, 7]
 *                     eliminated:
 *                       - entryId: 2
 *                         eliminatedAt: Quarter-final
 *                       - entryId: 4
 *                         eliminatedAt: Quarter-final
 *                       - entryId: 1
 *                         eliminatedAt: Round of 16
 *       400:
 *         description: Tournament not completed yet
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: Tournament is not completed yet
 *       404:
 *         $ref: '#/components/responses/NotFound404'
 *       500:
 *         $ref: '#/components/responses/InternalError500'
 */
router.get(
  "/standings/:categoryId",
  knockoutBracketController.getStandings.bind(knockoutBracketController)
);

/**
 * @swagger
 * /knockout-brackets/category/{categoryId}/entry:
 *   get:
 *     tags: [Knockout Brackets]
 *     summary: Get brackets for a specific entry
 *     description: |
 *       Retrieve all brackets involving a specific entry (team/player).
 *
 *       Search Options:
 *       - Query by entryId (exact match)
 *       - Query by entryName (partial match, case-insensitive)
 *       - Results include all brackets where entry is entryA, entryB, or winner
 *
 *       Use Cases:
 *       - Track entry's tournament progression
 *       - Show upcoming matches
 *       - Display match history with results
 *       - Generate entry-specific statistics
 *
 *       Pagination:
 *       - Results sorted by round (ascending) then bracket position
 *       - Default: 10 per page, page 1
 *       - Maximum meaningful page size around 20 (typical bracket has max 15 matches per entry)
 *     parameters:
 *       - name: categoryId
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *         description: Tournament category ID
 *       - name: entryId
 *         in: query
 *         schema:
 *           type: integer
 *         description: Entry ID to search for
 *       - name: entryName
 *         in: query
 *         schema:
 *           type: string
 *         description: Entry name for partial search (e.g., team name)
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Records per page
 *     responses:
 *       200:
 *         description: Entry brackets retrieved with pagination
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     brackets:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/KnockoutBracket'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                           description: Total number of brackets for entry
 *                           example: 4
 *                         page:
 *                           type: integer
 *                           example: 1
 *                         limit:
 *                           type: integer
 *                           example: 10
 *                         totalPages:
 *                           type: integer
 *                           example: 1
 *                         hasNextPage:
 *                           type: boolean
 *                           example: false
 *                         hasPrevPage:
 *                           type: boolean
 *                           example: false
 *             examples:
 *               entryProgress:
 *                 summary: Entry's tournament bracket progression
 *                 value:
 *                   success: true
 *                   data:
 *                     brackets:
 *                       - id: 1
 *                         roundNumber: 1
 *                         roundName: Round of 16
 *                         bracketPosition: 0
 *                         entryAId: 5
 *                         entryBId: 12
 *                         winnerEntryId: 5
 *                         status: completed
 *                         nextBracketId: 9
 *                       - id: 9
 *                         roundNumber: 2
 *                         roundName: Quarter-final
 *                         bracketPosition: 0
 *                         entryAId: 5
 *                         entryBId: 8
 *                         winnerEntryId: null
 *                         status: ready
 *                         nextBracketId: 13
 *                     pagination:
 *                       total: 2
 *                       page: 1
 *                       limit: 10
 *                       totalPages: 1
 *                       hasNextPage: false
 *                       hasPrevPage: false
 *       400:
 *         description: Missing both entryId and entryName parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: Provide either entryId or entryName
 *       404:
 *         $ref: '#/components/responses/NotFound404'
 *       500:
 *         $ref: '#/components/responses/InternalError500'
 */
router.get(
  "/category/:categoryId/entry",
  knockoutBracketController.getBracketsByEntry.bind(knockoutBracketController)
);

export default router;
