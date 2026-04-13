import { Request, Response, NextFunction } from "express";
import eloScoreService from "../services/eloScore.service";
import { NotFoundError } from "../utils/errors";

export class EloScoreController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const eloScore = await eloScoreService.create(req.body);
      res.status(201).json(eloScore);
    } catch (error) {
      next(error);
    }
  }

  async findAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const skip = Number(req.query.skip) || 0;
      const limit = Number(req.query.limit) || 10;
      const eloScores = await eloScoreService.findAll(skip, limit);
      res.status(200).json(eloScores);
    } catch (error) {
      next(error);
    }
  }

  async findById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const eloScore = await eloScoreService.findById(Number(req.params.id));
      if (!eloScore) {
        throw new NotFoundError("ELO score not found");
      }
      res.status(200).json(eloScore);
    } catch (error) {
      next(error);
    }
  }

  async getLeaderboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const skip = Number(req.query.skip) || 0;
      const limit = Number(req.query.limit) || 10;
      const leaderboard = await eloScoreService.getLeaderboard(skip, limit);
      res.status(200).json(leaderboard);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const eloScore = await eloScoreService.update(
        Number(req.params.id),
        req.body
      );
      if (!eloScore) {
        throw new NotFoundError("ELO score not found");
      }
      res.status(200).json(eloScore);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const deleted = await eloScoreService.delete(Number(req.params.id));
      if (!deleted) {
        throw new NotFoundError("ELO score not found");
      }
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

export default new EloScoreController();
