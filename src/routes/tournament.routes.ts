import { Router } from "express";
import tournamentController from "../controllers/tournament.controller";
import { authenticate } from "../middlewares/auth.middleware";

const router = Router();

/**
 * @swagger
 * /tournaments:
 *   post:
 *     tags: [Tournaments]
 *     summary: Create a new tournament with contents
 *     description: Create a tournament along with its tournament contents in a single transaction. Creator ID is automatically taken from authenticated user.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - startDate
 *               - location
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name of the tournament
 *                 example: "Spring Championship 2026"
 *               startDate:
 *                 type: string
 *                 format: date-time
 *                 description: Tournament start date and time
 *                 example: "2026-03-15T09:00:00Z"
 *               endDate:
 *                 type: string
 *                 format: date-time
 *                 description: Tournament end date and time (optional)
 *                 example: "2026-03-20T18:00:00Z"
 *               location:
 *                 type: string
 *                 description: Tournament venue location
 *                 example: "National Stadium"
 *               status:
 *                 type: string
 *                 enum: [upcoming, ongoing, completed]
 *                 description: Tournament status (default is 'upcoming')
 *                 example: "upcoming"
 *               contents:
 *                 type: array
 *                 description: Array of tournament contents
 *                 items:
 *                   type: object
 *                   required:
 *                     - name
 *                     - type
 *                     - maxEntries
 *                     - maxSets
 *                     - racketCheck
 *                   properties:
 *                     name:
 *                       type: string
 *                       description: Name of the tournament content (e.g., Men's Singles, Women's Doubles)
 *                       example: "Men's Singles"
 *                     type:
 *                       type: string
 *                       enum: [single, team, double]
 *                       description: Type of tournament content
 *                       example: "single"
 *                     maxEntries:
 *                       type: integer
 *                       description: Maximum number of entries allowed
 *                       example: 32
 *                     maxSets:
 *                       type: integer
 *                       description: Maximum number of sets per match
 *                       example: 3
 *                     numberOfSingles:
 *                       type: integer
 *                       description: Number of singles matches
 *                       example: 3
 *                     numberOfDoubles:
 *                       type: integer
 *                       description: Number of doubles matches
 *                       example: 2
 *                     racketCheck:
 *                       type: boolean
 *                       description: Whether racket check is required
 *                       example: true
 *                     gender:
 *                       type: string
 *                       enum: [male, female, mixed]
 *                       description: Gender requirement for the tournament content
 *                       example: "male"
 *                     isGroupStage:
 *                       type: boolean
 *                       description: Whether this content has a group stage (optional)
 *                       example: false
 *           examples:
 *             full:
 *               summary: Full tournament with multiple contents
 *               value:
 *                 name: "Spring Championship 2026"
 *                 startDate: "2026-03-15T09:00:00Z"
 *                 endDate: "2026-03-20T18:00:00Z"
 *                 location: "National Stadium"
 *                 status: "upcoming"
 *                 contents:
 *                   - name: "Men's Singles"
 *                     type: "single"
 *                     maxEntries: 32
 *                     maxSets: 3
 *                     racketCheck: true
 *                     gender: "male"
 *                     isGroupStage: false
 *                   - name: "Women's Singles"
 *                     type: "single"
 *                     maxEntries: 32
 *                     maxSets: 3
 *                     racketCheck: true
 *                     gender: "female"
 *                     isGroupStage: false
 *             minimal:
 *               summary: Minimal tournament without contents
 *               value:
 *                 name: "Local Tournament 2026"
 *                 startDate: "2026-04-01T10:00:00Z"
 *                 location: "Community Center"
 *     responses:
 *       201:
 *         description: Tournament created successfully with all related contents
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 1
 *                 name:
 *                   type: string
 *                   example: "Spring Championship 2026"
 *                 startDate:
 *                   type: string
 *                   format: date-time
 *                   example: "2026-03-15T09:00:00Z"
 *                 endDate:
 *                   type: string
 *                   format: date-time
 *                   example: "2026-03-20T18:00:00Z"
 *                 location:
 *                   type: string
 *                   example: "National Stadium"
 *                 status:
 *                   type: string
 *                   example: "upcoming"
 *                 createdBy:
 *                   type: integer
 *                   description: ID of the user who created this tournament
 *                   example: 1
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *                 contents:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       tournamentId:
 *                         type: integer
 *                       name:
 *                         type: string
 *                       type:
 *                         type: string
 *                         enum: [single, team, double]
 *                       maxEntries:
 *                         type: integer
 *                       maxSets:
 *                         type: integer
 *                       numberOfSingles:
 *                         type: integer
 *                       numberOfDoubles:
 *                         type: integer
 *                       racketCheck:
 *                         type: boolean
 *                       gender:
 *                         type: string
 *                         enum: [male, female, mixed]
 *                       isGroupStage:
 *                         type: boolean
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
 *         description: Unauthorized - User not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Unauthorized - User not authenticated"
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
 *     summary: Get all tournaments
 *     parameters:
 *       - $ref: '#/components/parameters/skipParam'
 *       - $ref: '#/components/parameters/limitParam'
 *     responses:
 *       200:
 *         description: List of tournaments
 */
router.post("/", authenticate, tournamentController.create.bind(tournamentController));
router.get("/", tournamentController.findAll.bind(tournamentController));

/**
 * @swagger
 * /tournaments/search:
 *   get:
 *     tags: [Tournaments]
 *     summary: Search tournaments with content filters and pagination
 *     description: Get all tournaments with their contents filtered by various criteria including user participation, age, ELO, gender, and other content properties
 *     parameters:
 *       - in: query
 *         name: skip
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of records to skip for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Maximum number of records to return
 *       - in: query
 *         name: userId
 *         schema:
 *           type: integer
 *         description: Filter tournaments where this user has entries
 *         example: 1
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
 *         description: Filter by minimum age requirement (content.minAge <= this value)
 *         example: 18
 *       - in: query
 *         name: maxAge
 *         schema:
 *           type: integer
 *         description: Filter by maximum age requirement (content.maxAge >= this value)
 *         example: 35
 *       - in: query
 *         name: minElo
 *         schema:
 *           type: integer
 *         description: Filter by minimum ELO requirement (content.minElo <= this value)
 *         example: 1000
 *       - in: query
 *         name: maxElo
 *         schema:
 *           type: integer
 *         description: Filter by maximum ELO requirement (content.maxElo >= this value)
 *         example: 2000
 *       - in: query
 *         name: gender
 *         schema:
 *           type: string
 *           enum: [male, female, mixed]
 *         description: Filter by gender category
 *         example: "male"
 *       - in: query
 *         name: racketCheck
 *         schema:
 *           type: boolean
 *         description: Filter by racket check requirement
 *         example: true
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
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       name:
 *                         type: string
 *                       status:
 *                         type: string
 *                         enum: [upcoming, ongoing, completed]
 *                       startDate:
 *                         type: string
 *                         format: date-time
 *                       endDate:
 *                         type: string
 *                         format: date-time
 *                       location:
 *                         type: string
 *                       createdBy:
 *                         type: integer
 *                       contents:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: integer
 *                             name:
 *                               type: string
 *                             type:
 *                               type: string
 *                               enum: [single, team, double]
 *                             maxEntries:
 *                               type: integer
 *                             maxSets:
 *                               type: integer
 *                             gender:
 *                               type: string
 *                               enum: [male, female, mixed]
 *                             racketCheck:
 *                               type: boolean
 *                             isGroupStage:
 *                               type: boolean
 *                 total:
 *                   type: integer
 *                   description: Total number of tournaments matching the filters
 *                   example: 42
 *       500:
 *         description: Internal server error
 */
router.get("/search", tournamentController.findAllWithContentsFiltered.bind(tournamentController));

/**
 * @swagger
 * /tournaments/{id}:
 *   get:
 *     tags: [Tournaments]
 *     summary: Get tournament by ID with contents
 *     description: Retrieve a tournament by ID including all tournament contents
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       200:
 *         description: Tournament details with contents
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 1
 *                 name:
 *                   type: string
 *                   example: "Spring Championship 2026"
 *                 status:
 *                   type: string
 *                   enum: [upcoming, ongoing, completed]
 *                   example: "upcoming"
 *                 startDate:
 *                   type: string
 *                   format: date-time
 *                 endDate:
 *                   type: string
 *                   format: date-time
 *                 location:
 *                   type: string
 *                   example: "National Stadium"
 *                 createdBy:
 *                   type: integer
 *                   example: 1
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *                 contents:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       tournamentId:
 *                         type: integer
 *                       name:
 *                         type: string
 *                       type:
 *                         type: string
 *                         enum: [single, team, double]
 *                       maxEntries:
 *                         type: integer
 *                       maxSets:
 *                         type: integer
 *                       numberOfSingles:
 *                         type: integer
 *                       numberOfDoubles:
 *                         type: integer
 *                       racketCheck:
 *                         type: boolean
 *                       gender:
 *                         type: string
 *                         enum: [male, female, mixed]
 *                       isGroupStage:
 *                         type: boolean
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   put:
 *     tags: [Tournaments]
 *     summary: Update tournament with contents
 *     description: Update a tournament and optionally its contents. If contents are provided, all existing contents will be replaced.
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
 *                 example: "Spring Championship 2026 - Updated"
 *               startDate:
 *                 type: string
 *                 format: date-time
 *                 example: "2026-03-15T09:00:00Z"
 *               endDate:
 *                 type: string
 *                 format: date-time
 *                 example: "2026-03-20T18:00:00Z"
 *               location:
 *                 type: string
 *                 example: "National Stadium"
 *               status:
 *                 type: string
 *                 enum: [upcoming, ongoing, completed]
 *                 example: "ongoing"
 *               contents:
 *                 type: array
 *                 description: Array of tournament contents (optional). If provided, replaces all existing contents.
 *                 items:
 *                   type: object
 *                   required:
 *                     - name
 *                     - type
 *                     - maxEntries
 *                     - maxSets
 *                     - racketCheck
 *                   properties:
 *                     name:
 *                       type: string
 *                       example: "Men's Singles"
 *                     type:
 *                       type: string
 *                       enum: [single, team, double]
 *                       example: "single"
 *                     maxEntries:
 *                       type: integer
 *                       example: 32
 *                     maxSets:
 *                       type: integer
 *                       example: 3
 *                     numberOfSingles:
 *                       type: integer
 *                       example: 3
 *                     numberOfDoubles:
 *                       type: integer
 *                       example: 2
 *                     racketCheck:
 *                       type: boolean
 *                       example: true
 *                     gender:
 *                       type: string
 *                       enum: [male, female, mixed]
 *                       example: "male"
 *                     isGroupStage:
 *                       type: boolean
 *                       example: false
 *     responses:
 *       200:
 *         description: Tournament updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Tournament'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       400:
 *         description: Bad request
 *   delete:
 *     tags: [Tournaments]
 *     summary: Delete tournament
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       204:
 *         $ref: '#/components/responses/NoContent'
 */
router.get("/:id", tournamentController.findById.bind(tournamentController));
router.put("/:id", authenticate, tournamentController.updateWithContents.bind(tournamentController));
router.delete("/:id", authenticate, tournamentController.delete.bind(tournamentController));

/**
 * @swagger
 * /tournaments/status/{status}:
 *   get:
 *     tags: [Tournaments]
 *     summary: Get tournaments by status
 *     parameters:
 *       - in: path
 *         name: status
 *         required: true
 *         schema:
 *           type: string
 *           enum: [upcoming, ongoing, completed]
 *       - $ref: '#/components/parameters/skipParam'
 *       - $ref: '#/components/parameters/limitParam'
 *     responses:
 *       200:
 *         description: List of tournaments with specified status
 */
router.get(
  "/status/:status",
  tournamentController.findByStatus.bind(tournamentController)
);

export default router;
