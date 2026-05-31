import { Request, Response, NextFunction } from "express";
import knockoutBracketService from "../services/knockoutBracket.service";
import {
  CreateKnockoutBracketDto,
  UpdateKnockoutBracketDto,
  AdvanceWinnerDto,
} from "../dto/knockoutBracket.dto";
import { UnauthorizedError } from "../utils/errors.helper";

export class KnockoutBracketController {
  /**
   * Generate knockout bracket từ danh sách entries (không có vòng bảng)
   * POST /knockout-brackets/generate
   * Body: { categoryId: number }
   */
  async generateFromEntries(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { categoryId } = req.body;
      const chiefRefereeId = (req as any).user?.id;

      if (!chiefRefereeId) {
        throw new UnauthorizedError("Unauthorized");
      }

      const result = await knockoutBracketService.generateFromEntries(
        chiefRefereeId,
        categoryId
      );
      res.status(201).json({
        success: true,
        data: result,
        message: "Knockout bracket generated successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Advance winner sang vòng tiếp theo
   * POST /knockout-brackets/:id/advance-winner
   * Body: { winnerEntryId: number }
   */
  async advanceWinner(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { winnerEntryId } = req.body;
      const chiefRefereeId = (req as any).user?.id;
      const bracketId = Number(id);

      if (!chiefRefereeId) {
        throw new UnauthorizedError("Unauthorized");
      }

      const result = await knockoutBracketService.advanceWinner(
        chiefRefereeId,
        bracketId,
        winnerEntryId
      );

      res.status(200).json({
        success: true,
        message: "Winner updated and advanced to the next round successfully",
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Generate knockout bracket từ kết quả vòng bảng
   * POST /knockout-brackets/generate-from-group-stage
   * Body: { categoryId: number, qualifiersPerGroup?: number }
   */
  async generateFromGroupStage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { categoryId, qualifiersPerGroup } = req.body;
      const chiefRefereeId = (req as any).user?.id;

      if (!chiefRefereeId) {
        throw new UnauthorizedError("Unauthorized");
      }

      const result = await knockoutBracketService.generateFromGroupStage(
        chiefRefereeId,
        categoryId,
        qualifiersPerGroup
      );
      res.status(201).json({
        success: true,
        data: result,
        message: "Knockout bracket generated from group stage results successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Lấy brackets theo entry ID hoặc entry name
   * GET /knockout-brackets/category/:categoryId/entry?entryId=5 hoặc ?entryName=Team+Alpha
   */
  async getBracketsByEntry(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { categoryId } = req.params;
      const { entryId, entryName } = req.query;
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;
      const offset = Math.max(page - 1, 0) * limit;

      const filter: { entryId?: number; entryName?: string } = {};

      if (entryId) filter.entryId = parseInt(entryId as string);
      if (entryName) filter.entryName = entryName as string;

      const result = await knockoutBracketService.getBracketsByEntry(
        parseInt(categoryId as string),
        filter,
        { offset, limit }
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Lấy toàn bộ bracket tree của 1 category
   * GET /knockout-brackets/category/:categoryId/tree
   */
  async getBracketTree(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { categoryId } = req.params;
      const result = await knockoutBracketService.getBracketTree(
        parseInt(categoryId as string)
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Validate bracket integrity trước khi bắt đầu giải
   * GET /knockout-brackets/validate/:categoryId
   */
  async validateBracketIntegrity(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { categoryId } = req.params;
      const chiefRefereeId = (req as any).user?.id;
      const parsedCategoryId = Number(categoryId);

      if (!chiefRefereeId) {
        throw new UnauthorizedError("Unauthorized");
      }

      const result = await knockoutBracketService.validateBracketIntegrity(
        chiefRefereeId,
        parsedCategoryId
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Lấy kết quả xếp hạng cuối giải knockout
   * GET /knockout-brackets/category/:categoryId/standings
   */
  async getStandings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { categoryId } = req.params;
      const result = await knockoutBracketService.getStandings(
        parseInt(categoryId as string)
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new KnockoutBracketController();
