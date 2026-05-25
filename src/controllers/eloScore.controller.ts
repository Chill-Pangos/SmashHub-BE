import { Request, Response, NextFunction } from "express";
import eloScoreService from "../services/eloScore.service";
import { NotFoundError } from "../utils/errors.helper";

export class EloScoreController {
  async getLeaderboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;
      const offset = Math.max(page - 1, 0) * limit;
      const leaderboard = await eloScoreService.getLeaderboard({ offset, limit });
      res.status(200).json(leaderboard);
    } catch (error) {
      next(error);
    }
  }
}

export default new EloScoreController();
