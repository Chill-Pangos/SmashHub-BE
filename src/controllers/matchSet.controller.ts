import { Response, NextFunction } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import matchSetService from "../services/matchSet.service";
import { BadRequestError } from "../utils/errors";

export class MatchSetController {
  /**
   * Tạo set với điểm số
   * POST /match-sets
   */
  async createSet(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const refereeId = req.userId!;
      const { subMatchId, entryAScore, entryBScore } = req.body;

      if (!subMatchId || entryAScore === undefined || entryBScore === undefined) {
        throw new BadRequestError("subMatchId, entryAScore, and entryBScore are required");
      }

      const matchSet = await matchSetService.createSet(refereeId, {
        subMatchId,
        entryAScore,
        entryBScore,
      });
      res.status(201).json(matchSet);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Cập nhật điểm set
   * PUT /match-sets/:id
   */
  async updateSetScore(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const refereeId = req.userId!;
      const setId = Number(req.params.id);
      const { entryAScore, entryBScore } = req.body;

      if (entryAScore === undefined || entryBScore === undefined) {
        throw new BadRequestError("entryAScore and entryBScore are required");
      }

      const matchSet = await matchSetService.updateSetScore(
        refereeId,
        setId,
        entryAScore,
        entryBScore
      );
      res.status(200).json(matchSet);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Lấy danh sách sets theo subMatchId
   * GET /match-sets/sub-match/:subMatchId
   */
  async getBySubMatchId(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const subMatchId = Number(req.params.subMatchId);
      const skip = Number(req.query.skip) || 0;
      const limit = Number(req.query.limit) || 10;
      const result = await matchSetService.getSetsBySubMatch(subMatchId, { skip, limit });
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Lấy chi tiết set theo ID
   * GET /match-sets/:id
   */
  async getById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const setId = Number(req.params.id);
      const matchSet = await matchSetService.getSetById(setId);
      res.status(200).json(matchSet);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Xóa set
   * DELETE /match-sets/:id
   */
  async deleteSet(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const refereeId = req.userId!;
      const setId = Number(req.params.id);

      await matchSetService.deleteSet(refereeId, setId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

export default new MatchSetController();
