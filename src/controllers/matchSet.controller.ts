import { Response, NextFunction } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import matchSetService from "../services/matchSet.service";
import { BadRequestError } from "../utils/errors.helper";

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

      const matchSet = await matchSetService.submitFinalSetScore(refereeId, {
        subMatchId,
        entryAScore,
        entryBScore,
      });
      res.status(201).json(matchSet);
    } catch (error) {
      next(error);
    }
  }

  async updateLiveSetScore(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const refereeId = req.userId!;
      const { subMatchId, entryAScore, entryBScore } = req.body;

      if (!subMatchId || entryAScore === undefined || entryBScore === undefined) {
        throw new BadRequestError("subMatchId, entryAScore, and entryBScore are required");
      }

      const result = await matchSetService.updateLiveSetScore(refereeId, {
        subMatchId,
        entryAScore,
        entryBScore,
      });
      res.status(result.isCompleted ? 201 : 200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async submitFinalSetScore(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const refereeId = req.userId!;
      const { subMatchId, setNumber, entryAScore, entryBScore } = req.body;

      if (!subMatchId || entryAScore === undefined || entryBScore === undefined) {
        throw new BadRequestError("subMatchId, entryAScore, and entryBScore are required");
      }

      const matchSet = await matchSetService.submitFinalSetScore(refereeId, {
        subMatchId,
        setNumber,
        entryAScore,
        entryBScore,
      });
      res.status(201).json(matchSet);
    } catch (error) {
      next(error);
    }
  }

  async getLiveSetScore(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const subMatchId = Number(req.params.subMatchId);
      const setNumber =
        req.query.setNumber !== undefined ? Number(req.query.setNumber) : undefined;

      const liveScore = await matchSetService.getLiveSetScore(subMatchId, setNumber);
      res.status(200).json({ liveScore });
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
      if (!Number.isInteger(subMatchId) || subMatchId <= 0) {
        throw new BadRequestError("Invalid sub-match ID");
      }

      const sets = await matchSetService.getSetsBySubMatch(subMatchId);
      res.status(200).json({
        message: "Match sets retrieved successfully",
        subMatchId,
        count: sets.length,
        sets,
      });
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
