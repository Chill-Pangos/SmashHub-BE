import { Request, Response, NextFunction } from "express";
import eloScoreService from "../services/eloScore.service";
import { parsePagination } from "../../../utils/request.helper";

export class EloScoreController {
  async getLeaderboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { offset, limit } = parsePagination(req.query);
      const leaderboard = await eloScoreService.getLeaderboard({ offset, limit });
      res.status(200).json(leaderboard);
    } catch (error) {
      next(error);
    }
  }
}

export default new EloScoreController();
