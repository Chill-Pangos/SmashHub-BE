import { Request, Response, NextFunction } from "express";
import TournamentCategoryService from "../services/tournamentCategory.service";
import { NotFoundError, UnauthorizedError } from "../../../utils/errors.helper";
import { parsePagination, parsePositiveInt } from "../../../utils/request.helper";
import { AuthRequest } from "../../../middlewares/auth.middleware";

export class TournamentCategoryController {
  private getAuthenticatedUserId(req: AuthRequest): number {
    if (req.userId == null) throw new UnauthorizedError("Unauthorized");
    return req.userId;
  }

  async create(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tournamentId = parsePositiveInt(req.body.tournamentId, "tournamentId");
      const category = await TournamentCategoryService.create(
        { ...req.body, tournamentId },
        this.getAuthenticatedUserId(req),
      );
      res.status(201).json(category);
    } catch (error) {
      next(error);
    }
  }

  async findAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { offset, limit } = parsePagination(req.query);
      const categories = await TournamentCategoryService.findAll(offset, limit);
      res.status(200).json(categories);
    } catch (error) {
      next(error);
    }
  }

  async findById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const category = await TournamentCategoryService.findById(
        Number(req.params.id)
      );
      if (!category) {
        throw new NotFoundError("Tournament category not found");
      }
      res.status(200).json(category);
    } catch (error) {
      next(error);
    }
  }

  async findByTournamentId(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { offset, limit } = parsePagination(req.query);
      const categories = await TournamentCategoryService.findByTournamentId(
        Number(req.params.tournamentId),
        offset,
        limit
      );
      res.status(200).json(categories);
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const category = await TournamentCategoryService.update(
        parsePositiveInt(req.params.id, "id"),
        req.body,
        this.getAuthenticatedUserId(req),
      );
      if (!category) {
        throw new NotFoundError("Tournament category not found");
      }
      res.status(200).json(category);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const deleted = await TournamentCategoryService.delete(
        parsePositiveInt(req.params.id, "id"),
        this.getAuthenticatedUserId(req),
      );
      if (!deleted) {
        throw new NotFoundError("Tournament category not found");
      }
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

export default new TournamentCategoryController();
