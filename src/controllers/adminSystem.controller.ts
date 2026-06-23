import { Request, Response, NextFunction } from "express";
import adminSystemService from "../services/adminSystem.service";
import { BadRequestError } from "../utils/errors.helper";
import type { MetricsWindow } from "../services/systemRuntime.service";

const VALID_WINDOWS = new Set(["1m", "5m", "15m"]);
const VALID_EVENT_TYPES = new Set(["error", "alert", "cron"]);

class AdminSystemController {
  async summary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const summary = await adminSystemService.getSummary();
      res.status(200).json({ success: true, data: summary });
    } catch (error) {
      next(error);
    }
  }

  async health(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const health = await adminSystemService.getHealth();
      res.status(200).json({ success: true, data: health });
    } catch (error) {
      next(error);
    }
  }

  async metrics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const window = req.query.window ? String(req.query.window) : "5m";
      if (!VALID_WINDOWS.has(window)) {
        throw new BadRequestError("window must be 1m, 5m, or 15m");
      }

      const metrics = adminSystemService.getMetrics(window as MetricsWindow);
      res.status(200).json({ success: true, data: metrics });
    } catch (error) {
      next(error);
    }
  }

  async events(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const type = req.query.type ? String(req.query.type) : undefined;
      if (type && !VALID_EVENT_TYPES.has(type)) {
        throw new BadRequestError("type must be error, alert, or cron");
      }

      const limit = req.query.limit !== undefined ? Number(req.query.limit) : 50;
      if (!Number.isInteger(limit) || limit <= 0) {
        throw new BadRequestError("limit must be a positive integer");
      }

      const events = await adminSystemService.getEvents(type as any, limit);
      res.status(200).json({ success: true, data: events });
    } catch (error) {
      next(error);
    }
  }

  async auditLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const offset = req.query.offset !== undefined ? Number(req.query.offset) : 0;
      const limit = req.query.limit !== undefined ? Number(req.query.limit) : 50;

      if (!Number.isInteger(offset) || offset < 0) {
        throw new BadRequestError("offset must be a non-negative integer");
      }
      if (!Number.isInteger(limit) || limit <= 0) {
        throw new BadRequestError("limit must be a positive integer");
      }

      const filters: { action?: string; offset: number; limit: number } = { offset, limit };
      if (req.query.action) filters.action = String(req.query.action);

      const result = await adminSystemService.getAuditLogs(filters);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
}

export default new AdminSystemController();
