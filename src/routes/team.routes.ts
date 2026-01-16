import { Router } from "express";
import teamController from "../controllers/team.controller";

const router = Router();

/**
 * @swagger
 * /teams:
 *   post:
 *     tags: [Teams]
 *     summary: Create a new team
 *     description: Create a team for a specific tournament
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tournamentId
 *               - name
 *             properties:
 *               tournamentId:
 *                 type: integer
 *                 description: ID of the tournament this team belongs to
 *                 example: 1
 *               name:
 *                 type: string
 *                 description: Name of the team
 *                 example: "Team Alpha"
 *               description:
 *                 type: string
 *                 description: Team description (optional)
 *                 example: "Elite championship team from District 1"
 *           examples:
 *             full:
 *               summary: Team with description
 *               value:
 *                 tournamentId: 1
 *                 name: "Team Alpha"
 *                 description: "Elite championship team from District 1"
 *             minimal:
 *               summary: Team without description
 *               value:
 *                 tournamentId: 1
 *                 name: "Team Beta"
 *     responses:
 *       201:
 *         description: Team created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 1
 *                 tournamentId:
 *                   type: integer
 *                   example: 1
 *                 name:
 *                   type: string
 *                   example: "Team Alpha"
 *                 description:
 *                   type: string
 *                   example: "Elite championship team from District 1"
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                   example: "2026-01-16T10:30:00Z"
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *                   example: "2026-01-16T10:30:00Z"
 *       400:
 *         description: Bad request - Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Error creating team"
 *                 error:
 *                   type: object
 *   get:
 *     tags: [Teams]
 *     summary: Get all teams
 *     description: Retrieve a paginated list of all teams
 *     parameters:
 *       - $ref: '#/components/parameters/skipParam'
 *       - $ref: '#/components/parameters/limitParam'
 *     responses:
 *       200:
 *         description: List of teams
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     example: 1
 *                   tournamentId:
 *                     type: integer
 *                     example: 1
 *                   name:
 *                     type: string
 *                     example: "Team Alpha"
 *                   description:
 *                     type: string
 *                     example: "Elite championship team"
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                   updatedAt:
 *                     type: string
 *                     format: date-time
 *                   members:
 *                     type: array
 *                     description: List of team members
 *                     items:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                           example: 1
 *                         teamId:
 *                           type: integer
 *                           example: 1
 *                         userId:
 *                           type: integer
 *                           example: 5
 *                         role:
 *                           type: string
 *                           example: "team_manager"
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *                         updatedAt:
 *                           type: string
 *                           format: date-time
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Error fetching teams"
 *                 error:
 *                   type: object
 */
router.post("/", teamController.create.bind(teamController));
router.get("/", teamController.findAll.bind(teamController));

/**
 * @swagger
 * /teams/with-members:
 *   post:
 *     tags: [Teams]
 *     summary: Create a new team with members
 *     description: Create a team for a tournament along with its members in a single transaction
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tournamentId
 *               - name
 *             properties:
 *               tournamentId:
 *                 type: integer
 *                 description: ID of the tournament this team belongs to
 *                 example: 1
 *               name:
 *                 type: string
 *                 description: Name of the team
 *                 example: "Team Alpha"
 *               description:
 *                 type: string
 *                 description: Team description (optional)
 *                 example: "Elite championship team from District 1"
 *               members:
 *                 type: array
 *                 description: Array of team members
 *                 items:
 *                   type: object
 *                   required:
 *                     - userId
 *                   properties:
 *                     userId:
 *                       type: integer
 *                       description: ID of the user joining the team
 *                       example: 5
 *                     role:
 *                       type: string
 *                       enum: [captain, member]
 *                       description: Role of the member in the team (default is 'member')
 *                       example: "captain"
 *           examples:
 *             fullTeam:
 *               summary: Team with multiple members
 *               value:
 *                 tournamentId: 1
 *                 name: "Team Alpha"
 *                 description: "Elite championship team from District 1"
 *                 members:
 *                   - userId: 5
 *                     role: "captain"
 *                   - userId: 10
 *                     role: "member"
 *                   - userId: 15
 *                     role: "member"
 *                   - userId: 20
 *                     role: "member"
 *             minimalTeam:
 *               summary: Team with captain only
 *               value:
 *                 tournamentId: 1
 *                 name: "Team Beta"
 *                 members:
 *                   - userId: 8
 *                     role: "captain"
 *     responses:
 *       201:
 *         description: Team created successfully with all members
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 1
 *                 tournamentId:
 *                   type: integer
 *                   example: 1
 *                 name:
 *                   type: string
 *                   example: "Team Alpha"
 *                 description:
 *                   type: string
 *                   example: "Elite championship team from District 1"
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                   example: "2026-01-16T10:30:00Z"
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *                   example: "2026-01-16T10:30:00Z"
 *                 members:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       teamId:
 *                         type: integer
 *                         example: 1
 *                       userId:
 *                         type: integer
 *                         example: 5
 *                       role:
 *                         type: string
 *                         enum: [captain, member]
 *                         example: "captain"
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *       400:
 *         description: Bad request - Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Error creating team with members"
 *                 error:
 *                   type: object
 */
router.post("/with-members", teamController.createWithMembers.bind(teamController));

/**
 * @swagger
 * /teams/{id}:
 *   get:
 *     tags: [Teams]
 *     summary: Get team by ID
 *     description: Retrieve detailed information about a specific team
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       200:
 *         description: Team details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 1
 *                 tournamentId:
 *                   type: integer
 *                   example: 1
 *                 name:
 *                   type: string
 *                   example: "Team Alpha"
 *                 description:
 *                   type: string
 *                   example: "Elite championship team from District 1"
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *                 members:
 *                   type: array
 *                   description: List of team members
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       teamId:
 *                         type: integer
 *                         example: 1
 *                       userId:
 *                         type: integer
 *                         example: 5
 *                       role:
 *                         type: string
 *                         example: "team_manager"
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *       404:
 *         description: Team not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Team not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Error fetching team"
 *                 error:
 *                   type: object
 *   put:
 *     tags: [Teams]
 *     summary: Update team
 *     description: Update team information
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
 *                 description: New team name
 *                 example: "Team Alpha Elite"
 *               description:
 *                 type: string
 *                 description: Updated team description
 *                 example: "Championship winning team 2026"
 *           examples:
 *             updateName:
 *               summary: Update only team name
 *               value:
 *                 name: "Team Alpha Elite"
 *             updateBoth:
 *               summary: Update name and description
 *               value:
 *                 name: "Team Alpha Elite"
 *                 description: "Championship winning team 2026"
 *     responses:
 *       200:
 *         description: Team updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 1
 *                 tournamentId:
 *                   type: integer
 *                   example: 1
 *                 name:
 *                   type: string
 *                   example: "Team Alpha Elite"
 *                 description:
 *                   type: string
 *                   example: "Championship winning team 2026"
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *       404:
 *         description: Team not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Team not found"
 *       400:
 *         description: Bad request - Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Error updating team"
 *                 error:
 *                   type: object
 *   delete:
 *     tags: [Teams]
 *     summary: Delete team
 *     description: Delete a team from the tournament
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       204:
 *         description: Team deleted successfully
 *       404:
 *         description: Team not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Team not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Error deleting team"
 *                 error:
 *                   type: object
 */
router.get("/:id", teamController.findById.bind(teamController));
router.put("/:id", teamController.update.bind(teamController));
router.delete("/:id", teamController.delete.bind(teamController));

/**
 * @swagger
 * /teams/tournament/{tournamentId}:
 *   get:
 *     tags: [Teams]
 *     summary: Get teams by tournament ID
 *     description: Retrieve all teams participating in a specific tournament
 *     parameters:
 *       - name: tournamentId
 *         in: path
 *         required: true
 *         description: ID of the tournament
 *         schema:
 *           type: integer
 *           example: 1
 *       - $ref: '#/components/parameters/skipParam'
 *       - $ref: '#/components/parameters/limitParam'
 *     responses:
 *       200:
 *         description: List of teams for the tournament
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     example: 1
 *                   tournamentId:
 *                     type: integer
 *                     example: 1
 *                   name:
 *                     type: string
 *                     example: "Team Alpha"
 *                   description:
 *                     type: string
 *                     example: "Elite championship team"
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                   updatedAt:
 *                     type: string
 *                     format: date-time
 *                   members:
 *                     type: array
 *                     description: List of team members
 *                     items:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                           example: 1
 *                         teamId:
 *                           type: integer
 *                           example: 1
 *                         userId:
 *                           type: integer
 *                           example: 5
 *                         role:
 *                           type: string
 *                           example: "team_manager"
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *                         updatedAt:
 *                           type: string
 *                           format: date-time
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Error fetching teams"
 *                 error:
 *                   type: object
 */
router.get("/tournament/:tournamentId", teamController.findByTournamentId.bind(teamController));

export default router;
