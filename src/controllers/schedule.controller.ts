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

  /**
   * Get schedules by tournament content ID
   * GET /schedules/content/:contentId
   */
  async getSchedulesByContentId(req: Request, res: Response): Promise<void> {
    try {
      const contentId = Number(req.params.contentId);
      if (isNaN(contentId)) {
        res.status(400).json({
          success: false,
          message: "Invalid content ID",
        });
        return;
      }

      const skip = Number(req.query.skip) || 0;
      const limit = Number(req.query.limit) || 10;
      const stage = req.query.stage as 'group' | 'knockout' | undefined;

      // Validate stage if provided
      if (stage && !['group', 'knockout'].includes(stage)) {
        res.status(400).json({
          success: false,
          message: "Invalid stage. Must be 'group' or 'knockout'",
        });
        return;
      }

      const result = await scheduleService.findSchedulesByContentId(
        contentId,
        skip,
        limit,
        stage
      );

      res.status(200).json({
        success: true,
        data: {
          schedules: result.schedules,
          count: result.count,
          skip,
          limit,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || "Error fetching schedules",
      });
    }
  }
}

export default new ScheduleController();
