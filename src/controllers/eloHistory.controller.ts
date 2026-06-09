import { Request, Response, NextFunction } from "express";
import eloHistoryService from "../services/eloHistory.service";
import { NotFoundError } from "../utils/errors.helper";

export class EloHistoryController {
  async findByUserId(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;
      const offset = Math.max(page - 1, 0) * limit;
      const result = await eloHistoryService.getByUser(
        Number(req.params.userId),
        { offset, limit }
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}

export default new EloHistoryController();
