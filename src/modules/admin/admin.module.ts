import { Router } from "express";
import cronLogRoutes from "./routes/cronLog.routes";
import adminSystemRoutes from "./routes/adminSystem.routes";
import type { AppModule } from "../module.types";

const router = Router();

router.use("/cron-logs", cronLogRoutes);
router.use("/admin/system", adminSystemRoutes);

export const adminModule: AppModule = {
  name: "admin",
  router,
};
