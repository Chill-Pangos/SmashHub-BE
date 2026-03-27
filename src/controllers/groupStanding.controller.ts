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

  async findByCategoryId(req: Request, res: Response): Promise<void> {
    try {
      const { categoryId } = req.params;
      const result = await groupStandingService.findByCategoryId(
        parseInt(categoryId as string)
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

      // Check if record exists first
      const existing = await groupStandingService.findById(parseInt(id as string));
      if (!existing) {
        res.status(404).json({
          success: false,
          message: "Group standing not found",
        });
        return;
      }

      await groupStandingService.update(parseInt(id as string), data);

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

      // Check if record exists first
      const existing = await groupStandingService.findById(parseInt(id as string));
      if (!existing) {
        res.status(404).json({
          success: false,
          message: "Group standing not found",
        });
        return;
      }

      await groupStandingService.delete(parseInt(id as string));

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
   * Body: { categoryId: number, numberOfGroups: number, maxEntriesPerGroup: number }
   */
  async generatePlaceholders(req: Request, res: Response): Promise<void> {
    try {
      const data: GenerateGroupPlaceholdersDto = req.body;
      const result = await groupStandingService.generateGroupPlaceholders(data);
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
   * Body: { categoryId: number, entries: number[], numberOfGroups: number }
   */
  async randomDraw(req: Request, res: Response): Promise<void> {
    try {
      const data: RandomDrawEntriesDto = req.body;
      const result = await groupStandingService.randomDrawEntries(data);
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
   * Body: { categoryId: number, assignments: { [key: string]: number[] } }
   */
  async saveAssignments(req: Request, res: Response): Promise<void> {
    try {
      const data: SaveGroupAssignmentsDto = req.body;
      const result = await groupStandingService.saveGroupAssignments(data);
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
   * Bốc thăm ngẫu nhiên và lưu kết quả
   * POST /group-standings/random-draw-and-save
   * Body: { categoryId: number }
   */
  async randomDrawAndSave(req: Request, res: Response): Promise<void> {
    try {
      const data: RandomDrawAndSaveDto = req.body;
      const result = await groupStandingService.randomDrawAndSave(data);
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
      const { categoryId }: CalculateStandingsDto = req.body;
      const calculationResult = await groupStandingService.calculateGroupStandings(categoryId);

      // Lấy standings đã được tính toán
      const result = await groupStandingService.findByCategoryId(categoryId);

      res.status(200).json({
        success: true,
        data: result,
        calculation: calculationResult,
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
      const { categoryId } = req.params;
      const groupName = req.query.groupName as string;
      const result = await groupStandingService.findByCategoryId(
        parseInt(categoryId as string)
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
      const { categoryId } = req.params;
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
