import { Router } from "express";
import entryController from "../controllers/entry.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { checkPermission } from "../middlewares/permission.middleware";
import { PERMISSIONS } from "../constants/permissions";

const router = Router();

/**
 * @swagger
 * /entries/register:
 *   post:
 *     tags: [Entries]
 *     summary: Register for tournament
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               categoryId:
 *                 type: integer
 *               action:
 *                 type: string
 *                 enum: [create_team, join_team]
 *               targetEntryId:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Registration successful
 */
router.post(
  "/register",
  authenticate,
  checkPermission(PERMISSIONS.ENTRIES_CREATE),
  entryController.register.bind(entryController)
);

/**
 * @swagger
 * /entries/category/{categoryId}:
 *   get:
 *     tags: [Entries]
 *     summary: Get entries by category with filters
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: integer
 *       - $ref: '#/components/parameters/skipParam'
 *       - $ref: '#/components/parameters/limitParam'
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
 *         description: List of entries
 */
router.get(
  "/category/:categoryId",
  entryController.findByCategoryId.bind(entryController)
);

/**
 * @swagger
 * /entries/{entryId}:
 *   get:
 *     tags: [Entries]
 *     summary: Get entry by ID
 *     parameters:
 *       - in: path
 *         name: entryId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Entry details
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   put:
 *     tags: [Entries]
 *     summary: Update entry (captain only)
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
 *     responses:
 *       200:
 *         description: Entry updated
 *   delete:
 *     tags: [Entries]
 *     summary: Delete entry (captain only)
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
 *         $ref: '#/components/responses/NoContent'
 */
router.get("/:entryId", entryController.getById.bind(entryController));
router.put(
  "/:entryId",
  authenticate,
  checkPermission(PERMISSIONS.ENTRIES_UPDATE),
  entryController.update.bind(entryController)
);
router.delete(
  "/:entryId",
  authenticate,
  checkPermission(PERMISSIONS.ENTRIES_DELETE),
  entryController.delete.bind(entryController)
);

/**
 * @swagger
 * /entries/{entryId}/add-member:
 *   post:
 *     tags: [Entries]
 *     summary: Add member to entry (captain only)
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
 *               newMemberId:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Member added
 */
router.post(
  "/:entryId/add-member",
  authenticate,
  checkPermission(PERMISSIONS.ENTRIES_UPDATE),
  entryController.addMember.bind(entryController)
);

/**
 * @swagger
 * /entries/{entryId}/remove-member:
 *   post:
 *     tags: [Entries]
 *     summary: Remove member from entry (captain only)
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
 *               memberId:
 *                 type: integer
 *     responses:
 *       204:
 *         description: Member removed
 */
router.post(
  "/:entryId/remove-member",
  authenticate,
  checkPermission(PERMISSIONS.ENTRIES_UPDATE),
  entryController.removeMember.bind(entryController)
);

/**
 * @swagger
 * /entries/{entryId}/members:
 *   get:
 *     tags: [Entries]
 *     summary: Get all members of entry
 *     parameters:
 *       - in: path
 *         name: entryId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of members
 */
router.get(
  "/:entryId/members",
  entryController.getAllMembers.bind(entryController)
);

/**
 * @swagger
 * /entries/{entryId}/leave:
 *   post:
 *     tags: [Entries]
 *     summary: Leave entry (member only)
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
 *         description: Left entry
 */
router.post(
  "/:entryId/leave",
  authenticate,
  entryController.leaveEntry.bind(entryController)
);

/**
 * @swagger
 * /entries/{entryId}/set-required-members:
 *   post:
 *     tags: [Entries]
 *     summary: Set required member count (captain only, team entries)
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
 *               count:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Required member count set
 */
router.post(
  "/:entryId/set-required-members",
  authenticate,
  checkPermission(PERMISSIONS.ENTRIES_UPDATE),
  entryController.setRequiredMemberCount.bind(entryController)
);

/**
 * @swagger
 * /entries/{entryId}/transfer-captaincy:
 *   post:
 *     tags: [Entries]
 *     summary: Transfer captaincy to another member
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
 *               newCaptainId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Captaincy transferred
 */
router.post(
  "/:entryId/transfer-captaincy",
  authenticate,
  checkPermission(PERMISSIONS.ENTRIES_UPDATE),
  entryController.transferCaptaincy.bind(entryController)
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected]
 *     responses:
 *       200:
 *         description: List of join requests
 */
router.get(
  "/:entryId/join-requests",
  authenticate,
  checkPermission(PERMISSIONS.ENTRIES_VIEW),
  entryController.getJoinRequests.bind(entryController)
);

/**
 * @swagger
 * /entries/join-requests/{joinRequestId}/respond:
 *   post:
 *     tags: [Entries]
 *     summary: Respond to join request (captain only)
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
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [approve, reject]
 *               rejectionReason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Join request responded
 */
router.post(
  "/join-requests/:joinRequestId/respond",
  authenticate,
  checkPermission(PERMISSIONS.ENTRIES_UPDATE),
  entryController.respondToJoinRequest.bind(entryController)
);

/**
 * @swagger
 * /entries/{entryId}/confirm-lineup:
 *   post:
 *     tags: [Entries]
 *     summary: Confirm lineup (captain only)
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
 *         description: Lineup confirmed
 */
router.post(
  "/:entryId/confirm-lineup",
  authenticate,
  checkPermission(PERMISSIONS.ENTRIES_UPDATE),
  entryController.confirmLineup.bind(entryController)
);

/**
 * @swagger
 * /entries/category/{categoryId}/eligible:
 *   get:
 *     tags: [Entries]
 *     summary: Get eligible entries for competition
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Eligible and ineligible entries
 */
router.get(
  "/category/:categoryId/eligible",
  entryController.getEligibleEntries.bind(entryController)
);

/**
 * @swagger
 * /entries/category/{categoryId}/disqualify:
 *   post:
 *     tags: [Entries]
 *     summary: Disqualify ineligible entries (organizer only)
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
 */
router.post(
  "/category/:categoryId/disqualify",
  authenticate,
  checkPermission(PERMISSIONS.ENTRIES_DELETE),
  entryController.disqualifyIneligibleEntries.bind(entryController)
);

/**
 * @swagger
 * /entries/me:
 *   get:
 *     tags: [Entries]
 *     summary: Get current user's entries with role (captain or member)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/skipParam'
 *       - $ref: '#/components/parameters/limitParam'
 *     responses:
 *       200:
 *         description: List of user's entries with role information
 */
router.get(
  "/me",
  authenticate,
  entryController.getUserEntries.bind(entryController)
);

/**
 * @swagger
 * /entries/{entryId}/my-role:
 *   get:
 *     tags: [Entries]
 *     summary: Get current user's role in a specific entry
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
 *         description: User's role (captain, member, or null)
 */
router.get(
  "/:entryId/my-role",
  authenticate,
  entryController.getUserRoleInEntry.bind(entryController)
);

export default router;
