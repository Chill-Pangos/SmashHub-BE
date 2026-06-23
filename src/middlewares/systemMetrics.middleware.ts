import { Request, Response, NextFunction } from "express";
import systemRuntimeService from "../services/systemRuntime.service";

export const systemMetricsMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const startedAt = process.hrtime.bigint();

  res.on("finish", () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
    systemRuntimeService.recordRequest({
      method: req.method,
      path: req.originalUrl,
      route: systemRuntimeService.routeFromRequest(req),
      statusCode: res.statusCode,
      durationMs,
      timestamp: Date.now(),
    });
  });

  next();
};
