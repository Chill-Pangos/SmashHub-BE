import "reflect-metadata";
import app from "./app";
import config from "./config/config";
import sequelize from "./config/database";
import { startCleanupCrons } from "./cron/cleanup.cron";

const checkConnection = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync({force: true});
    console.log("Database connected successfully");
  } catch (error) {
    console.error("Database connection failed:", error);
  }
};

checkConnection().then(() => {
  app.listen(config.port, () => {
    console.log(`Server is running on port ${config.port}`);
    
    // Start cron jobs
    startCleanupCrons();
  });
});
