import { Request, Response, NextFunction } from "express";
import eloHistoryService from "../services/eloHistory.service";
import { NotFoundError } from "../utils/errors";

export class EloHistoryController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const eloHistory = await eloHistoryService.create(req.body);
      res.status(201).json(eloHistory);
    } catch (error) {
      next(error);
    }
  }

  async findAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const skip = Number(req.query.skip) || 0;
      const limit = Number(req.query.limit) || 10;
      const eloHistories = await eloHistoryService.findAll(skip, limit);
      res.status(200).json(eloHistories);
    } catch (error) {
      next(error);
    }
  }

  async findById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const eloHistory = await eloHistoryService.findById(
        Number(req.params.id)
      );
      if (!eloHistory) {
        throw new NotFoundError("ELO history not found");
      }
      res.status(200).json(eloHistory);
    } catch (error) {
      next(error);
    }
  }

  async findByUserId(req: Request, res: Response, next: NextFunction): Promise<void> {
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
      next(error);
    }
  }

  async findByMatchId(req: Request, res: Response, next: NextFunction): Promise<void> {
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
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const deleted = await eloHistoryService.delete(Number(req.params.id));
      if (!deleted) {
        throw new NotFoundError("ELO history not found");
      }
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

export default new EloHistoryController();
