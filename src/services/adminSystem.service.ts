import os from "os";
import path from "path";
import { readFile, statfs } from "fs/promises";
import { setTimeout as delay } from "timers/promises";
import { Op } from "sequelize";
import sequelize from "../config/database";
import config from "../config/config";
import redisClient, { connectRedis } from "../config/redis";
import AuditLog from "../models/auditLog.model";
import CronLog from "../models/cronLog.model";
import notificationService from "./notification.service";
import systemRuntimeService, { MetricsWindow, SystemAlert } from "./systemRuntime.service";

type HealthStatus = "up" | "down" | "degraded";
type EventType = "error" | "alert" | "cron";
type ResourceStatus = "ok" | "warning" | "critical";

const STARTED_AT = new Date();
const REALTIME_ROOM = "admin:system";
const REALTIME_INTERVAL_MS = 5_000;
const MEMORY_HIGH_RATIO = 0.85;
const DISK_HIGH_RATIO = 0.85;
const EVENT_LOOP_LAG_HIGH_MS = 100;
const P95_HIGH_MS = 1_000;
const ERROR_RATE_HIGH = 0.05;

class AdminSystemService {
  private realtimeTimer: NodeJS.Timeout | null = null;
  private lastHealthSignature: string | null = null;

  async getSummary() {
    return this.getOverview();
  }

  async getOverview() {
    const [app, infra, socket, cron, metrics] = await Promise.all([
      this.getAppHealth(),
      this.getInfraHealth(),
      this.getSocketStats(),
      this.getCronSummary(),
      Promise.resolve(systemRuntimeService.getMetrics("5m")),
    ]);
    const alerts = this.evaluateAlerts({ infra, cron, metrics, app });
    return this.buildOverview({ app, infra, socket, cron, metrics, alerts });
  }

  async getHealth() {
    const [app, infra, socket, cron] = await Promise.all([
      this.getAppHealth(),
      this.getInfraHealth(),
      this.getSocketStats(),
      this.getCronSummary(),
    ]);
    const health = {
      app: app.status,
      db: infra.db.status,
      redis: infra.redis.status,
      socket: socket.status,
      cron: cron.status,
      cpuPercent: infra.cpu.usagePercent,
      ramPercent: this.toPercent(infra.systemMemory.usedRatio),
      diskPercent: this.getMaxDiskUsagePercent(infra.disks),
      generatedAt: new Date().toISOString(),
    };
    return health;
  }

  getMetrics(window: MetricsWindow) {
    return systemRuntimeService.getMetrics(window);
  }

  async getEvents(type: EventType | undefined, limit: number) {
    const normalizedLimit = Math.min(Math.max(limit, 1), 100);
    if (type === "error") return { errors: systemRuntimeService.getErrors(normalizedLimit) };
    if (type === "alert") return { alerts: systemRuntimeService.getAlerts(normalizedLimit) };
    if (type === "cron") return { cronLogs: await this.getLatestCronLogs(normalizedLimit) };

    return {
      errors: systemRuntimeService.getErrors(normalizedLimit),
      alerts: systemRuntimeService.getAlerts(normalizedLimit),
      cronLogs: await this.getLatestCronLogs(normalizedLimit),
    };
  }

  async getAuditLogs(filters: { action?: string; offset?: number; limit?: number }) {
    const limit = Math.min(Math.max(filters.limit ?? 50, 1), 100);
    const offset = Math.max(filters.offset ?? 0, 0);
    const where: Record<string, unknown> = {};
    if (filters.action) where.action = filters.action;

    const { rows, count } = await AuditLog.findAndCountAll({
      where,
      limit,
      offset,
      order: [["createdAt", "DESC"]],
    });

    return {
      rows,
      pagination: {
        total: count,
        offset,
        limit,
        hasNextPage: offset + rows.length < count,
      },
    };
  }

  startRealtimePublisher(): void {
    if (this.realtimeTimer) return;

    this.realtimeTimer = setInterval(() => {
      void this.publishRealtimeSnapshot();
    }, REALTIME_INTERVAL_MS);
  }

  async publishCronEvent(log: CronLog): Promise<void> {
    const plainLog = log.get ? log.get({ plain: true }) : log;
    notificationService.sendEventToRoom(REALTIME_ROOM, "admin_system_metrics_updated", {
      type: "cron",
      data: plainLog,
      generatedAt: new Date().toISOString(),
    });

    if (log.status === "failed") {
      const alert = {
        key: `cron_failed:${log.jobName}`,
        severity: "critical" as const,
        message: `Cron job failed: ${log.jobName}`,
        createdAt: new Date().toISOString(),
        data: plainLog,
      };
      if (systemRuntimeService.recordAlert(alert)) {
        notificationService.sendEventToRoom(REALTIME_ROOM, "admin_system_alert_created", alert);
      }
    }
  }

  private async publishRealtimeSnapshot(): Promise<void> {
    try {
      const overview = await this.getOverview();

      notificationService.sendEventToRoom(REALTIME_ROOM, "admin_system_metrics_updated", {
        type: "overview",
        data: overview,
        generatedAt: new Date().toISOString(),
      });

      const signature = JSON.stringify({
        status: overview.status,
        db: overview.services.db,
        redis: overview.services.redis,
        socket: overview.services.socket,
        cron: overview.services.cron,
        cpu: overview.resources.cpu.status,
        ram: overview.resources.ram.status,
        disk: overview.resources.disk.status,
      });
      if (signature !== this.lastHealthSignature) {
        this.lastHealthSignature = signature;
        notificationService.sendEventToRoom(REALTIME_ROOM, "admin_system_health_changed", {
          status: overview.status,
          services: overview.services,
          resources: overview.resources,
          alerts: overview.alerts,
          generatedAt: overview.generatedAt,
        });
      }
    } catch (error) {
      console.error("Failed to publish admin system realtime snapshot:", error);
    }
  }

  private buildOverview(input: {
    app: Awaited<ReturnType<AdminSystemService["getAppHealth"]>>;
    infra: Awaited<ReturnType<AdminSystemService["getInfraHealth"]>>;
    socket: ReturnType<AdminSystemService["getSocketStats"]>;
    cron: Awaited<ReturnType<AdminSystemService["getCronSummary"]>>;
    metrics: ReturnType<typeof systemRuntimeService.getMetrics>;
    alerts: SystemAlert[];
  }) {
    const disk = this.getPrimaryDisk(input.infra.disks);
    const ramPercent = this.toPercent(input.infra.systemMemory.usedRatio);
    const diskPercent = disk?.usedRatio !== undefined ? this.toPercent(disk.usedRatio) : null;
    const apiErrorPercent = this.toPercent(input.metrics.errorRate);
    const criticalAlerts = input.alerts.filter((alert) => alert.severity === "critical").length;
    const warningAlerts = input.alerts.filter((alert) => alert.severity === "warning").length;

    return {
      status: criticalAlerts > 0 ? "critical" as ResourceStatus : warningAlerts > 0 ? "warning" as ResourceStatus : "ok" as ResourceStatus,
      uptimeSeconds: input.app.uptimeSeconds,
      resources: {
        cpu: {
          percent: input.infra.cpu.usagePercent,
          status: this.resourceStatus(input.infra.cpu.usagePercent),
          label: `${input.infra.cpu.usagePercent}%`,
        },
        ram: {
          percent: ramPercent,
          status: this.resourceStatus(ramPercent),
          label: `${ramPercent}%`,
          usedGb: this.toGb(input.infra.systemMemory.total - input.infra.systemMemory.free),
          totalGb: this.toGb(input.infra.systemMemory.total),
        },
        disk: {
          percent: diskPercent,
          status: diskPercent === null ? "warning" as ResourceStatus : this.resourceStatus(diskPercent),
          label: diskPercent === null ? "N/A" : `${diskPercent}%`,
          path: disk?.path ?? null,
          usedGb: disk && "used" in disk ? this.toGb(disk.used ?? 0) : null,
          totalGb: disk && "total" in disk ? this.toGb(disk.total ?? 0) : null,
        },
      },
      services: {
        db: input.infra.db.status,
        redis: input.infra.redis.status,
        socket: input.socket.status,
        cron: input.cron.status,
      },
      traffic: {
        window: input.metrics.window,
        requestCount: input.metrics.requestCount,
        errorPercent: apiErrorPercent,
        p95LatencyMs: input.metrics.latency.p95Ms,
      },
      realtime: {
        connectedUsers: input.socket.totalConnectedUsers,
        roomCount: input.socket.roomCount,
      },
      alerts: {
        total: input.alerts.length,
        critical: criticalAlerts,
        warning: warningAlerts,
      },
      generatedAt: new Date().toISOString(),
    };
  }

  private async getAppHealth() {
    const packageInfo = await this.getPackageInfo();
    const memory = process.memoryUsage();
    const totalMemory = os.totalmem();
    const eventLoopLag = systemRuntimeService.getEventLoopLag();

    return {
      status: "up" as HealthStatus,
      uptimeSeconds: Math.round(process.uptime()),
      startedAt: STARTED_AT.toISOString(),
      env: config.env,
      version: packageInfo.version,
      nodeVersion: process.version,
      pid: process.pid,
      memory: {
        rss: memory.rss,
        heapTotal: memory.heapTotal,
        heapUsed: memory.heapUsed,
        external: memory.external,
        heapUsedRatio: memory.heapTotal === 0 ? 0 : this.round(memory.heapUsed / memory.heapTotal),
        rssSystemRatio: totalMemory === 0 ? 0 : this.round(memory.rss / totalMemory),
      },
      eventLoopLag,
    };
  }

  private async getInfraHealth() {
    const [cpuUsage, db, redis, disks] = await Promise.all([
      this.sampleCpuUsage(),
      this.pingDatabase(),
      this.pingRedis(),
      this.getDiskUsage(),
    ]);

    return {
      cpu: {
        cores: os.cpus().length,
        loadAverage: os.loadavg(),
        usagePercent: cpuUsage,
      },
      systemMemory: {
        total: os.totalmem(),
        free: os.freemem(),
        usedRatio: this.round((os.totalmem() - os.freemem()) / os.totalmem()),
      },
      disks,
      db,
      redis,
    };
  }

  private getSocketStats() {
    return {
      status: "up" as HealthStatus,
      totalConnectedUsers: notificationService.getConnectedUsersCount(),
      roomCount: notificationService.getRoomCount(),
      adapterMode: notificationService.getAdapterMode(),
      lastSocketError: notificationService.getLastSocketError(),
    };
  }

  private async getCronSummary() {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [latest, failedCount, skippedCount, lastFailed, recent] = await Promise.all([
      this.getLatestCronLogs(20),
      CronLog.count({ where: { status: "failed", createdAt: { [Op.gte]: since } } }),
      CronLog.count({ where: { status: "skipped", createdAt: { [Op.gte]: since } } }),
      CronLog.findOne({ where: { status: "failed" }, order: [["createdAt", "DESC"]] }),
      CronLog.findAll({
        where: { createdAt: { [Op.gte]: since }, durationMs: { [Op.ne]: null } },
        limit: 200,
        order: [["createdAt", "DESC"]],
      }),
    ]);

    const avgDurationByJob = this.averageDurationByJob(recent);

    return {
      status: failedCount > 0 ? "degraded" as HealthStatus : "up" as HealthStatus,
      latest,
      failedCount24h: failedCount,
      skippedCount24h: skippedCount,
      lastFailed: lastFailed?.get({ plain: true }) ?? null,
      avgDurationByJob,
    };
  }

  private async getLatestCronLogs(limit: number) {
    const logs = await CronLog.findAll({
      limit,
      order: [["createdAt", "DESC"]],
    });
    return logs.map((log) => log.get({ plain: true }));
  }

  private evaluateAlerts(input: {
    infra: Awaited<ReturnType<AdminSystemService["getInfraHealth"]>>;
    cron: Awaited<ReturnType<AdminSystemService["getCronSummary"]>>;
    metrics: ReturnType<typeof systemRuntimeService.getMetrics>;
    app: Awaited<ReturnType<AdminSystemService["getAppHealth"]>>;
  }): SystemAlert[] {
    const now = new Date().toISOString();
    const activeAlerts: SystemAlert[] = [];

    if (input.infra.db.status === "down") {
      activeAlerts.push({ key: "db_down", severity: "critical", message: "Database is down", createdAt: now, data: input.infra.db });
    }
    if (input.infra.redis.status === "down") {
      activeAlerts.push({ key: "redis_down", severity: "warning", message: "Redis is down", createdAt: now, data: input.infra.redis });
    }
    for (const disk of input.infra.disks) {
      if (typeof disk.usedRatio === "number" && disk.usedRatio >= DISK_HIGH_RATIO) {
        activeAlerts.push({ key: `disk_high:${disk.path}`, severity: "critical", message: `Disk usage high: ${disk.path}`, createdAt: now, data: disk });
      }
    }
    if (input.app.memory.rssSystemRatio >= MEMORY_HIGH_RATIO) {
      activeAlerts.push({ key: "memory_high", severity: "critical", message: "Process memory usage high", createdAt: now, data: input.app.memory });
    }
    if (input.app.eventLoopLag.p95Ms >= EVENT_LOOP_LAG_HIGH_MS) {
      activeAlerts.push({ key: "event_loop_lag_high", severity: "warning", message: "Event loop lag high", createdAt: now, data: input.app.eventLoopLag });
    }
    if (input.metrics.latency.p95Ms >= P95_HIGH_MS) {
      activeAlerts.push({ key: "api_p95_high", severity: "warning", message: "API p95 latency high", createdAt: now, data: input.metrics.latency });
    }
    if (input.metrics.errorRate >= ERROR_RATE_HIGH && input.metrics.requestCount > 0) {
      activeAlerts.push({ key: "api_5xx_spike", severity: "critical", message: "API 5xx error rate high", createdAt: now, data: { errorRate: input.metrics.errorRate } });
    }
    if (input.cron.failedCount24h > 0) {
      activeAlerts.push({ key: "cron_failed_24h", severity: "critical", message: "Cron failures in last 24h", createdAt: now, data: { failedCount24h: input.cron.failedCount24h } });
    }
    if (notificationService.getLastSocketError()) {
      activeAlerts.push({ key: "socket_adapter_error", severity: "warning", message: "Socket.IO adapter error", createdAt: now, data: { error: notificationService.getLastSocketError() } });
    }

    const activeKeys = new Set(activeAlerts.map((alert) => alert.key));
    systemRuntimeService.resolveAlerts(activeKeys);
    for (const alert of activeAlerts) {
      if (systemRuntimeService.recordAlert(alert)) {
        notificationService.sendEventToRoom(REALTIME_ROOM, "admin_system_alert_created", alert);
      }
    }
    return activeAlerts;
  }

  private async pingDatabase() {
    const startedAt = process.hrtime.bigint();
    try {
      await sequelize.authenticate();
      return {
        status: "up" as HealthStatus,
        latencyMs: this.elapsedMs(startedAt),
      };
    } catch (error) {
      return {
        status: "down" as HealthStatus,
        latencyMs: this.elapsedMs(startedAt),
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private async pingRedis() {
    const startedAt = process.hrtime.bigint();
    try {
      const client = await connectRedis();
      if (!client || !redisClient.isReady) {
        return { status: "down" as HealthStatus, latencyMs: this.elapsedMs(startedAt), error: "Redis is not ready" };
      }
      await client.ping();
      return {
        status: "up" as HealthStatus,
        latencyMs: this.elapsedMs(startedAt),
      };
    } catch (error) {
      return {
        status: "down" as HealthStatus,
        latencyMs: this.elapsedMs(startedAt),
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private async getDiskUsage() {
    const paths = Array.from(new Set([process.cwd(), config.upload.avatarDir, config.upload.paymentDir]));
    const results = [];
    for (const targetPath of paths) {
      try {
        const stats = await statfs(targetPath);
        const total = Number(stats.blocks) * Number(stats.bsize);
        const free = Number(stats.bfree) * Number(stats.bsize);
        const available = Number(stats.bavail) * Number(stats.bsize);
        results.push({
          path: targetPath,
          total,
          free,
          available,
          used: total - free,
          usedRatio: total === 0 ? 0 : this.round((total - free) / total),
        });
      } catch (error) {
        results.push({
          path: targetPath,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
    return results;
  }

  private async sampleCpuUsage(): Promise<number> {
    const startUsage = process.cpuUsage();
    const startTime = process.hrtime.bigint();
    await delay(100);
    const endUsage = process.cpuUsage(startUsage);
    const elapsedMicros = Number(process.hrtime.bigint() - startTime) / 1_000;
    const usedMicros = endUsage.user + endUsage.system;
    const cores = Math.max(os.cpus().length, 1);
    return this.round((usedMicros / (elapsedMicros * cores)) * 100);
  }

  private averageDurationByJob(logs: CronLog[]) {
    const byJob = new Map<string, { count: number; total: number }>();
    for (const log of logs) {
      if (log.durationMs == null) continue;
      const stat = byJob.get(log.jobName) ?? { count: 0, total: 0 };
      stat.count += 1;
      stat.total += log.durationMs;
      byJob.set(log.jobName, stat);
    }
    return Array.from(byJob.entries()).map(([jobName, stat]) => ({
      jobName,
      count: stat.count,
      avgDurationMs: this.round(stat.total / stat.count),
    }));
  }

  private getPrimaryDisk(
    disks: Array<{
      path: string;
      total?: number;
      used?: number;
      usedRatio?: number;
      error?: string;
    }>,
  ) {
    const usableDisks = disks.filter((disk) => typeof disk.usedRatio === "number");
    if (usableDisks.length === 0) return null;
    return usableDisks.reduce((max, disk) => (
      (disk.usedRatio ?? 0) > (max.usedRatio ?? 0) ? disk : max
    ));
  }

  private getMaxDiskUsagePercent(
    disks: Array<{
      path: string;
      usedRatio?: number;
    }>,
  ): number | null {
    const primaryDisk = this.getPrimaryDisk(disks);
    return primaryDisk?.usedRatio !== undefined ? this.toPercent(primaryDisk.usedRatio) : null;
  }

  private resourceStatus(percent: number): ResourceStatus {
    if (percent >= 85) return "critical";
    if (percent >= 70) return "warning";
    return "ok";
  }

  private toPercent(ratio: number): number {
    return this.round(ratio * 100);
  }

  private toGb(bytes: number): number {
    return this.round(bytes / 1024 / 1024 / 1024);
  }

  private async getPackageInfo(): Promise<{ version: string }> {
    try {
      const raw = await readFile(path.join(process.cwd(), "package.json"), "utf8");
      const parsed = JSON.parse(raw) as { version?: string };
      return { version: parsed.version ?? "unknown" };
    } catch {
      return { version: "unknown" };
    }
  }

  private elapsedMs(startedAt: bigint): number {
    return this.round(Number(process.hrtime.bigint() - startedAt) / 1_000_000);
  }

  private round(value: number): number {
    if (!Number.isFinite(value)) return 0;
    return Math.round(value * 100) / 100;
  }
}

export default new AdminSystemService();
