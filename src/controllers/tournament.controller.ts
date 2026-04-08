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

  async findAllWithCategoriesFiltered(req: Request, res: Response): Promise<void> {
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

      const result = await tournamentService.findAllWithCategoriesFiltered({
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
      const id = Number(req.params.id);

      if (isNaN(id) || id <= 0) {
        res.status(400).json({ message: "Invalid tournament ID" });
        return;
      }

      const tournament = await tournamentService.findById(id);
      if (!tournament) {
        res.status(404).json({ message: "Tournament not found" });
        return;
      }
      res.status(200).json(tournament);
    } catch (error) {
      res.status(500).json({ message: "Error fetching tournament", error });
    }
  }

  async findByIdWithCategories(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);

      if (isNaN(id) || id <= 0) {
        res.status(400).json({ message: "Invalid tournament ID" });
        return;
      }

      const tournament = await tournamentService.findByIdWithCategories(id);
      if (!tournament) {
        res.status(404).json({ message: "Tournament not found" });
        return;
      }
      res.status(200).json(tournament);
    } catch (error) {
      res.status(500).json({ message: "Error fetching tournament with categories", error });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);

      if (isNaN(id) || id <= 0) {
        res.status(400).json({ message: "Invalid tournament ID" });
        return;
      }

      const tournament = await tournamentService.update(id, req.body);
      if (!tournament) {
        res.status(404).json({ message: "Tournament not found" });
        return;
      }
      res.status(200).json(tournament);
    } catch (error) {
      res.status(400).json({ message: "Error updating tournament", error });
    }
  }

  async updateWithCategories(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);

      if (isNaN(id) || id <= 0) {
        res.status(400).json({ message: "Invalid tournament ID" });
        return;
      }

      const tournament = await tournamentService.update(id, req.body);
      if (!tournament) {
        res.status(404).json({ message: "Tournament not found" });
        return;
      }
      res.status(200).json(tournament);
    } catch (error) {
      res.status(400).json({ message: "Error updating tournament with categories", error });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);

      if (isNaN(id) || id <= 0) {
        res.status(400).json({ message: "Invalid tournament ID" });
        return;
      }

      const deleted = await tournamentService.delete(id);
      if (!deleted) {
        res.status(404).json({ message: "Tournament not found" });
        return;
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error deleting tournament", error });
    }
  }

  /**
   * Manually trigger tournament status update
   * POST /tournaments/update-statuses
   */
  async updateStatuses(req: Request, res: Response): Promise<void> {
    try {
      const result = await tournamentService.updateTournamentStatuses();
      res.status(200).json({
        success: true,
        message: "Tournament statuses updated successfully",
        data: result,
      });
    } catch (error: any) {
      console.error("Error updating tournament statuses:", error);
      res.status(500).json({
        success: false,
        message: "Error updating tournament statuses",
        error: {
          message: error?.message || "Unknown error",
          name: error?.name,
        },
      });
    }
  }

  /**
   * Get upcoming tournament status changes
   * GET /tournaments/upcoming-changes?hours=24
   */
  async getUpcomingChanges(req: Request, res: Response): Promise<void> {
    try {
      const hours = parseInt(req.query.hours as string) || 24;
      const result = await tournamentService.getUpcomingStatusChanges(hours);
      res.status(200).json({
        success: true,
        data: result,
        metadata: {
          lookAheadHours: hours,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error: any) {
      console.error("Error getting upcoming status changes:", error);
      res.status(500).json({
        success: false,
        message: "Error getting upcoming status changes",
        error: {
          message: error?.message || "Unknown error",
          name: error?.name,
        },
      });
    }
  }
}

export default new TournamentController();
