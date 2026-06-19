import { Op, WhereOptions } from "sequelize";
import CronLog, { CronLogLevel, CronLogStatus } from "../models/cronLog.model";
import notificationService from "./notification.service";

export type CreateCronLogInput = {
  jobName: string;
  tournamentId?: number | null;
  level?: CronLogLevel;
  status?: CronLogStatus;
  message: string;
  meta?: unknown;
  startedAt?: Date;
  finishedAt?: Date | null;
  durationMs?: number | null;
};

export type CronLogFilter = {
  jobName?: string;
  tournamentId?: number;
  status?: CronLogStatus;
  level?: CronLogLevel;
  offset?: number;
  limit?: number;
};

class CronLogService {
  async create(input: CreateCronLogInput): Promise<CronLog> {
    const log = await CronLog.create({
      jobName: input.jobName,
      tournamentId: input.tournamentId ?? null,
      level: input.level ?? "info",
      status: input.status ?? "success",
      message: input.message,
      meta: input.meta ?? null,
      startedAt: input.startedAt ?? new Date(),
      finishedAt: input.finishedAt ?? null,
      durationMs: input.durationMs ?? null,
    } as any);

    notificationService.publishCronLog(log).catch((error) => {
      console.error("Failed to publish cron log realtime event:", error);
    });
    return log;
  }

  async findAll(filters: CronLogFilter): Promise<{
    logs: CronLog[];
    pagination: {
      total: number;
      offset: number;
      limit: number;
      hasNextPage: boolean;
    };
  }> {
    const limit = Math.min(Math.max(filters.limit ?? 50, 1), 200);
    const offset = Math.max(filters.offset ?? 0, 0);
    const where: WhereOptions<any> = {};

    if (filters.jobName) where.jobName = filters.jobName;
    if (filters.tournamentId !== undefined) where.tournamentId = filters.tournamentId;
    if (filters.status) where.status = filters.status;
    if (filters.level) where.level = filters.level;

    const { rows, count } = await CronLog.findAndCountAll({
      where,
      limit,
      offset,
      order: [["createdAt", "DESC"]],
    });

    return {
      logs: rows,
      pagination: {
        total: count,
        offset,
        limit,
        hasNextPage: offset + rows.length < count,
      },
    };
  }

  async latest(jobName?: string, limit = 20): Promise<CronLog[]> {
    const where: WhereOptions<any> = {};
    if (jobName) where.jobName = { [Op.eq]: jobName };

    return CronLog.findAll({
      where,
      limit: Math.min(Math.max(limit, 1), 100),
      order: [["createdAt", "DESC"]],
    });
  }
}

export default new CronLogService();
