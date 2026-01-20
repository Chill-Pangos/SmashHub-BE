import { Request, Response } from "express";
import matchService from "../services/match.service";

export class MatchController {
  async create(req: Request, res: Response): Promise<void> {
    try {
      const match = await matchService.create(req.body);
      res.status(201).json(match);
    } catch (error) {
      res.status(400).json({ message: "Error creating match", error });
    }
  }

  async findAll(req: Request, res: Response): Promise<void> {
    try {
      const skip = Number(req.query.skip) || 0;
      const limit = Number(req.query.limit) || 10;
      const matches = await matchService.findAll(skip, limit);
      res.status(200).json(matches);
    } catch (error) {
      res.status(500).json({ message: "Error fetching matches", error });
    }
  }

  async findById(req: Request, res: Response): Promise<void> {
    try {
      const match = await matchService.findById(Number(req.params.id));
      if (!match) {
        res.status(404).json({ message: "Match not found" });
        return;
      }
      res.status(200).json(match);
    } catch (error) {
      res.status(500).json({ message: "Error fetching match", error });
    }
  }

  async findByScheduleId(req: Request, res: Response): Promise<void> {
    try {
      const skip = Number(req.query.skip) || 0;
      const limit = Number(req.query.limit) || 10;
      const matches = await matchService.findByScheduleId(
        Number(req.params.scheduleId),
        skip,
        limit
      );
      res.status(200).json(matches);
    } catch (error) {
      res.status(500).json({ message: "Error fetching matches", error });
    }
  }

  async findByStatus(req: Request, res: Response): Promise<void> {
    try {
      const status = req.params.status;
      if (!status || typeof status !== 'string') {
        res.status(400).json({ message: "Status is required" });
        return;
      }
      
      // Validate status value
      const validStatuses = ['scheduled', 'in_progress', 'completed', 'cancelled'];
      if (!validStatuses.includes(status)) {
        res.status(400).json({ 
          message: "Invalid status. Must be one of: scheduled, in_progress, completed, cancelled" 
        });
        return;
      }
      
      const skip = Number(req.query.skip) || 0;
      const limit = Number(req.query.limit) || 10;
      const matches = await matchService.findByStatus(status, skip, limit);
      res.status(200).json(matches);
    } catch (error) {
      res.status(500).json({ message: "Error fetching matches", error });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const match = await matchService.update(Number(req.params.id), req.body);
      if (!match) {
        res.status(404).json({ message: "Match not found" });
        return;
      }
      res.status(200).json(match);
    } catch (error) {
      res.status(400).json({ message: "Error updating match", error });
    }
  }

  async startMatch(req: Request, res: Response): Promise<void> {
    try {
      const match = await matchService.startMatch(Number(req.params.id));
      res.status(200).json(match);
    } catch (error: any) {
      if (error.message === "Match not found") {
        res.status(404).json({ message: error.message });
        return;
      }
      res.status(400).json({ message: error.message || "Error starting match", error });
    }
  }

  async finalizeMatch(req: Request, res: Response): Promise<void> {
    try {
      const match = await matchService.finalizeMatch(Number(req.params.id));
      res.status(200).json(match);
    } catch (error: any) {
      if (error.message === "Match not found") {
        res.status(404).json({ message: error.message });
        return;
      }
      res.status(400).json({ message: error.message || "Error finalizing match", error });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const deleted = await matchService.delete(Number(req.params.id));
      if (!deleted) {
        res.status(404).json({ message: "Match not found" });
        return;
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error deleting match", error });
    }
  }
}

export default new MatchController();
