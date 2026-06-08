import { Router } from "express";
import groupStandingController from "../controllers/groupStanding.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { checkRole } from "../middlewares/permission.middleware";

const router = Router();

/**
 * @swagger
 * /group-standings/generate:
 *   post:
 *     tags: [Group Standings]
 *     summary: Generate group preview with random assignments
 *     description: |
 *       Generate a random group stage preview for organizer review.
 *       This endpoint does not save data. Review the returned groups, then call /group-standings/save-assignments with approved assignments.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [categoryId]
 *             properties:
 *               categoryId:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       200:
 *         description: Group preview generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       groupName:
 *                         type: string
 *                         example: Group A
 *                       slots:
 *                         type: integer
 *                         example: 4
 *                       entryIds:
 *                         type: array
 *                         items:
 *                           type: integer
 *                         example: [5, 12, 3, 8]
 *                 message:
 *                   type: string
 *                   example: Group preview generated successfully
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
  "/generate",
  authenticate,
  checkRole("organizer"),
  groupStandingController.generatePlaceholders.bind(groupStandingController)
);

/**
 * @swagger
 * /group-standings/save-assignments:
 *   post:
 *     tags: [Group Standings]
 *     summary: Save group assignments to database
 *     description: |
 *       Persist approved group assignments to the database after organizer confirmation.
 *       Creates initial GroupStanding records with all stats at zero (0 matches, 0 sets).
 *
 *       **Workflow**:
 *       1. Organizer calls `/group-standings/generate-placeholders` to get preview
 *       2. Reviews and optionally modifies group assignments
 *       3. Calls this endpoint to finalize - REPLACES any existing standings for category
 *
 *       **What Gets Created**:
 *       Each entry in each group gets a GroupStanding record initialized with:
 *       - position: null (will be calculated after first match)
 *       - matchesPlayed, matchesWon, matchesLost: 0
 *       - setsWon, setsLost, setsDiff: 0
 *
 *       **Validation**:
 *       - All entries must belong to the category
 *       - No duplicate entries across groups
 *       - All entries must be eligible (closed registration, proper member count)
 *       - Replaces previous standings completely (transaction-safe)
 *
 *       **Authorization**: Only organizer of the tournament
 *
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
 *               groupAssignments:
 *                 type: array
 *                 description: Group assignments (primary field name)
 *                 items:
 *                   type: object
 *                   required:
 *                     - groupName
 *                     - entryIds
 *                   properties:
 *                     groupName:
 *                       type: string
 *                       description: Unique group identifier (e.g., Group A, Group B)
 *                       example: "Group A"
 *                     entryIds:
 *                       type: array
 *                       description: Team/entry IDs in this group
 *                       items:
 *                         type: integer
 *                       example: [1, 5, 8, 12]
 *               assignments:
 *                 type: array
 *                 description: Backward-compatible alias for groupAssignments (deprecated - use groupAssignments instead)
 *                 items:
 *                   type: object
 *                   properties:
 *                     groupName:
 *                       type: string
 *                       example: "Group B"
 *                     entryIds:
 *                       type: array
 *                       items:
 *                         type: integer
 *                       example: [2, 6, 9, 13]
 *           examples:
 *             preferred:
 *               summary: Using groupAssignments (recommended)
 *               description: Modern format using groupAssignments field
 *               value:
 *                 categoryId: 1
 *                 groupAssignments:
 *                   - groupName: "Group A"
 *                     entryIds: [1, 5, 8, 12]
 *                   - groupName: "Group B"
 *                     entryIds: [2, 6, 9, 13]
 *                   - groupName: "Group C"
 *                     entryIds: [3, 7, 10, 14]
 *                   - groupName: "Group D"
 *                     entryIds: [4, 11, 15, 16]
 *             legacy:
 *               summary: Using assignments (backward compatibility)
 *               description: Legacy format - still works but groupAssignments is preferred
 *               value:
 *                 categoryId: 2
 *                 assignments:
 *                   - groupName: "Group A"
 *                     entryIds: [1, 2, 3, 4, 5]
 *                   - groupName: "Group B"
 *                     entryIds: [6, 7, 8, 9]
 *             customModified:
 *               summary: organizer manually modified assignments
 *               description: After reviewing preview, assignments were customized
 *               value:
 *                 categoryId: 1
 *                 groupAssignments:
 *                   - groupName: "Group A"
 *                     entryIds: [5, 3, 12, 8]
 *                   - groupName: "Group B"
 *                     entryIds: [1, 9, 6, 15]
 *                   - groupName: "Group C"
 *                     entryIds: [2, 10, 7, 14]
 *                   - groupName: "Group D"
 *                     entryIds: [4, 11, 13, 16]
 *     responses:
 *       201:
 *         description: Assignments saved successfully and GroupStanding records created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   description: Array of created GroupStanding records
 *                   items:
 *                     $ref: '#/components/schemas/GroupStanding'
 *                 message:
 *                   type: string
 *                   example: "Group assignments saved successfully"
 *             example:
 *               success: true
 *               data:
 *                 - id: 1
 *                   categoryId: 1
 *                   groupName: "Group A"
 *                   entryId: 1
 *                   matchesPlayed: 0
 *                   matchesWon: 0
 *                   matchesLost: 0
 *                   setsWon: 0
 *                   setsLost: 0
 *                   setsDiff: 0
 *                   position: null
 *                   createdAt: "2024-01-15T10:30:00Z"
 *                   updatedAt: "2024-01-15T10:30:00Z"
 *                 - id: 2
 *                   categoryId: 1
 *                   groupName: "Group A"
 *                   entryId: 5
 *                   matchesPlayed: 0
 *                   matchesWon: 0
 *                   matchesLost: 0
 *                   setsWon: 0
 *                   setsLost: 0
 *                   setsDiff: 0
 *                   position: null
 *                   createdAt: "2024-01-15T10:30:00Z"
 *                   updatedAt: "2024-01-15T10:30:00Z"
 *               message: "Group assignments saved successfully"
 *       400:
 *         description: Invalid request data or validation failed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   enum:
 *                     - "categoryId must be a positive integer"
 *                     - "groupAssignments must be an array of { groupName, entryIds[] }"
 *                     - "Assignments must contain at least one entry"
 *                     - "Duplicate entries found across groups"
 *                     - "Some entries do not belong to this category"
 *                     - "Registration must be closed before managing groups"
 *       401:
 *         $ref: '#/components/responses/Unauthorized401'
 *       403:
 *         description: User is not the tournament organizer
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Only the tournament organizer can perform this action"
 *       500:
 *         $ref: '#/components/responses/InternalError500'
 */
router.post(
  "/save-assignments",
  authenticate,
  checkRole("organizer"),
  groupStandingController.saveAssignments.bind(groupStandingController)
);

/**
 * @swagger
 * /group-standings/calculate:
 *   post:
 *     tags: [Group Standings]
 *     summary: Recalculate group standings positions
 *     description: |
 *       Recalculate ranking positions for group standings based on current match statistics.
 *       Applies three-tier tiebreaker system to determine final positions.
 *
 *       **Tie-Breaking Order** (applied in sequence):
 *       1. **Matches Won (DESC)**: Primary ranking criterion
 *       2. **Set Difference (DESC)**: Sets won - sets lost
 *       3. **Head-to-Head Result**: Direct match result between tied teams
 *          - Looks up completed group stage matches between teams
 *          - Uses winner of direct match as tiebreaker
 *          - Query optimized with single pre-fetch to avoid N² lookups
 *
 *       **Usage**:
 *       - Typically called after each group stage match completes
 *       - Can be called manually to refresh all positions
 *       - Optional groupName parameter to recalculate single group only
 *       - If groupName omitted: recalculates ALL groups in category
 *
 *       **Performance**: H2H results pre-fetched once per recalculation (efficient)
 *
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
 *               groupName:
 *                 type: string
 *                 description: Specific group name to recalculate (optional, all groups if omitted)
 *                 example: "Group A"
 *           examples:
 *             singleGroup:
 *               summary: Recalculate single group
 *               value:
 *                 categoryId: 1
 *                 groupName: "Group A"
 *             allGroups:
 *               summary: Recalculate all groups in category
 *               value:
 *                 categoryId: 1
 *     responses:
 *       200:
 *         description: Standings recalculated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/GroupStanding'
 *                 message:
 *                   type: string
 *                   example: "Group standings recalculated successfully"
 *       400:
 *         description: Invalid request or no group standings found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "No group standings found for this category"
 *       401:
 *         $ref: '#/components/responses/Unauthorized401'
 *       403:
 *         $ref: '#/components/responses/Forbidden403'
 *       500:
 *         $ref: '#/components/responses/InternalError500'
 */
router.post(
  "/calculate",
  authenticate,
  checkRole("organizer"),
  groupStandingController.calculateStandings.bind(groupStandingController)
);

/**
 * @swagger
 * /group-standings/matches/{matchId}/sync:
 *   post:
 *     tags: [Group Standings]
 *     summary: Update standings after group stage match completion
 *     description: |
 *       Update group standings statistics and rankings after a group stage match completes.
 *       Called when referee marks a group stage match as completed and sets the winner.
 *
 *       **What This Does**:
 *       1. Finds the completed match and its match sets
 *       2. Counts sets won/lost for both teams
 *       3. Updates both teams' standings:
 *          - matchesPlayed +1
 *          - matchesWon +1 (winner), matchesLost +1 (loser)
 *          - setsWon, setsLost (from all sets in match)
 *          - setsDiff recalculated (setsWon - setsLost)
 *       4. Recalculates positions for the group using tiebreaker
 *
 *       **Authorization**: Only organizer of the tournament can call this
 *
 *       **Prerequisites**:
 *       - Match must be in group stage (schedule.stage === "group")
 *       - Match status must be "completed"
 *       - Match must have a winner assigned
 *       - Both entries must be in the same group
 *
 *       **Concurrency**: Uses row-level locking to prevent race conditions
 *       if multiple matches in same group complete simultaneously
 *
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: matchId
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *         description: Match ID to sync standings for
 *         example: 42
 *     responses:
 *       200:
 *         description: Standings updated and positions recalculated successfully
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
 *                   example: "Group standings updated successfully"
 *       400:
 *         description: Invalid match ID, match not found, or preconditions not met
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   enum:
 *                     - "matchId must be a positive integer"
 *                     - "Match not found or not a group stage match"
 *                     - "Match is not completed yet"
 *                     - "Match has no winner"
 *       401:
 *         $ref: '#/components/responses/Unauthorized401'
 *       403:
 *         description: Insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Only the tournament organizer can perform this action"
 *       500:
 *         $ref: '#/components/responses/InternalError500'
 */
router.post(
  "/matches/:matchId/sync",
  authenticate,
  checkRole("organizer"),
  groupStandingController.updateAfterMatch.bind(groupStandingController)
);

/**
 * @swagger
 * /group-standings/{categoryId}:
 *   get:
 *     tags: [Group Standings]
 *     summary: Get group standings for a category
 *     description: |
 *       Retrieve all group standings for a tournament category.
 *       Results ordered by group name, then by position within each group.
 *
 *       **Response Fields**:
 *       - **groupName**: Group identifier (e.g., "Group A")
 *       - **position**: Current ranking in the group (null until first calculation)
 *       - **matchesPlayed/Won/Lost**: Match statistics
 *       - **setsWon/Lost**: Total sets counted across all matches
 *       - **setsDiff**: Set differential (setsWon - setsLost)
 *       - **entry**: Associated Entry object (if included via relationship)
 *
 *       **Optional Filtering**: Use groupName query parameter to filter single group
 *
 *     parameters:
 *       - name: categoryId
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *         description: Tournament category ID
 *         example: 1
 *       - name: groupName
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *         description: Filter by specific group name (e.g., "Group A")
 *         example: "Group A"
 *     responses:
 *       200:
 *         description: Standings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/GroupStanding'
 *             example:
 *               success: true
 *               data:
 *                 - id: 1
 *                   categoryId: 1
 *                   groupName: "Group A"
 *                   entryId: 5
 *                   position: 1
 *                   matchesPlayed: 3
 *                   matchesWon: 3
 *                   matchesLost: 0
 *                   setsWon: 9
 *                   setsLost: 1
 *                   setsDiff: 8
 *                   createdAt: "2024-01-15T10:30:00Z"
 *                   updatedAt: "2024-01-20T14:45:00Z"
 *                 - id: 2
 *                   categoryId: 1
 *                   groupName: "Group A"
 *                   entryId: 12
 *                   position: 2
 *                   matchesPlayed: 3
 *                   matchesWon: 2
 *                   matchesLost: 1
 *                   setsWon: 7
 *                   setsLost: 4
 *                   setsDiff: 3
 *                   createdAt: "2024-01-15T10:30:00Z"
 *                   updatedAt: "2024-01-20T14:45:00Z"
 *       400:
 *         description: Invalid category ID
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "categoryId must be a positive integer"
 *       500:
 *         $ref: '#/components/responses/InternalError500'
 */
router.get(
  "/:categoryId",
  groupStandingController.getStandings.bind(groupStandingController)
);

/**
 * @swagger
 * /group-standings/{categoryId}/qualified:
 *   get:
 *     tags: [Group Standings]
 *     summary: Get qualified teams advancing from group stage
 *     description: |
 *       Retrieve top N teams from each group that advance to knockout stage.
 *       Returns grouped results by group name with pagination support.
 *
 *       **Qualification Logic**:
 *       - Filters teams where position <= qualifiersPerGroup
 *       - Each group must have at least qualifiersPerGroup ranked teams
 *       - Returns {groupName, qualifiers[]} array (paginated)
 *
 *       **Position Calculation**:
 *       - Positions must be calculated first via `/calculate` endpoint
 *       - Uses three-tier tiebreaker (matchesWon, setsDiff, H2H)
 *
 *       **Pagination**:
 *       - page: 1-based page number (default: 1)
 *       - limit: results per page (default: 10)
 *       - Response includes pagination metadata (total, totalPages, hasNextPage, hasPrevPage)
 *
 *     parameters:
 *       - name: categoryId
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *         description: Tournament category ID
 *         example: 1
 *       - name: qualifiersPerGroup
 *         in: query
 *         required: false
 *         schema:
 *           type: integer
 *           default: 2
 *         description: Number of teams to qualify from each group (minimum 1)
 *         example: 2
 *       - name: teamsPerGroup
 *         in: query
 *         required: false
 *         schema:
 *           type: integer
 *           default: 2
 *         description: Legacy alias for qualifiersPerGroup (for backward compatibility)
 *         example: 2
 *       - name: page
 *         in: query
 *         required: false
 *         schema:
 *           type: integer
 *           default: 1
 *           minimum: 1
 *         description: Page number for pagination
 *         example: 1
 *       - name: limit
 *         in: query
 *         required: false
 *         schema:
 *           type: integer
 *           default: 10
 *           minimum: 1
 *         description: Results per page
 *         example: 10
 *     responses:
 *       200:
 *         description: Qualified teams retrieved successfully
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
 *                     qualifiers:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           groupName:
 *                             type: string
 *                             example: "Group A"
 *                           qualifiers:
 *                             type: array
 *                             items:
 *                               $ref: '#/components/schemas/GroupStanding'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                           example: 12
 *                         page:
 *                           type: integer
 *                           example: 1
 *                         limit:
 *                           type: integer
 *                           example: 10
 *                         totalPages:
 *                           type: integer
 *                           example: 2
 *                         hasNextPage:
 *                           type: boolean
 *                           example: true
 *                         hasPrevPage:
 *                           type: boolean
 *                           example: false
 *             example:
 *               success: true
 *               data:
 *                 qualifiers:
 *                   - groupName: "Group A"
 *                     qualifiers:
 *                       - id: 1
 *                         categoryId: 1
 *                         groupName: "Group A"
 *                         entryId: 5
 *                         position: 1
 *                         matchesPlayed: 3
 *                         matchesWon: 3
 *                         matchesLost: 0
 *                         setsWon: 9
 *                         setsLost: 1
 *                         setsDiff: 8
 *                       - id: 2
 *                         categoryId: 1
 *                         groupName: "Group A"
 *                         entryId: 12
 *                         position: 2
 *                         matchesPlayed: 3
 *                         matchesWon: 2
 *                         matchesLost: 1
 *                         setsWon: 7
 *                         setsLost: 4
 *                         setsDiff: 3
 *                   - groupName: "Group B"
 *                     qualifiers:
 *                       - id: 5
 *                         categoryId: 1
 *                         groupName: "Group B"
 *                         entryId: 8
 *                         position: 1
 *                         matchesPlayed: 3
 *                         matchesWon: 3
 *                         matchesLost: 0
 *                         setsWon: 8
 *                         setsLost: 2
 *                         setsDiff: 6
 *                       - id: 6
 *                         categoryId: 1
 *                         groupName: "Group B"
 *                         entryId: 9
 *                         position: 2
 *                         matchesPlayed: 3
 *                         matchesWon: 2
 *                         matchesLost: 1
 *                         setsWon: 6
 *                         setsLost: 5
 *                         setsDiff: 1
 *                 pagination:
 *                   total: 2
 *                   page: 1
 *                   limit: 10
 *                   totalPages: 1
 *                   hasNextPage: false
 *                   hasPrevPage: false
 *       400:
 *         description: Invalid parameters
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   enum:
 *                     - "categoryId must be a positive integer"
 *                     - "qualifiersPerGroup must be a positive integer"
 *                     - "No standings found for this category"
 *                     - "Some standings have not been ranked yet"
 *       500:
 *         $ref: '#/components/responses/InternalError500'
 */
router.get(
  "/:categoryId/qualified",
  groupStandingController.getQualifiedTeams.bind(groupStandingController)
);

export default router;
