import { Request, Response } from "express";
import complaintMessageService from "../services/complaintMessage.service";

export class ComplaintMessageController {
  async create(req: Request, res: Response): Promise<void> {
    try {
      const message = await complaintMessageService.create(req.body);
      res.status(201).json(message);
    } catch (error) {
      res
        .status(400)
        .json({ message: "Error creating complaint message", error });
    }
  }

  async findAll(req: Request, res: Response): Promise<void> {
    try {
      const skip = Number(req.query.skip) || 0;
      const limit = Number(req.query.limit) || 10;
      const messages = await complaintMessageService.findAll(skip, limit);
      res.status(200).json(messages);
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error fetching complaint messages", error });
    }
  }

  async findById(req: Request, res: Response): Promise<void> {
    try {
      const message = await complaintMessageService.findById(
        Number(req.params.id)
      );
      if (!message) {
        res.status(404).json({ message: "Complaint message not found" });
        return;
      }
      res.status(200).json(message);
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error fetching complaint message", error });
    }
  }

  async findByComplaintId(req: Request, res: Response): Promise<void> {
    try {
      const skip = Number(req.query.skip) || 0;
      const limit = Number(req.query.limit) || 10;
      const messages = await complaintMessageService.findByComplaintId(
        Number(req.params.complaintId),
        skip,
        limit
      );
      res.status(200).json(messages);
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error fetching complaint messages", error });
    }
  }

  async findUnreadByUserId(req: Request, res: Response): Promise<void> {
    try {
      const skip = Number(req.query.skip) || 0;
      const limit = Number(req.query.limit) || 10;
      const messages = await complaintMessageService.findUnreadByReceiver(
        Number(req.params.userId),
        skip,
        limit
      );
      res.status(200).json(messages);
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error fetching unread messages", error });
    }
  }

  async markAsRead(req: Request, res: Response): Promise<void> {
    try {
      const message = await complaintMessageService.markAsRead(
        Number(req.params.id)
      );
      if (!message) {
        res.status(404).json({ message: "Complaint message not found" });
        return;
      }
      res.status(200).json(message);
    } catch (error) {
      res.status(400).json({ message: "Error marking message as read", error });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const message = await complaintMessageService.update(
        Number(req.params.id),
        req.body
      );
      if (!message) {
        res.status(404).json({ message: "Complaint message not found" });
        return;
      }
      res.status(200).json(message);
    } catch (error) {
      res
        .status(400)
        .json({ message: "Error updating complaint message", error });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const deleted = await complaintMessageService.delete(
        Number(req.params.id)
      );
      if (!deleted) {
        res.status(404).json({ message: "Complaint message not found" });
        return;
      }
      res.status(204).send();
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error deleting complaint message", error });
    }
  }
}

export default new ComplaintMessageController();
