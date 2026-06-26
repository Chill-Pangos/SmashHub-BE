import { Request, Response, NextFunction } from "express";
import { adminMetricsRuntimeService } from "../modules/admin/public.runtime";

export const systemMetricsMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const startedAt = process.hrtime.bigint();

  res.on("finish", () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
    adminMetricsRuntimeService.recordRequest({
      method: req.method,
      path: req.originalUrl,
      route: adminMetricsRuntimeService.routeFromRequest(req),
      statusCode: res.statusCode,
      durationMs,
      timestamp: Date.now(),
    });
  });

  next();
};
