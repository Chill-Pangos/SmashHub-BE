import { Request, Response, NextFunction } from "express";
import entryMemberService from "../services/entryMember.service";
import { AuthRequest } from "../middlewares/auth.middleware";
import { UnauthorizedError } from "../utils/errors.helper";

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
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;
      const offset = Math.max(page - 1, 0) * limit;
      const result = await entryMemberService.findAll(offset, limit);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async findById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
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
      const entryId = Number(req.params.entryId);
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;
      const offset = Math.max(page - 1, 0) * limit;
      const result = await entryMemberService.findByEntryId(entryId, offset, limit);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async findByUserId(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = Number(req.params.userId);
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;
      const offset = Math.max(page - 1, 0) * limit;
      const result = await entryMemberService.findByUserId(userId, offset, limit);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      const result = await entryMemberService.update(id, req.body);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      await entryMemberService.delete(id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  // ─── Business logic ────────────────────────────────────────────────────────

  /**
   * Thêm thành viên vào đội (captain only)
   * POST /entries/:entryId/members
   */
  async addMember(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const captainId = this.getAuthenticatedUserId(req, next);
      if (captainId == null) return;
      const entryId = Number(req.params.entryId);
      const { newMemberId } = req.body;
      const member = await entryMemberService.addMember(captainId, entryId, newMemberId);
      res.status(201).json(member);
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
      const entryId = Number(req.params.entryId);
      const memberId = Number(req.params.memberId);
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
      const entryId = Number(req.params.entryId);
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;
      const offset = Math.max(page - 1, 0) * limit;
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
      const entryId = Number(req.params.entryId);
      await entryMemberService.leaveEntry(userId, entryId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

export default new EntryMemberController();