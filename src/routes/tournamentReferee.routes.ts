import { Router } from "express";
import tournamentRefereeController from "../controllers/tournamentReferee.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { checkPermission } from "../middlewares/permission.middleware";
import { PERMISSIONS } from "../constants/permissions";

const router = Router();

/**
 * @swagger
 * /tournament-referees/invite:
 *   post:
 *     tags: [Tournament Referees]
 *     summary: Send invitation to referee
 *     description: Organizer invites a referee to join tournament
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
 *                 example: 1
 *               refereeId:
 *                 type: integer
 *                 example: 5
 *               role:
 *                 type: string
 *                 enum: [referee, chief]
 *                 example: referee
 *     responses:
 *       201:
 *         description: Invitation sent successfully
 *       400:
 *         description: Bad request
 */
router.post(
  "/invite",
  authenticate,
  checkPermission(PERMISSIONS.TOURNAMENTS_MANAGE),
  tournamentRefereeController.inviteReferee.bind(tournamentRefereeController)
);

/**
 * @swagger
 * /tournament-referees/accept-invitation:
 *   post:
 *     tags: [Tournament Referees]
 *     summary: Accept referee invitation
 *     description: Referee accepts an invitation
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
 *                 example: 1
 *     responses:
 *       200:
 *         description: Invitation accepted
 *       400:
 *         description: Bad request
 *       404:
 *         description: Invitation not found
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
 *     description: Referee rejects an invitation
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
 *                 example: 1
 *               rejectionReason:
 *                 type: string
 *                 example: "Not available at that time"
 *     responses:
 *       200:
 *         description: Invitation rejected
 *       400:
 *         description: Bad request
 *       404:
 *         description: Invitation not found
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
 *     description: Organizer cancels a pending invitation
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
 *                 example: 1
 *     responses:
 *       200:
 *         description: Invitation cancelled
 *       400:
 *         description: Bad request
 *       404:
 *         description: Invitation not found
 */
router.post(
  "/cancel-invitation",
  authenticate,
  checkPermission(PERMISSIONS.TOURNAMENTS_MANAGE),
  tournamentRefereeController.cancelInvitation.bind(tournamentRefereeController)
);

/**
 * @swagger
 * /tournament-referees/remove:
 *   post:
 *     tags: [Tournament Referees]
 *     summary: Remove referee from tournament
 *     description: Organizer removes a referee from tournament
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
 *                 example: 1
 *               refereeId:
 *                 type: integer
 *                 example: 5
 *     responses:
 *       204:
 *         description: Referee removed
 *       404:
 *         description: Not found
 *       400:
 *         description: Bad request
 */
router.post(
  "/remove",
  authenticate,
  checkPermission(PERMISSIONS.TOURNAMENTS_MANAGE),
  tournamentRefereeController.removeReferee.bind(tournamentRefereeController)
);

/**
 * @swagger
 * /tournament-referees/update-role:
 *   post:
 *     tags: [Tournament Referees]
 *     summary: Update referee role
 *     description: Organizer updates a referee's role in tournament
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
 *                 example: 1
 *               refereeId:
 *                 type: integer
 *                 example: 5
 *               newRole:
 *                 type: string
 *                 enum: [referee, chief]
 *                 example: chief
 *     responses:
 *       200:
 *         description: Role updated
 *       400:
 *         description: Bad request
 *       404:
 *         description: Not found
 */
router.post(
  "/update-role",
  authenticate,
  checkPermission(PERMISSIONS.TOURNAMENTS_MANAGE),
  tournamentRefereeController.updateRole.bind(tournamentRefereeController)
);

/**
 * @swagger
 * /tournament-referees/tournament/{tournamentId}:
 *   get:
 *     tags: [Tournament Referees]
 *     summary: Get referees by tournament
 *     description: Get all referees assigned to a tournament
 *     parameters:
 *       - in: path
 *         name: tournamentId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Tournament ID
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [referee, chief]
 *         description: Filter by role
 *     responses:
 *       200:
 *         description: List of referees
 *       400:
 *         description: Bad request
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
 *     description: Get all referee invitations for a tournament (organizer only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tournamentId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Tournament ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, accepted, rejected, cancelled, expired]
 *         description: Filter by invitation status
 *     responses:
 *       200:
 *         description: List of invitations
 *       400:
 *         description: Bad request
 *       404:
 *         description: Tournament not found
 */
router.get(
  "/tournament/:tournamentId/invitations",
  authenticate,
  checkPermission(PERMISSIONS.TOURNAMENTS_MANAGE),
  tournamentRefereeController.getInvitationsByTournament.bind(tournamentRefereeController)
);

export default router;
