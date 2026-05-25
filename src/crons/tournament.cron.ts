import cron from "node-cron";
import tournamentService from "../services/tournament.service";
import ScheduleConfig from "../models/scheduleConfig.model";
import { formatDateGMT7 } from "../utils/date.helper";

/**
 * Cron job: Auto update tournament status based on dates
 * Pattern: Every 15 minutes
 *
 * Logic:
 * 1. When registrationStartDate is reached -> status changes to "registration_open"
 * 2. When registrationEndDate is reached -> status changes to "registration_closed"
 * 3. When bracketGenerationDate is reached -> status changes to "brackets_generated"
 */
export const autoUpdateTournamentStatus = cron.schedule(
  "*/15 * * * *",
  async () => {
    try {
      const now = new Date();
      const {
        openedCount,
        closedCount,
        bracketsGeneratedCount,
        totalUpdated,
      } = await tournamentService.updateTournamentStatuses();

      if (totalUpdated > 0) {
        console.log(`[CRON] Updated ${totalUpdated} tournament(s) status at ${formatDateGMT7(now)}`);
        console.log(`  - Opened registration: ${openedCount} tournament(s)`);
        console.log(`  - Closed registration: ${closedCount} tournament(s)`);
        console.log(`  - Generated brackets: ${bracketsGeneratedCount} tournament(s)`);
      }
    } catch (error) {
      console.error("[CRON] Error updating tournament status:", error);
    }
  }
);

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
export const startTournamentCrons = () => {
  autoUpdateTournamentStatus.start();
  notifyUpcomingStatusChanges.start();
  console.log("[CRON] All tournament cron jobs started");
};

/**
 * Stop all tournament cron jobs
 */
export const stopTournamentCrons = () => {
  autoUpdateTournamentStatus.stop();
  notifyUpcomingStatusChanges.stop();
  console.log("[CRON] All tournament cron jobs stopped");
};
