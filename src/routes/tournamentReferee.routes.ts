import { Router } from "express";
import tournamentRefereeController from "../controllers/tournamentReferee.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { checkPermission } from "../middlewares/permission.middleware";

const router = Router();

/**
 * @swagger
 * /tournament-referees/invite:
 *   post:
 *     tags: [Tournament Referees]
 *     summary: Send invitation to referee
 *     description: |
 *       Organizer invites a referee to join tournament with a specific role.
 *
 *       Key constraints:
 *       - Organizer cannot invite themselves
 *       - Referee must have required system role (referee or chief_referee)
 *       - Referee cannot be competing in the same tournament
 *       - Only 1 chief referee allowed per tournament
 *       - Each referee can only have 1 active invitation per tournament
 *       - Invitation expires after INVITATION_EXPIRY_HOURS (default: 48 hours)
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
 *               - refereeId
 *               - role
 *             properties:
 *               tournamentId:
 *                 type: integer
 *                 description: Tournament ID
 *                 example: 1
 *               refereeId:
 *                 type: integer
 *                 description: User ID of the referee to invite
 *                 example: 5
 *               role:
 *                 type: string
 *                 enum: [referee, chief]
 *                 description: Role for the referee in this tournament
 *                 example: referee
 *           examples:
 *             referee_invitation:
 *               summary: Invite regular referee
 *               value:
 *                 tournamentId: 1
 *                 refereeId: 5
 *                 role: referee
 *             chief_referee_invitation:
 *               summary: Invite as chief referee
 *               value:
 *                 tournamentId: 1
 *                 refereeId: 6
 *                 role: chief
 *     responses:
 *       201:
 *         description: Invitation sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RefereeInvitation'
 *             example:
 *               id: 1
 *               tournamentId: 1
 *               refereeId: 5
 *               invitedBy: 2
 *               role: referee
 *               status: pending
 *               expiresAt: "2024-06-29T12:00:00.000Z"
 *               respondedAt: null
 *               rejectionReason: null
 *               createdAt: "2024-06-27T12:00:00.000Z"
 *               updatedAt: "2024-06-27T12:00:00.000Z"
 *       400:
 *         $ref: '#/components/responses/BadRequest400'
 *       401:
 *         $ref: '#/components/responses/Unauthorized401'
 *       403:
 *         $ref: '#/components/responses/Forbidden403'
 *       404:
 *         $ref: '#/components/responses/NotFound404'
 *       409:
 *         $ref: '#/components/responses/Conflict409'
 *       500:
 *         $ref: '#/components/responses/InternalError500'
 */
router.post(
  "/invite",
  authenticate,
  checkPermission('tournaments:manage'),
  tournamentRefereeController.inviteReferee.bind(tournamentRefereeController)
);

/**
 * @swagger
 * /tournament-referees/accept-invitation:
 *   post:
 *     tags: [Tournament Referees]
 *     summary: Accept referee invitation
 *     description: |
 *       Referee accepts a pending invitation and becomes an active referee for the tournament.
 *
 *       Key behaviors:
 *       - Only pending invitations can be accepted
 *       - Expired invitations are automatically rejected
 *       - Accepts chief role only if no other chief referee exists
 *       - Creates active TournamentReferee record
 *       - Updates invitation status and respondedAt timestamp
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - invitationId
 *             properties:
 *               invitationId:
 *                 type: integer
 *                 description: ID of the invitation to accept
 *                 example: 1
 *           examples:
 *             basic:
 *               summary: Accept invitation
 *               value:
 *                 invitationId: 1
 *     responses:
 *       200:
 *         description: Invitation accepted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TournamentReferee'
 *             example:
 *               id: 1
 *               tournamentId: 1
 *               refereeId: 5
 *               role: referee
 *               createdAt: "2024-06-27T12:00:00.000Z"
 *               updatedAt: "2024-06-27T12:00:00.000Z"
 *       400:
 *         $ref: '#/components/responses/BadRequest400'
 *       401:
 *         $ref: '#/components/responses/Unauthorized401'
 *       404:
 *         $ref: '#/components/responses/NotFound404'
 *       409:
 *         $ref: '#/components/responses/Conflict409'
 *       500:
 *         $ref: '#/components/responses/InternalError500'
 */
router.post(
  "/accept-invitation",
  authenticate,
  tournamentRefereeController.acceptInvitation.bind(tournamentRefereeController)
);

/**
 * @swagger
 * /tournament-referees/reject-invitation:
 *   post:
 *     tags: [Tournament Referees]
 *     summary: Reject referee invitation
 *     description: |
 *       Referee rejects a pending invitation with optional reason.
 *
 *       Key behaviors:
 *       - Only pending invitations can be rejected
 *       - Expired invitations cannot be manually rejected
 *       - Rejection reason is optional (max 255 characters)
 *       - Updates invitation status and respondedAt timestamp
 *       - Rejected invitations cannot be re-sent (must be cancelled first if organizer wants to reinvite)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - invitationId
 *             properties:
 *               invitationId:
 *                 type: integer
 *                 description: ID of the invitation to reject
 *                 example: 1
 *               rejectionReason:
 *                 type: string
 *                 maxLength: 255
 *                 description: Optional reason for rejection
 *                 example: "Not available at that time"
 *           examples:
 *             with_reason:
 *               summary: Reject with reason
 *               value:
 *                 invitationId: 1
 *                 rejectionReason: "Scheduling conflict with another tournament"
 *             without_reason:
 *               summary: Reject without reason
 *               value:
 *                 invitationId: 1
 *     responses:
 *       200:
 *         description: Invitation rejected successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RefereeInvitation'
 *             example:
 *               id: 1
 *               tournamentId: 1
 *               refereeId: 5
 *               invitedBy: 2
 *               role: referee
 *               status: rejected
 *               expiresAt: "2024-06-29T12:00:00.000Z"
 *               respondedAt: "2024-06-27T12:30:00.000Z"
 *               rejectionReason: "Not available at that time"
 *               createdAt: "2024-06-27T12:00:00.000Z"
 *               updatedAt: "2024-06-27T12:30:00.000Z"
 *       400:
 *         $ref: '#/components/responses/BadRequest400'
 *       401:
 *         $ref: '#/components/responses/Unauthorized401'
 *       404:
 *         $ref: '#/components/responses/NotFound404'
 *       500:
 *         $ref: '#/components/responses/InternalError500'
 */
router.post(
  "/reject-invitation",
  authenticate,
  tournamentRefereeController.rejectInvitation.bind(tournamentRefereeController)
);

/**
 * @swagger
 * /tournament-referees/cancel-invitation:
 *   post:
 *     tags: [Tournament Referees]
 *     summary: Cancel pending invitation
 *     description: |
 *       Organizer cancels a pending invitation before referee responds.
 *
 *       Key behaviors:
 *       - Only pending invitations can be cancelled
 *       - Only tournament organizer can cancel
 *       - Updates invitation status and respondedAt timestamp
 *       - After cancellation, organizer can send a new invitation to same referee
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - invitationId
 *             properties:
 *               invitationId:
 *                 type: integer
 *                 description: ID of the invitation to cancel
 *                 example: 1
 *           examples:
 *             basic:
 *               summary: Cancel pending invitation
 *               value:
 *                 invitationId: 1
 *     responses:
 *       200:
 *         description: Invitation cancelled successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RefereeInvitation'
 *             example:
 *               id: 1
 *               tournamentId: 1
 *               refereeId: 5
 *               invitedBy: 2
 *               role: referee
 *               status: cancelled
 *               expiresAt: "2024-06-29T12:00:00.000Z"
 *               respondedAt: "2024-06-27T13:00:00.000Z"
 *               rejectionReason: null
 *               createdAt: "2024-06-27T12:00:00.000Z"
 *               updatedAt: "2024-06-27T13:00:00.000Z"
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
  "/cancel-invitation",
  authenticate,
  checkPermission('tournaments:manage'),
  tournamentRefereeController.cancelInvitation.bind(tournamentRefereeController)
);

/**
 * @swagger
 * /tournament-referees/remove:
 *   post:
 *     tags: [Tournament Referees]
 *     summary: Remove referee from tournament
 *     description: |
 *       Organizer removes an active referee from tournament.
 *
 *       Key behaviors:
 *       - Only organizer can remove referees
 *       - Removes from active referees (TournamentReferee record)
 *       - Does not affect past invitations or rejections
 *       - Returns no content on success (204)
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
 *               - refereeId
 *             properties:
 *               tournamentId:
 *                 type: integer
 *                 description: Tournament ID
 *                 example: 1
 *               refereeId:
 *                 type: integer
 *                 description: Referee user ID to remove
 *                 example: 5
 *           examples:
 *             basic:
 *               summary: Remove referee
 *               value:
 *                 tournamentId: 1
 *                 refereeId: 5
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
router.post(
  "/remove",
  authenticate,
  checkPermission('tournaments:manage'),
  tournamentRefereeController.removeReferee.bind(tournamentRefereeController)
);

/**
 * @swagger
 * /tournament-referees/update-role:
 *   post:
 *     tags: [Tournament Referees]
 *     summary: Update referee role
 *     description: |
 *       Organizer changes a referee's role in tournament (PATCH route but uses POST).
 *
 *       Key constraints:
 *       - Only organizer can update role
 *       - Referee must exist in tournament
 *       - When promoting to chief: must have chief_referee system role and no other chief exists
 *       - Returns updated TournamentReferee record
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
 *               - refereeId
 *               - newRole
 *             properties:
 *               tournamentId:
 *                 type: integer
 *                 description: Tournament ID
 *                 example: 1
 *               refereeId:
 *                 type: integer
 *                 description: Referee user ID to update
 *                 example: 5
 *               newRole:
 *                 type: string
 *                 enum: [referee, chief]
 *                 description: New role for the referee
 *                 example: chief
 *           examples:
 *             promote_to_chief:
 *               summary: Promote to chief referee
 *               value:
 *                 tournamentId: 1
 *                 refereeId: 5
 *                 newRole: chief
 *             demote_to_referee:
 *               summary: Demote to regular referee
 *               value:
 *                 tournamentId: 1
 *                 refereeId: 5
 *                 newRole: referee
 *     responses:
 *       200:
 *         description: Role updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TournamentReferee'
 *             example:
 *               id: 1
 *               tournamentId: 1
 *               refereeId: 5
 *               role: chief
 *               createdAt: "2024-06-27T12:00:00.000Z"
 *               updatedAt: "2024-06-27T13:15:00.000Z"
 *       400:
 *         $ref: '#/components/responses/BadRequest400'
 *       401:
 *         $ref: '#/components/responses/Unauthorized401'
 *       403:
 *         $ref: '#/components/responses/Forbidden403'
 *       404:
 *         $ref: '#/components/responses/NotFound404'
 *       409:
 *         $ref: '#/components/responses/Conflict409'
 *       500:
 *         $ref: '#/components/responses/InternalError500'
 */
router.post(
  "/update-role",
  authenticate,
  checkPermission('tournaments:manage'),
  tournamentRefereeController.updateRole.bind(tournamentRefereeController)
);

/**
 * @swagger
 * /tournament-referees/tournament/{tournamentId}:
 *   get:
 *     tags: [Tournament Referees]
 *     summary: Get referees by tournament
 *     description: |
 *       Retrieve all active referees assigned to a tournament with optional role filtering.
 *
 *       Features:
 *       - Supports pagination with page/limit query parameters
 *       - Optional role filter (referee or chief)
 *       - Returns referees with basic user information
 *       - Public endpoint (no authentication required)
 *     parameters:
 *       - in: path
 *         name: tournamentId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Tournament ID
 *       - $ref: '#/components/parameters/pageParam'
 *       - $ref: '#/components/parameters/limitParam'
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [referee, chief]
 *         description: Filter referees by role
 *         example: chief
 *     responses:
 *       200:
 *         description: List of referees with pagination
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TournamentRefereesResponse'
 *             example:
 *               referees:
 *                 - id: 1
 *                   tournamentId: 1
 *                   refereeId: 5
 *                   role: chief
 *                   createdAt: "2024-06-27T12:00:00.000Z"
 *                   updatedAt: "2024-06-27T12:00:00.000Z"
 *                   referee:
 *                     id: 5
 *                     firstName: John
 *                     lastName: Doe
 *                     email: john@example.com
 *                 - id: 2
 *                   tournamentId: 1
 *                   refereeId: 6
 *                   role: referee
 *                   createdAt: "2024-06-27T12:05:00.000Z"
 *                   updatedAt: "2024-06-27T12:05:00.000Z"
 *                   referee:
 *                     id: 6
 *                     firstName: Jane
 *                     lastName: Smith
 *                     email: jane@example.com
 *               pagination:
 *                 total: 2
 *                 page: 1
 *                 limit: 10
 *                 totalPages: 1
 *                 hasNextPage: false
 *                 hasPrevPage: false
 *       400:
 *         $ref: '#/components/responses/BadRequest400'
 *       404:
 *         $ref: '#/components/responses/NotFound404'
 *       500:
 *         $ref: '#/components/responses/InternalError500'
 */
router.get(
  "/tournament/:tournamentId",
  tournamentRefereeController.getRefereesByTournament.bind(tournamentRefereeController)
);

/**
 * @swagger
 * /tournament-referees/tournament/{tournamentId}/invitations:
 *   get:
 *     tags: [Tournament Referees]
 *     summary: Get invitations by tournament
 *     description: |
 *       Retrieve all referee invitations for a tournament (organizer only).
 *
 *       Features:
 *       - Organizer can track pending, accepted, rejected, cancelled, and expired invitations
 *       - Supports pagination with page/limit query parameters
 *       - Optional status filter
 *       - Returns invitation details with invited referee information
 *       - Only accessible to tournament organizer
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tournamentId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Tournament ID
 *       - $ref: '#/components/parameters/pageParam'
 *       - $ref: '#/components/parameters/limitParam'
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, accepted, rejected, cancelled, expired]
 *         description: Filter invitations by status
 *         example: pending
 *     responses:
 *       200:
 *         description: List of invitations with pagination
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RefereeInvitationsResponse'
 *             example:
 *               invitations:
 *                 - id: 1
 *                   tournamentId: 1
 *                   refereeId: 5
 *                   invitedBy: 2
 *                   role: chief
 *                   status: pending
 *                   expiresAt: "2024-06-29T12:00:00.000Z"
 *                   respondedAt: null
 *                   rejectionReason: null
 *                   createdAt: "2024-06-27T12:00:00.000Z"
 *                   updatedAt: "2024-06-27T12:00:00.000Z"
 *                   referee:
 *                     id: 5
 *                     firstName: John
 *                     lastName: Doe
 *                     email: john@example.com
 *               pagination:
 *                 total: 1
 *                 page: 1
 *                 limit: 10
 *                 totalPages: 1
 *                 hasNextPage: false
 *                 hasPrevPage: false
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
router.get(
  "/tournament/:tournamentId/invitations",
  authenticate,
  checkPermission('tournaments:manage'),
  tournamentRefereeController.getInvitationsByTournament.bind(tournamentRefereeController)
);

/**
 * @swagger
 * /tournament-referees/tournament/{tournamentId}/available:
 *   get:
 *     tags: [Tournament Referees]
 *     summary: Get referees available for invitation
 *     description: |
 *       Retrieve referee users who can be invited to this tournament.
 *
 *       A referee is available only when:
 *       - Has referee or chief_referee system role
 *       - Is not organizer of this tournament
 *       - Is not competing in this tournament
 *       - Is not already assigned/invited to this tournament
 *       - Is not assigned to another non-cancelled tournament whose schedule overlaps this tournament
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tournamentId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Tournament ID
 *       - $ref: '#/components/parameters/pageParam'
 *       - $ref: '#/components/parameters/limitParam'
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [referee, chief]
 *         description: Filter by tournament referee role. chief maps to users with chief_referee system role.
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by firstName, lastName, or email
 *     responses:
 *       200:
 *         description: Available referees with pagination
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 referees:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
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
router.get(
  "/tournament/:tournamentId/available",
  authenticate,
  checkPermission('tournaments:manage'),
  tournamentRefereeController.getAvailableReferees.bind(tournamentRefereeController)
);

/**
 * @swagger
 * /tournament-referees/my-invitations:
 *   get:
 *     tags: [Tournament Referees]
 *     summary: Get my invitations
 *     description: |
 *       Retrieve all referee invitations sent to the current user across all tournaments.
 *
 *       Features:
 *       - Personal invitation list for authenticated referee
 *       - Includes complete tournament and organizer information
 *       - Supports filtering by invitation status (pending, accepted, rejected, cancelled, expired)
 *       - Supports pagination and sorting (createdAt, status, role, etc.)
 *       - Shows expiration details and rejection reasons (if applicable)
 *       - Useful for referee to track pending invitations and respond to them
 *
 *       Status meanings:
 *       - pending: Awaiting referee response, expires after INVITATION_EXPIRY_HOURS (48 hours)
 *       - accepted: Referee accepted and is now active in tournament
 *       - rejected: Referee rejected the invitation
 *       - cancelled: Organizer cancelled the pending invitation
 *       - expired: Invitation expired without response
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, accepted, rejected, cancelled, expired]
 *         description: Filter by invitation status
 *       - $ref: '#/components/parameters/pageParam'
 *       - $ref: '#/components/parameters/limitParam'
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, status, role, expiresAt]
 *           default: createdAt
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *           default: DESC
 *         description: Sort order (ascending or descending)
 *     responses:
 *       200:
 *         description: List of referee invitations with tournament and organizer details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MyRefereeInvitationsResponse'
 *             example:
 *               invitations:
 *                 - id: 1
 *                   tournamentId: 1
 *                   refereeId: 5
 *                   invitedBy: 2
 *                   role: referee
 *                   status: pending
 *                   expiresAt: "2024-06-29T12:00:00.000Z"
 *                   respondedAt: null
 *                   rejectionReason: null
 *                   tournament:
 *                     id: 1
 *                     name: "Summer Championship 2024"
 *                     location: "New York"
 *                     tier: 2
 *                     status: registration_open
 *                     createdBy: 2
 *                     scheduleConfig:
 *                       startDate: "2024-07-10T00:00:00.000Z"
 *                       endDate: "2024-07-12T00:00:00.000Z"
 *                       registrationStartDate: "2024-06-01T00:00:00.000Z"
 *                       registrationEndDate: "2024-06-20T00:00:00.000Z"
 *                       bracketGenerationDate: "2024-06-21T00:00:00.000Z"
 *                   inviter:
 *                     id: 2
 *                     firstName: Admin
 *                     lastName: User
 *                     email: admin@example.com
 *                   createdAt: "2024-06-27T12:00:00.000Z"
 *                   updatedAt: "2024-06-27T12:00:00.000Z"
 *               pagination:
 *                 total: 1
 *                 page: 1
 *                 limit: 10
 *                 totalPages: 1
 *                 hasNextPage: false
 *                 hasPrevPage: false
 *       401:
 *         $ref: '#/components/responses/Unauthorized401'
 *       500:
 *         $ref: '#/components/responses/InternalError500'
 */
router.get(
  "/my-invitations",
  authenticate,
  tournamentRefereeController.getMyInvitations.bind(tournamentRefereeController)
);

export default router;
