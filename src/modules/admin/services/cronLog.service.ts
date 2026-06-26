import { Op, WhereOptions } from "sequelize";
import CronLog, { CronLogLevel, CronLogStatus } from "../models/cronLog.model";
import { domainEvents } from "../../../shared/events/domainEvents";
import { registerAdminEventHandlers } from "../admin.events";
import type { CronLogPayload } from "../public.contracts";

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
    registerAdminEventHandlers();

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

    domainEvents.publish("cronLog.created", { log: this.toCronLogPayload(log) });
    return log;
  }

  async findAll(filters: CronLogFilter): Promise<{
    logs: CronLog[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  }> {
    const limit = Math.min(Math.max(filters.limit ?? 50, 1), 200);
    const offset = Math.max(filters.offset ?? 0, 0);
    const page = Math.floor(offset / limit) + 1;
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
        page,
        limit,
        totalPages: Math.ceil(count / limit),
        hasNextPage: offset + rows.length < count,
        hasPrevPage: page > 1,
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

  private toCronLogPayload(log: CronLog): CronLogPayload {
    return log.get({ plain: true }) as CronLogPayload;
  }
}

export default new CronLogService();
