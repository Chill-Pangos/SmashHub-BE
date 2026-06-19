import { Request, Response, NextFunction } from "express";
import cronLogService from "../services/cronLog.service";
import { BadRequestError } from "../utils/errors.helper";

const VALID_STATUSES = new Set(["success", "failed", "skipped"]);
const VALID_LEVELS = new Set(["info", "warn", "error"]);

export class CronLogController {
  async findAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tournamentId =
        req.query.tournamentId !== undefined ? Number(req.query.tournamentId) : undefined;
      if (tournamentId !== undefined && (!Number.isInteger(tournamentId) || tournamentId <= 0)) {
        throw new BadRequestError("Invalid tournamentId");
      }

      const status = req.query.status ? String(req.query.status) : undefined;
      if (status && !VALID_STATUSES.has(status)) {
        throw new BadRequestError("status must be success, failed, or skipped");
      }

      const level = req.query.level ? String(req.query.level) : undefined;
      if (level && !VALID_LEVELS.has(level)) {
        throw new BadRequestError("level must be info, warn, or error");
      }

      const filters: Parameters<typeof cronLogService.findAll>[0] = {};
      if (req.query.jobName) filters.jobName = String(req.query.jobName);
      if (tournamentId !== undefined) filters.tournamentId = tournamentId;
      if (status) filters.status = status as any;
      if (level) filters.level = level as any;
      if (req.query.offset !== undefined) filters.offset = Number(req.query.offset);
      if (req.query.limit !== undefined) filters.limit = Number(req.query.limit);

      const result = await cronLogService.findAll(filters);

      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async latest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const limit = req.query.limit !== undefined ? Number(req.query.limit) : 20;
      const logs = await cronLogService.latest(
        req.query.jobName ? String(req.query.jobName) : undefined,
        limit,
      );

      res.status(200).json({ success: true, data: logs });
    } catch (error) {
      next(error);
    }
  }
}

export default new CronLogController();
