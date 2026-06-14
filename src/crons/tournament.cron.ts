import cron from "node-cron";
import tournamentService from "../services/tournament.service";
import ScheduleConfig from "../models/scheduleConfig.model";
import redisClient, { connectRedis } from "../config/redis";
import { formatDateGMT7 } from "../utils/date.helper";
import { TOURNAMENT_STATUS_REFRESH_CHANNEL } from "../utils/tournamentStatusScheduler.helper";

const MAX_TIMEOUT_MS = 2_147_483_647;

let tournamentStatusTimer: NodeJS.Timeout | null = null;
let scheduledUpdateTimes: Date[] = [];
let tournamentStatusSchedulerStarted = false;
let refreshPromise: Promise<void> | null = null;
let redisSubscriber: ReturnType<typeof redisClient.duplicate> | null = null;

/**
 * Dynamic scheduler: Auto update tournament status based on schedule_configs dates
 *
 * Logic:
 * 1. When registrationStartDate is reached -> status changes to "registration_open"
 * 2. When registrationEndDate is reached -> status changes to "registration_closed"
 * 3. When bracketGenerationDate is reached -> status changes to "brackets_generated"
 */
async function runTournamentStatusUpdate(): Promise<void> {
  try {
    const now = new Date();
    const {
      openedCount,
      closedCount,
      bracketsGeneratedCount,
      cancelledCount,
      totalUpdated,
    } = await tournamentService.updateTournamentStatuses();

    if (totalUpdated > 0) {
      console.log(`[CRON] Updated ${totalUpdated} tournament(s) status at ${formatDateGMT7(now)}`);
      console.log(`  - Opened registration: ${openedCount} tournament(s)`);
      console.log(`  - Closed registration: ${closedCount} tournament(s)`);
      console.log(`  - Generated brackets: ${bracketsGeneratedCount} tournament(s)`);
      console.log(`  - Cancelled: ${cancelledCount} tournament(s)`);
    }
  } catch (error) {
    console.error("[CRON] Error updating tournament status:", error);
  }
}

function clearTournamentStatusTimer(): void {
  if (!tournamentStatusTimer) return;
  clearTimeout(tournamentStatusTimer);
  tournamentStatusTimer = null;
}

async function loadScheduledUpdateTimes(): Promise<Date[]> {
  const now = new Date();
  const configs = await ScheduleConfig.findAll({
    attributes: [
      "registrationStartDate",
      "registrationEndDate",
      "bracketGenerationDate",
    ],
  });

  const uniqueTimes = new Set<number>();
  for (const config of configs) {
    for (const dateValue of [
      config.registrationStartDate,
      config.registrationEndDate,
      config.bracketGenerationDate,
    ]) {
      if (!dateValue) continue;
      const time = new Date(dateValue).getTime();
      if (time > now.getTime()) uniqueTimes.add(time);
    }
  }

  return [...uniqueTimes].sort((a, b) => a - b).map((time) => new Date(time));
}

function scheduleNextTournamentStatusUpdate(): void {
  clearTournamentStatusTimer();

  const nextTime = scheduledUpdateTimes[0];
  if (!nextTime) {
    console.log("[CRON] Tournament status scheduler: no future update time");
    return;
  }

  const delay = nextTime.getTime() - Date.now();
  if (delay <= 0) {
    tournamentStatusTimer = setTimeout(async () => {
      await runTournamentStatusUpdate();
      await refreshTournamentStatusUpdateSchedule();
    }, 0);
    return;
  }

  if (delay > MAX_TIMEOUT_MS) {
    tournamentStatusTimer = setTimeout(
      () => refreshTournamentStatusUpdateSchedule(),
      MAX_TIMEOUT_MS,
    );
    console.log(`[CRON] Tournament status scheduler: next refresh before ${formatDateGMT7(nextTime)}`);
    return;
  }

  tournamentStatusTimer = setTimeout(async () => {
    await runTournamentStatusUpdate();
    await refreshTournamentStatusUpdateSchedule();
  }, delay);

  console.log(`[CRON] Tournament status scheduler: next update at ${formatDateGMT7(nextTime)}`);
}

export async function refreshTournamentStatusUpdateSchedule(): Promise<void> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      scheduledUpdateTimes = await loadScheduledUpdateTimes();
      scheduleNextTournamentStatusUpdate();
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
    redisSubscriber = redisClient.duplicate();
    await redisSubscriber.connect();
    await redisSubscriber.subscribe(TOURNAMENT_STATUS_REFRESH_CHANNEL, async () => {
      await runTournamentStatusUpdate();
      await refreshTournamentStatusUpdateSchedule();
    });
  } catch (error) {
    console.error("[CRON] Error subscribing tournament status schedule refresh:", error);
  }
}

/**
 * Cron job: Notify upcoming tournament status changes
 * Pattern: Every hour at minute 0
 *
 * This job checks for tournaments that will change status in the next 24 hours
 * and logs warnings for admin awareness
 */
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
            const dateStr = formatDateGMT7(dateVal);
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
            const dateStr = formatDateGMT7(dateVal);
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

/**
 * Start all tournament cron jobs
 */
export const startTournamentCrons = async () => {
  if (!tournamentStatusSchedulerStarted) {
    tournamentStatusSchedulerStarted = true;
    await runTournamentStatusUpdate();
    await refreshTournamentStatusUpdateSchedule();
    void startTournamentStatusRefreshSubscriber();
  }
  notifyUpcomingStatusChanges.start();
  console.log("[CRON] All tournament cron jobs started");
};

/**
 * Stop all tournament cron jobs
 */
export const stopTournamentCrons = () => {
  tournamentStatusSchedulerStarted = false;
  clearTournamentStatusTimer();
  if (redisSubscriber?.isOpen) {
    redisSubscriber.quit().catch((error) => {
      console.error("[CRON] Error closing tournament status refresh subscriber:", error);
    });
  }
  redisSubscriber = null;
  notifyUpcomingStatusChanges.stop();
  console.log("[CRON] All tournament cron jobs stopped");
};
