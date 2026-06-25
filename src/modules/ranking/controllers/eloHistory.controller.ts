import { Request, Response, NextFunction } from "express";
import eloHistoryService from "../services/eloHistory.service";
import { parsePagination } from "../../../utils/request.helper";

export class EloHistoryController {
  async findByUserId(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { offset, limit } = parsePagination(req.query);
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
