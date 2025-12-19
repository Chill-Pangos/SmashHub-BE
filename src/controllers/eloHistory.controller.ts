import { Request, Response } from "express";
import eloHistoryService from "../services/eloHistory.service";

export class EloHistoryController {
  async create(req: Request, res: Response): Promise<void> {
    try {
      const eloHistory = await eloHistoryService.create(req.body);
      res.status(201).json(eloHistory);
    } catch (error) {
      res.status(400).json({ message: "Error creating ELO history", error });
    }
  }

  async findAll(req: Request, res: Response): Promise<void> {
    try {
      const skip = Number(req.query.skip) || 0;
      const limit = Number(req.query.limit) || 10;
      const eloHistories = await eloHistoryService.findAll(skip, limit);
      res.status(200).json(eloHistories);
    } catch (error) {
      res.status(500).json({ message: "Error fetching ELO histories", error });
    }
  }

  async findById(req: Request, res: Response): Promise<void> {
    try {
      const eloHistory = await eloHistoryService.findById(
        Number(req.params.id)
      );
      if (!eloHistory) {
        res.status(404).json({ message: "ELO history not found" });
        return;
      }
      res.status(200).json(eloHistory);
    } catch (error) {
      res.status(500).json({ message: "Error fetching ELO history", error });
    }
  }

  async findByUserId(req: Request, res: Response): Promise<void> {
    try {
      const skip = Number(req.query.skip) || 0;
      const limit = Number(req.query.limit) || 10;
      const eloHistories = await eloHistoryService.findByUserId(
        Number(req.params.userId),
        skip,
        limit
      );
      res.status(200).json(eloHistories);
    } catch (error) {
      res.status(500).json({ message: "Error fetching ELO histories", error });
    }
  }

  async findByMatchId(req: Request, res: Response): Promise<void> {
    try {
      const skip = Number(req.query.skip) || 0;
      const limit = Number(req.query.limit) || 10;
      const eloHistories = await eloHistoryService.findByMatchId(
        Number(req.params.matchId),
        skip,
        limit
      );
      res.status(200).json(eloHistories);
    } catch (error) {
      res.status(500).json({ message: "Error fetching ELO histories", error });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const deleted = await eloHistoryService.delete(Number(req.params.id));
      if (!deleted) {
        res.status(404).json({ message: "ELO history not found" });
        return;
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error deleting ELO history", error });
    }
  }
}

export default new EloHistoryController();
