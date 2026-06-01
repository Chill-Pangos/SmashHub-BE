import "reflect-metadata";
import sequelize from "./config/database";
import { startCleanupCrons, stopCleanupCrons } from "./crons/cleanup.cron";
import { startTournamentCrons, stopTournamentCrons } from "./crons/tournament.cron";

const start = async () => {
  try {
    await sequelize.authenticate();
    console.log("Database connected for cron process");

    // Start cron jobs
    startCleanupCrons();
    startTournamentCrons();

    console.log("Cron jobs started");
  } catch (error) {
    console.error("Failed to start cron process:", error);
    process.exit(1);
  }
};

const shutdown = async () => {
  console.log("Shutting down cron process...");
  try {
    stopCleanupCrons();
    stopTournamentCrons();
  } catch (e) {
    console.error("Error stopping cron jobs:", e);
  }
  process.exit(0);
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

start();
