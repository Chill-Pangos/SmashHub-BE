import { Router } from "express";
import notificationRoutes from "./routes/notification.routes";
import type { AppModule } from "../module.types";

const router = Router();

router.use("/notifications", notificationRoutes);

export const notificationModule: AppModule = {
  name: "notification",
  router,
};
