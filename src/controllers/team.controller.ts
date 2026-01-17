import { Request, Response } from "express";
import teamService from "../services/team.service";

export class TeamController {
  async create(req: Request, res: Response): Promise<void> {
    try {
      const team = await teamService.create(req.body);
      res.status(201).json(team);
    } catch (error) {
      res.status(400).json({ message: "Error creating team", error });
    }
  }

  async findAll(req: Request, res: Response): Promise<void> {
    try {
      const skip = Number(req.query.skip) || 0;
      const limit = Number(req.query.limit) || 10;
      const teams = await teamService.findAll(skip, limit);
      res.status(200).json(teams);
    } catch (error) {
      res.status(500).json({ message: "Error fetching teams", error });
    }
  }

  async findById(req: Request, res: Response): Promise<void> {
    try {
      const team = await teamService.findById(Number(req.params.id));
      if (!team) {
        res.status(404).json({ message: "Team not found" });
        return;
      }
      res.status(200).json(team);
    } catch (error) {
      res.status(500).json({ message: "Error fetching team", error });
    }
  }

  async findByTournamentId(req: Request, res: Response): Promise<void> {
    try {
      const skip = Number(req.query.skip) || 0;
      const limit = Number(req.query.limit) || 10;
      const teams = await teamService.findByTournamentId(
        Number(req.params.tournamentId),
        skip,
        limit
      );
      res.status(200).json(teams);
    } catch (error) {
      res.status(500).json({ message: "Error fetching teams", error });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const team = await teamService.update(Number(req.params.id), req.body);
      if (!team) {
        res.status(404).json({ message: "Team not found" });
        return;
      }
      res.status(200).json(team);
    } catch (error) {
      res.status(400).json({ message: "Error updating team", error });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const deleted = await teamService.delete(Number(req.params.id));
      if (!deleted) {
        res.status(404).json({ message: "Team not found" });
        return;
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error deleting team", error });
    }
  }
}

export default new TeamController();
