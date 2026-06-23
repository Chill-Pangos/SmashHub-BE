import { Router } from "express";
import adminSystemController from "../controllers/adminSystem.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { checkPermission } from "../middlewares/permission.middleware";

const router = Router();

router.get(
  "/summary",
  authenticate,
  checkPermission("admin_system:view"),
  adminSystemController.summary.bind(adminSystemController),
);

router.get(
  "/health",
  authenticate,
  checkPermission("admin_system:view"),
  adminSystemController.health.bind(adminSystemController),
);

router.get(
  "/metrics",
  authenticate,
  checkPermission("admin_system:view"),
  adminSystemController.metrics.bind(adminSystemController),
);

router.get(
  "/events",
  authenticate,
  checkPermission("admin_system:view"),
  adminSystemController.events.bind(adminSystemController),
);

router.get(
  "/audit-logs",
  authenticate,
  checkPermission("admin_system:view"),
  adminSystemController.auditLogs.bind(adminSystemController),
);

export default router;
