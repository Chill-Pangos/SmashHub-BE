import { Request, Response, NextFunction } from "express";
import entryService from "../services/entry.service";
import { AuthRequest } from "../middlewares/auth.middleware";
import { UnauthorizedError } from "../utils/errors";

export class EntryController {
  private getAuthenticatedUserId(req: AuthRequest, next: NextFunction): number | null {
    if (req.userId == null) {
      next(new UnauthorizedError("Unauthorized"));
      return null;
    }

    return req.userId;
  }

  /**
   * 1. Register for tournament (single/double/team)
   */
  async register(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = this.getAuthenticatedUserId(req, next);
      if (userId == null) {
        return;
      }
      const { categoryId, action, targetEntryId } = req.body;

      const result = await entryService.register(
        userId,
        categoryId,
        action,
        targetEntryId
      );
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * 2. Add member to entry (captain only)
   */
  async addMember(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const captainId = this.getAuthenticatedUserId(req, next);
      if (captainId == null) {
        return;
      }
      const { entryId, newMemberId } = req.body;

      const member = await entryService.addMember(captainId, entryId, newMemberId);
      res.status(201).json(member);
    } catch (error) {
      next(error);
    }
  }

  /**
   * 3. Remove member from entry (captain only)
   */
  async removeMember(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const captainId = this.getAuthenticatedUserId(req, next);
      if (captainId == null) {
        return;
      }
      const { entryId, memberId } = req.body;

      await entryService.removeMember(captainId, entryId, memberId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  /**
   * 4. Get entries by category with filters
   */
  async findByCategoryId(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const categoryId = Number(req.params.categoryId);
      const skip = Number(req.query.skip) || 0;
      const limit = Number(req.query.limit) || 10;
      const isFull = req.query.isFull ? req.query.isFull === "true" : undefined;
      const isAcceptingMembers = req.query.isAcceptingMembers
        ? req.query.isAcceptingMembers === "true"
        : undefined;
      const captainName = req.query.captainName as string | undefined;

      const options: {
        skip: number;
        limit: number;
        isFull?: boolean;
        isAcceptingMembers?: boolean;
        captainName?: string;
      } = {
        skip,
        limit,
      };

      if (isFull !== undefined) {
        options.isFull = isFull;
      }

      if (isAcceptingMembers !== undefined) {
        options.isAcceptingMembers = isAcceptingMembers;
      }

      if (captainName !== undefined) {
        options.captainName = captainName;
      }

      const result = await entryService.findByCategoryId(categoryId, options);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * 5. Respond to join request (captain only)
   */
  async respondToJoinRequest(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const captainId = this.getAuthenticatedUserId(req, next);
      if (captainId == null) {
        return;
      }
      const { joinRequestId, action, rejectionReason } = req.body;

      const result = await entryService.respondToJoinRequest(
        captainId,
        joinRequestId,
        action,
        rejectionReason
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * 6. Get join requests for entry (captain only)
   */
  async getJoinRequests(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const captainId = this.getAuthenticatedUserId(req, next);
      if (captainId == null) {
        return;
      }
      const entryId = Number(req.params.entryId);
      const status = req.query.status as
        | "pending"
        | "approved"
        | "rejected"
        | undefined;

      const requests = await entryService.getJoinRequests(
        captainId,
        entryId,
        status
      );
      res.status(200).json(requests);
    } catch (error) {
      next(error);
    }
  }

  /**
   * 7. Get entry by ID
   */
  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const entryId = Number(req.params.entryId);
      const entry = await entryService.getById(entryId);
      res.status(200).json(entry);
    } catch (error) {
      next(error);
    }
  }

  /**
   * 8. Update entry (captain only)
   */
  async update(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const captainId = this.getAuthenticatedUserId(req, next);
      if (captainId == null) {
        return;
      }
      const entryId = Number(req.params.entryId);
      const updateData = req.body;

      const entry = await entryService.update(captainId, entryId, updateData);
      res.status(200).json(entry);
    } catch (error) {
      next(error);
    }
  }

  /**
   * 9. Delete entry (captain only)
   */
  async delete(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const captainId = this.getAuthenticatedUserId(req, next);
      if (captainId == null) {
        return;
      }
      const entryId = Number(req.params.entryId);

      await entryService.delete(captainId, entryId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  /**
   * 10. Transfer captaincy to another member
   */
  async transferCaptaincy(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const currentCaptainId = this.getAuthenticatedUserId(req, next);
      if (currentCaptainId == null) {
        return;
      }
      const { entryId, newCaptainId } = req.body;

      const entry = await entryService.transferCaptaincy(
        currentCaptainId,
        entryId,
        newCaptainId
      );
      res.status(200).json(entry);
    } catch (error) {
      next(error);
    }
  }

  /**
   * 11. Get all members of entry
   */
  async getAllMembers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const entryId = Number(req.params.entryId);
      const members = await entryService.getAllMembers(entryId);
      res.status(200).json(members);
    } catch (error) {
      next(error);
    }
  }

  /**
   * 12. Leave entry (member)
   */
  async leaveEntry(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = this.getAuthenticatedUserId(req, next);
      if (userId == null) {
        return;
      }
      const entryId = Number(req.params.entryId);

      await entryService.leaveEntry(userId, entryId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  /**
   * 13. Set required member count (captain only, team entries)
   */
  async setRequiredMemberCount(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const captainId = this.getAuthenticatedUserId(req, next);
      if (captainId == null) {
        return;
      }
      const entryId = Number(req.params.entryId);
      const { count } = req.body;

      const entry = await entryService.setRequiredMemberCount(
        captainId,
        entryId,
        count
      );
      res.status(200).json(entry);
    } catch (error) {
      next(error);
    }
  }

  /**
   * 14. Confirm lineup (captain only)
   */
  async confirmLineup(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const captainId = this.getAuthenticatedUserId(req, next);
      if (captainId == null) {
        return;
      }
      const entryId = Number(req.params.entryId);

      const entry = await entryService.confirmLineup(captainId, entryId);
      res.status(200).json(entry);
    } catch (error) {
      next(error);
    }
  }

  /**
   * 15. Get eligible entries for competition
   */
  async getEligibleEntries(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const categoryId = Number(req.params.categoryId);

      const result = await entryService.getEligibleEntries(categoryId);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * 16. Disqualify ineligible entries (organizer only)
   */
  async disqualifyIneligibleEntries(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const organizerId = this.getAuthenticatedUserId(req, next);
      if (organizerId == null) {
        return;
      }
      const categoryId = Number(req.params.categoryId);

      const result = await entryService.disqualifyIneligibleEntries(
        organizerId,
        categoryId
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * 17. Get user's entries with role (member or captain)
   */
  async getUserEntries(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = this.getAuthenticatedUserId(req, next);
      if (userId == null) {
        return;
      }
      const skip = Number(req.query.skip) || 0;
      const limit = Number(req.query.limit) || 10;

      const result = await entryService.getUserEntries(userId, { skip, limit });
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * 18. Get user's role in a specific entry
   */
  async getUserRoleInEntry(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = this.getAuthenticatedUserId(req, next);
      if (userId == null) {
        return;
      }
      const entryId = Number(req.params.entryId);

      const role = await entryService.getUserRoleInEntry(entryId, userId);
      res.status(200).json({ entryId, userId, role });
    } catch (error) {
      next(error);
    }
  }
}

export default new EntryController();
