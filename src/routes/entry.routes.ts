import { Router } from "express";
import entryController from "../controllers/entry.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { checkPermission } from "../middlewares/permission.middleware";

const router = Router();

/**
 * @swagger
 * /entries/register:
 *   post:
 *     tags: [Entries]
 *     summary: Register for tournament (create team or join existing)
 *     description: |
 *       Register a user for a tournament category. For single entries, a team is automatically created.
 *       For double/team entries, user can either create a new team or request to join an existing team.
 *
 *       Validation rules:
 *       - User must pass category eligibility checks (gender, age, ELO)
 *       - User cannot already be registered in this category (as captain or member)
 *       - Registration window must be open for the tournament
 *       - When joining, target team must be accepting members and not full
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [categoryId, action]
 *             properties:
 *               categoryId:
 *                 type: integer
 *               action:
 *                 type: string
 *                 enum: [create_team, join_team]
 *               targetEntryId:
 *                 type: integer
 *           examples:
 *             createTeam:
 *               value:
 *                 categoryId: 1
 *                 action: create_team
 *             joinTeam:
 *               value:
 *                 categoryId: 1
 *                 action: join_team
 *                 targetEntryId: 5
 *     responses:
 *       201:
 *         description: Registration successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 entry:
 *                   $ref: '#/components/schemas/Entry'
 *                 message:
 *                   type: string
 *       400:
 *         $ref: '#/components/responses/BadRequest400'
 *       401:
 *         $ref: '#/components/responses/Unauthorized401'
 *       500:
 *         $ref: '#/components/responses/InternalError500'
 */
router.post(
  "/register",
  authenticate,
  checkPermission("entries:create"),
  entryController.register.bind(entryController),
);

/**
 * @swagger
 * /entries/category/{categoryId}:
 *   get:
 *     tags: [Entries]
 *     summary: Get entries by category with pagination and filters
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: isFull
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: isAcceptingMembers
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: captainName
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of entries with pagination
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 rows:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Entry'
 *                 count:
 *                   type: integer
 *       400:
 *         $ref: '#/components/responses/BadRequest400'
 *       404:
 *         $ref: '#/components/responses/NotFound404'
 *       500:
 *         $ref: '#/components/responses/InternalError500'
 */
router.get(
  "/category/:categoryId",
  entryController.findByCategoryId.bind(entryController),
);

/**
 * @swagger
 * /entries/category/{categoryId}/eligible:
 *   get:
 *     tags: [Entries]
 *     summary: Get eligible and ineligible entries for competition
 *     description: |
 *       Entry is ELIGIBLE when:
 *       1. Has sufficient members (currentMemberCount >= requiredMemberCount)
 *       2. Captain confirmed the lineup (isConfirmed = true)
 *       3. Entry fee paid (if applicable)
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Eligible and ineligible entries with pagination
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 eligible:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Entry'
 *                 ineligible:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       entry:
 *                         $ref: '#/components/schemas/Entry'
 *                       reasons:
 *                         type: array
 *                         items:
 *                           type: string
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       404:
 *         $ref: '#/components/responses/NotFound404'
 *       500:
 *         $ref: '#/components/responses/InternalError500'
 */
router.get(
  "/category/:categoryId/eligible",
  entryController.getEligibleEntries.bind(entryController),
);

/**
 * @swagger
 * /entries/category/{categoryId}/disqualify:
 *   post:
 *     tags: [Entries]
 *     summary: Disqualify ineligible entries (organizer only)
 *     description: |
 *       Mass remove all ineligible entries after registration closes.
 *       Only tournament organizer can perform. Operation is permanent.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Ineligible entries disqualified
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 deletedCount:
 *                   type: integer
 *                 deleted:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       entryId:
 *                         type: integer
 *                       reasons:
 *                         type: array
 *                         items:
 *                           type: string
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
  "/category/:categoryId/disqualify",
  authenticate,
  checkPermission("entries:delete"),
  entryController.disqualifyIneligibleEntries.bind(entryController),
);

/**
 * @swagger
 * /entries/join-requests/{joinRequestId}/respond:
 *   post:
 *     tags: [Entries]
 *     summary: Respond to join request (captain only)
 *     description: |
 *       On Approval: user added to team, member count incremented, team closes if full.
 *       On Rejection: request marked rejected with optional reason.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: joinRequestId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [action]
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [approve, reject]
 *               rejectionReason:
 *                 type: string
 *           examples:
 *             approve:
 *               value:
 *                 action: approve
 *             reject:
 *               value:
 *                 action: reject
 *                 rejectionReason: "Player is too strong for this category"
 *     responses:
 *       200:
 *         description: Join request responded
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
  "/join-requests/:joinRequestId/respond",
  authenticate,
  checkPermission("entries:update"),
  entryController.respondToJoinRequest.bind(entryController),
);

/**
 * @swagger
 * /entries/me:
 *   get:
 *     tags: [Entries]
 *     summary: Get current user's entries with role information
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: User's entries with role information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 rows:
 *                   type: array
 *                   items:
 *                     allOf:
 *                       - $ref: '#/components/schemas/Entry'
 *                       - type: object
 *                         properties:
 *                           userRole:
 *                             type: string
 *                             enum: [captain, member]
 *                 count:
 *                   type: integer
 *       401:
 *         $ref: '#/components/responses/Unauthorized401'
 *       500:
 *         $ref: '#/components/responses/InternalError500'
 */
router.get(
  "/me",
  authenticate,
  entryController.getUserEntries.bind(entryController),
);

/**
 * @swagger
 * /entries/{entryId}:
 *   get:
 *     tags: [Entries]
 *     summary: Get entry details by ID
 *     parameters:
 *       - in: path
 *         name: entryId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Entry details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Entry'
 *       404:
 *         $ref: '#/components/responses/NotFound404'
 *       500:
 *         $ref: '#/components/responses/InternalError500'
 *   patch:
 *     tags: [Entries]
 *     summary: Update entry information (captain only)
 *     description: |
 *       Updateable fields: name, requiredMemberCount, isAcceptingMembers.
 *       Cannot set requiredMemberCount < currentMemberCount or exceed maxMembersPerEntry.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: entryId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               requiredMemberCount:
 *                 type: integer
 *                 minimum: 1
 *               isAcceptingMembers:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Entry updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Entry'
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
 *     tags: [Entries]
 *     summary: Delete entry (captain only, during registration)
 *     description: Deletes all entry members and join requests. Cannot be undone.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: entryId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         $ref: '#/components/responses/NoContent204'
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
router.get("/:entryId", entryController.getById.bind(entryController));
router.put(
  "/:entryId",
  authenticate,
  checkPermission("entries:update"),
  entryController.update.bind(entryController),
);
router.delete(
  "/:entryId",
  authenticate,
  checkPermission("entries:delete"),
  entryController.delete.bind(entryController),
);

/**
 * @swagger
 * /entries/{entryId}/join-requests:
 *   get:
 *     tags: [Entries]
 *     summary: Get join requests for entry (captain only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: entryId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected]
 *     responses:
 *       200:
 *         description: List of join requests with pagination
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 joinRequests:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       entryId:
 *                         type: integer
 *                       userId:
 *                         type: integer
 *                       status:
 *                         type: string
 *                         enum: [pending, approved, rejected]
 *                       rejectionReason:
 *                         type: string
 *                         nullable: true
 *                       respondedAt:
 *                         type: string
 *                         format: date-time
 *                         nullable: true
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       user:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           firstName:
 *                             type: string
 *                           lastName:
 *                             type: string
 *                           email:
 *                             type: string
 *                           gender:
 *                             type: string
 *                           dob:
 *                             type: string
 *                             format: date
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
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
  "/:entryId/join-requests",
  authenticate,
  checkPermission("entries:view"),
  entryController.getJoinRequests.bind(entryController),
);

/**
 * @swagger
 * /entries/{entryId}/transfer-captaincy:
 *   post:
 *     tags: [Entries]
 *     summary: Transfer captaincy to another member
 *     description: New captain must be an existing member of the team.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: entryId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [newCaptainId]
 *             properties:
 *               newCaptainId:
 *                 type: integer
 *           examples:
 *             example1:
 *               value:
 *                 newCaptainId: 15
 *     responses:
 *       200:
 *         description: Captaincy transferred successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Entry'
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
  "/:entryId/transfer-captaincy",
  authenticate,
  checkPermission("entries:update"),
  entryController.transferCaptaincy.bind(entryController),
);

/**
 * @swagger
 * /entries/{entryId}/required-members:
 *   patch:
 *     tags: [Entries]
 *     summary: Set required member count (captain only, team entries)
 *     description: |
 *       count >= currentMemberCount and <= category.maxMembersPerEntry.
 *       Only applicable to "team" category entries.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: entryId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [count]
 *             properties:
 *               count:
 *                 type: integer
 *                 minimum: 1
 *           examples:
 *             example1:
 *               value:
 *                 count: 5
 *     responses:
 *       200:
 *         description: Required member count set successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Entry'
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
router.patch(
  "/:entryId/required-members",
  authenticate,
  checkPermission("entries:update"),
  entryController.setRequiredMemberCount.bind(entryController),
);

/**
 * @swagger
 * /entries/{entryId}/confirm-lineup:
 *   post:
 *     tags: [Entries]
 *     summary: Confirm lineup (captain only)
 *     description: |
 *       Locks in the team for competition. Requirements:
 *       currentMemberCount >= requiredMemberCount, during registration window, can only confirm once.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: entryId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lineup confirmed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Entry'
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
  "/:entryId/confirm-lineup",
  authenticate,
  checkPermission("entries:update"),
  entryController.confirmLineup.bind(entryController),
);

/**
 * @swagger
 * /entries/{entryId}/my-role:
 *   get:
 *     tags: [Entries]
 *     summary: Get current user's role in a specific entry
 *     description: Returns "captain", "member", or null if user is not part of this entry.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: entryId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: User's role in this entry
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 entryId:
 *                   type: integer
 *                 userId:
 *                   type: integer
 *                 role:
 *                   type: string
 *                   enum: [captain, member]
 *                   nullable: true
 *       401:
 *         $ref: '#/components/responses/Unauthorized401'
 *       404:
 *         $ref: '#/components/responses/NotFound404'
 *       500:
 *         $ref: '#/components/responses/InternalError500'
 */
router.get(
  "/:entryId/my-role",
  authenticate,
  entryController.getUserRoleInEntry.bind(entryController),
);

export default router;