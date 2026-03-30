import { Request, Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import tournamentRefereeService from "../services/tournamentReferee.service";

export class TournamentRefereeController {
  // ── 1. Organizer sends invitation ───────────────────────────────────────

  async inviteReferee(req: AuthRequest, res: Response): Promise<void> {
    try {
      const organizerId = (req as AuthRequest).userId!;
      const { tournamentId, refereeId, role } = req.body;

      if (!tournamentId || !refereeId || !role) {
        res.status(400).json({
          message: "Missing required fields: tournamentId, refereeId, role"
        });
        return;
      }

      const invitation = await tournamentRefereeService.inviteReferee(
        organizerId,
        tournamentId,
        refereeId,
        role
      );
      res.status(201).json(invitation);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Error sending invitation" });
    }
  }

  // ── 2. Referee accepts invitation ───────────────────────────────────────

  async acceptInvitation(req: AuthRequest, res: Response): Promise<void> {
    try {
      const refereeId = (req as AuthRequest).userId!;
      const { invitationId } = req.body;

      if (!invitationId) {
        res.status(400).json({ message: "Missing required field: invitationId" });
        return;
      }

      const referee = await tournamentRefereeService.acceptInvitation(
        refereeId,
        invitationId
      );
      res.status(200).json(referee);
    } catch (error: any) {
      const statusCode = error.message.includes("not found") ? 404 : 400;
      res.status(statusCode).json({ message: error.message || "Error accepting invitation" });
    }
  }

  // ── 3. Referee rejects invitation ───────────────────────────────────────

  async rejectInvitation(req: AuthRequest, res: Response): Promise<void> {
    try {
      const refereeId = (req as AuthRequest).userId!;
      const { invitationId, rejectionReason } = req.body;

      if (!invitationId) {
        res.status(400).json({ message: "Missing required field: invitationId" });
        return;
      }

      const invitation = await tournamentRefereeService.rejectInvitation(
        refereeId,
        invitationId,
        rejectionReason
      );
      res.status(200).json(invitation);
    } catch (error: any) {
      const statusCode = error.message.includes("not found") ? 404 : 400;
      res.status(statusCode).json({ message: error.message || "Error rejecting invitation" });
    }
  }

  // ── 4. Organizer cancels invitation ────────────────────────────────────

  async cancelInvitation(req: AuthRequest, res: Response): Promise<void> {
    try {
      const organizerId = (req as AuthRequest).userId!;
      const { invitationId } = req.body;

      if (!invitationId) {
        res.status(400).json({ message: "Missing required field: invitationId" });
        return;
      }

      const invitation = await tournamentRefereeService.cancelInvitation(
        organizerId,
        invitationId
      );
      res.status(200).json(invitation);
    } catch (error: any) {
      const statusCode = error.message.includes("not found") ? 404 : 400;
      res.status(statusCode).json({ message: error.message || "Error cancelling invitation" });
    }
  }

  // ── 5. Organizer removes referee from tournament ────────────────────────

  async removeReferee(req: AuthRequest, res: Response): Promise<void> {
    try {
      const organizerId = (req as AuthRequest).userId!;
      const { tournamentId, refereeId } = req.body;

      if (!tournamentId || !refereeId) {
        res.status(400).json({
          message: "Missing required fields: tournamentId, refereeId"
        });
        return;
      }

      await tournamentRefereeService.removeReferee(
        organizerId,
        tournamentId,
        refereeId
      );
      res.status(204).send();
    } catch (error: any) {
      const statusCode = error.message.includes("not found") ? 404 : 400;
      res.status(statusCode).json({ message: error.message || "Error removing referee" });
    }
  }

  // ── 6. Organizer updates referee role ──────────────────────────────────

  async updateRole(req: AuthRequest, res: Response): Promise<void> {
    try {
      const organizerId = (req as AuthRequest).userId!;
      const { tournamentId, refereeId, newRole } = req.body;

      if (!tournamentId || !refereeId || !newRole) {
        res.status(400).json({
          message: "Missing required fields: tournamentId, refereeId, newRole"
        });
        return;
      }

      const referee = await tournamentRefereeService.updateRole(
        organizerId,
        tournamentId,
        refereeId,
        newRole
      );
      res.status(200).json(referee);
    } catch (error: any) {
      const statusCode = error.message.includes("not found") ? 404 : 400;
      res.status(statusCode).json({ message: error.message || "Error updating role" });
    }
  }

  // ── 7. Get referees by tournament ──────────────────────────────────────

  async getRefereesByTournament(req: Request, res: Response): Promise<void> {
    try {
      const { tournamentId } = req.params;
      const role = req.query.role as string | undefined;

      const referees = await tournamentRefereeService.getRefereesByTournament(
        Number(tournamentId),
        role as any
      );
      res.status(200).json(referees);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Error fetching referees" });
    }
  }

  // ── 8. Get invitations by tournament (organizer only) ───────────────────

  async getInvitationsByTournament(req: AuthRequest, res: Response): Promise<void> {
    try {
      const organizerId = (req as AuthRequest).userId!;
      const { tournamentId } = req.params;
      const status = req.query.status as string | undefined;

      const invitations = await tournamentRefereeService.getInvitationsByTournament(
        organizerId,
        Number(tournamentId),
        status as any
      );
      res.status(200).json(invitations);
    } catch (error: any) {
      const statusCode = error.message.includes("not found") ? 404 : 400;
      res.status(statusCode).json({ message: error.message || "Error fetching invitations" });
    }
  }
}

export default new TournamentRefereeController();
