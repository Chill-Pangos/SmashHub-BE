import { Request, Response, NextFunction } from "express";
import entryMemberService from "../services/entryMember.service";
import { AuthRequest } from "../middlewares/auth.middleware";
import { UnauthorizedError } from "../utils/errors.helper";
import { parsePagination, parsePositiveInt } from "../utils/request.helper";

export class EntryMemberController {
  private getAuthenticatedUserId(req: AuthRequest, next: NextFunction): number | null {
    if (req.userId == null) {
      next(new UnauthorizedError("Unauthorized"));
      return null;
    }
    return req.userId;
  }

  // ─── CRUD gốc ──────────────────────────────────────────────────────────────

  async findAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { offset, limit } = parsePagination(req.query);
      const result = await entryMemberService.findAll(offset, limit);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async findById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parsePositiveInt(req.params.id, "id");
      const member = await entryMemberService.findById(id);
      if (!member) {
        res.status(404).json({ message: "Entry member not found" });
        return;
      }
      res.status(200).json(member);
    } catch (error) {
      next(error);
    }
  }

  async findByEntryId(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const entryId = parsePositiveInt(req.params.entryId, "entryId");
      const { offset, limit } = parsePagination(req.query);
      const result = await entryMemberService.findByEntryId(entryId, offset, limit);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async findByUserId(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = parsePositiveInt(req.params.userId, "userId");
      const { offset, limit } = parsePagination(req.query);
      const result = await entryMemberService.findByUserId(userId, offset, limit);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parsePositiveInt(req.params.id, "id");
      const result = await entryMemberService.update(id, req.body);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parsePositiveInt(req.params.id, "id");
      await entryMemberService.delete(id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  // ─── Business logic ────────────────────────────────────────────────────────

  /**
   * Captain mời thành viên vào đội (tạo invitation, chờ invitee confirm)
   * POST /entries/:entryId/members/invite
   */
  async inviteMember(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const captainId = this.getAuthenticatedUserId(req, next);
      if (captainId == null) return;
      const entryId = parsePositiveInt(req.params.entryId, "entryId");
      const { inviteeId } = req.body;
      const invitation = await entryMemberService.inviteMember(
        captainId,
        entryId,
        parsePositiveInt(inviteeId, "inviteeId"),
      );
      res.status(201).json(invitation);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Invitee chấp nhận lời mời
   * POST /entries/:entryId/members/invitations/:invitationId/accept
   */
  async acceptInvitation(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = this.getAuthenticatedUserId(req, next);
      if (userId == null) return;
      const invitationId = parsePositiveInt(req.params.invitationId, "invitationId");
      const member = await entryMemberService.acceptInvitation(userId, invitationId);
      res.status(201).json(member);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Invitee từ chối lời mời
   * POST /entries/:entryId/members/invitations/:invitationId/reject
   */
  async rejectInvitation(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = this.getAuthenticatedUserId(req, next);
      if (userId == null) return;
      const invitationId = parsePositiveInt(req.params.invitationId, "invitationId");
      await entryMemberService.rejectInvitation(userId, invitationId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  /**
   * Xóa thành viên khỏi đội (captain only)
   * DELETE /entries/:entryId/members/:memberId
   */
  async removeMember(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const captainId = this.getAuthenticatedUserId(req, next);
      if (captainId == null) return;
      const entryId = parsePositiveInt(req.params.entryId, "entryId");
      const memberId = parsePositiveInt(req.params.memberId, "memberId");
      await entryMemberService.removeMember(captainId, entryId, memberId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  /**
   * Lấy danh sách thành viên của entry (có pagination)
   * GET /entries/:entryId/members
   */
  async getAllMembers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const entryId = parsePositiveInt(req.params.entryId, "entryId");
      const { offset, limit } = parsePagination(req.query);
      const result = await entryMemberService.getAllMembers(entryId, { offset, limit });
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Thành viên tự rời đội
   * DELETE /entries/:entryId/members/me
   */
  async leaveEntry(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = this.getAuthenticatedUserId(req, next);
      if (userId == null) return;
      const entryId = parsePositiveInt(req.params.entryId, "entryId");
      await entryMemberService.leaveEntry(userId, entryId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

export default new EntryMemberController();
