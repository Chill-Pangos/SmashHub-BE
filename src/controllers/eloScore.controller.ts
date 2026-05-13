import { Request, Response, NextFunction } from "express";
import eloScoreService from "../services/eloScore.service";
import { NotFoundError } from "../utils/errors";

export class EloScoreController {
  async getLeaderboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const skip = Number(req.query.skip) || 0;
      const limit = Number(req.query.limit) || 10;
      const leaderboard = await eloScoreService.getLeaderboard({ skip, limit });
      res.status(200).json(leaderboard);
    } catch (error) {
      next(error);
    }
  }
}

export default new EloScoreController();
