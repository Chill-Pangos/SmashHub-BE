import { Request, Response } from "express";
import eloScoreService from "../services/eloScore.service";

export class EloScoreController {
  async create(req: Request, res: Response): Promise<void> {
    try {
      const eloScore = await eloScoreService.create(req.body);
      res.status(201).json(eloScore);
    } catch (error) {
      res.status(400).json({ message: "Error creating ELO score", error });
    }
  }

  async findAll(req: Request, res: Response): Promise<void> {
    try {
      const skip = Number(req.query.skip) || 0;
      const limit = Number(req.query.limit) || 10;
      const eloScores = await eloScoreService.findAll(skip, limit);
      res.status(200).json(eloScores);
    } catch (error) {
      res.status(500).json({ message: "Error fetching ELO scores", error });
    }
  }

  async findById(req: Request, res: Response): Promise<void> {
    try {
      const eloScore = await eloScoreService.findById(Number(req.params.id));
      if (!eloScore) {
        res.status(404).json({ message: "ELO score not found" });
        return;
      }
      res.status(200).json(eloScore);
    } catch (error) {
      res.status(500).json({ message: "Error fetching ELO score", error });
    }
  }

  async getLeaderboard(req: Request, res: Response): Promise<void> {
    try {
      const skip = Number(req.query.skip) || 0;
      const limit = Number(req.query.limit) || 10;
      const leaderboard = await eloScoreService.getLeaderboard(skip, limit);
      res.status(200).json(leaderboard);
    } catch (error) {
      res.status(500).json({ message: "Error fetching leaderboard", error });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const eloScore = await eloScoreService.update(
        Number(req.params.id),
        req.body
      );
      if (!eloScore) {
        res.status(404).json({ message: "ELO score not found" });
        return;
      }
      res.status(200).json(eloScore);
    } catch (error) {
      res.status(400).json({ message: "Error updating ELO score", error });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const deleted = await eloScoreService.delete(Number(req.params.id));
      if (!deleted) {
        res.status(404).json({ message: "ELO score not found" });
        return;
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error deleting ELO score", error });
    }
  }
}

export default new EloScoreController();
