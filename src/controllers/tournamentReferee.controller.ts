import { Request, Response, NextFunction } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import tournamentRefereeService from "../services/tournamentReferee.service";
import { BadRequestError } from "../utils/errors";

export class TournamentRefereeController {
  // ── 1. Organizer sends invitation ───────────────────────────────────────

  async inviteReferee(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const organizerId = (req as AuthRequest).userId!;
      const { tournamentId, refereeId, role } = req.body;

      if (!tournamentId || !refereeId || !role) {
        throw new BadRequestError("Missing required fields: tournamentId, refereeId, role");
      }

      const invitation = await tournamentRefereeService.inviteReferee(
        organizerId,
        tournamentId,
        refereeId,
        role
      );
      res.status(201).json(invitation);
    } catch (error) {
      next(error);
    }
  }

  // ── 2. Referee accepts invitation ───────────────────────────────────────

  async acceptInvitation(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const refereeId = (req as AuthRequest).userId!;
      const { invitationId } = req.body;

      if (!invitationId) {
        throw new BadRequestError("Missing required field: invitationId");
      }

      const referee = await tournamentRefereeService.acceptInvitation(
        refereeId,
        invitationId
      );
      res.status(200).json(referee);
    } catch (error) {
      next(error);
    }
  }

  // ── 3. Referee rejects invitation ───────────────────────────────────────

  async rejectInvitation(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const refereeId = (req as AuthRequest).userId!;
      const { invitationId, rejectionReason } = req.body;

      if (!invitationId) {
        throw new BadRequestError("Missing required field: invitationId");
      }

      const invitation = await tournamentRefereeService.rejectInvitation(
        refereeId,
        invitationId,
        rejectionReason
      );
      res.status(200).json(invitation);
    } catch (error) {
      next(error);
    }
  }

  // ── 4. Organizer cancels invitation ────────────────────────────────────

  async cancelInvitation(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const organizerId = (req as AuthRequest).userId!;
      const { invitationId } = req.body;

      if (!invitationId) {
        throw new BadRequestError("Missing required field: invitationId");
      }

      const invitation = await tournamentRefereeService.cancelInvitation(
        organizerId,
        invitationId
      );
      res.status(200).json(invitation);
    } catch (error) {
      next(error);
    }
  }

  // ── 5. Organizer removes referee from tournament ────────────────────────

  async removeReferee(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const organizerId = (req as AuthRequest).userId!;
      const { tournamentId, refereeId } = req.body;

      if (!tournamentId || !refereeId) {
        throw new BadRequestError("Missing required fields: tournamentId, refereeId");
      }

      await tournamentRefereeService.removeReferee(
        organizerId,
        tournamentId,
        refereeId
      );
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  // ── 6. Organizer updates referee role ──────────────────────────────────

  async updateRole(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const organizerId = (req as AuthRequest).userId!;
      const { tournamentId, refereeId, newRole } = req.body;

      if (!tournamentId || !refereeId || !newRole) {
        throw new BadRequestError("Missing required fields: tournamentId, refereeId, newRole");
      }

      const referee = await tournamentRefereeService.updateRole(
        organizerId,
        tournamentId,
        refereeId,
        newRole
      );
      res.status(200).json(referee);
    } catch (error) {
      next(error);
    }
  }

  // ── 7. Get referees by tournament ──────────────────────────────────────

  async getRefereesByTournament(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tournamentId } = req.params;
      const role = req.query.role as string | undefined;
      const skip = Number(req.query.skip) || 0;
      const limit = Number(req.query.limit) || 10;

      const result = await tournamentRefereeService.getRefereesByTournament(
        Number(tournamentId),
        role as any,
        { skip, limit }
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  // ── 8. Get invitations by tournament (organizer only) ───────────────────

  async getInvitationsByTournament(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const organizerId = (req as AuthRequest).userId!;
      const { tournamentId } = req.params;
      const status = req.query.status as string | undefined;
      const skip = Number(req.query.skip) || 0;
      const limit = Number(req.query.limit) || 10;

      const result = await tournamentRefereeService.getInvitationsByTournament(
        organizerId,
        Number(tournamentId),
        status as any,
        { skip, limit }
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}

export default new TournamentRefereeController();
