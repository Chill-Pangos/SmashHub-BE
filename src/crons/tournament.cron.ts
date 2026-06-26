import cron from "node-cron";
import {
  type TournamentStatusTransition,
  type TournamentStatusUpdateResult,
  tournamentRuntimeService,
} from "../modules/tournament/public.runtime";
import {
  competitionReadService,
  type ScheduleConfigDateField,
} from "../modules/competition/public.read";
import redisClient, { connectRedis } from "../config/redis";
import { formatDateGMT7 } from "../utils/date.helper";
import { TOURNAMENT_STATUS_REFRESH_CHANNEL } from "../utils/tournamentStatusScheduler.helper";
import { withDbLock } from "../utils/dbLock.helper";
import { adminWriteService } from "../modules/admin/public.write";

const MAX_TIMEOUT_MS = 2_147_483_647;
const PERIODIC_REFRESH_CRON = "*/5 * * * *";
const RECONCILE_CRON = "* * * * *";

type StatusJobName = "open" | "close" | "bracket" | "start";

type StatusJobConfig = {
  jobName: StatusJobName;
  label: string;
  dateField: ScheduleConfigDateField;
  lockName: string;
  handler: () => Promise<TournamentStatusTransition[]>;
};

const statusJobs: StatusJobConfig[] = [
  {
    jobName: "open",
    label: "tournament-status-open",
    dateField: "registrationStartDate",
    lockName: "cron:tournament-status:open",
    handler: () => tournamentRuntimeService.openRegistrations(),
  },
  {
    jobName: "close",
    label: "tournament-status-close",
    dateField: "registrationEndDate",
    lockName: "cron:tournament-status:close",
    handler: () => tournamentRuntimeService.closeRegistrations(),
  },
  {
    jobName: "bracket",
    label: "tournament-status-bracket",
    dateField: "bracketGenerationDate",
    lockName: "cron:tournament-status:bracket",
    handler: () => tournamentRuntimeService.generateBracketsOrCancel(),
  },
  {
    jobName: "start",
    label: "tournament-status-start",
    dateField: "startDate",
    lockName: "cron:tournament-status:start",
    handler: () => tournamentRuntimeService.startTournaments(),
  },
];

const timerByJob = new Map<StatusJobName, NodeJS.Timeout>();
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
    await adminWriteService.createCronLog({
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
    await tournamentRuntimeService.notifyTransitions(events);
  } catch (error) {
    await adminWriteService.createCronLog({
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
    await adminWriteService.createCronLog({
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

  await adminWriteService.createCronLog({
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
    console.log(`[CRON] ${jobName}: updated ${summary.totalUpdated} tournament(s) at ${formatDateGMT7(finishedAt)}`);
  }

  return summary;
}

async function runConfiguredStatusJob(job: StatusJobConfig): Promise<TournamentStatusUpdateResult> {
  try {
    return await runStatusJob(job.label, job.lockName, job.handler);
  } catch (error) {
    await adminWriteService.createCronLog({
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
  const locked = await withDbLock("cron:tournament-status:reconcile", async () => {
    const result = await tournamentRuntimeService.reconcileTournamentStatuses();
    return result.events;
  });

  if (!locked.acquired) {
    await adminWriteService.createCronLog({
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
  await adminWriteService.createCronLog({
    jobName: "tournament-status-reconcile",
    level: "info",
    status: "success",
    message: "Tournament status reconcile completed",
    meta: summary,
    startedAt,
    finishedAt,
    durationMs: finishedAt.getTime() - startedAt.getTime(),
  });
  await writeEventLogs("tournament-status-reconcile", events);
  await notifyStatusTransitions("tournament-status-reconcile", events);
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

async function loadNextUpdateTime(job: StatusJobConfig): Promise<Date | null> {
  return competitionReadService.getNextScheduleConfigDate(job.dateField);
}

async function scheduleNextStatusJob(job: StatusJobConfig): Promise<void> {
  clearStatusTimer(job.jobName);

  const nextTime = await loadNextUpdateTime(job);
  if (!nextTime) {
    console.log(`[CRON] ${job.label}: no future update time`);
    return;
  }

  const delay = nextTime.getTime() - Date.now();
  if (delay > MAX_TIMEOUT_MS) {
    const timer = setTimeout(() => {
      void scheduleNextStatusJob(job);
    }, MAX_TIMEOUT_MS);
    timerByJob.set(job.jobName, timer);
    console.log(`[CRON] ${job.label}: next refresh before ${formatDateGMT7(nextTime)}`);
    return;
  }

  const timer = setTimeout(async () => {
    await runConfiguredStatusJob(job);
    await refreshTournamentStatusUpdateSchedule();
  }, Math.max(delay, 0));
  timerByJob.set(job.jobName, timer);

  console.log(`[CRON] ${job.label}: next update at ${formatDateGMT7(nextTime)}`);
}

export async function refreshTournamentStatusUpdateSchedule(): Promise<void> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      await Promise.all(statusJobs.map((job) => scheduleNextStatusJob(job)));
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
        await tournamentRuntimeService.getUpcomingStatusChanges(24);

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
              const cfg = await competitionReadService.getTournamentScheduleConfig(t.id);
              dateVal = cfg?.registrationStartDate;
            }
            const dateStr = formatDateGMT7(dateVal);
            console.log(`    * ${t.name} (ID: ${t.id}) - opens at ${dateStr}`);
          }
        }

        if (closingSoon.length > 0) {
          console.log(`  - Registration closing: ${closingSoon.length} tournament(s)`);
          for (const t of closingSoon) {
            let dateVal = t.scheduleConfig?.registrationEndDate;
            if (!dateVal) {
              const cfg = await competitionReadService.getTournamentScheduleConfig(t.id);
              dateVal = cfg?.registrationEndDate;
            }
            const dateStr = formatDateGMT7(dateVal);
            console.log(`    * ${t.name} (ID: ${t.id}) - closes at ${dateStr}`);
          }
        }

        if (bracketsSoon.length > 0) {
          console.log(`  - Bracket generation: ${bracketsSoon.length} tournament(s)`);
          for (const t of bracketsSoon) {
            let dateVal = t.scheduleConfig?.bracketGenerationDate;
            if (!dateVal) {
              const cfg = await competitionReadService.getTournamentScheduleConfig(t.id);
              dateVal = cfg?.bracketGenerationDate;
            }
            const dateStr = formatDateGMT7(dateVal);
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
