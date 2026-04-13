import { Request, Response, NextFunction } from "express";
import scheduleService from "../services/schedule.service";
import { BadRequestError } from "../utils/errors";

export class ScheduleController {
  async findAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const skip = Number(req.query.skip) || 0;
      const limit = Number(req.query.limit) || 10;
      const result = await scheduleService.findAll(skip, limit);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async generateGroupStageSchedule(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { categoryId, startDate } = req.body;

      if (!categoryId || !startDate) {
        throw new BadRequestError("categoryId and startDate are required");
      }

      const start = new Date(startDate);
      if (isNaN(start.getTime())) {
        throw new BadRequestError("Invalid startDate");
      }

      const result = await scheduleService.generateGroupStageSchedule(categoryId, start);

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


  async generateCompleteSchedule(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { categoryId, startDate } = req.body;

      if (!categoryId || !startDate) {
        throw new BadRequestError("categoryId and startDate are required");
      }

      const start = new Date(startDate);
      if (isNaN(start.getTime())) {
        throw new BadRequestError("Invalid startDate");
      }

      const result = await scheduleService.generateCompleteSchedule(categoryId, start);

      res.status(201).json({
        success: true,
        message: "Complete schedule generated successfully",
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


  async generateKnockoutOnlySchedule(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { categoryId, startDate } = req.body;

      if (!categoryId || !startDate) {
        throw new BadRequestError("categoryId and startDate are required");
      }

      const start = new Date(startDate);
      if (isNaN(start.getTime())) {
        throw new BadRequestError("Invalid startDate");
      }

      const result = await scheduleService.generateKnockoutOnlySchedule(categoryId, start);

      res.status(201).json({
        success: true,
        message: "Knockout-only schedule generated successfully",
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


  async generateKnockoutStageSchedule(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { categoryId, startDate } = req.body;

      if (!categoryId || !startDate) {
        throw new BadRequestError("categoryId and startDate are required");
      }

      const start = new Date(startDate);
      if (isNaN(start.getTime())) {
        throw new BadRequestError("Invalid startDate");
      }

      const result = await scheduleService.generateKnockoutStageSchedule(categoryId, start);

      res.status(201).json({
        success: true,
        message: "Knockout stage schedule created successfully",
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
      const result = await scheduleService.findSchedulesByCategoryId(
        categoryId,
        skip,
        limit
      );

      res.status(200).json({
        success: true,
        data: {
          schedules: result.schedules,
          total: result.total,
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
