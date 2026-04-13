import { Request, Response, NextFunction } from "express";
import tournamentService from "../services/tournament.service";
import { BadRequestError, NotFoundError } from "../utils/errors";

export class TournamentController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Get user ID from authenticated request
      const userId = (req as any).user?.id;
      if (!userId) {
        throw new BadRequestError("Unauthorized - User not authenticated");
      }

      const tournamentData = {
        ...req.body,
        createdBy: userId,
      };

      const tournament = await tournamentService.create(tournamentData);
      res.status(201).json(tournament);
    } catch (error) {
      next(error);
    }
  }

  async findAllWithCategoriesFiltered(req: Request, res: Response, next: NextFunction): Promise<void> {
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
      next(error);
    }
  }

  async findById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);

      if (isNaN(id) || id <= 0) {
        throw new BadRequestError("Invalid tournament ID");
      }

      const tournament = await tournamentService.findById(id);
      if (!tournament) {
        throw new NotFoundError("Tournament not found");
      }
      res.status(200).json(tournament);
    } catch (error) {
      next(error);
    }
  }

  async findByIdWithCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);

      if (isNaN(id) || id <= 0) {
        throw new BadRequestError("Invalid tournament ID");
      }

      const tournament = await tournamentService.findByIdWithCategories(id);
      if (!tournament) {
        throw new NotFoundError("Tournament not found");
      }
      res.status(200).json(tournament);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);

      if (isNaN(id) || id <= 0) {
        throw new BadRequestError("Invalid tournament ID");
      }

      const tournament = await tournamentService.update(id, req.body);
      if (!tournament) {
        throw new NotFoundError("Tournament not found");
      }
      res.status(200).json(tournament);
    } catch (error) {
      next(error);
    }
  }

  async updateWithCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);

      if (isNaN(id) || id <= 0) {
        throw new BadRequestError("Invalid tournament ID");
      }

      const tournament = await tournamentService.update(id, req.body);
      if (!tournament) {
        throw new NotFoundError("Tournament not found");
      }
      res.status(200).json(tournament);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);

      if (isNaN(id) || id <= 0) {
        throw new BadRequestError("Invalid tournament ID");
      }

      const deleted = await tournamentService.delete(id);
      if (!deleted) {
        throw new NotFoundError("Tournament not found");
      }
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  /**
   * Manually trigger tournament status update
   * POST /tournaments/update-statuses
   */
  async updateStatuses(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await tournamentService.updateTournamentStatuses();
      res.status(200).json({
        success: true,
        message: "Tournament statuses updated successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get upcoming tournament status changes
   * GET /tournaments/upcoming-changes?hours=24
   */
  async getUpcomingChanges(req: Request, res: Response, next: NextFunction): Promise<void> {
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
    } catch (error) {
      next(error);
    }
  }
}

export default new TournamentController();
