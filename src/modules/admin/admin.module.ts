import { Router } from "express";
import cronLogRoutes from "./routes/cronLog.routes";
import adminSystemRoutes from "./routes/adminSystem.routes";
import type { AppModule } from "../module.types";
import { registerAdminEventHandlers } from "./admin.events";

const router = Router();

registerAdminEventHandlers();

router.use("/cron-logs", cronLogRoutes);
router.use("/admin/system", adminSystemRoutes);

export const adminModule: AppModule = {
  name: "admin",
  router,
};
