import { Request, Response } from "express";
import knockoutBracketService from "../services/knockoutBracket.service";
import {
  CreateKnockoutBracketDto,
  UpdateKnockoutBracketDto,
  AdvanceWinnerDto,
} from "../dto/knockoutBracket.dto";

export class KnockoutBracketController {
  

  /**
   * Generate knockout bracket từ danh sách entries (không có vòng bảng)
   * POST /knockout-brackets/generate
   * Body: { categoryId: number }
   */
  async generateFromEntries(req: Request, res: Response): Promise<void> {
    try {
      const { categoryId } = req.body;
      const chiefRefereeId = (req as any).user?.id;

      if (!chiefRefereeId) {
        res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
        return;
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
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Advance winner sang vòng tiếp theo
   * POST /knockout-brackets/advance-winner
   * Body: { bracketId: number, winnerEntryId: number }
   */
  async advanceWinner(req: Request, res: Response): Promise<void> {
    try {
      const { bracketId, winnerEntryId } = req.body;
      const chiefRefereeId = (req as any).user?.id;

      if (!chiefRefereeId) {
        res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
        return;
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
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Generate knockout bracket từ kết quả vòng bảng
   * POST /knockout-brackets/generate-from-group-stage
   * Body: { categoryId: number, qualifiersPerGroup?: number }
   */
  async generateFromGroupStage(req: Request, res: Response): Promise<void> {
    try {
      const { categoryId, qualifiersPerGroup } = req.body;
      const chiefRefereeId = (req as any).user?.id;

      if (!chiefRefereeId) {
        res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
        return;
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
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Lấy brackets theo entry ID hoặc entry name
   * GET /knockout-brackets/category/:categoryId/entry?entryId=5 hoặc ?entryName=Team+Alpha
   */
  async getBracketsByEntry(req: Request, res: Response): Promise<void> {
    try {
      const { categoryId } = req.params;
      const { entryId, entryName } = req.query;

      const filter: { entryId?: number; entryName?: string } = {};

      if (entryId) filter.entryId = parseInt(entryId as string);
      if (entryName) filter.entryName = entryName as string;

      const result = await knockoutBracketService.getBracketsByEntry(
        parseInt(categoryId as string),
        filter
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Lấy toàn bộ bracket tree của 1 category
   * GET /knockout-brackets/category/:categoryId/tree
   */
  async getBracketTree(req: Request, res: Response): Promise<void> {
    try {
      const { categoryId } = req.params;
      const result = await knockoutBracketService.getBracketTree(
        parseInt(categoryId as string)
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Validate bracket integrity trước khi bắt đầu giải
   * POST /knockout-brackets/validate
   * Body: { categoryId: number }
   */
  async validateBracketIntegrity(req: Request, res: Response): Promise<void> {
    try {
      const { categoryId } = req.body;
      const chiefRefereeId = (req as any).user?.id;

      if (!chiefRefereeId) {
        res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
        return;
      }

      const result = await knockoutBracketService.validateBracketIntegrity(
        chiefRefereeId,
        categoryId
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Lấy kết quả xếp hạng cuối giải knockout
   * GET /knockout-brackets/category/:categoryId/standings
   */
  async getStandings(req: Request, res: Response): Promise<void> {
    try {
      const { categoryId } = req.params;
      const result = await knockoutBracketService.getStandings(
        parseInt(categoryId as string)
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
}

export default new KnockoutBracketController();
