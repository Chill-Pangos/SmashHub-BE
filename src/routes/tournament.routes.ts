import { Router } from "express";
import tournamentController from "../controllers/tournament.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { checkPermission, checkAnyPermission } from "../middlewares/permission.middleware";

const router = Router();

/**
 * @swagger
 * /tournaments:
 *   post:
 *     tags: [Tournaments]
 *     summary: Create a new tournament
 *     description: Create a new tournament with optional categories
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTournamentRequest'
 *           examples:
 *             full:
 *               summary: Full tournament with comprehensive categories
 *               value:
 *                 name: "Spring Championship 2026"
 *                 introduction: "Annual spring badminton tournament."
 *                 tier: 3
 *                 location: "National Stadium"
 *                 status: "upcoming"
 *                 categories:
 *                   - name: "Men's Singles"
 *                     type: "single"
 *                     maxEntries: 32
 *                     maxSets: 5
 *                     minAge: 18
 *                     maxAge: 65
 *                     minElo: 1000
 *                     maxElo: 2500
 *                     gender: "male"
 *                     isGroupStage: false
 *                   - name: "Women's Singles"
 *                     type: "single"
 *                     maxEntries: 32
 *                     maxSets: 5
 *                     minAge: 18
 *                     maxAge: 65
 *                     minElo: 1000
 *                     maxElo: 2500
 *                     gender: "female"
 *                     isGroupStage: false
 *             minimal:
 *               summary: Minimal tournament without categories
 *               value:
 *                 name: "Local Tournament 2026"
 *                 tier: 1
 *                 location: "Community Center"
 *     responses:
 *       201:
 *         description: Tournament created successfully with all related categories
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Tournament'
 *       400:
 *         description: Bad request - Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Error creating tournament"
 *                 error:
 *                   type: object
 *       401:
 *         $ref: '#/components/responses/Unauthorized401'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Transaction failed"
 *   get:
 *     tags: [Tournaments]
 *     summary: Get all tournaments with pagination
 *     description: |
 *       Get all tournaments with their categories and pagination information.
 *       Note: Date and table configuration is managed in ScheduleConfig.
 *     parameters:
 *       - $ref: '#/components/parameters/pageParam'
 *       - $ref: '#/components/parameters/limitParam'
 *     responses:
 *       200:
 *         description: List of tournaments with pagination
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tournaments:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Tournament'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       example: 25
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 10
 *                     totalPages:
 *                       type: integer
 *                       example: 3
 *                     hasNextPage:
 *                       type: boolean
 *                       example: true
 *                     hasPrevPage:
 *                       type: boolean
 *                       example: false
 *       500:
 *         description: Internal server error
 */
router.post("/", 
  authenticate, 
  checkPermission('tournaments:create'),
  tournamentController.create.bind(tournamentController)
);
router.get("/", tournamentController.findAllWithCategoriesFiltered.bind(tournamentController));

/**
 * @swagger
 * /tournaments/search:
 *   get:
 *     tags: [Tournaments]
 *     summary: Search tournaments with category filters and pagination
 *     description: Get all tournaments with their categories filtered by various criteria including user participation, age, ELO, gender, and other category properties
 *     parameters:
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of records to offset for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Maximum number of records to return. Use 0 to get all tournaments without limit
 *       - in: query
 *         name: userId
 *         schema:
 *           type: integer
 *         description: Filter tournaments where this user has entries
 *         example: 1
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Filter tournaments by similar name
 *         example: "Spring"
 *       - in: query
 *         name: createdBy
 *         schema:
 *           type: integer
 *         description: Filter tournaments created by this user
 *         example: 1
 *       - in: query
 *         name: minAge
 *         schema:
 *           type: integer
 *         description: Filter by minimum age requirement (category.minAge <= this value)
 *         example: 18
 *       - in: query
 *         name: maxAge
 *         schema:
 *           type: integer
 *         description: Filter by maximum age requirement (category.maxAge >= this value)
 *         example: 35
 *       - in: query
 *         name: minElo
 *         schema:
 *           type: integer
 *         description: Filter by minimum ELO requirement (category.minElo <= this value)
 *         example: 1000
 *       - in: query
 *         name: maxElo
 *         schema:
 *           type: integer
 *         description: Filter by maximum ELO requirement (category.maxElo >= this value)
 *         example: 2000
 *       - in: query
 *         name: gender
 *         schema:
 *           type: string
 *           enum: [male, female, mixed]
 *         description: Filter by gender category
 *         example: "male"
 *       - in: query
 *         name: isGroupStage
 *         schema:
 *           type: boolean
 *         description: Filter by group stage format
 *         example: false
 *     responses:
 *       200:
 *         description: Filtered list of tournaments with pagination
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tournaments:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Tournament'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       description: Total number of tournaments matching the filters
 *                       example: 42
 *                     page:
 *                       type: integer
 *                       description: Current page number
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       description: Number of items per page
 *                       example: 10
 *                     totalPages:
 *                       type: integer
 *                       description: Total number of pages
 *                       example: 5
 *                     hasNextPage:
 *                       type: boolean
 *                       description: Whether there is a next page
 *                       example: true
 *                     hasPrevPage:
 *                       type: boolean
 *                       description: Whether there is a previous page
 *                       example: false
 *       500:
 *         description: Internal server error
 */
router.get("/search", tournamentController.findAllWithCategoriesFiltered.bind(tournamentController));

/**
 * @swagger
 * /tournaments/update-statuses:
 *   post:
 *     tags: [Tournaments]
 *     summary: Manually trigger tournament status updates
 *     description: |
 *       Manually update tournament statuses based on registration and bracket dates.
 *       This endpoint is useful for admins to force status updates outside the cron schedule.
 *       Status transitions:
 *       - upcoming → registration_open (when registrationStartDate is reached)
 *       - registration_open → registration_closed (when registrationEndDate is reached)
 *       - registration_closed → brackets_generated (when bracketGenerationDate is reached)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Status update completed successfully
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
 *                   example: "Tournament statuses updated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     openedCount:
 *                       type: integer
 *                       description: Number of tournaments that opened registration
 *                       example: 2
 *                     closedCount:
 *                       type: integer
 *                       description: Number of tournaments that closed registration
 *                       example: 1
 *                     bracketsGeneratedCount:
 *                       type: integer
 *                       description: Number of tournaments that generated brackets
 *                       example: 0
 *                     totalUpdated:
 *                       type: integer
 *                       description: Total number of tournaments updated
 *                       example: 3
 *       401:
 *         $ref: '#/components/responses/Unauthorized401'
 *       500:
 *         description: Internal server error
 */
router.post(
  "/update-statuses",
  authenticate,
  checkPermission('tournaments:update'),
  tournamentController.updateStatuses.bind(tournamentController)
);

/**
 * @swagger
 * /tournaments/upcoming-changes:
 *   get:
 *     tags: [Tournaments]
 *     summary: Get upcoming tournament status changes
 *     description: |
 *       Get a list of tournaments that will change status within the specified time period.
 *       Useful for monitoring and preparing for upcoming tournament phases.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: hours
 *         schema:
 *           type: integer
 *           default: 24
 *         description: Number of hours to look ahead (default is 24 hours)
 *         example: 48
 *     responses:
 *       200:
 *         description: List of upcoming status changes
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
 *                     openingSoon:
 *                       type: array
 *                       description: Tournaments that will open registration soon
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           name:
 *                             type: string
 *                           status:
 *                             type: string
 *                             example: "upcoming"
 *                           scheduleConfig:
 *                             type: object
 *                             properties:
 *                               registrationStartDate:
 *                                 type: string
 *                                 format: date-time
 *                     closingSoon:
 *                       type: array
 *                       description: Tournaments that will close registration soon
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           name:
 *                             type: string
 *                           status:
 *                             type: string
 *                             example: "registration_open"
 *                           scheduleConfig:
 *                             type: object
 *                             properties:
 *                               registrationEndDate:
 *                                 type: string
 *                                 format: date-time
 *                     bracketsSoon:
 *                       type: array
 *                       description: Tournaments that will generate brackets soon
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           name:
 *                             type: string
 *                           status:
 *                             type: string
 *                             example: "registration_closed"
 *                           scheduleConfig:
 *                             type: object
 *                             properties:
 *                               bracketGenerationDate:
 *                                 type: string
 *                                 format: date-time
 *                 metadata:
 *                   type: object
 *                   properties:
 *                     lookAheadHours:
 *                       type: integer
 *                       example: 24
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *       401:
 *         $ref: '#/components/responses/Unauthorized401'
 *       500:
 *         description: Internal server error
 */
router.get(
  "/upcoming-changes",
  authenticate,
  checkAnyPermission(['tournaments:view', 'tournaments:update']),
  tournamentController.getUpcomingChanges.bind(tournamentController)
);

/**
 * @swagger
 * /tournaments/organizer/my:
 *   get:
 *     tags: [Tournaments]
 *     summary: Get tournaments organized by current user
 *     description: Retrieve all tournaments created by the authenticated user with pagination and sorting support
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of items to offset for pagination
 *         example: 0
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items to return per page
 *         example: 10
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: createdAt
 *         description: Field to sort by
 *         example: "name"
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *           default: DESC
 *         description: Sort order (ASC or DESC)
 *         example: "DESC"
 *     responses:
 *       200:
 *         description: List of tournaments created by user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tournaments:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Tournament'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       example: 5
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 10
 *                     totalPages:
 *                       type: integer
 *                       example: 1
 *                     hasNextPage:
 *                       type: boolean
 *                       example: false
 *                     hasPrevPage:
 *                       type: boolean
 *                       example: false
 *       401:
 *         $ref: '#/components/responses/Unauthorized401'
 *       500:
 *         description: Internal server error
 */
router.get(
  "/organizer/my",
  authenticate,
  checkPermission('tournaments:view'),
  tournamentController.getMyOrganizedTournaments.bind(tournamentController)
);

/**
 * @swagger
 * /tournaments/referee/my:
 *   get:
 *     tags: [Tournaments]
 *     summary: Get tournaments where user is a referee
 *     description: Retrieve all tournaments where the authenticated user is assigned as a referee with pagination and sorting support
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of items to offset for pagination
 *         example: 0
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items to return per page
 *         example: 10
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: createdAt
 *         description: Field to sort by
 *         example: "name"
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *           default: DESC
 *         description: Sort order (ASC or DESC)
 *         example: "DESC"
 *     responses:
 *       200:
 *         description: List of tournaments where user is a referee
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tournaments:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Tournament'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       example: 3
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 10
 *                     totalPages:
 *                       type: integer
 *                       example: 1
 *                     hasNextPage:
 *                       type: boolean
 *                       example: false
 *                     hasPrevPage:
 *                       type: boolean
 *                       example: false
 *       401:
 *         $ref: '#/components/responses/Unauthorized401'
 *       500:
 *         description: Internal server error
 */
router.get(
  "/referee/my",
  authenticate,
  checkPermission('tournaments:view'),
  tournamentController.getMyRefereedTournaments.bind(tournamentController)
);

/**
 * @swagger
 * /tournaments/{id}/elo/calculate:
 *   post:
 *     tags: [Tournaments]
 *     summary: Calculate Elo for all players in a completed tournament
 *     description: |
 *       Calculates and persists Elo changes for all players who participated in approved matches of a completed tournament.
 *       This endpoint is intended to be called once after the tournament ends.
 *
 *       Business Logic:
 *       - Tournament status must be completed
 *       - Uses only matches with status = completed and resultStatus = approved
 *       - Creates missing Elo scores with default 1000
 *       - Aggregates all match deltas per user and writes one Elo history record per user
 *       - Rejects duplicate calculation if Elo history already exists for the tournament
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       200:
 *         description: Tournament Elo calculated successfully
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
  "/:id/elo/calculate",
  authenticate,
  checkPermission('tournaments:update'),
  tournamentController.calculateTournamentElo.bind(tournamentController)
);

/**
 * @swagger
 * /tournaments/{id}/complete:
 *   post:
 *     tags: [Tournaments]
 *     summary: Complete tournament, return awards, and update Elo
 *     description: |
 *       Marks a tournament as completed, returns prize winners, then calculates and persists Elo changes.
 *
 *       Award logic:
 *       - Knockout: champion, runner-up, and third-place entries from final standings
 *       - Group-only: top 3 entries per group from group standings
 *
 *       Elo logic:
 *       - Uses approved completed matches
 *       - Rejects duplicate Elo calculation if histories already exist for the tournament
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       200:
 *         description: Tournament completed successfully
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
  "/:id/complete",
  authenticate,
  checkPermission('tournaments:update'),
  tournamentController.completeTournament.bind(tournamentController)
);

/**
 * @swagger
 * /tournaments/{id}/cancel:
 *   post:
 *     tags: [Tournaments]
 *     summary: Cancel tournament
 *     description: |
 *       Marks a tournament as cancelled. Only the tournament organizer can cancel it.
 *       Completed or already cancelled tournaments cannot be cancelled.
 *
 *       Paid entries are not refunded automatically. Use payment refund APIs to
 *       upload refund proof and mark completed payments as refunded.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       200:
 *         description: Tournament cancelled successfully
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
  "/:id/cancel",
  authenticate,
  checkPermission('tournaments:update'),
  tournamentController.cancelTournament.bind(tournamentController)
);

/**
 * @swagger
 * /tournaments/{id}:
 *   get:
 *     tags: [Tournaments]
 *     summary: Get tournament by ID with categories
 *     description: Retrieve a tournament by ID including all tournament categories
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       200:
 *         description: Tournament details with categories
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Tournament'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   put:
 *     tags: [Tournaments]
 *     summary: Update tournament with categories
 *     description: Update a tournament and optionally replace its categories.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateTournamentRequest'
 *     responses:
 *       200:
 *         description: Tournament updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Tournament'
 *       401:
 *         $ref: '#/components/responses/Unauthorized401'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       400:
 *         description: Bad request
 *   delete:
 *     tags: [Tournaments]
 *     summary: Delete tournament
 *     description: Delete a tournament by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       204:
 *         $ref: '#/components/responses/NoContent'
 *       401:
 *         $ref: '#/components/responses/Unauthorized401'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get("/:id", tournamentController.findByIdWithCategories.bind(tournamentController));
router.put("/:id", 
  authenticate, 
  checkPermission('tournaments:update'),
  tournamentController.updateWithCategories.bind(tournamentController)
);
router.delete("/:id", 
  authenticate, 
  checkPermission('tournaments:delete'),
  tournamentController.delete.bind(tournamentController)
);


export default router;
