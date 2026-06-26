import "reflect-metadata";
import { createServer } from "http";
import app from "./app";
import config from "./config/config";
import sequelize from "./config/database";
import { connectRedis, disconnectRedis } from "./config/redis";
import { notificationRuntimeService } from "./modules/notification/public.runtime";
import { adminRuntimeService } from "./modules/admin/public.runtime";

const checkConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log("Database connected successfully");
  } catch (error) {
    console.error("Database connection failed:", error);
    process.exit(1);
  }
};

checkConnection().then(() => {
  connectRedis().then((client) => {
    if (client?.isReady) {
      console.log("Redis connected successfully");
    }
  });

  const httpServer = createServer(app);

  // Initialize Socket.IO
  notificationRuntimeService.initialize(httpServer);
  adminRuntimeService.startRealtimePublisher();

  httpServer.listen(config.port, () => {
    console.log(`Server is running on port ${config.port}`);
    console.log(`Socket.IO is ready for connections`);

    // Cron jobs are started by a dedicated cron process (src/cron.ts)
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    disconnectRedis().finally(() => {
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    disconnectRedis().finally(() => {
      process.exit(0);
    });
  });
});
