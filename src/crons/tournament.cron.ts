import cron from "node-cron";
import { Op } from "sequelize";
import Tournament from "../models/tournament.model";

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
      let totalUpdated = 0;

      // 1. Open registration: upcoming -> registration_open
      const openedCount = await Tournament.update(
        { status: "registration_open" },
        {
          where: {
            status: "upcoming",
            registrationStartDate: {
              [Op.lte]: now,
              [Op.not]: null,
            },
          },
        }
      );
      totalUpdated += openedCount[0];

      // 2. Close registration: registration_open -> registration_closed
      const closedCount = await Tournament.update(
        { status: "registration_closed" },
        {
          where: {
            status: "registration_open",
            registrationEndDate: {
              [Op.lte]: now,
              [Op.not]: null,
            },
          },
        }
      );
      totalUpdated += closedCount[0];

      // 3. Generate brackets: registration_closed -> brackets_generated
      const bracketsCount = await Tournament.update(
        { status: "brackets_generated" },
        {
          where: {
            status: "registration_closed",
            bracketGenerationDate: {
              [Op.lte]: now,
              [Op.not]: null,
            },
          },
        }
      );
      totalUpdated += bracketsCount[0];

      if (totalUpdated > 0) {
        console.log(
          `[CRON] Updated ${totalUpdated} tournament(s) status at ${now.toISOString()}`
        );
        console.log(
          `  - Opened registration: ${openedCount[0]} tournament(s)`
        );
        console.log(
          `  - Closed registration: ${closedCount[0]} tournament(s)`
        );
        console.log(
          `  - Generated brackets: ${bracketsCount[0]} tournament(s)`
        );
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
      const now = new Date();
      const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      // Check for upcoming registration openings
      const upcomingOpen = await Tournament.findAll({
        where: {
          status: "upcoming",
          registrationStartDate: {
            [Op.between]: [now, next24Hours],
          },
        },
        attributes: ["id", "name", "registrationStartDate"],
      });

      // Check for upcoming registration closings
      const upcomingClose = await Tournament.findAll({
        where: {
          status: "registration_open",
          registrationEndDate: {
            [Op.between]: [now, next24Hours],
          },
        },
        attributes: ["id", "name", "registrationEndDate"],
      });

      // Check for upcoming bracket generation
      const upcomingBrackets = await Tournament.findAll({
        where: {
          status: "registration_closed",
          bracketGenerationDate: {
            [Op.between]: [now, next24Hours],
          },
        },
        attributes: ["id", "name", "bracketGenerationDate"],
      });

      if (
        upcomingOpen.length > 0 ||
        upcomingClose.length > 0 ||
        upcomingBrackets.length > 0
      ) {
        console.log(
          `[CRON] Upcoming tournament status changes in next 24 hours:`
        );

        if (upcomingOpen.length > 0) {
          console.log(`  - Registration opening: ${upcomingOpen.length} tournament(s)`);
          upcomingOpen.forEach((t) => {
            console.log(`    * ${t.name} (ID: ${t.id}) at ${t.registrationStartDate}`);
          });
        }

        if (upcomingClose.length > 0) {
          console.log(`  - Registration closing: ${upcomingClose.length} tournament(s)`);
          upcomingClose.forEach((t) => {
            console.log(`    * ${t.name} (ID: ${t.id}) at ${t.registrationEndDate}`);
          });
        }

        if (upcomingBrackets.length > 0) {
          console.log(`  - Bracket generation: ${upcomingBrackets.length} tournament(s)`);
          upcomingBrackets.forEach((t) => {
            console.log(`    * ${t.name} (ID: ${t.id}) at ${t.bracketGenerationDate}`);
          });
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
