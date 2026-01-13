import { Router } from "express";
import tournamentController from "../controllers/tournament.controller";
import { authenticate } from "../middlewares/auth.middleware";

const router = Router();

/**
 * @swagger
 * /tournaments:
 *   post:
 *     tags: [Tournaments]
 *     summary: Create a new tournament with contents and rules
 *     description: Create a tournament along with its tournament contents and content rules in a single transaction. Creator ID is automatically taken from authenticated user.
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
 *                 description: Array of tournament contents with their rules
 *                 items:
 *                   type: object
 *                   required:
 *                     - name
 *                     - formatTypeId
 *                     - contentRule
 *                   properties:
 *                     name:
 *                       type: string
 *                       description: Name of the tournament content (e.g., Men's Singles, Women's Doubles)
 *                       example: "Men's Singles"
 *                     formatTypeId:
 *                       type: integer
 *                       description: ID of the format type
 *                       example: 1
 *                     contentRule:
 *                       type: object
 *                       description: Rules for this tournament content
 *                       required:
 *                         - maxEntries
 *                         - maxSets
 *                         - racketCheck
 *                       properties:
 *                         matchFormatId:
 *                           type: integer
 *                           description: ID of the match format (optional)
 *                           example: 1
 *                         maxEntries:
 *                           type: integer
 *                           description: Maximum number of entries allowed
 *                           example: 32
 *                         maxSets:
 *                           type: integer
 *                           description: Maximum number of sets per match
 *                           example: 3
 *                         racketCheck:
 *                           type: boolean
 *                           description: Whether racket check is required
 *                           example: true
 *                         isGroupStage:
 *                           type: boolean
 *                           description: Whether this content has a group stage (optional)
 *                           example: false
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
 *                     formatTypeId: 1
 *                     contentRule:
 *                       matchFormatId: 1
 *                       maxEntries: 32
 *                       maxSets: 3
 *                       racketCheck: true
 *                       isGroupStage: false
 *                   - name: "Women's Singles"
 *                     formatTypeId: 1
 *                     contentRule:
 *                       maxEntries: 32
 *                       maxSets: 3
 *                       racketCheck: true
 *                       isGroupStage: false
 *             minimal:
 *               summary: Minimal tournament without contents
 *               value:
 *                 name: "Local Tournament 2026"
 *                 startDate: "2026-04-01T10:00:00Z"
 *                 location: "Community Center"
 *     responses:
 *       201:
 *         description: Tournament created successfully with all related contents and rules
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
 *                       formatTypeId:
 *                         type: integer
 *                       formatType:
 *                         type: object
 *                         description: Format type details
 *                         properties:
 *                           id:
 *                             type: integer
 *                           typeName:
 *                             type: string
 *                           description:
 *                             type: string
 *                       contentRule:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           contentId:
 *                             type: integer
 *                           matchFormatId:
 *                             type: integer
 *                           maxEntries:
 *                             type: integer
 *                           maxSets:
 *                             type: integer
 *                           racketCheck:
 *                             type: boolean
 *                           isGroupStage:
 *                             type: boolean
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
 * /tournaments/{id}:
 *   get:
 *     tags: [Tournaments]
 *     summary: Get tournament by ID
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       200:
 *         description: Tournament details
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   put:
 *     tags: [Tournaments]
 *     summary: Update tournament
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       200:
 *         description: Tournament updated
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   delete:
 *     tags: [Tournaments]
 *     summary: Delete tournament
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       204:
 *         $ref: '#/components/responses/NoContent'
 */
router.get("/:id", tournamentController.findById.bind(tournamentController));
router.put("/:id", tournamentController.update.bind(tournamentController));
router.delete("/:id", tournamentController.delete.bind(tournamentController));

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
