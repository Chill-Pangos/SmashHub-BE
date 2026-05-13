import { Request, Response, NextFunction } from "express";
import eloHistoryService from "../services/eloHistory.service";
import { NotFoundError } from "../utils/errors";

export class EloHistoryController {
  async findByUserId(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const skip = Number(req.query.skip) || 0;
      const limit = Number(req.query.limit) || 10;
      const result = await eloHistoryService.getByUser(
        Number(req.params.userId),
        { skip, limit }
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async findByMatchId(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const eloHistories = await eloHistoryService.getByMatch(
        Number(req.params.matchId)
      );
      res.status(200).json(eloHistories);
    } catch (error) {
      next(error);
    }
  }
}

export default new EloHistoryController();
