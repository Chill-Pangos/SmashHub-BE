import { Request, Response } from "express";
import tournamentService from "../services/tournament.service";

export class TournamentController {
  async create(req: Request, res: Response): Promise<void> {
    try {
      const tournament = await tournamentService.create(req.body);
      res.status(201).json(tournament);
    } catch (error) {
      res.status(400).json({ message: "Error creating tournament", error });
    }
  }

  async findAll(req: Request, res: Response): Promise<void> {
    try {
      const skip = Number(req.query.skip) || 0;
      const limit = Number(req.query.limit) || 10;
      const tournaments = await tournamentService.findAll(skip, limit);
      res.status(200).json(tournaments);
    } catch (error) {
      res.status(500).json({ message: "Error fetching tournaments", error });
    }
  }

  async findById(req: Request, res: Response): Promise<void> {
    try {
      const tournament = await tournamentService.findById(
        Number(req.params.id)
      );
      if (!tournament) {
        res.status(404).json({ message: "Tournament not found" });
        return;
      }
      res.status(200).json(tournament);
    } catch (error) {
      res.status(500).json({ message: "Error fetching tournament", error });
    }
  }

  async findByStatus(req: Request, res: Response): Promise<void> {
    try {
      const status = req.params.status;
      if (!status) {
        res.status(400).json({ message: "Status is required" });
        return;
      }
      const skip = Number(req.query.skip) || 0;
      const limit = Number(req.query.limit) || 10;
      const tournaments = await tournamentService.findByStatus(
        status,
        skip,
        limit
      );
      res.status(200).json(tournaments);
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error fetching tournaments by status", error });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const tournament = await tournamentService.update(
        Number(req.params.id),
        req.body
      );
      if (!tournament) {
        res.status(404).json({ message: "Tournament not found" });
        return;
      }
      res.status(200).json(tournament);
    } catch (error) {
      res.status(400).json({ message: "Error updating tournament", error });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const deleted = await tournamentService.delete(Number(req.params.id));
      if (!deleted) {
        res.status(404).json({ message: "Tournament not found" });
        return;
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error deleting tournament", error });
    }
  }
}

export default new TournamentController();
