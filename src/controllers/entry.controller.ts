import { Request, Response, NextFunction } from "express";
import entryService from "../services/entry.service";
import { AuthRequest } from "../middlewares/auth.middleware";
import { BadRequestError, UnauthorizedError } from "../utils/errors.helper";
import { parsePagination, parsePositiveInt } from "../utils/request.helper";

export class EntryController {
  private getAuthenticatedUserId(req: AuthRequest, next: NextFunction): number | null {
    if (req.userId == null) {
      next(new UnauthorizedError("Unauthorized"));
      return null;
    }
    return req.userId;
  }

  async register(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = this.getAuthenticatedUserId(req, next);
      if (userId == null) return;
      const { categoryId, action, targetEntryId, name } = req.body;
      const result = await entryService.register(
        userId,
        parsePositiveInt(categoryId, "categoryId"),
        action,
        targetEntryId === undefined ? undefined : parsePositiveInt(targetEntryId, "targetEntryId"),
        name,
      );
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  async findByCategoryId(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const categoryId = parsePositiveInt(req.params.categoryId, "categoryId");
      const { offset, limit } = parsePagination(req.query);
      const isFull = req.query.isFull ? req.query.isFull === "true" : undefined;
      const isAcceptingMembers = req.query.isAcceptingMembers
        ? req.query.isAcceptingMembers === "true"
        : undefined;
      const captainName =
        typeof req.query.captainName === "string" ? req.query.captainName : undefined;

      const options: {
        offset: number;
        limit: number;
        isFull?: boolean;
        isAcceptingMembers?: boolean;
        captainName?: string;
      } = { offset, limit };

      if (isFull !== undefined) options.isFull = isFull;
      if (isAcceptingMembers !== undefined) options.isAcceptingMembers = isAcceptingMembers;
      if (captainName !== undefined) options.captainName = captainName;

      const result = await entryService.findByCategoryId(categoryId, options);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async searchByName(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const name = typeof req.query.name === "string" ? req.query.name.trim() : "";
      const { offset, limit } = parsePagination(req.query);
      const result = await entryService.searchByName(name, { offset, limit });
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async respondToJoinRequest(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const captainId = this.getAuthenticatedUserId(req, next);
      if (captainId == null) return;
      const joinRequestId = parsePositiveInt(req.params.joinRequestId, "joinRequestId");
      const { action, rejectionReason } = req.body;
      const result = await entryService.respondToJoinRequest(
        captainId,
        joinRequestId,
        action,
        rejectionReason,
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getJoinRequests(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const captainId = this.getAuthenticatedUserId(req, next);
      if (captainId == null) return;
      const entryId = parsePositiveInt(req.params.entryId, "entryId");
      const { offset, limit } = parsePagination(req.query);
      const status =
        typeof req.query.status === "string"
          ? (req.query.status as "pending" | "approved" | "rejected")
          : undefined;
      if (status && !["pending", "approved", "rejected"].includes(status)) {
        throw new BadRequestError("status must be pending, approved, or rejected");
      }
      const result = await entryService.getJoinRequests(captainId, entryId, status, {
        offset,
        limit,
      });
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const entryId = parsePositiveInt(req.params.entryId, "entryId");
      const entry = await entryService.getById(entryId);
      res.status(200).json(entry);
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const captainId = this.getAuthenticatedUserId(req, next);
      if (captainId == null) return;
      const entryId = parsePositiveInt(req.params.entryId, "entryId");
      const entry = await entryService.update(captainId, entryId, req.body);
      res.status(200).json(entry);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const captainId = this.getAuthenticatedUserId(req, next);
      if (captainId == null) return;
      const entryId = parsePositiveInt(req.params.entryId, "entryId");
      await entryService.delete(captainId, entryId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  async transferCaptaincy(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const currentCaptainId = this.getAuthenticatedUserId(req, next);
      if (currentCaptainId == null) return;
      const entryId = parsePositiveInt(req.params.entryId, "entryId");
      const { newCaptainId } = req.body;
      const entry = await entryService.transferCaptaincy(
        currentCaptainId,
        entryId,
        parsePositiveInt(newCaptainId, "newCaptainId"),
      );
      res.status(200).json(entry);
    } catch (error) {
      next(error);
    }
  }

  async setRequiredMemberCount(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const captainId = this.getAuthenticatedUserId(req, next);
      if (captainId == null) return;
      const entryId = parsePositiveInt(req.params.entryId, "entryId");
      const { count } = req.body;
      const entry = await entryService.setRequiredMemberCount(
        captainId,
        entryId,
        parsePositiveInt(count, "count"),
      );
      res.status(200).json(entry);
    } catch (error) {
      next(error);
    }
  }

  async confirmLineup(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const captainId = this.getAuthenticatedUserId(req, next);
      if (captainId == null) return;
      const entryId = parsePositiveInt(req.params.entryId, "entryId");
      const entry = await entryService.confirmLineup(captainId, entryId);
      res.status(200).json(entry);
    } catch (error) {
      next(error);
    }
  }

  async getEligibleEntries(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const categoryId = parsePositiveInt(req.params.categoryId, "categoryId");
      const { offset, limit } = parsePagination(req.query);
      const result = await entryService.getEligibleEntries(categoryId, { offset, limit });
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async disqualifyIneligibleEntries(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const organizerId = this.getAuthenticatedUserId(req, next);
      if (organizerId == null) return;
      const categoryId = parsePositiveInt(req.params.categoryId, "categoryId");
      const result = await entryService.disqualifyIneligibleEntries(organizerId, categoryId);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getUserEntries(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = this.getAuthenticatedUserId(req, next);
      if (userId == null) return;
      const { offset, limit } = parsePagination(req.query);
      const result = await entryService.getUserEntries(userId, { offset, limit });
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getUserRoleInEntry(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = this.getAuthenticatedUserId(req, next);
      if (userId == null) return;
      const entryId = parsePositiveInt(req.params.entryId, "entryId");
      const role = await entryService.getUserRoleInEntry(entryId, userId);
      res.status(200).json({ entryId, userId, role });
    } catch (error) {
      next(error);
    }
  }
}

export default new EntryController();
