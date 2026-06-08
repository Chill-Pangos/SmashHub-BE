import { Request, Response, NextFunction } from "express";
import knockoutBracketService from "../services/knockoutBracket.service";
import { AuthRequest } from "../middlewares/auth.middleware";
import { UnauthorizedError } from "../utils/errors.helper";

export class KnockoutBracketController {
  private getAuthenticatedUserId(req: AuthRequest, next: NextFunction): number | null {
    if (req.userId == null) {
      next(new UnauthorizedError("Unauthorized"));
      return null;
    }
    return req.userId;
  }

  /**
   * Tạo bracket placeholders toàn TBD dựa trên số bảng hiện có.
   * Dùng để tạo schedule trước khi vòng bảng kết thúc.
   * POST /knockout-brackets/placeholders
   * Body: { categoryId: number }
   */
  async previewPlaceholders(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const organizerId = this.getAuthenticatedUserId(req, next);
      if (organizerId == null) return;

      const { categoryId } = req.body;

      const result = await knockoutBracketService.previewPlaceholders(
        organizerId,
        Number(categoryId),
      );

      res.status(200).json({
        success: true,
        data: result,
        message: "Bracket placeholders preview generated successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  private parseEntryIds(value: unknown): number[] | undefined {
    if (value == null) return undefined;
    if (!Array.isArray(value)) {
      throw new Error("entryIds must be an array of positive integers");
    }

    const entryIds = value.map((id) => Number(id));
    if (entryIds.some((id) => !Number.isInteger(id) || id <= 0)) {
      throw new Error("entryIds must be an array of positive integers");
    }

    return entryIds;
  }

  async generatePlaceholders(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const chiefRefereeId = this.getAuthenticatedUserId(req, next);
      if (chiefRefereeId == null) return;

      const { categoryId } = req.body;

      const result = await knockoutBracketService.generatePlaceholders(
        chiefRefereeId,
        Number(categoryId),
      );

      res.status(201).json({
        success: true,
        data: result,
        message: "Bracket placeholders generated successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Fill entryId thật vào bracket round 1 sau khi vòng bảng kết thúc.
   * POST /knockout-brackets/fill-qualifiers
   * Body: { categoryId: number }
   */
  async previewFillQualifiers(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const organizerId = this.getAuthenticatedUserId(req, next);
      if (organizerId == null) return;

      const { categoryId } = req.body;

      const result = await knockoutBracketService.previewFillQualifiers(
        organizerId,
        Number(categoryId),
      );

      res.status(200).json({
        success: true,
        data: result,
        message: "Qualifiers preview generated successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  async fillQualifiers(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const chiefRefereeId = this.getAuthenticatedUserId(req, next);
      if (chiefRefereeId == null) return;

      const { categoryId, entryIds } = req.body;

      const result = await knockoutBracketService.fillQualifiers(
        chiefRefereeId,
        Number(categoryId),
        this.parseEntryIds(entryIds),
      );

      res.status(200).json({
        success: true,
        data: result,
        message: "Qualifiers filled into bracket successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Generate knockout bracket từ danh sách entries (không có vòng bảng).
   * POST /knockout-brackets/from-entries
   * Body: { categoryId: number }
   */
  async previewFromEntries(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const organizerId = this.getAuthenticatedUserId(req, next);
      if (organizerId == null) return;

      const { categoryId } = req.body;

      const result = await knockoutBracketService.previewFromEntries(
        organizerId,
        Number(categoryId),
      );

      res.status(200).json({
        success: true,
        data: result,
        message: "Knockout bracket preview generated successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  async generateFromEntries(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const chiefRefereeId = this.getAuthenticatedUserId(req, next);
      if (chiefRefereeId == null) return;

      const { categoryId, entryIds } = req.body;

      const result = await knockoutBracketService.generateFromEntries(
        chiefRefereeId,
        Number(categoryId),
        this.parseEntryIds(entryIds),
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
   * Advance winner sang vòng tiếp theo.
   * POST /knockout-brackets/:id/advance-winner
   * Body: { winnerEntryId: number }
   */
  async advanceWinner(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const chiefRefereeId = this.getAuthenticatedUserId(req, next);
      if (chiefRefereeId == null) return;

      const bracketId = Number(req.params.id);
      const { winnerEntryId } = req.body;

      const result = await knockoutBracketService.advanceWinner(
        chiefRefereeId,
        bracketId,
        Number(winnerEntryId),
      );

      res.status(200).json({
        success: true,
        data: result,
        message: "Winner advanced to the next round successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Lấy brackets theo entryId hoặc entryName.
   * GET /knockout-brackets/category/:categoryId/entry?entryId=5 hoặc ?entryName=Team+Alpha
   */
  async getBracketsByEntry(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const categoryId = Number(req.params.categoryId);
      const { entryId, entryName } = req.query;
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;
      const offset = Math.max(page - 1, 0) * limit;

      const filter: { entryId?: number; entryName?: string } = {};
      if (entryId) filter.entryId = Number(entryId);
      if (entryName) filter.entryName = entryName as string;

      const result = await knockoutBracketService.getBracketsByEntry(
        categoryId,
        filter,
        { offset, limit },
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
   * Lấy toàn bộ bracket tree của 1 category.
   * GET /knockout-brackets/tree/:categoryId
   */
  async getBracketTree(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const categoryId = Number(req.params.categoryId);
      const result = await knockoutBracketService.getBracketTree(categoryId);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Validate bracket integrity trước khi bắt đầu giải.
   * GET /knockout-brackets/validate/:categoryId
   */
  async validateBracketIntegrity(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const chiefRefereeId = this.getAuthenticatedUserId(req, next);
      if (chiefRefereeId == null) return;

      const categoryId = Number(req.params.categoryId);

      const result = await knockoutBracketService.validateBracketIntegrity(
        chiefRefereeId,
        categoryId,
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
   * Lấy kết quả xếp hạng cuối giải knockout.
   * GET /knockout-brackets/standings/:categoryId
   */
  async getStandings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const categoryId = Number(req.params.categoryId);
      const result = await knockoutBracketService.getStandings(categoryId);

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
