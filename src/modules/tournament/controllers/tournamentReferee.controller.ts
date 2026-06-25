import { Request, Response, NextFunction } from "express";
import { AuthRequest } from "../../../middlewares/auth.middleware";
import tournamentRefereeService from "../services/tournamentReferee.service";
import { BadRequestError } from "../../../utils/errors.helper";
import { parseEnumQuery, parsePagination, parseSortQuery } from "../../../utils/request.helper";

const TOURNAMENT_REFEREE_ROLES = ["chief", "referee"] as const;
const AVAILABLE_REFEREE_ROLES = ["referee", "chief_referee"] as const;
const INVITATION_STATUSES = ["pending", "accepted", "rejected", "cancelled", "expired"] as const;
const INVITATION_SORT_FIELDS = ["createdAt", "status", "role", "expiresAt"] as const;
const SORT_ORDERS = ["ASC", "DESC"] as const;

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
      const role = parseEnumQuery(req.query.role, "role", TOURNAMENT_REFEREE_ROLES);
      const { offset, limit } = parsePagination(req.query);

      const result = await tournamentRefereeService.getRefereesByTournament(
        Number(tournamentId),
        role,
        { offset, limit }
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
      const status = parseEnumQuery(req.query.status, "status", INVITATION_STATUSES);
      const { offset, limit } = parsePagination(req.query);

      const result = await tournamentRefereeService.getInvitationsByTournament(
        organizerId,
        Number(tournamentId),
        status,
        { offset, limit }
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  // ── 9. Get available referees for tournament invite ─────────────────────

  async getAvailableReferees(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const organizerId = (req as AuthRequest).userId!;
      const { tournamentId } = req.params;
      const { offset, limit } = parsePagination(req.query);
      const role = parseEnumQuery(req.query.role, "role", AVAILABLE_REFEREE_ROLES);
      const search = req.query.search as string | undefined;
      const filters: {
        role?: "referee" | "chief_referee";
        search?: string;
        offset: number;
        limit: number;
      } = { offset, limit };
      if (role) filters.role = role;
      if (search) filters.search = search;

      const result = await tournamentRefereeService.getAvailableRefereesForTournament(
        organizerId,
        Number(tournamentId),
        filters
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  // ── 10. Get my invitations (referee) ──────────────────────────────────────

  async getMyInvitations(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const refereeId = (req as AuthRequest).userId!;
      const status = parseEnumQuery(req.query.status, "status", INVITATION_STATUSES);
      const { offset, limit } = parsePagination(req.query);
      const sortBy = parseSortQuery(req.query.sortBy, "sortBy", INVITATION_SORT_FIELDS, "createdAt");
      const sortOrder = parseSortQuery(req.query.sortOrder, "sortOrder", SORT_ORDERS, "DESC");

      const filters: {
        status?: (typeof INVITATION_STATUSES)[number];
        offset: number;
        limit: number;
        sortBy: (typeof INVITATION_SORT_FIELDS)[number];
        sortOrder: (typeof SORT_ORDERS)[number];
      } = {
        offset,
        limit,
        sortBy,
        sortOrder,
      };
      if (status) filters.status = status;

      const result = await tournamentRefereeService.getMyInvitations(refereeId, filters);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}

export default new TournamentRefereeController();
