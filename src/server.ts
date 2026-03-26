import "reflect-metadata";
import { createServer } from "http";
import app from "./app";
import config from "./config/config";
import sequelize from "./config/database";
import { startCleanupCrons } from "./crons/cleanup.cron";
import NotificationService from "./services/notification.service";
import { TournamentScheduler } from "./jobs/tournamentScheduler";

const checkConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log("Database connected successfully");
  } catch (error) {
    console.error("Database connection failed:", error);
  }
};

checkConnection().then(() => {
  const httpServer = createServer(app);

  // Initialize Socket.IO
  NotificationService.initialize(httpServer);

  // Initialize Tournament Scheduler
  const tournamentScheduler = new TournamentScheduler();

  httpServer.listen(config.port, () => {
    console.log(`Server is running on port ${config.port}`);
    console.log(`Socket.IO is ready for connections`);

    // Start cron jobs
    startCleanupCrons();

    // Start tournament scheduler
    tournamentScheduler.startScheduler();
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    tournamentScheduler.stopScheduler();
    process.exit(0);
  });

  process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    tournamentScheduler.stopScheduler();
    process.exit(0);
  });
});
