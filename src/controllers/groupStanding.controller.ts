import { Request, Response } from "express";
import groupStandingService from "../services/groupStanding.service";
import {
  CreateGroupStandingDto,
  UpdateGroupStandingDto,
  GenerateGroupPlaceholdersDto,
  SaveGroupAssignmentsDto,
  RandomDrawEntriesDto,
  RandomDrawAndSaveDto,
  CalculateStandingsDto,
} from "../dto/groupStanding.dto";

export class GroupStandingController {
  async create(req: Request, res: Response): Promise<void> {
    try {
      const data: CreateGroupStandingDto = req.body;
      const result = await groupStandingService.create(data);
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
      const result = await groupStandingService.findAll(skip, limit);
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
      const result = await groupStandingService.findById(parseInt(id as string));
      if (!result) {
        res.status(404).json({
          success: false,
          message: "Group standing not found",
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
      const skip = parseInt(req.query.skip as string) || 0;
      const limit = parseInt(req.query.limit as string) || 100;
      const result = await groupStandingService.findByContentId(
        parseInt(contentId as string),
        skip,
        limit
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
      const data: UpdateGroupStandingDto = req.body;
      const [affectedCount] = await groupStandingService.update(
        parseInt(id as string),
        data
      );
      if (affectedCount === 0) {
        res.status(404).json({
          success: false,
          message: "Group standing not found",
        });
        return;
      }
      res.status(200).json({
        success: true,
        message: "Group standing updated successfully",
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
      const affectedCount = await groupStandingService.delete(parseInt(id as string));
      if (affectedCount === 0) {
        res.status(404).json({
          success: false,
          message: "Group standing not found",
        });
        return;
      }
      res.status(200).json({
        success: true,
        message: "Group standing deleted successfully",
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Tạo danh sách bảng đấu placeholder
   * POST /group-standings/generate-placeholders
   * Body: { contentId: number }
   */
  async generatePlaceholders(req: Request, res: Response): Promise<void> {
    try {
      const { contentId }: GenerateGroupPlaceholdersDto = req.body;
      const result = await groupStandingService.generateGroupPlaceholders(
        contentId
      );
      res.status(200).json({
        success: true,
        data: result,
        message: "Danh sách bảng đấu đã được tạo thành công",
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Bốc thăm ngẫu nhiên entries vào các bảng
   * POST /group-standings/random-draw
   * Body: { contentId: number }
   */
  async randomDraw(req: Request, res: Response): Promise<void> {
    try {
      const { contentId }: RandomDrawEntriesDto = req.body;
      const result = await groupStandingService.randomDrawEntries(contentId);
      res.status(200).json({
        success: true,
        data: result,
        message: "Bốc thăm thành công",
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Lưu kết quả phân bổ entries vào các bảng
   * POST /group-standings/save-assignments
   * Body: { contentId: number, groupAssignments: [{groupName: string, entryIds: number[]}] }
   */
  async saveAssignments(req: Request, res: Response): Promise<void> {
    try {
      const { contentId, groupAssignments }: SaveGroupAssignmentsDto = req.body;
      const result = await groupStandingService.saveGroupAssignments(
        contentId,
        groupAssignments
      );
      res.status(201).json({
        success: true,
        data: result,
        message: "Lưu phân bổ bảng đấu thành công",
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Bốc thăm và lưu luôn vào database
   * POST /group-standings/random-draw-and-save
   * Body: { contentId: number }
   */
  async randomDrawAndSave(req: Request, res: Response): Promise<void> {
    try {
      const { contentId }: RandomDrawAndSaveDto = req.body;
      const result = await groupStandingService.randomDrawAndSave(contentId);
      res.status(201).json({
        success: true,
        data: result,
        message: "Bốc thăm và lưu thành công",
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Tính toán standings (placeholder method - needs implementation)
   */
  async calculateStandings(req: Request, res: Response): Promise<void> {
    try {
      const { contentId, groupName }: CalculateStandingsDto = req.body;
      await groupStandingService.calculateGroupStandings(contentId, groupName);
      
      // Lấy standings đã được tính toán
      const result = await groupStandingService.findByContentId(contentId, 0, 100);
      
      res.status(200).json({
        success: true,
        data: result,
        message: "Đã tính toán standings thành công",
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Get standings (placeholder method - needs implementation)
   */
  async getStandings(req: Request, res: Response): Promise<void> {
    try {
      const { contentId } = req.params;
      const groupName = req.query.groupName as string;
      const result = await groupStandingService.findByContentId(
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

  /**
   * Get qualified teams (placeholder method - needs implementation)
   */
  async getQualifiedTeams(req: Request, res: Response): Promise<void> {
    try {
      const { contentId } = req.params;
      const teamsPerGroup = parseInt(req.query.teamsPerGroup as string) || 2;
      // TODO: Implement get qualified teams logic
      res.status(200).json({
        success: true,
        message: "Get qualified teams - to be implemented",
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
}

export default new GroupStandingController();
