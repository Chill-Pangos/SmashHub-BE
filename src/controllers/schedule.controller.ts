import { Request, Response, NextFunction } from "express";
import scheduleService from "../services/schedule.service";
import { BadRequestError, UnauthorizedError } from "../utils/errors.helper";
import { AuthRequest } from "../middlewares/auth.middleware";
import { KNOCKOUT_ROUNDS, KnockoutRound } from "../models/schedule.model";
import { parsePagination, parsePositiveInt } from "../utils/request.helper";

export class ScheduleController {
  private getAuthenticatedUserId(req: AuthRequest, next: NextFunction): number | null {
    if (req.userId == null) {
      next(new UnauthorizedError("Unauthorized"));
      return null;
    }
    return req.userId;
  }

  // ── 1. Generate group stage schedule ───────────────────────────────────────

  /**
   * Tạo lịch vòng bảng cho 1 category dựa trên groupStandings.
   * POST /schedules/generate-group-stage
   * Body: { categoryId: number }
   */
  async generateGroupStageSchedule(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const organizerId = this.getAuthenticatedUserId(req, next);
      if (organizerId == null) return;

      const { categoryId } = req.body;
      if (!categoryId) throw new BadRequestError("categoryId is required");

      const result = await scheduleService.generateGroupStageSchedule(
        organizerId,
        parsePositiveInt(categoryId, "categoryId"),
      );

      res.status(201).json({
        success: true,
        message: "Group stage schedule generated successfully",
        ...(result.warning && { warning: result.warning }),
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

  // ── 2. Generate knockout schedule ──────────────────────────────────────────

  /**
   * Tạo lịch knockout cho 1 category dựa trên knockoutBrackets.
   * Lấy tất cả brackets (kể cả TBD placeholder) trừ bye matches.
   * POST /schedules/generate-knockout
   * Body: { categoryId: number, roundName?: string }
   */
  async generateKnockoutSchedule(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const organizerId = this.getAuthenticatedUserId(req, next);
      if (organizerId == null) return;

      const { categoryId, roundName } = req.body;
      if (!categoryId) throw new BadRequestError("categoryId is required");
      if (roundName !== undefined && !KNOCKOUT_ROUNDS.includes(roundName)) {
        throw new BadRequestError("Invalid roundName");
      }

      const result = await scheduleService.generateKnockoutSchedule(
        organizerId,
        parsePositiveInt(categoryId, "categoryId"),
        roundName as KnockoutRound | undefined,
      );

      res.status(201).json({
        success: true,
        message: "Knockout schedule generated successfully",
        ...(result.warning && { warning: result.warning }),
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

  // ── 3. Generate full tournament schedule ───────────────────────────────────

  /**
   * Tạo lịch toàn bộ tournament (group + knockout theo thứ tự từng category).
   * POST /schedules/generate-tournament
   * Body: { tournamentId: number }
   */
  async generateTournamentSchedule(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const organizerId = this.getAuthenticatedUserId(req, next);
      if (organizerId == null) return;

      const { tournamentId } = req.body;
      if (!tournamentId) throw new BadRequestError("tournamentId is required");

      const results = await scheduleService.generateTournamentSchedule(
        organizerId,
        parsePositiveInt(tournamentId, "tournamentId"),
      );

      const warnings = results
        .filter((r) => r.result.warning)
        .map((r) => `[Category ${r.categoryId}] ${r.result.warning}`);

      res.status(201).json({
        success: true,
        message: "Tournament schedule generated successfully",
        ...(warnings.length > 0 && { warnings }),
        data: results.map((r) => ({
          categoryId: r.categoryId,
          totalSchedules: r.result.schedules.length,
          totalMatches: r.result.matches.length,
        })),
      });
    } catch (error) {
      next(error);
    }
  }

  // ── 4. Sync match entries từ brackets sau fillQualifiers ──────────────────

  /**
   * Cập nhật lại entryId trong match sau khi fillQualifiers() chạy.
   * POST /schedules/sync-match-entries
   * Body: { categoryId: number }
   */
  async syncMatchEntries(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const organizerId = this.getAuthenticatedUserId(req, next);
      if (organizerId == null) return;

      const { categoryId } = req.body;
      if (!categoryId) throw new BadRequestError("categoryId is required");

      await scheduleService.syncMatchEntriesFromBrackets(
        organizerId,
        parsePositiveInt(categoryId, "categoryId"),
      );

      res.status(200).json({
        success: true,
        message: "Match entries synced from brackets successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  // ── 5. Get schedule by ID ─────────────────────────────────────────────────

  /**
   * GET /schedules/:id
   */
  async findById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parsePositiveInt(req.params.id, "schedule ID");

      const schedule = await scheduleService.getScheduleById(id);
      res.status(200).json({ success: true, data: schedule });
    } catch (error) {
      next(error);
    }
  }

  // ── 6. Get schedules by category ──────────────────────────────────────────

  /**
   * GET /schedules/category/:categoryId
   * Query: page, limit, stage, groupName, knockoutRound
   */
  async getSchedulesByCategoryId(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const categoryId = parsePositiveInt(req.params.categoryId, "category ID");

      const { page, offset, limit } = parsePagination(req.query);

      const stage = req.query.stage as "group" | "knockout" | undefined;
      if (stage && !["group", "knockout"].includes(stage)) {
        throw new BadRequestError("Invalid stage. Must be 'group' or 'knockout'");
      }

      const groupName = req.query.groupName as string | undefined;
      const knockoutRound = req.query.knockoutRound as string | undefined;

      const result = await scheduleService.getSchedulesByCategory(categoryId, {
        offset,
        limit,
        ...(stage && { stage }),
        ...(groupName && { groupName }),
        ...(knockoutRound && { knockoutRound: knockoutRound as KnockoutRound }),
      });

      const totalPages = Math.ceil(result.count / limit);

      res.status(200).json({
        success: true,
        data: {
          schedules: result.rows,
          pagination: {
            total: result.count,
            page,
            limit,
            totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // ── 7. Update schedule ────────────────────────────────────────────────────

  /**
   * PUT /schedules/:id
   * Body: { scheduledAt?: Date, tableNumber?: number }
   */
  async update(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const organizerId = this.getAuthenticatedUserId(req, next);
      if (organizerId == null) return;

      const id = parsePositiveInt(req.params.id, "schedule ID");

      const { scheduledAt, tableNumber } = req.body;

      const updated = await scheduleService.updateSchedule(organizerId, id, {
        ...(scheduledAt && { scheduledAt }),
        ...(tableNumber !== undefined && {
          tableNumber: tableNumber === null ? null : parsePositiveInt(tableNumber, "tableNumber"),
        }),
      });

      res.status(200).json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  }

  // ── 8. Delete schedule ────────────────────────────────────────────────────

  /**
   * DELETE /schedules/:id
   */
  async delete(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const organizerId = this.getAuthenticatedUserId(req, next);
      if (organizerId == null) return;

      const id = parsePositiveInt(req.params.id, "schedule ID");

      await scheduleService.deleteSchedule(organizerId, id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

export default new ScheduleController();
