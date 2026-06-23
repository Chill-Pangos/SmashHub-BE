import type { Request } from "express";
import { monitorEventLoopDelay } from "perf_hooks";

export type MetricsWindow = "1m" | "5m" | "15m";

export type RequestMetric = {
  method: string;
  path: string;
  route: string;
  statusCode: number;
  durationMs: number;
  timestamp: number;
};

export type SanitizedErrorEvent = {
  timestamp: string;
  method: string;
  path: string;
  statusCode: number;
  errorCode: string;
  message: string;
  requestId?: string;
};

export type SystemAlert = {
  key: string;
  severity: "warning" | "critical";
  message: string;
  createdAt: string;
  data?: unknown;
};

const MAX_REQUEST_AGE_MS = 15 * 60 * 1000;
const MAX_ERROR_EVENTS = 50;
const MAX_ALERT_EVENTS = 100;
const EVENT_LOOP_RESOLUTION_MS = 20;

const eventLoopDelay = monitorEventLoopDelay({ resolution: EVENT_LOOP_RESOLUTION_MS });
eventLoopDelay.enable();

class SystemRuntimeService {
  private requests: RequestMetric[] = [];
  private errors: SanitizedErrorEvent[] = [];
  private alerts: SystemAlert[] = [];
  private activeAlertKeys = new Set<string>();

  recordRequest(metric: RequestMetric): void {
    this.requests.push(metric);
    this.pruneRequests(metric.timestamp);
  }

  recordError(event: SanitizedErrorEvent): void {
    this.errors.unshift(event);
    this.errors = this.errors.slice(0, MAX_ERROR_EVENTS);
  }

  recordAlert(alert: SystemAlert): boolean {
    if (this.activeAlertKeys.has(alert.key)) return false;
    this.activeAlertKeys.add(alert.key);
    this.alerts.unshift(alert);
    this.alerts = this.alerts.slice(0, MAX_ALERT_EVENTS);
    return true;
  }

  resolveAlerts(activeKeys: Set<string>): void {
    for (const key of this.activeAlertKeys) {
      if (!activeKeys.has(key)) this.activeAlertKeys.delete(key);
    }
  }

  getMetrics(window: MetricsWindow) {
    const now = Date.now();
    const since = now - this.windowToMs(window);
    const items = this.requests.filter((item) => item.timestamp >= since);
    const durations = items.map((item) => item.durationMs).sort((a, b) => a - b);
    const statusGroups = { "2xx": 0, "3xx": 0, "4xx": 0, "5xx": 0 };
    const routeStats = new Map<string, { count: number; totalDurationMs: number; maxDurationMs: number }>();

    for (const item of items) {
      if (item.statusCode >= 500) statusGroups["5xx"] += 1;
      else if (item.statusCode >= 400) statusGroups["4xx"] += 1;
      else if (item.statusCode >= 300) statusGroups["3xx"] += 1;
      else if (item.statusCode >= 200) statusGroups["2xx"] += 1;

      const key = `${item.method} ${item.route}`;
      const stat = routeStats.get(key) ?? { count: 0, totalDurationMs: 0, maxDurationMs: 0 };
      stat.count += 1;
      stat.totalDurationMs += item.durationMs;
      stat.maxDurationMs = Math.max(stat.maxDurationMs, item.durationMs);
      routeStats.set(key, stat);
    }

    const requestCount = items.length;
    const errorCount = statusGroups["5xx"];
    const errorRate = requestCount === 0 ? 0 : errorCount / requestCount;

    return {
      window,
      requestCount,
      statusGroups,
      errorCount,
      errorRate,
      latency: {
        avgMs: this.round(requestCount === 0 ? 0 : durations.reduce((sum, value) => sum + value, 0) / requestCount),
        p50Ms: this.percentile(durations, 0.5),
        p95Ms: this.percentile(durations, 0.95),
      },
      slowRoutes: Array.from(routeStats.entries())
        .map(([route, stat]) => ({
          route,
          count: stat.count,
          avgMs: this.round(stat.totalDurationMs / stat.count),
          maxMs: this.round(stat.maxDurationMs),
        }))
        .sort((a, b) => b.avgMs - a.avgMs)
        .slice(0, 10),
      generatedAt: new Date().toISOString(),
    };
  }

  getErrors(limit = MAX_ERROR_EVENTS): SanitizedErrorEvent[] {
    return this.errors.slice(0, Math.min(Math.max(limit, 1), MAX_ERROR_EVENTS));
  }

  getAlerts(limit = MAX_ALERT_EVENTS): SystemAlert[] {
    return this.alerts.slice(0, Math.min(Math.max(limit, 1), MAX_ALERT_EVENTS));
  }

  getEventLoopLag() {
    return {
      meanMs: this.round(eventLoopDelay.mean / 1_000_000),
      maxMs: this.round(eventLoopDelay.max / 1_000_000),
      p95Ms: this.round(eventLoopDelay.percentile(95) / 1_000_000),
    };
  }

  routeFromRequest(req: Request): string {
    const baseUrl = req.baseUrl || "";
    const routePath = req.route?.path;
    if (typeof routePath === "string") return `${baseUrl}${routePath}` || req.path;
    return req.path || req.originalUrl;
  }

  private pruneRequests(now: number): void {
    const cutoff = now - MAX_REQUEST_AGE_MS;
    if (this.requests.length < 2) return;
    this.requests = this.requests.filter((item) => item.timestamp >= cutoff);
  }

  private windowToMs(window: MetricsWindow): number {
    if (window === "1m") return 60_000;
    if (window === "5m") return 5 * 60_000;
    return 15 * 60_000;
  }

  private percentile(sorted: number[], ratio: number): number {
    if (sorted.length === 0) return 0;
    const index = Math.min(sorted.length - 1, Math.ceil(sorted.length * ratio) - 1);
    return this.round(sorted[index] ?? 0);
  }

  private round(value: number): number {
    if (!Number.isFinite(value)) return 0;
    return Math.round(value * 100) / 100;
  }
}

export default new SystemRuntimeService();
