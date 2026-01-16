import { Router } from "express";
import teamMemberController from "../controllers/teamMember.controller";

const router = Router();

/**
 * @swagger
 * /team-members:
 *   post:
 *     tags: [TeamMembers]
 *     summary: Create a new team member
 *     description: Add a member to a team with a specific role
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - teamId
 *               - userId
 *             properties:
 *               teamId:
 *                 type: integer
 *                 description: ID of the team
 *                 example: 1
 *               userId:
 *                 type: integer
 *                 description: ID of the user joining the team
 *                 example: 5
 *               role:
 *                 type: string
 *                 enum: [captain, member]
 *                 description: Role of the member in the team (default is 'member')
 *                 example: "member"
 *           examples:
 *             captain:
 *               summary: Add team captain
 *               value:
 *                 teamId: 1
 *                 userId: 5
 *                 role: "captain"
 *             member:
 *               summary: Add regular member
 *               value:
 *                 teamId: 1
 *                 userId: 10
 *                 role: "member"
 *             memberDefault:
 *               summary: Add member without specifying role
 *               value:
 *                 teamId: 1
 *                 userId: 15
 *     responses:
 *       201:
 *         description: Team member created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 1
 *                 teamId:
 *                   type: integer
 *                   example: 1
 *                 userId:
 *                   type: integer
 *                   example: 5
 *                 role:
 *                   type: string
 *                   enum: [captain, member]
 *                   example: "member"
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
 *                   example: "Error creating team member"
 *                 error:
 *                   type: object
 *   get:
 *     tags: [TeamMembers]
 *     summary: Get all team members
 *     description: Retrieve a paginated list of all team members
 *     parameters:
 *       - $ref: '#/components/parameters/skipParam'
 *       - $ref: '#/components/parameters/limitParam'
 *     responses:
 *       200:
 *         description: List of team members
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
 *                   teamId:
 *                     type: integer
 *                     example: 1
 *                   userId:
 *                     type: integer
 *                     example: 5
 *                   role:
 *                     type: string
 *                     example: "member"
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                   updatedAt:
 *                     type: string
 *                     format: date-time
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Error fetching team members"
 *                 error:
 *                   type: object
 */
router.post("/", teamMemberController.create.bind(teamMemberController));
router.get("/", teamMemberController.findAll.bind(teamMemberController));

/**
 * @swagger
 * /team-members/{id}:
 *   get:
 *     tags: [TeamMembers]
 *     summary: Get team member by ID
 *     description: Retrieve detailed information about a specific team member
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       200:
 *         description: Team member details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 1
 *                 teamId:
 *                   type: integer
 *                   example: 1
 *                 userId:
 *                   type: integer
 *                   example: 5
 *                 role:
 *                   type: string
 *                   enum: [captain, member]
 *                   example: "captain"
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *       404:
 *         description: Team member not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Team member not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Error fetching team member"
 *                 error:
 *                   type: object
 *   put:
 *     tags: [TeamMembers]
 *     summary: Update team member
 *     description: Update team member's role
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [captain, member]
 *                 description: New role for the team member
 *                 example: "captain"
 *           examples:
 *             promoteToCaptain:
 *               summary: Promote member to captain
 *               value:
 *                 role: "captain"
 *             demoteToMember:
 *               summary: Demote captain to member
 *               value:
 *                 role: "member"
 *     responses:
 *       200:
 *         description: Team member updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 1
 *                 teamId:
 *                   type: integer
 *                   example: 1
 *                 userId:
 *                   type: integer
 *                   example: 5
 *                 role:
 *                   type: string
 *                   example: "captain"
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *       404:
 *         description: Team member not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Team member not found"
 *       400:
 *         description: Bad request - Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Error updating team member"
 *                 error:
 *                   type: object
 *   delete:
 *     tags: [TeamMembers]
 *     summary: Delete team member
 *     description: Remove a member from the team
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       204:
 *         description: Team member deleted successfully
 *       404:
 *         description: Team member not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Team member not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Error deleting team member"
 *                 error:
 *                   type: object
 */
router.get("/:id", teamMemberController.findById.bind(teamMemberController));
router.put("/:id", teamMemberController.update.bind(teamMemberController));
router.delete("/:id", teamMemberController.delete.bind(teamMemberController));

/**
 * @swagger
 * /team-members/team/{teamId}:
 *   get:
 *     tags: [TeamMembers]
 *     summary: Get team members by team ID
 *     description: Retrieve all members of a specific team
 *     parameters:
 *       - name: teamId
 *         in: path
 *         required: true
 *         description: ID of the team
 *         schema:
 *           type: integer
 *           example: 1
 *       - $ref: '#/components/parameters/skipParam'
 *       - $ref: '#/components/parameters/limitParam'
 *     responses:
 *       200:
 *         description: List of team members for the team
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
 *                   teamId:
 *                     type: integer
 *                     example: 1
 *                   userId:
 *                     type: integer
 *                     example: 5
 *                   role:
 *                     type: string
 *                     example: "captain"
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                   updatedAt:
 *                     type: string
 *                     format: date-time
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Error fetching team members"
 *                 error:
 *                   type: object
 */
router.get("/team/:teamId", teamMemberController.findByTeamId.bind(teamMemberController));

/**
 * @swagger
 * /team-members/user/{userId}:
 *   get:
 *     tags: [TeamMembers]
 *     summary: Get team members by user ID
 *     description: Retrieve all teams that a specific user is a member of
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         description: ID of the user
 *         schema:
 *           type: integer
 *           example: 5
 *       - $ref: '#/components/parameters/skipParam'
 *       - $ref: '#/components/parameters/limitParam'
 *     responses:
 *       200:
 *         description: List of teams the user is member of
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
 *                   teamId:
 *                     type: integer
 *                     example: 1
 *                   userId:
 *                     type: integer
 *                     example: 5
 *                   role:
 *                     type: string
 *                     example: "member"
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                   updatedAt:
 *                     type: string
 *                     format: date-time
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Error fetching team members"
 *                 error:
 *                   type: object
 */
router.get("/user/:userId", teamMemberController.findByUserId.bind(teamMemberController));

export default router;
