import cron from "node-cron";
import { Op, WhereOptions } from "sequelize";
import Tournament from "../models/tournament.model";
import ScheduleConfig from "../models/scheduleConfig.model";

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
      const statuses = { opened: 0, closed: 0, brackets: 0 };

      const getIds = async (where: WhereOptions<any>): Promise<number[]> => {
        const configs = await ScheduleConfig.findAll({ where, attributes: ["tournamentId"] });
        return configs.map((c: any) => c.tournamentId);
      };

      // 1. upcoming → registration_open
      const openIds = await getIds({ registrationStartDate: { [Op.lte]: now, [Op.not]: null }, registrationEndDate: { [Op.gt]: now, [Op.not]: null } });
      if (openIds.length > 0) {
        const r = await Tournament.update({ status: "registration_open" }, { where: { status: "upcoming", id: { [Op.in]: openIds } } });
        statuses.opened += r[0];
      }

      // 2. registration_open → registration_closed
      const closeIds = await getIds({ registrationEndDate: { [Op.lte]: now, [Op.not]: null }, bracketGenerationDate: { [Op.gt]: now, [Op.not]: null } });
      if (closeIds.length > 0) {
        const r = await Tournament.update({ status: "registration_closed" }, { where: { status: "registration_open", id: { [Op.in]: closeIds } } });
        statuses.closed += r[0];
      }

      // 3. registration_closed → brackets_generated
      const bracketIds = await getIds({ bracketGenerationDate: { [Op.lte]: now, [Op.not]: null } });
      if (bracketIds.length > 0) {
        const r = await Tournament.update({ status: "brackets_generated" }, { where: { status: "registration_closed", id: { [Op.in]: bracketIds } } });
        statuses.brackets += r[0];
      }

      // 4. Edge case: upcoming → registration_closed (skip open phase)
      const skipCloseIds = await getIds({ registrationStartDate: { [Op.lte]: now, [Op.not]: null }, registrationEndDate: { [Op.lte]: now, [Op.not]: null }, bracketGenerationDate: { [Op.gt]: now, [Op.not]: null } });
      if (skipCloseIds.length > 0) {
        const r = await Tournament.update({ status: "registration_closed" }, { where: { status: "upcoming", id: { [Op.in]: skipCloseIds } } });
        statuses.closed += r[0];
      }

      // 5. Edge case: any early phase → brackets_generated (ids resolved again)
      const skipBracketIds = await getIds({ bracketGenerationDate: { [Op.lte]: now, [Op.not]: null } });
      if (skipBracketIds.length > 0) {
        const r = await Tournament.update({ status: "brackets_generated" }, { where: { status: { [Op.in]: ["upcoming", "registration_open", "registration_closed"] }, id: { [Op.in]: skipBracketIds } } });
        statuses.brackets += r[0];
      }

      const totalUpdated = statuses.opened + statuses.closed + statuses.brackets;
      if (totalUpdated > 0) {
        console.log(`[CRON] Updated ${totalUpdated} tournament(s) status at ${now.toISOString()}`);
        console.log(`  - Opened registration: ${statuses.opened} tournament(s)`);
        console.log(`  - Closed registration: ${statuses.closed} tournament(s)`);
        console.log(`  - Generated brackets: ${statuses.brackets} tournament(s)`);
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

      const getIds = async (where: WhereOptions<any>): Promise<number[]> => {
        const configs = await ScheduleConfig.findAll({ where, attributes: ["tournamentId"] });
        return configs.map((c: any) => c.tournamentId);
      };

      // Check for upcoming registration openings
      const openingIds = await getIds({ registrationStartDate: { [Op.between]: [now, next24Hours] } });
      const upcomingOpen = openingIds.length > 0
        ? await Tournament.findAll({ where: { status: "upcoming", id: { [Op.in]: openingIds } }, attributes: ["id", "name"], include: [{ model: ScheduleConfig, as: "scheduleConfig", attributes: ["registrationStartDate"] }] })
        : [];

      // Check for upcoming registration closings
      const closingIds = await getIds({ registrationEndDate: { [Op.between]: [now, next24Hours] } });
      const upcomingClose = closingIds.length > 0
        ? await Tournament.findAll({ where: { status: "registration_open", id: { [Op.in]: closingIds } }, attributes: ["id", "name"], include: [{ model: ScheduleConfig, as: "scheduleConfig", attributes: ["registrationEndDate"] }] })
        : [];

      // Check for upcoming bracket generation
      const bracketIds = await getIds({ bracketGenerationDate: { [Op.between]: [now, next24Hours] } });
      const upcomingBrackets = bracketIds.length > 0
        ? await Tournament.findAll({ where: { status: "registration_closed", id: { [Op.in]: bracketIds } }, attributes: ["id", "name"], include: [{ model: ScheduleConfig, as: "scheduleConfig", attributes: ["bracketGenerationDate"] }] })
        : [];

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
          upcomingOpen.forEach((t: any) => {
            console.log(`    * ${t.name} (ID: ${t.id}) at ${t.scheduleConfig?.registrationStartDate}`);
          });
        }

        if (upcomingClose.length > 0) {
          console.log(`  - Registration closing: ${upcomingClose.length} tournament(s)`);
          upcomingClose.forEach((t: any) => {
            console.log(`    * ${t.name} (ID: ${t.id}) at ${t.scheduleConfig?.registrationEndDate}`);
          });
        }

        if (upcomingBrackets.length > 0) {
          console.log(`  - Bracket generation: ${upcomingBrackets.length} tournament(s)`);
          upcomingBrackets.forEach((t: any) => {
            console.log(`    * ${t.name} (ID: ${t.id}) at ${t.scheduleConfig?.bracketGenerationDate}`);
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
