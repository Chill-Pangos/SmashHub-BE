import app from "./app";
import config from "./config/config";
import db from "./config/database";

const checkConnection = async () => {
  try {
    await db.authenticate();
    console.log("Database connected successfully");
  } catch (error) {
    console.error("Database connection failed:", error);
  }
};

checkConnection().then(() => {
  app.listen(config.port, () => {
    console.log(`Server is running on port ${config.port}`);
  });
});
