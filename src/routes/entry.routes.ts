import { Router } from "express";
import entryController from "../controllers/entry.controller";
import { authenticate } from "../middlewares/auth.middleware";

const router = Router();

/**
 * @swagger
 * /entries:
 *   post:
 *     tags: [Entries]
 *     summary: Create a new entry
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Entry created successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *   get:
 *     tags: [Entries]
 *     summary: Get all entries
 *     parameters:
 *       - $ref: '#/components/parameters/skipParam'
 *       - $ref: '#/components/parameters/limitParam'
 *     responses:
 *       200:
 *         description: List of entries
 */
router.post("/", entryController.create.bind(entryController));
router.get("/", entryController.findAll.bind(entryController));

/**
 * @swagger
 * /entries/register:
 *   post:
 *     tags: [Entries]
 *     summary: Register entry for team (team_manager only)
 *     description: Team manager can register their team for a tournament content with selected members
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - contentId
 *               - teamId
 *               - memberIds
 *             properties:
 *               contentId:
 *                 type: integer
 *                 description: ID of the tournament content to register for
 *                 example: 1
 *               teamId:
 *                 type: integer
 *                 description: ID of the team to register
 *                 example: 1
 *               memberIds:
 *                 type: array
 *                 description: Array of user IDs (team members) to participate in this entry
 *                 items:
 *                   type: integer
 *                 example: [5, 10, 15]
 *           examples:
 *             singlePlayer:
 *               summary: Register for singles content
 *               value:
 *                 contentId: 1
 *                 teamId: 1
 *                 memberIds: [5]
 *             multiplePlayers:
 *               summary: Register for team content
 *               value:
 *                 contentId: 2
 *                 teamId: 1
 *                 memberIds: [5, 10, 15, 20]
 *     responses:
 *       201:
 *         description: Entry registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 1
 *                 contentId:
 *                   type: integer
 *                   example: 1
 *                 teamId:
 *                   type: integer
 *                   example: 1
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *                 members:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       entryId:
 *                         type: integer
 *                         example: 1
 *                       userId:
 *                         type: integer
 *                         example: 5
 *                       eloAtEntry:
 *                         type: integer
 *                         example: 1650
 *                 team:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     name:
 *                       type: string
 *                 content:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     name:
 *                       type: string
 *       400:
 *         description: Bad request - Invalid data or user is not team manager
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Only team manager can register entry for the team"
 *                 error:
 *                   type: object
 *       401:
 *         description: Unauthorized - User not authenticated
 */
router.post("/register", authenticate, entryController.registerEntry.bind(entryController));

/**
 * @swagger
 * /entries/{id}:
 *   get:
 *     tags: [Entries]
 *     summary: Get entry by ID
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       200:
 *         description: Entry details
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   put:
 *     tags: [Entries]
 *     summary: Update entry
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       200:
 *         description: Entry updated
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   delete:
 *     tags: [Entries]
 *     summary: Delete entry
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       204:
 *         $ref: '#/components/responses/NoContent'
 */
router.get("/:id", entryController.findById.bind(entryController));
router.put("/:id", entryController.update.bind(entryController));
router.delete("/:id", entryController.delete.bind(entryController));

/**
 * @swagger
 * /entries/content/{contentId}:
 *   get:
 *     tags: [Entries]
 *     summary: Get entries by content ID
 *     parameters:
 *       - in: path
 *         name: contentId
 *         required: true
 *         schema:
 *           type: integer
 *       - $ref: '#/components/parameters/skipParam'
 *       - $ref: '#/components/parameters/limitParam'
 *     responses:
 *       200:
 *         description: List of entries for content
 */
router.get(
  "/content/:contentId",
  entryController.findByContentId.bind(entryController)
);

export default router;
