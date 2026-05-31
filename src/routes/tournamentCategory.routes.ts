import { Router } from "express";
import TournamentCategoryController from "../controllers/tournamentCategory.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { checkPermission } from "../middlewares/permission.middleware";

const router = Router();

/**
 * @swagger
 * /tournament-categories:
 *   post:
 *     tags: [Tournament Categories]
 *     summary: Create a new tournament category
 *     description: |
 *       Creates a new tournament category with match type and eligibility constraints.
 *
 *       **Validation Rules:**
 *       - `gender = 'mixed'` is only valid when `type = 'double'`
 *       - `maxEntries` must be greater than 0
 *       - `maxSets` must be between 1 and 5
 *       - If `type = 'team'`, both `numberOfSingles` and `numberOfDoubles` must be specified
 *       - Age range: `minAge` should be less than or equal to `maxAge` (if both provided)
 *       - ELO range: `minElo` should be less than or equal to `maxElo` (if both provided)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tournamentId
 *               - name
 *               - type
 *               - maxEntries
 *               - maxSets
 *             properties:
 *               tournamentId:
 *                 type: integer
 *                 description: The tournament this category belongs to
 *                 example: 1
 *               name:
 *                 type: string
 *                 maxLength: 100
 *                 description: Display name for the category
 *                 example: "Men's Singles"
 *               type:
 *                 type: string
 *                 enum: [single, double, team]
 *                 description: Match format type - single, double, or team competition
 *                 example: "single"
 *               maxEntries:
 *                 type: integer
 *                 minimum: 1
 *                 description: Maximum number of entries allowed in this category
 *                 example: 32
 *               maxSets:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Maximum number of sets per match (best-of format)
 *                 example: 3
 *               numberOfSingles:
 *                 type: integer
 *                 minimum: 1
 *                 description: For team type - number of singles matches. Required for team type
 *                 example: 3
 *               numberOfDoubles:
 *                 type: integer
 *                 minimum: 0
 *                 description: For team type - number of doubles matches. Required for team type
 *                 example: 2
 *               minAge:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 100
 *                 description: Minimum age requirement for participants (optional)
 *                 example: 16
 *               maxAge:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 100
 *                 description: Maximum age requirement for participants (optional)
 *                 example: 35
 *               minElo:
 *                 type: integer
 *                 minimum: 0
 *                 description: Minimum ELO rating requirement (optional)
 *                 example: 1000
 *               maxElo:
 *                 type: integer
 *                 minimum: 0
 *                 description: Maximum ELO rating cap for participants (optional)
 *                 example: 2200
 *               gender:
 *                 type: string
 *                 enum: [male, female, mixed]
 *                 description: Gender category. 'mixed' only valid for double type
 *                 example: "male"
 *               isGroupStage:
 *                 type: boolean
 *                 description: Whether this category uses group stage format
 *                 example: false
 *           examples:
 *             single:
 *               value:
 *                 tournamentId: 1
 *                 name: "Men's Singles"
 *                 type: "single"
 *                 maxEntries: 32
 *                 maxSets: 3
 *                 gender: "male"
 *                 minAge: 16
 *                 maxAge: 45
 *                 isGroupStage: false
 *             double:
 *               value:
 *                 tournamentId: 1
 *                 name: "Mixed Doubles"
 *                 type: "double"
 *                 maxEntries: 16
 *                 maxSets: 2
 *                 gender: "mixed"
 *                 minElo: 1200
 *                 isGroupStage: true
 *             team:
 *               value:
 *                 tournamentId: 1
 *                 name: "Team Competition"
 *                 type: "team"
 *                 maxEntries: 8
 *                 maxSets: 3
 *                 numberOfSingles: 3
 *                 numberOfDoubles: 1
 *                 gender: "male"
 *     responses:
 *       201:
 *         description: Tournament category created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TournamentCategory'
 *             example:
 *               id: 1
 *               tournamentId: 1
 *               name: "Men's Singles"
 *               type: "single"
 *               maxEntries: 32
 *               maxSets: 3
 *               numberOfSingles: null
 *               numberOfDoubles: null
 *               minAge: 16
 *               maxAge: 45
 *               minElo: null
 *               maxElo: null
 *               gender: "male"
 *               isGroupStage: false
 *               createdAt: "2024-05-27T10:30:00.000Z"
 *               updatedAt: "2024-05-27T10:30:00.000Z"
 *       400:
 *         $ref: '#/components/responses/BadRequest400'
 *       401:
 *         $ref: '#/components/responses/Unauthorized401'
 *       403:
 *         $ref: '#/components/responses/Forbidden403'
 *       500:
 *         $ref: '#/components/responses/InternalError500'
 *   get:
 *     tags: [Tournament Categories]
 *     summary: List all tournament categories
 *     description: |
 *       Retrieves all tournament categories with pagination support.
 *       Categories are returned as an array, sorted by creation date.
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *           minimum: 1
 *         description: Page number for pagination (1-indexed)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           minimum: 1
 *           maximum: 100
 *         description: Maximum records per page
 *     responses:
 *       200:
 *         description: List of tournament categories retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/TournamentCategory'
 *             example:
 *               - id: 1
 *                 tournamentId: 1
 *                 name: "Men's Singles"
 *                 type: "single"
 *                 maxEntries: 32
 *                 maxSets: 3
 *                 numberOfSingles: null
 *                 numberOfDoubles: null
 *                 minAge: 16
 *                 maxAge: 45
 *                 minElo: null
 *                 maxElo: null
 *                 gender: "male"
 *                 isGroupStage: false
 *                 createdAt: "2024-05-27T10:30:00.000Z"
 *                 updatedAt: "2024-05-27T10:30:00.000Z"
 *               - id: 2
 *                 tournamentId: 1
 *                 name: "Women's Doubles"
 *                 type: "double"
 *                 maxEntries: 16
 *                 maxSets: 2
 *                 numberOfSingles: null
 *                 numberOfDoubles: null
 *                 minAge: null
 *                 maxAge: null
 *                 minElo: 1000
 *                 maxElo: 2000
 *                 gender: "female"
 *                 isGroupStage: true
 *                 createdAt: "2024-05-27T11:00:00.000Z"
 *                 updatedAt: "2024-05-27T11:00:00.000Z"
 *       500:
 *         $ref: '#/components/responses/InternalError500'
 */
router.post(
  "/",
  authenticate,
  checkPermission('content:create'),
  TournamentCategoryController.create.bind(TournamentCategoryController)
);
router.get(
  "/",
  TournamentCategoryController.findAll.bind(TournamentCategoryController)
);

/**
 * @swagger
 * /tournament-categories/{id}:
 *   get:
 *     tags: [Tournament Categories]
 *     summary: Get tournament category by ID
 *     description: Retrieves a specific tournament category with all its configuration details
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: The ID of the tournament category
 *     responses:
 *       200:
 *         description: Tournament category retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TournamentCategory'
 *             example:
 *               id: 1
 *               tournamentId: 1
 *               name: "Men's Singles"
 *               type: "single"
 *               maxEntries: 32
 *               maxSets: 3
 *               numberOfSingles: null
 *               numberOfDoubles: null
 *               minAge: 16
 *               maxAge: 45
 *               minElo: null
 *               maxElo: null
 *               gender: "male"
 *               isGroupStage: false
 *               createdAt: "2024-05-27T10:30:00.000Z"
 *               updatedAt: "2024-05-27T10:30:00.000Z"
 *       404:
 *         $ref: '#/components/responses/NotFound404'
 *       500:
 *         $ref: '#/components/responses/InternalError500'
 *   patch:
 *     tags: [Tournament Categories]
 *     summary: Update tournament category
 *     description: |
 *       Updates one or more fields of an existing tournament category.
 *
 *       **Validation Rules:**
 *       - If updating `gender` or `type`, the combination must be valid (mixed gender only for double type)
 *       - All other field constraints from creation apply here as well
 *       - Partial updates are supported - only include fields to update
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: The ID of the tournament category to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 100
 *                 description: Display name for the category
 *                 example: "Women's Singles"
 *               type:
 *                 type: string
 *                 enum: [single, double, team]
 *                 description: Match format type
 *                 example: "single"
 *               maxEntries:
 *                 type: integer
 *                 minimum: 1
 *                 description: Maximum number of entries allowed
 *                 example: 32
 *               maxSets:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Maximum number of sets per match
 *                 example: 3
 *               numberOfSingles:
 *                 type: integer
 *                 minimum: 1
 *                 description: For team type - number of singles matches
 *                 example: 3
 *               numberOfDoubles:
 *                 type: integer
 *                 minimum: 0
 *                 description: For team type - number of doubles matches
 *                 example: 2
 *               minAge:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 100
 *                 description: Minimum age requirement
 *                 example: 18
 *               maxAge:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 100
 *                 description: Maximum age requirement
 *                 example: 40
 *               minElo:
 *                 type: integer
 *                 minimum: 0
 *                 description: Minimum ELO rating requirement
 *                 example: 1100
 *               maxElo:
 *                 type: integer
 *                 minimum: 0
 *                 description: Maximum ELO rating cap
 *                 example: 2100
 *               gender:
 *                 type: string
 *                 enum: [male, female, mixed]
 *                 description: Gender category. 'mixed' only valid for double type
 *                 example: "female"
 *               isGroupStage:
 *                 type: boolean
 *                 description: Whether this category uses group stage format
 *                 example: true
 *           examples:
 *             partial:
 *               value:
 *                 name: "Senior Men's Singles"
 *                 maxEntries: 24
 *             fullUpdate:
 *               value:
 *                 name: "Women's Doubles"
 *                 type: "double"
 *                 maxEntries: 16
 *                 maxSets: 2
 *                 gender: "female"
 *                 isGroupStage: true
 *     responses:
 *       200:
 *         description: Tournament category updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TournamentCategory'
 *             example:
 *               id: 1
 *               tournamentId: 1
 *               name: "Women's Singles"
 *               type: "single"
 *               maxEntries: 32
 *               maxSets: 3
 *               numberOfSingles: null
 *               numberOfDoubles: null
 *               minAge: 18
 *               maxAge: 40
 *               minElo: 1100
 *               maxElo: 2100
 *               gender: "female"
 *               isGroupStage: false
 *               createdAt: "2024-05-27T10:30:00.000Z"
 *               updatedAt: "2024-05-27T12:45:00.000Z"
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
 *   delete:
 *     tags: [Tournament Categories]
 *     summary: Delete tournament category
 *     description: |
 *       Permanently deletes a tournament category.
 *
 *       **Warning:** Deleting a category may affect associated entries and schedules.
 *       Ensure all related data is handled before deletion.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: The ID of the tournament category to delete
 *     responses:
 *       204:
 *         $ref: '#/components/responses/NoContent204'
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
  "/:id",
  TournamentCategoryController.findById.bind(TournamentCategoryController)
);
router.patch(
  "/:id",
  authenticate,
  checkPermission('content:update'),
  TournamentCategoryController.update.bind(TournamentCategoryController)
);
router.delete(
  "/:id",
  authenticate,
  checkPermission('content:delete'),
  TournamentCategoryController.delete.bind(TournamentCategoryController)
);

/**
 * @swagger
 * /tournament-categories/tournament/{tournamentId}:
 *   get:
 *     tags: [Tournament Categories]
 *     summary: Get categories by tournament ID
 *     description: |
 *       Retrieves all tournament categories for a specific tournament with pagination support.
 *       Useful for loading the complete category configuration when organizing a tournament.
 *     parameters:
 *       - in: path
 *         name: tournamentId
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: The ID of the tournament to retrieve categories for
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *           minimum: 1
 *         description: Page number for pagination (1-indexed)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           minimum: 1
 *           maximum: 100
 *         description: Maximum records per page
 *     responses:
 *       200:
 *         description: Tournament categories retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/TournamentCategory'
 *             example:
 *               - id: 1
 *                 tournamentId: 5
 *                 name: "Men's Singles"
 *                 type: "single"
 *                 maxEntries: 32
 *                 maxSets: 3
 *                 numberOfSingles: null
 *                 numberOfDoubles: null
 *                 minAge: 16
 *                 maxAge: null
 *                 minElo: null
 *                 maxElo: null
 *                 gender: "male"
 *                 isGroupStage: false
 *                 createdAt: "2024-05-27T10:30:00.000Z"
 *                 updatedAt: "2024-05-27T10:30:00.000Z"
 *               - id: 2
 *                 tournamentId: 5
 *                 name: "Women's Doubles"
 *                 type: "double"
 *                 maxEntries: 16
 *                 maxSets: 2
 *                 numberOfSingles: null
 *                 numberOfDoubles: null
 *                 minAge: 18
 *                 maxAge: 50
 *                 minElo: 1000
 *                 maxElo: 2200
 *                 gender: "female"
 *                 isGroupStage: true
 *                 createdAt: "2024-05-27T11:00:00.000Z"
 *                 updatedAt: "2024-05-27T11:00:00.000Z"
 *               - id: 3
 *                 tournamentId: 5
 *                 name: "Team Competition"
 *                 type: "team"
 *                 maxEntries: 8
 *                 maxSets: 3
 *                 numberOfSingles: 3
 *                 numberOfDoubles: 1
 *                 minAge: null
 *                 maxAge: null
 *                 minElo: 1200
 *                 maxElo: null
 *                 gender: "mixed"
 *                 isGroupStage: false
 *                 createdAt: "2024-05-27T11:15:00.000Z"
 *                 updatedAt: "2024-05-27T11:15:00.000Z"
 *       404:
 *         description: Tournament not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: "Tournament not found"
 *       500:
 *         $ref: '#/components/responses/InternalError500'
 */
router.get(
  "/tournament/:tournamentId",
  TournamentCategoryController.findByTournamentId.bind(
    TournamentCategoryController
  )
);

export default router;
