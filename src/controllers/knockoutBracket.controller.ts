import { Request, Response } from "express";
import knockoutBracketService from "../services/knockoutBracket.service";
import {
  CreateKnockoutBracketDto,
  UpdateKnockoutBracketDto,
  AdvanceWinnerDto,
} from "../dto/knockoutBracket.dto";

export class KnockoutBracketController {
  async create(req: Request, res: Response): Promise<void> {
    try {
      const data: CreateKnockoutBracketDto = req.body;
      const result = await knockoutBracketService.create(data);
      res.status(201).json({
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

  async findAll(req: Request, res: Response): Promise<void> {
    try {
      const skip = parseInt(req.query.skip as string) || 0;
      const limit = parseInt(req.query.limit as string) || 10;
      const result = await knockoutBracketService.findAll(skip, limit);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async findById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await knockoutBracketService.findById(parseInt(id as string));
      if (!result) {
        res.status(404).json({
          success: false,
          message: "Knockout bracket not found",
        });
        return;
      }
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async findByContentId(req: Request, res: Response): Promise<void> {
    try {
      const { contentId } = req.params;
      const result = await knockoutBracketService.findByContentId(
        parseInt(contentId as string)
      );
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const data: UpdateKnockoutBracketDto = req.body;
      const [affectedCount] = await knockoutBracketService.update(
        parseInt(id as string),
        data
      );
      if (affectedCount === 0) {
        res.status(404).json({
          success: false,
          message: "Knockout bracket not found",
        });
        return;
      }
      res.status(200).json({
        success: true,
        message: "Knockout bracket updated successfully",
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const affectedCount = await knockoutBracketService.delete(parseInt(id as string));
      if (affectedCount === 0) {
        res.status(404).json({
          success: false,
          message: "Knockout bracket not found",
        });
        return;
      }
      res.status(200).json({
        success: true,
        message: "Knockout bracket deleted successfully",
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Tạo cấu trúc nhánh đấu knockout
   * POST /knockout-brackets/generate
   * Body: { contentId: number }
   */
  async generateBracket(req: Request, res: Response): Promise<void> {
    try {
      const { contentId } = req.body;
      const result = await knockoutBracketService.generateKnockoutBracket(contentId);
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
      const { bracketId, winnerEntryId }: AdvanceWinnerDto = req.body;
      await knockoutBracketService.advanceWinner(bracketId, winnerEntryId);
      res.status(200).json({
        success: true,
        message: "Winner updated and advanced to the next round successfully",
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Tạo knockout bracket từ kết quả vòng bảng
   * POST /knockout-brackets/generate-from-groups
   * Body: { contentId: number }
   */
  async generateFromGroups(req: Request, res: Response): Promise<void> {
    try {
      const { contentId } = req.body;
      const result = await knockoutBracketService.generateKnockoutBracketFromGroups(contentId);
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
}

export default new KnockoutBracketController();
