import { Request, Response, NextFunction } from "express";
import TournamentCategoryService from "../services/tournamentCategory.service";
import { NotFoundError } from "../utils/errors.helper";

export class TournamentCategoryController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const category = await TournamentCategoryService.create(req.body);
      res.status(201).json(category);
    } catch (error) {
      next(error);
    }
  }

  async findAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;
      const offset = Math.max(page - 1, 0) * limit;
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
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;
      const offset = Math.max(page - 1, 0) * limit;
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

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const category = await TournamentCategoryService.update(
        Number(req.params.id),
        req.body
      );
      if (!category) {
        throw new NotFoundError("Tournament category not found");
      }
      res.status(200).json(category);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const deleted = await TournamentCategoryService.delete(
        Number(req.params.id)
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
