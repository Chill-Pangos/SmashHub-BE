import { Request, Response } from "express";
import scheduleService from "../services/schedule.service";

export class ScheduleController {
  async findAll(req: Request, res: Response): Promise<void> {
    try {
      const result = await scheduleService.findAll();
      res.status(200).json({
        success: true,
        data: result,
      });
    }
    catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
  /**
   * Tạo schedule cho vòng bảng
   * POST /schedules/generate-group-stage
   * Body: { contentId: number, startDate: string }
   */
  async generateGroupStageSchedule(req: Request, res: Response): Promise<void> {
    try {
      const { contentId, startDate } = req.body;
      
      if (!contentId || !startDate) {
        res.status(400).json({
          success: false,
          message: "contentId and startDate are required",
        });
        return;
      }

      const start = new Date(startDate);
      if (isNaN(start.getTime())) {
        res.status(400).json({
          success: false,
          message: "Invalid startDate",
        });
        return;
      }

      const result = await scheduleService.generateGroupStageSchedule(contentId, start);
      
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
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || "Error creating schedule",
      });
    }
  }

  /**
   * Tạo lịch thi đấu hoàn chỉnh (group + knockout)
   * POST /schedules/generate-complete
   * Body: { contentId: number, startDate: string, endDate: string }
   */
  async generateCompleteSchedule(req: Request, res: Response): Promise<void> {
    try {
      const { contentId } = req.body;
      
      if (!contentId) {
        res.status(400).json({
          success: false,
          message: "contentId is required",
        });
        return;
      }

      const result = await scheduleService.generateCompleteSchedule(contentId);
      
      res.status(201).json({
        success: true,
        message: "Complete schedule generated successfully",
        data: {
          groupStandings: result.groupStandings.length,
          groupSchedules: result.groupSchedules.length,
          groupMatches: result.groupMatches.length,
          knockoutBrackets: result.knockoutBrackets.length,
          knockoutSchedules: result.knockoutSchedules.length,
          knockoutMatches: result.knockoutMatches.length,
          details: result,
        },
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || "Error generating complete schedule",
      });
    }
  }

  /**
   * Tạo schedule cho nội dung chỉ có knockout stage (không có group stage)
   * POST /schedules/generate-knockout-only
   * Body: { contentId: number }
   */
  async generateKnockoutOnlySchedule(req: Request, res: Response): Promise<void> {
    try {
      const { contentId } = req.body;
      
      if (!contentId) {
        res.status(400).json({
          success: false,
          message: "contentId is required",
        });
        return;
      }

      const result = await scheduleService.generateKnockoutOnlySchedule(contentId);
      
      res.status(201).json({
        success: true,
        message: "Knockout-only schedule generated successfully",
        data: {
          knockoutBrackets: result.knockoutBrackets.length,
          knockoutSchedules: result.knockoutSchedules.length,
          knockoutMatches: result.knockoutMatches.length,
          details: result,
        },
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || "Error generating knockout-only schedule",
      });
    }
  }

  /**
   * Tạo schedule cho vòng knockout
   * POST /schedules/generate-knockout-stage
   * Body: { contentId: number, startDate: string }
   */
  async generateKnockoutStageSchedule(req: Request, res: Response): Promise<void> {
    try {
      const { contentId, startDate } = req.body;
      
      if (!contentId || !startDate) {
        res.status(400).json({
          success: false,
          message: "contentId and startDate are required",
        });
        return;
      }

      const start = new Date(startDate);
      if (isNaN(start.getTime())) {
        res.status(400).json({
          success: false,
          message: "Invalid startDate",
        });
        return;
      }

      const result = await scheduleService.generateKnockoutStageSchedule(contentId, start);
      
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
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || "Error creating knockout schedule",
      });
    }
  }

  /**
   * Generate schedule (not implemented - use generateGroupStageSchedule instead)
   */
  async generateSchedule(req: Request, res: Response): Promise<void> {
    res.status(501).json({
      success: false,
      message: "Not implemented. Use /generate-group-stage endpoint instead.",
    });
  }

  /**
   * Update knockout entries (not implemented)
   */
  async updateKnockoutEntries(req: Request, res: Response): Promise<void> {
    res.status(501).json({
      success: false,
      message: "Not implemented",
    });
  }

  /**
   * Find schedule by ID
   */
  async findById(req: Request, res: Response): Promise<void> {
    res.status(501).json({
      success: false,
      message: "Not implemented",
    });
  }

  /**
   * Update schedule
   */
  async update(req: Request, res: Response): Promise<void> {
    res.status(501).json({
      success: false,
      message: "Not implemented",
    });
  }

  /**
   * Delete schedule
   */
  async delete(req: Request, res: Response): Promise<void> {
    res.status(501).json({
      success: false,
      message: "Not implemented",
    });
  }
}

export default new ScheduleController();
