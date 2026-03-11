import { Request, Response } from "express";
import matchSetService from "../services/matchSet.service";

export class MatchSetController {
  async create(req: Request, res: Response): Promise<void> {
    try {
      const matchSet = await matchSetService.create(req.body);
      res.status(201).json(matchSet);
    } catch (error) {
      res.status(400).json({ message: "Error creating match set", error });
    }
  }

  async findAll(req: Request, res: Response): Promise<void> {
    try {
      const skip = Number(req.query.skip) || 0;
      const limit = Number(req.query.limit) || 10;
      const matchSets = await matchSetService.findAll(skip, limit);
      res.status(200).json(matchSets);
    } catch (error) {
      res.status(500).json({ message: "Error fetching match sets", error });
    }
  }

  async findById(req: Request, res: Response): Promise<void> {
    try {
      const matchSet = await matchSetService.findById(Number(req.params.id));
      if (!matchSet) {
        res.status(404).json({ message: "Match set not found" });
        return;
      }
      res.status(200).json(matchSet);
    } catch (error) {
      res.status(500).json({ message: "Error fetching match set", error });
    }
  }

  async findByMatchId(req: Request, res: Response): Promise<void> {
    try {
      const skip = Number(req.query.skip) || 0;
      const limit = Number(req.query.limit) || 10;
      const matchSets = await matchSetService.findByMatchId(
        Number(req.params.matchId),
        skip,
        limit
      );
      res.status(200).json(matchSets);
    } catch (error) {
      res.status(500).json({ message: "Error fetching match sets", error });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const matchSet = await matchSetService.update(
        Number(req.params.id),
        req.body
      );
      if (!matchSet) {
        res.status(404).json({ message: "Match set not found" });
        return;
      }
      res.status(200).json(matchSet);
    } catch (error) {
      res.status(400).json({ message: "Error updating match set", error });
    }
  }

  async createSetWithScore(req: Request, res: Response): Promise<void> {
    try {
      const matchSet = await matchSetService.createSetWithScore(req.body);
      res.status(201).json(matchSet);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Error creating match set with score", error });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const deleted = await matchSetService.delete(Number(req.params.id));
      if (!deleted) {
        res.status(404).json({ message: "Match set not found" });
        return;
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error deleting match set", error });
    }
  }
}

export default new MatchSetController();
