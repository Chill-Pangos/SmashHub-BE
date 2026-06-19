import { Router } from "express";
import cronLogController from "../controllers/cronLog.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { checkPermission } from "../middlewares/permission.middleware";

const router = Router();

router.get(
  "/",
  authenticate,
  checkPermission("cron_logs:view"),
  cronLogController.findAll.bind(cronLogController),
);

router.get(
  "/latest",
  authenticate,
  checkPermission("cron_logs:view"),
  cronLogController.latest.bind(cronLogController),
);

export default router;
