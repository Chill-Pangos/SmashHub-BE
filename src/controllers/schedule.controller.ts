import { Request, Response, NextFunction } from "express";
import scheduleService from "../services/schedule.service";
import { BadRequestError } from "../utils/errors";
import { AuthRequest } from "../middlewares/auth.middleware";

export class ScheduleController {
  async generateGroupStageSchedule(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { categoryId } = req.body;

      if (!categoryId) {
        throw new BadRequestError("categoryId is required");
      }
      
      if (!req.userId) {
        throw new BadRequestError("User not authenticated");
      }

      const result = await scheduleService.generateGroupStageSchedule(req.userId, categoryId);

      res.status(201).json({
        success: true,
        message: "Group stage schedule created successfully",
        data: {
          totalSchedules: result.schedules.length,
          totalMatches: result.matches.length,
          schedules: result.schedules,
          matches: result.matches,
        },
      });
    } catch (error) {
      next(error);
    }
  }


  async generateKnockoutSchedule(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { categoryId, roundName } = req.body;

      if (!categoryId) {
        throw new BadRequestError("categoryId is required");
      }

      if (!req.userId) {
        throw new BadRequestError("User not authenticated");
      }

      const result = await scheduleService.generateKnockoutSchedule(req.userId, categoryId, roundName);

      res.status(201).json({
        success: true,
        message: "Knockout schedule generated successfully",
        data: {
          totalSchedules: result.schedules.length,
          totalMatches: result.matches.length,
          schedules: result.schedules,
          matches: result.matches,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Generate schedule (not implemented - use generateGroupStageSchedule instead)
   */
  async generateSchedule(_req: Request, res: Response): Promise<void> {
    res.status(501).json({
      success: false,
      message: "Not implemented. Use /generate-group-stage endpoint instead.",
    });
  }

  /**
   * Update knockout entries (not implemented)
   */
  async updateKnockoutEntries(_req: Request, res: Response): Promise<void> {
    res.status(501).json({
      success: false,
      message: "Not implemented",
    });
  }

  /**
   * Find schedule by ID
   */
  async findById(_req: Request, res: Response): Promise<void> {
    res.status(501).json({
      success: false,
      message: "Not implemented",
    });
  }

  /**
   * Update schedule
   */
  async update(_req: Request, res: Response): Promise<void> {
    res.status(501).json({
      success: false,
      message: "Not implemented",
    });
  }

  /**
   * Delete schedule
   */
  async delete(_req: Request, res: Response): Promise<void> {
    res.status(501).json({
      success: false,
      message: "Not implemented",
    });
  }

  /**
   * Get schedules by tournament category ID
   * GET /schedules/category/:categoryId
   */
  async getSchedulesByCategoryId(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const categoryId = Number(req.params.categoryId);
      if (isNaN(categoryId)) {
        throw new BadRequestError("Invalid category ID");
      }

      const skip = Number(req.query.skip) || 0;
      const limit = Number(req.query.limit) || 10;
      const stage = req.query.stage as 'group' | 'knockout' | undefined;

      // Validate stage if provided
      if (stage && !['group', 'knockout'].includes(stage)) {
        throw new BadRequestError("Invalid stage. Must be 'group' or 'knockout'");
      }

      // Note: The service currently doesn't support stage filtering
      // TODO: Add stage filtering support to the service method
      const result = await scheduleService.getSchedulesByCategory(
        categoryId,
        { skip, limit, stage: stage as any }
      );

      res.status(200).json({
        success: true,
        data: {
          schedules: result.rows,
          total: result.count,
          skip,
          limit,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new ScheduleController();
