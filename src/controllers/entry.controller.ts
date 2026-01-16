import { Request, Response } from "express";
import entryService from "../services/entry.service";

export class EntryController {
  async create(req: Request, res: Response): Promise<void> {
    try {
      const entry = await entryService.create(req.body);
      res.status(201).json(entry);
    } catch (error) {
      res.status(400).json({ message: "Error creating entry", error });
    }
  }

  async registerEntry(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({ message: "Unauthorized - User not authenticated" });
        return;
      }

      const entry = await entryService.registerEntry(req.body, userId);
      res.status(201).json(entry);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Error registering entry", error });
    }
  }

  async findAll(req: Request, res: Response): Promise<void> {
    try {
      const skip = Number(req.query.skip) || 0;
      const limit = Number(req.query.limit) || 10;
      const entries = await entryService.findAll(skip, limit);
      res.status(200).json(entries);
    } catch (error) {
      res.status(500).json({ message: "Error fetching entries", error });
    }
  }

  async findById(req: Request, res: Response): Promise<void> {
    try {
      const entry = await entryService.findById(Number(req.params.id));
      if (!entry) {
        res.status(404).json({ message: "Entry not found" });
        return;
      }
      res.status(200).json(entry);
    } catch (error) {
      res.status(500).json({ message: "Error fetching entry", error });
    }
  }

  async findByContentId(req: Request, res: Response): Promise<void> {
    try {
      const skip = Number(req.query.skip) || 0;
      const limit = Number(req.query.limit) || 10;
      const entries = await entryService.findByContentId(
        Number(req.params.contentId),
        skip,
        limit
      );
      res.status(200).json(entries);
    } catch (error) {
      res.status(500).json({ message: "Error fetching entries", error });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const entry = await entryService.update(Number(req.params.id), req.body);
      if (!entry) {
        res.status(404).json({ message: "Entry not found" });
        return;
      }
      res.status(200).json(entry);
    } catch (error) {
      res.status(400).json({ message: "Error updating entry", error });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const deleted = await entryService.delete(Number(req.params.id));
      if (!deleted) {
        res.status(404).json({ message: "Entry not found" });
        return;
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error deleting entry", error });
    }
  }
}

export default new EntryController();
