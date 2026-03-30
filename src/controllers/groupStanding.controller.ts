import { Request, Response } from "express";
import groupStandingService, {
  GroupAssignment,
} from "../services/groupStanding.service";
import GroupStanding from "../models/groupStanding.model";
import Entry from "../models/entry.model";
import { AuthRequest } from "../middlewares/auth.middleware";

type CategoryBody = {
  categoryId?: unknown;
};

type SaveAssignmentsBody = {
  categoryId?: unknown;
  groupAssignments?: unknown;
  assignments?: unknown;
};

type CalculateStandingsBody = {
  categoryId?: unknown;
  groupName?: unknown;
};

export class GroupStandingController {
  private getAuthenticatedUserId(req: AuthRequest, res: Response): number | null {
    if (req.userId == null) {
      res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
      return null;
    }

    return req.userId;
  }

  private parsePositiveInt(value: unknown): number | null {
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      return null;
    }

    return parsed;
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    return "Unexpected error";
  }

  private normalizeAssignments(rawAssignments: unknown): GroupAssignment[] | null {
    if (!Array.isArray(rawAssignments)) {
      return null;
    }

    const assignments: GroupAssignment[] = [];

    for (const item of rawAssignments) {
      if (typeof item !== "object" || item == null) {
        return null;
      }

      const maybeGroup = item as { groupName?: unknown; entryIds?: unknown };
      const groupName =
        typeof maybeGroup.groupName === "string"
          ? maybeGroup.groupName.trim()
          : "";
      if (!groupName) {
        return null;
      }

      if (!Array.isArray(maybeGroup.entryIds)) {
        return null;
      }

      const entryIds: number[] = [];
      for (const rawId of maybeGroup.entryIds) {
        const entryId = this.parsePositiveInt(rawId);
        if (entryId == null) {
          return null;
        }
        entryIds.push(entryId);
      }

      assignments.push({ groupName, entryIds });
    }

    return assignments;
  }

  private async fetchStandings(
    categoryId: number,
    groupName?: string
  ): Promise<GroupStanding[]> {
    const where: { categoryId: number; groupName?: string } = { categoryId };
    if (groupName) {
      where.groupName = groupName;
    }

    return await GroupStanding.findAll({
      where,
      include: [{ model: Entry, as: "entry" }],
      order: [
        ["groupName", "ASC"],
        ["position", "ASC"],
        ["matchesWon", "DESC"],
        ["setsDiff", "DESC"],
      ],
    });
  }

  private async getCategoryGroups(categoryId: number): Promise<string[]> {
    const rows = await GroupStanding.findAll({
      where: { categoryId },
      attributes: ["groupName"],
      group: ["groupName"],
      order: [["groupName", "ASC"]],
    });

    return rows.map((row) => row.groupName);
  }

  /**
   * Tạo preview phân bảng ngẫu nhiên (chưa lưu DB)
   */
  async generatePlaceholders(req: AuthRequest, res: Response): Promise<void> {
    try {
      const chiefRefereeId = this.getAuthenticatedUserId(req, res);
      if (chiefRefereeId == null) {
        return;
      }

      const body = req.body as CategoryBody;
      const categoryId = this.parsePositiveInt(body.categoryId);
      if (categoryId == null) {
        res.status(400).json({
          success: false,
          message: "categoryId must be a positive integer",
        });
        return;
      }

      const result = await groupStandingService.generateGroupPreview(
        chiefRefereeId,
        categoryId
      );
      res.status(200).json({
        success: true,
        data: result,
        message: "Group preview generated successfully",
      });
    } catch (error: unknown) {
      res.status(400).json({
        success: false,
        message: this.getErrorMessage(error),
      });
    }
  }

  /**
   * Alias cho generatePlaceholders để giữ tương thích endpoint cũ
   */
  async randomDraw(req: AuthRequest, res: Response): Promise<void> {
    await this.generatePlaceholders(req, res);
  }

  /**
   * Lưu kết quả phân bảng vào DB
   */
  async saveAssignments(req: AuthRequest, res: Response): Promise<void> {
    try {
      const chiefRefereeId = this.getAuthenticatedUserId(req, res);
      if (chiefRefereeId == null) {
        return;
      }

      const body = req.body as SaveAssignmentsBody;
      const categoryId = this.parsePositiveInt(body.categoryId);
      if (categoryId == null) {
        res.status(400).json({
          success: false,
          message: "categoryId must be a positive integer",
        });
        return;
      }

      const rawAssignments = body.groupAssignments ?? body.assignments;
      const assignments = this.normalizeAssignments(rawAssignments);
      if (assignments == null) {
        res.status(400).json({
          success: false,
          message: "groupAssignments must be an array of { groupName, entryIds[] }",
        });
        return;
      }

      const result = await groupStandingService.saveGroupAssignments(
        chiefRefereeId,
        categoryId,
        assignments
      );

      res.status(201).json({
        success: true,
        data: result,
        message: "Group assignments saved successfully",
      });
    } catch (error: unknown) {
      res.status(400).json({
        success: false,
        message: this.getErrorMessage(error),
      });
    }
  }

  /**
   * Cập nhật standings sau khi 1 trận group stage hoàn thành
   */
  async updateAfterMatch(req: AuthRequest, res: Response): Promise<void> {
    try {
      const chiefRefereeId = this.getAuthenticatedUserId(req, res);
      if (chiefRefereeId == null) {
        return;
      }

      const matchId = this.parsePositiveInt(req.params.matchId);
      if (matchId == null) {
        res.status(400).json({
          success: false,
          message: "matchId must be a positive integer",
        });
        return;
      }

      await groupStandingService.updateStandingsAfterMatch(chiefRefereeId, matchId);

      res.status(200).json({
        success: true,
        message: "Group standings updated successfully",
      });
    } catch (error: unknown) {
      res.status(400).json({
        success: false,
        message: this.getErrorMessage(error),
      });
    }
  }

  /**
   * Tính lại vị trí trong bảng
   */
  async calculateStandings(req: AuthRequest, res: Response): Promise<void> {
    try {
      const chiefRefereeId = this.getAuthenticatedUserId(req, res);
      if (chiefRefereeId == null) {
        return;
      }

      const body = req.body as CalculateStandingsBody;
      const categoryId = this.parsePositiveInt(body.categoryId);
      if (categoryId == null) {
        res.status(400).json({
          success: false,
          message: "categoryId must be a positive integer",
        });
        return;
      }

      const groupName =
        typeof body.groupName === "string" && body.groupName.trim().length > 0
          ? body.groupName.trim()
          : undefined;

      const groupsToRecalculate = groupName
        ? [groupName]
        : await this.getCategoryGroups(categoryId);

      if (groupsToRecalculate.length === 0) {
        res.status(404).json({
          success: false,
          message: "No group standings found for this category",
        });
        return;
      }

      for (const currentGroupName of groupsToRecalculate) {
        await groupStandingService.recalculatePositions(categoryId, currentGroupName);
      }

      const result = await this.fetchStandings(categoryId, groupName);

      res.status(200).json({
        success: true,
        data: result,
        message: "Group standings recalculated successfully",
      });
    } catch (error: unknown) {
      res.status(400).json({
        success: false,
        message: this.getErrorMessage(error),
      });
    }
  }

  /**
   * Lấy standings của category
   */
  async getStandings(req: Request, res: Response): Promise<void> {
    try {
      const categoryId = this.parsePositiveInt(req.params.categoryId);
      if (categoryId == null) {
        res.status(400).json({
          success: false,
          message: "categoryId must be a positive integer",
        });
        return;
      }

      const groupName =
        typeof req.query.groupName === "string" && req.query.groupName.trim().length > 0
          ? req.query.groupName.trim()
          : undefined;

      const result = await this.fetchStandings(categoryId, groupName);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        message: this.getErrorMessage(error),
      });
    }
  }

  /**
   * Lấy danh sách đội vào vòng sau
   */
  async getQualifiedTeams(req: Request, res: Response): Promise<void> {
    try {
      const categoryId = this.parsePositiveInt(req.params.categoryId);
      if (categoryId == null) {
        res.status(400).json({
          success: false,
          message: "categoryId must be a positive integer",
        });
        return;
      }

      const rawQualifierCount =
        req.query.qualifiersPerGroup ?? req.query.teamsPerGroup;
      const qualifiersPerGroup =
        rawQualifierCount == null ? 2 : Number(rawQualifierCount);

      if (!Number.isInteger(qualifiersPerGroup) || qualifiersPerGroup < 1) {
        res.status(400).json({
          success: false,
          message: "qualifiersPerGroup must be a positive integer",
        });
        return;
      }

      const result = await groupStandingService.getQualifiers(
        categoryId,
        qualifiersPerGroup
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: unknown) {
      res.status(400).json({
        success: false,
        message: this.getErrorMessage(error),
      });
    }
  }
}

export default new GroupStandingController();
