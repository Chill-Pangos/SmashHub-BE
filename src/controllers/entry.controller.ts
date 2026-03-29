import { Request, Response } from "express";
import entryService from "../services/entry.service";
import { AuthRequest } from "../middlewares/auth.middleware";

export class EntryController {
  private getAuthenticatedUserId(req: AuthRequest, res: Response): number | null {
    if (req.userId == null) {
      res.status(401).json({ message: "Unauthorized" });
      return null;
    }

    return req.userId;
  }

  /**
   * 1. Register for tournament (single/double/team)
   */
  async register(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = this.getAuthenticatedUserId(req, res);
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
      res.status(400).json({ message: "Error registering for tournament", error });
    }
  }

  /**
   * 2. Add member to entry (captain only)
   */
  async addMember(req: AuthRequest, res: Response): Promise<void> {
    try {
      const captainId = this.getAuthenticatedUserId(req, res);
      if (captainId == null) {
        return;
      }
      const { entryId, newMemberId } = req.body;

      const member = await entryService.addMember(captainId, entryId, newMemberId);
      res.status(201).json(member);
    } catch (error) {
      res.status(400).json({ message: "Error adding member", error });
    }
  }

  /**
   * 3. Remove member from entry (captain only)
   */
  async removeMember(req: AuthRequest, res: Response): Promise<void> {
    try {
      const captainId = this.getAuthenticatedUserId(req, res);
      if (captainId == null) {
        return;
      }
      const { entryId, memberId } = req.body;

      await entryService.removeMember(captainId, entryId, memberId);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ message: "Error removing member", error });
    }
  }

  /**
   * 4. Get entries by category with filters
   */
  async findByCategoryId(req: Request, res: Response): Promise<void> {
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
      res.status(500).json({ message: "Error fetching entries", error });
    }
  }

  /**
   * 5. Respond to join request (captain only)
   */
  async respondToJoinRequest(req: AuthRequest, res: Response): Promise<void> {
    try {
      const captainId = this.getAuthenticatedUserId(req, res);
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
      res.status(400).json({ message: "Error responding to join request", error });
    }
  }

  /**
   * 6. Get join requests for entry (captain only)
   */
  async getJoinRequests(req: AuthRequest, res: Response): Promise<void> {
    try {
      const captainId = this.getAuthenticatedUserId(req, res);
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
      res.status(500).json({ message: "Error fetching join requests", error });
    }
  }

  /**
   * 7. Get entry by ID
   */
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const entryId = Number(req.params.entryId);
      const entry = await entryService.getById(entryId);
      res.status(200).json(entry);
    } catch (error) {
      res.status(404).json({ message: "Entry not found", error });
    }
  }

  /**
   * 8. Update entry (captain only)
   */
  async update(req: AuthRequest, res: Response): Promise<void> {
    try {
      const captainId = this.getAuthenticatedUserId(req, res);
      if (captainId == null) {
        return;
      }
      const entryId = Number(req.params.entryId);
      const updateData = req.body;

      const entry = await entryService.update(captainId, entryId, updateData);
      res.status(200).json(entry);
    } catch (error) {
      res.status(400).json({ message: "Error updating entry", error });
    }
  }

  /**
   * 9. Delete entry (captain only)
   */
  async delete(req: AuthRequest, res: Response): Promise<void> {
    try {
      const captainId = this.getAuthenticatedUserId(req, res);
      if (captainId == null) {
        return;
      }
      const entryId = Number(req.params.entryId);

      await entryService.delete(captainId, entryId);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ message: "Error deleting entry", error });
    }
  }

  /**
   * 10. Transfer captaincy to another member
   */
  async transferCaptaincy(req: AuthRequest, res: Response): Promise<void> {
    try {
      const currentCaptainId = this.getAuthenticatedUserId(req, res);
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
      res.status(400).json({ message: "Error transferring captaincy", error });
    }
  }

  /**
   * 11. Get all members of entry
   */
  async getAllMembers(req: Request, res: Response): Promise<void> {
    try {
      const entryId = Number(req.params.entryId);
      const members = await entryService.getAllMembers(entryId);
      res.status(200).json(members);
    } catch (error) {
      res.status(500).json({ message: "Error fetching members", error });
    }
  }

  /**
   * 12. Leave entry (member)
   */
  async leaveEntry(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = this.getAuthenticatedUserId(req, res);
      if (userId == null) {
        return;
      }
      const entryId = Number(req.params.entryId);

      await entryService.leaveEntry(userId, entryId);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ message: "Error leaving entry", error });
    }
  }

  /**
   * 13. Set required member count (captain only, team entries)
   */
  async setRequiredMemberCount(req: AuthRequest, res: Response): Promise<void> {
    try {
      const captainId = this.getAuthenticatedUserId(req, res);
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
      res.status(400).json({ message: "Error setting required member count", error });
    }
  }
}

export default new EntryController();
