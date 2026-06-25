import { Router } from "express";
import entryRoutes from "./routes/entry.routes";
import entryMemberRoutes from "./routes/entryMember.routes";
import paymentRoutes from "./routes/payment.routes";
import type { AppModule } from "../module.types";

const router = Router();

router.use("/entries", entryRoutes);
router.use("/entries/:entryId/members", entryMemberRoutes);
router.use("/payments", paymentRoutes);

export const registrationModule: AppModule = {
  name: "registration",
  router,
};
