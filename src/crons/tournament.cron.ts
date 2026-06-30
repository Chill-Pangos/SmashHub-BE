import cron from "node-cron";
import tournamentService, {
  TournamentStatusTransition,
  TournamentStatusUpdateResult,
} from "../services/tournament.service";
import ScheduleConfig from "../models/scheduleConfig.model";
import Tournament from "../models/tournament.model";
import TournamentReferee from "../models/tournamentReferee.model";
import redisClient, { connectRedis } from "../config/redis";
import { formatDateUTC } from "../utils/date.helper";
import { TOURNAMENT_STATUS_REFRESH_CHANNEL } from "../utils/tournamentStatusScheduler.helper";
import { withDbLock } from "../utils/dbLock.helper";
import cronLogService from "../services/cronLog.service";
import notificationService from "../services/notification.service";
import tournamentStatusNotificationService from "../services/tournamentStatusNotification.service";
import { Op } from "sequelize";

const MAX_TIMEOUT_MS = 2_147_483_647;
const PERIODIC_REFRESH_CRON = "*/5 * * * *";
const RECONCILE_CRON = "*/5 * * * *";
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

type StatusJobName = "open" | "close" | "bracket" | "start";
type RefereeCheckMilestone =
  | "after_registration_end"
  | "before_bracket_generation"
  | "before_tournament_start";

type StatusJobConfig = {
  jobName: StatusJobName;
  label: string;
  dateField: "registrationStartDate" | "registrationEndDate" | "bracketGenerationDate" | "startDate";
  lockName: string;
  handler: () => Promise<TournamentStatusTransition[]>;
};

type RefereeCheckEvent = {
  tournamentId: number;
  milestone: RefereeCheckMilestone;
  runAt: Date;
};

const statusJobs: StatusJobConfig[] = [
  {
    jobName: "open",
    label: "tournament-status-open",
    dateField: "registrationStartDate",
    lockName: "cron:tournament-status:open",
    handler: () => tournamentService.openRegistrations(),
  },
  {
    jobName: "close",
    label: "tournament-status-close",
    dateField: "registrationEndDate",
    lockName: "cron:tournament-status:close",
    handler: () => tournamentService.closeRegistrations(),
  },
  {
    jobName: "bracket",
    label: "tournament-status-bracket",
    dateField: "bracketGenerationDate",
    lockName: "cron:tournament-status:bracket",
    handler: () => tournamentService.generateBracketsOrCancel(),
  },
  {
    jobName: "start",
    label: "tournament-status-start",
    dateField: "startDate",
    lockName: "cron:tournament-status:start",
    handler: () => tournamentService.startTournaments(),
  },
];

const timerByJob = new Map<StatusJobName, NodeJS.Timeout>();
let refereeCheckTimer: NodeJS.Timeout | null = null;
let tournamentStatusSchedulerStarted = false;
let refreshPromise: Promise<void> | null = null;
let redisSubscriber: ReturnType<typeof redisClient.duplicate> | null = null;

function summarizeEvents(events: TournamentStatusTransition[]): TournamentStatusUpdateResult {
  const openedTournamentIds = events
    .filter((event) => event.toStatus === "registration_open")
    .map((event) => event.tournamentId);
  const closedTournamentIds = events
    .filter((event) => event.toStatus === "registration_closed")
    .map((event) => event.tournamentId);
  const bracketsGeneratedTournamentIds = events
    .filter((event) => event.toStatus === "brackets_generated")
    .map((event) => event.tournamentId);
  const ongoingTournamentIds = events
    .filter((event) => event.toStatus === "ongoing")
    .map((event) => event.tournamentId);
  const cancelledTournamentIds = events
    .filter((event) => event.toStatus === "cancelled")
    .map((event) => event.tournamentId);

  return {
    openedCount: openedTournamentIds.length,
    closedCount: closedTournamentIds.length,
    bracketsGeneratedCount: bracketsGeneratedTournamentIds.length,
    ongoingCount: ongoingTournamentIds.length,
    cancelledCount: cancelledTournamentIds.length,
    openedTournamentIds,
    closedTournamentIds,
    bracketsGeneratedTournamentIds,
    ongoingTournamentIds,
    cancelledTournamentIds,
    events,
    totalUpdated: events.length,
  };
}

async function writeEventLogs(jobName: string, events: TournamentStatusTransition[]): Promise<void> {
  for (const event of events) {
    await cronLogService.create({
      jobName,
      tournamentId: event.tournamentId,
      level: "info",
      status: "success",
      message: "Tournament status changed",
      meta: event,
      startedAt: new Date(),
      finishedAt: new Date(),
      durationMs: 0,
    });
  }
}

async function notifyStatusTransitions(
  jobName: string,
  events: TournamentStatusTransition[],
): Promise<void> {
  if (events.length === 0) return;

  try {
    await tournamentStatusNotificationService.notifyTransitions(events);
  } catch (error) {
    await cronLogService.create({
      jobName,
      level: "error",
      status: "failed",
      message: "Failed to notify tournament status changes",
      meta: { error: error instanceof Error ? error.message : String(error) },
      startedAt: new Date(),
      finishedAt: new Date(),
      durationMs: 0,
    });
  }
}

async function runStatusJob(
  jobName: string,
  lockName: string,
  handler: () => Promise<TournamentStatusTransition[]>,
): Promise<TournamentStatusUpdateResult> {
  const startedAt = new Date();
  const locked = await withDbLock(lockName, handler);

  if (!locked.acquired) {
    await cronLogService.create({
      jobName,
      level: "warn",
      status: "skipped",
      message: "Cron job skipped because another worker holds the lock",
      meta: { lockName },
      startedAt,
      finishedAt: new Date(),
      durationMs: Date.now() - startedAt.getTime(),
    });
    return summarizeEvents([]);
  }

  const events = locked.result;
  const summary = summarizeEvents(events);
  const finishedAt = new Date();

  await cronLogService.create({
    jobName,
    level: "info",
    status: "success",
    message: "Tournament status job completed",
    meta: summary,
    startedAt,
    finishedAt,
    durationMs: finishedAt.getTime() - startedAt.getTime(),
  });
  await writeEventLogs(jobName, events);
  await notifyStatusTransitions(jobName, events);

  if (summary.totalUpdated > 0) {
    console.log(`[CRON] ${jobName}: updated ${summary.totalUpdated} tournament(s) at ${formatDateUTC(finishedAt)}`);
  }

  return summary;
}

async function runConfiguredStatusJob(job: StatusJobConfig): Promise<TournamentStatusUpdateResult> {
  try {
    return await runStatusJob(job.label, job.lockName, job.handler);
  } catch (error) {
    await cronLogService.create({
      jobName: job.label,
      level: "error",
      status: "failed",
      message: "Tournament status job failed",
      meta: { error: error instanceof Error ? error.message : String(error) },
      startedAt: new Date(),
      finishedAt: new Date(),
      durationMs: 0,
    });
    console.error(`[CRON] ${job.label} failed:`, error);
    return summarizeEvents([]);
  }
}

async function runReconcileTournamentStatuses(): Promise<void> {
  const startedAt = new Date();

  try {
    const locked = await withDbLock("cron:tournament-status:reconcile", async () => {
      const result = await tournamentService.reconcileTournamentStatuses();
      return result.events;
    });

    if (!locked.acquired) {
      await cronLogService.create({
        jobName: "tournament-status-reconcile",
        level: "warn",
        status: "skipped",
        message: "Reconcile skipped because another worker holds the lock",
        startedAt,
        finishedAt: new Date(),
        durationMs: Date.now() - startedAt.getTime(),
      });
      return;
    }

    const events = locked.result;
    const summary = summarizeEvents(events);
    const finishedAt = new Date();

    if (summary.totalUpdated > 0) {
      await cronLogService.create({
        jobName: "tournament-status-reconcile",
        level: "info",
        status: "success",
        message: "Tournament status reconcile completed",
        meta: summary,
        startedAt,
        finishedAt,
        durationMs: finishedAt.getTime() - startedAt.getTime(),
      });
    }

    await writeEventLogs("tournament-status-reconcile", events);
    await notifyStatusTransitions("tournament-status-reconcile", events);
  } catch (error) {
    const finishedAt = new Date();
    await cronLogService.create({
      jobName: "tournament-status-reconcile",
      level: "error",
      status: "failed",
      message: "Tournament status reconcile failed",
      meta: { error: error instanceof Error ? error.message : String(error) },
      startedAt,
      finishedAt,
      durationMs: finishedAt.getTime() - startedAt.getTime(),
    });
  }
}

function clearStatusTimer(jobName: StatusJobName): void {
  const timer = timerByJob.get(jobName);
  if (!timer) return;
  clearTimeout(timer);
  timerByJob.delete(jobName);
}

function clearAllStatusTimers(): void {
  for (const jobName of timerByJob.keys()) {
    clearStatusTimer(jobName);
  }
}

function clearRefereeCheckTimer(): void {
  if (!refereeCheckTimer) return;
  clearTimeout(refereeCheckTimer);
  refereeCheckTimer = null;
}

async function writeSchedulerPlanLog(
  jobName: string,
  message: string,
  meta: Record<string, unknown>,
): Promise<void> {
  const now = new Date();
  try {
    await cronLogService.create({
      jobName,
      level: "info",
      status: "success",
      message,
      meta,
      startedAt: now,
      finishedAt: now,
      durationMs: 0,
    });
  } catch (error) {
    console.error(`[CRON] Failed to write scheduler plan log for ${jobName}:`, error);
  }
}

async function loadNextUpdateTime(job: StatusJobConfig): Promise<Date | null> {
  const now = new Date();
  const configs = await ScheduleConfig.findAll({
    attributes: [job.dateField],
    where: {
      [job.dateField]: { [Op.gt]: now },
    },
    order: [[job.dateField, "ASC"]],
    limit: 1,
  });

  const next = configs[0]?.[job.dateField];
  return next ? new Date(next) : null;
}

async function scheduleNextStatusJob(job: StatusJobConfig): Promise<void> {
  clearStatusTimer(job.jobName);

  const nextTime = await loadNextUpdateTime(job);
  if (!nextTime) {
    console.log(`[CRON] ${job.label}: no future update time`);
    await writeSchedulerPlanLog(
      job.label,
      "Tournament status scheduler has no future update time",
      {
        schedulerEvent: "no_future_update_time",
        statusJob: job.jobName,
        dateField: job.dateField,
      },
    );
    return;
  }

  const delay = nextTime.getTime() - Date.now();
  if (delay > MAX_TIMEOUT_MS) {
    const timer = setTimeout(() => {
      void scheduleNextStatusJob(job);
    }, MAX_TIMEOUT_MS);
    timerByJob.set(job.jobName, timer);
    console.log(`[CRON] ${job.label}: next refresh before ${formatDateUTC(nextTime)}`);
    await writeSchedulerPlanLog(
      job.label,
      "Tournament status scheduler planned long timeout refresh",
      {
        schedulerEvent: "next_refresh_before",
        statusJob: job.jobName,
        dateField: job.dateField,
        nextTime: nextTime.toISOString(),
        nextTimeUtc: formatDateUTC(nextTime),
        delayMs: delay,
      },
    );
    return;
  }

  const timer = setTimeout(async () => {
    await runConfiguredStatusJob(job);
    await refreshTournamentStatusUpdateSchedule();
  }, Math.max(delay, 0));
  timerByJob.set(job.jobName, timer);

  console.log(`[CRON] ${job.label}: next update at ${formatDateUTC(nextTime)}`);
  await writeSchedulerPlanLog(
    job.label,
    "Tournament status scheduler planned next update",
    {
      schedulerEvent: "next_update",
      statusJob: job.jobName,
      dateField: job.dateField,
      nextTime: nextTime.toISOString(),
      nextTimeUtc: formatDateUTC(nextTime),
      delayMs: delay,
    },
  );
}

function buildRefereeCheckEvents(config: ScheduleConfig): RefereeCheckEvent[] {
  return [
    {
      tournamentId: config.tournamentId,
      milestone: "after_registration_end",
      runAt: new Date(config.registrationEndDate),
    },
    {
      tournamentId: config.tournamentId,
      milestone: "before_bracket_generation",
      runAt: new Date(new Date(config.bracketGenerationDate).getTime() - ONE_DAY_MS),
    },
    {
      tournamentId: config.tournamentId,
      milestone: "before_tournament_start",
      runAt: new Date(new Date(config.startDate).getTime() - ONE_DAY_MS),
    },
  ];
}

async function loadNextRefereeCheckEvents(): Promise<RefereeCheckEvent[]> {
  const now = new Date();
  const configs = await ScheduleConfig.findAll({
    attributes: [
      "tournamentId",
      "startDate",
      "registrationEndDate",
      "bracketGenerationDate",
    ],
    where: {
      [Op.or]: [
        { registrationEndDate: { [Op.gt]: now } },
        { bracketGenerationDate: { [Op.gt]: now } },
        { startDate: { [Op.gt]: now } },
      ],
    },
  });

  const futureEvents = configs
    .flatMap(buildRefereeCheckEvents)
    .filter((event) => event.runAt > now)
    .sort((a, b) => a.runAt.getTime() - b.runAt.getTime());

  const next = futureEvents[0];
  if (!next) return [];

  const nextTime = next.runAt.getTime();
  return futureEvents.filter((event) => event.runAt.getTime() === nextTime);
}

function getRefereeCheckLabel(milestone: RefereeCheckMilestone): string {
  switch (milestone) {
    case "after_registration_end":
      return "sau khi đóng đăng ký";
    case "before_bracket_generation":
      return "24 giờ trước khi tạo bracket";
    case "before_tournament_start":
      return "24 giờ trước khi giải bắt đầu";
  }
}

function summarizeRefereeCheckEvents(events: RefereeCheckEvent[]): string {
  return events
    .map((event) => `T#${event.tournamentId}:${event.milestone}`)
    .join(", ");
}

async function runRefereeCapacityCheck(event: RefereeCheckEvent): Promise<void> {
  const startedAt = new Date();
  const jobName = "tournament-referee-capacity-check";

  try {
    const locked = await withDbLock(
      `cron:tournament-referee-capacity:${event.tournamentId}:${event.milestone}`,
      async () => {
        const tournament = await Tournament.findByPk(event.tournamentId, {
          attributes: ["id", "name", "createdBy", "status"],
        });
        if (!tournament) return { skipped: true, reason: "Tournament not found" };
        if (["cancelled", "completed", "ongoing"].includes(tournament.status)) {
          return { skipped: true, reason: `Tournament status is ${tournament.status}` };
        }

        const config = await ScheduleConfig.findOne({
          where: { tournamentId: event.tournamentId },
          attributes: ["numberOfTables"],
        });
        if (!config) return { skipped: true, reason: "Schedule config not found" };

        const acceptedReferees = await TournamentReferee.count({
          where: { tournamentId: event.tournamentId, role: "referee" },
        });
        const requiredReferees = config.numberOfTables;
        const missingReferees = Math.max(requiredReferees - acceptedReferees, 0);

        if (missingReferees <= 0) {
          return {
            skipped: false,
            notified: false,
            acceptedReferees,
            requiredReferees,
            missingReferees,
          };
        }

        await notificationService.create(tournament.createdBy, {
          type: "tournament_announcement",
          title: "Thiếu trọng tài cho giải đấu",
          message:
            `Giải "${tournament.name}" cần tối thiểu ${requiredReferees} trọng tài cho ` +
            `${config.numberOfTables} bàn. Hiện có ${acceptedReferees}, còn thiếu ${missingReferees}.`,
          referenceId: tournament.id,
          referenceType: "tournament",
          data: {
            warningType: "insufficient_referees",
            milestone: event.milestone,
            milestoneLabel: getRefereeCheckLabel(event.milestone),
            acceptedReferees,
            requiredReferees,
            missingReferees,
            numberOfTables: config.numberOfTables,
            scheduledAt: event.runAt.toISOString(),
          },
        });

        return {
          skipped: false,
          notified: true,
          acceptedReferees,
          requiredReferees,
          missingReferees,
        };
      },
    );

    const finishedAt = new Date();
    await cronLogService.create({
      jobName,
      tournamentId: event.tournamentId,
      level: locked.acquired ? "info" : "warn",
      status: locked.acquired ? "success" : "skipped",
      message: locked.acquired
        ? "Tournament referee capacity check completed"
        : "Tournament referee capacity check skipped because another worker holds the lock",
      meta: {
        milestone: event.milestone,
        runAt: event.runAt.toISOString(),
        result: locked.acquired ? locked.result : undefined,
      },
      startedAt,
      finishedAt,
      durationMs: finishedAt.getTime() - startedAt.getTime(),
    });
  } catch (error) {
    const finishedAt = new Date();
    await cronLogService.create({
      jobName,
      tournamentId: event.tournamentId,
      level: "error",
      status: "failed",
      message: "Tournament referee capacity check failed",
      meta: {
        milestone: event.milestone,
        runAt: event.runAt.toISOString(),
        error: error instanceof Error ? error.message : String(error),
      },
      startedAt,
      finishedAt,
      durationMs: finishedAt.getTime() - startedAt.getTime(),
    });
  }
}

async function scheduleNextRefereeCheckJob(): Promise<void> {
  clearRefereeCheckTimer();

  const events = await loadNextRefereeCheckEvents();
  const nextTime = events[0]?.runAt;
  if (!nextTime) {
    console.log("[CRON] tournament-referee-capacity-check: no future update time");
    await writeSchedulerPlanLog(
      "tournament-referee-capacity-check",
      "Tournament referee capacity scheduler has no future update time",
      {
        schedulerEvent: "no_future_update_time",
      },
    );
    return;
  }

  const delay = nextTime.getTime() - Date.now();
  if (delay > MAX_TIMEOUT_MS) {
    refereeCheckTimer = setTimeout(() => {
      void scheduleNextRefereeCheckJob();
    }, MAX_TIMEOUT_MS);
    console.log(
      `[CRON] tournament-referee-capacity-check: next refresh before ${formatDateUTC(nextTime)} ` +
        `(${events.length} event(s): ${summarizeRefereeCheckEvents(events)})`,
    );
    await writeSchedulerPlanLog(
      "tournament-referee-capacity-check",
      "Tournament referee capacity scheduler planned long timeout refresh",
      {
        schedulerEvent: "next_refresh_before",
        nextTime: nextTime.toISOString(),
        nextTimeUtc: formatDateUTC(nextTime),
        delayMs: delay,
        eventCount: events.length,
        events: events.map((event) => ({
          tournamentId: event.tournamentId,
          milestone: event.milestone,
          runAt: event.runAt.toISOString(),
        })),
      },
    );
    return;
  }

  refereeCheckTimer = setTimeout(async () => {
    for (const event of events) {
      await runRefereeCapacityCheck(event);
    }
    await refreshTournamentStatusUpdateSchedule();
  }, Math.max(delay, 0));

  console.log(
    `[CRON] tournament-referee-capacity-check: next update at ${formatDateUTC(nextTime)} ` +
      `(${events.length} event(s): ${summarizeRefereeCheckEvents(events)})`,
  );
  await writeSchedulerPlanLog(
    "tournament-referee-capacity-check",
    "Tournament referee capacity scheduler planned next update",
    {
      schedulerEvent: "next_update",
      nextTime: nextTime.toISOString(),
      nextTimeUtc: formatDateUTC(nextTime),
      delayMs: delay,
      eventCount: events.length,
      events: events.map((event) => ({
        tournamentId: event.tournamentId,
        milestone: event.milestone,
        runAt: event.runAt.toISOString(),
      })),
    },
  );
}

export async function refreshTournamentStatusUpdateSchedule(): Promise<void> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      await Promise.all([
        ...statusJobs.map((job) => scheduleNextStatusJob(job)),
        scheduleNextRefereeCheckJob(),
      ]);
    } catch (error) {
      console.error("[CRON] Error refreshing tournament status schedule:", error);
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

async function startTournamentStatusRefreshSubscriber(): Promise<void> {
  try {
    await connectRedis();
    if (!redisClient.isReady) return;

    redisSubscriber = redisClient.duplicate();
    await redisSubscriber.connect();
    await redisSubscriber.subscribe(TOURNAMENT_STATUS_REFRESH_CHANNEL, async () => {
      await runReconcileTournamentStatuses();
      await refreshTournamentStatusUpdateSchedule();
    });
  } catch (error) {
    console.error("[CRON] Error subscribing tournament status schedule refresh:", error);
  }
}

export const reconcileTournamentStatuses = cron.schedule(
  RECONCILE_CRON,
  async () => {
    await runReconcileTournamentStatuses();
  },
);

export const refreshTournamentStatusSchedule = cron.schedule(
  PERIODIC_REFRESH_CRON,
  async () => {
    await refreshTournamentStatusUpdateSchedule();
  },
);

export const notifyUpcomingStatusChanges = cron.schedule(
  "0 * * * *",
  async () => {
    try {
      const { openingSoon, closingSoon, bracketsSoon } =
        await tournamentService.getUpcomingStatusChanges(24);

      if (
        openingSoon.length > 0 ||
        closingSoon.length > 0 ||
        bracketsSoon.length > 0
      ) {
        console.log(
          `[CRON] Upcoming tournament status changes in next 24 hours:`
        );

        if (openingSoon.length > 0) {
          console.log(`  - Registration opening: ${openingSoon.length} tournament(s)`);
          for (const t of openingSoon) {
            let dateVal = t.scheduleConfig?.registrationStartDate;
            if (!dateVal) {
              const cfg = await ScheduleConfig.findOne({ where: { tournamentId: t.id }, attributes: ["registrationStartDate"] });
              dateVal = cfg?.registrationStartDate;
            }
            const dateStr = formatDateUTC(dateVal);
            console.log(`    * ${t.name} (ID: ${t.id}) - opens at ${dateStr}`);
          }
        }

        if (closingSoon.length > 0) {
          console.log(`  - Registration closing: ${closingSoon.length} tournament(s)`);
          for (const t of closingSoon) {
            let dateVal = t.scheduleConfig?.registrationEndDate;
            if (!dateVal) {
              const cfg = await ScheduleConfig.findOne({ where: { tournamentId: t.id }, attributes: ["registrationEndDate"] });
              dateVal = cfg?.registrationEndDate;
            }
            const dateStr = formatDateUTC(dateVal);
            console.log(`    * ${t.name} (ID: ${t.id}) - closes at ${dateStr}`);
          }
        }

        if (bracketsSoon.length > 0) {
          console.log(`  - Bracket generation: ${bracketsSoon.length} tournament(s)`);
          for (const t of bracketsSoon) {
            let dateVal = t.scheduleConfig?.bracketGenerationDate;
            if (!dateVal) {
              const cfg = await ScheduleConfig.findOne({ where: { tournamentId: t.id }, attributes: ["bracketGenerationDate"] });
              dateVal = cfg?.bracketGenerationDate;
            }
            const dateStr = formatDateUTC(dateVal);
            console.log(`    * ${t.name} (ID: ${t.id}) - generates brackets at ${dateStr}`);
          }
        }
      }
    } catch (error) {
      console.error(
        "[CRON] Error checking upcoming tournament status changes:",
        error
      );
    }
  }
);

export const startTournamentCrons = async () => {
  if (!tournamentStatusSchedulerStarted) {
    tournamentStatusSchedulerStarted = true;
    await runReconcileTournamentStatuses();
    await refreshTournamentStatusUpdateSchedule();
    void startTournamentStatusRefreshSubscriber();
  }

  reconcileTournamentStatuses.start();
  refreshTournamentStatusSchedule.start();
  notifyUpcomingStatusChanges.start();
  console.log("[CRON] All tournament cron jobs started");
};

export const stopTournamentCrons = () => {
  tournamentStatusSchedulerStarted = false;
  clearAllStatusTimers();
  clearRefereeCheckTimer();
  if (redisSubscriber?.isOpen) {
    redisSubscriber.quit().catch((error) => {
      console.error("[CRON] Error closing tournament status refresh subscriber:", error);
    });
  }
  redisSubscriber = null;
  reconcileTournamentStatuses.stop();
  refreshTournamentStatusSchedule.stop();
  notifyUpcomingStatusChanges.stop();
  console.log("[CRON] All tournament cron jobs stopped");
};
