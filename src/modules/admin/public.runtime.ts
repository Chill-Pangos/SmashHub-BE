import systemRuntimeService from "./services/systemRuntime.service";
import type { Request } from "express";
import type {
  RequestMetric,
  SanitizedErrorEvent,
} from "./services/systemRuntime.service";

export { default as adminRuntimeService } from "./services/adminSystem.service";
export const adminMetricsRuntimeService = {
  recordRequest: (metric: RequestMetric): void =>
    systemRuntimeService.recordRequest(metric),
  recordError: (event: SanitizedErrorEvent): void =>
    systemRuntimeService.recordError(event),
  routeFromRequest: (req: Request): string =>
    systemRuntimeService.routeFromRequest(req),
};
export type {
  MetricsWindow,
  RequestMetric,
  SanitizedErrorEvent,
  SystemAlert,
} from "./services/systemRuntime.service";
