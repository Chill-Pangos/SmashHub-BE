import { Request, Response } from "express";
import tournamentService from "../services/tournament.service";

export class TournamentController {
  async create(req: Request, res: Response): Promise<void> {
    try {
      // Get user ID from authenticated request
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({ message: "Unauthorized - User not authenticated" });
        return;
      }
      
      const tournamentData = {
        ...req.body,
        createdBy: userId,
      };
      
      const tournament = await tournamentService.create(tournamentData);
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

  async findAllWithContentsFiltered(req: Request, res: Response): Promise<void> {
    try {
      const skip = Number(req.query.skip) || 0;
      const limit = req.query.limit !== undefined ? Number(req.query.limit) : 10;
      const userId = req.query.userId ? Number(req.query.userId) : undefined;
      const createdBy = req.query.createdBy ? Number(req.query.createdBy) : undefined;
      const minAge = req.query.minAge ? Number(req.query.minAge) : undefined;
      const maxAge = req.query.maxAge ? Number(req.query.maxAge) : undefined;
      const minElo = req.query.minElo ? Number(req.query.minElo) : undefined;
      const maxElo = req.query.maxElo ? Number(req.query.maxElo) : undefined;
      const gender = req.query.gender as 'male' | 'female' | 'mixed' | undefined;
      const isGroupStage = req.query.isGroupStage === 'true' ? true : req.query.isGroupStage === 'false' ? false : undefined;

      const result = await tournamentService.findAllWithContentsFiltered({
        skip,
        limit,
        userId,
        createdBy,
        minAge,
        maxAge,
        minElo,
        maxElo,
        gender,
        isGroupStage,
      });

      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ message: "Error fetching tournaments with filters", error });
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

  async findByIdWithContents(req: Request, res: Response): Promise<void> {
    try {
      const tournament = await tournamentService.findByIdWithContents(
        Number(req.params.id)
      );
      if (!tournament) {
        res.status(404).json({ message: "Tournament not found" });
        return;
      }
      res.status(200).json(tournament);
    } catch (error) {
      res.status(500).json({ message: "Error fetching tournament with contents", error });
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
      const validStatuses = ['upcoming', 'ongoing', 'completed'];
      if (!validStatuses.includes(status)) {
        res.status(400).json({ 
          message: "Invalid status. Must be one of: upcoming, ongoing, completed" 
        });
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

  async updateWithContents(req: Request, res: Response): Promise<void> {
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
      res.status(400).json({ message: "Error updating tournament with contents", error });
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
