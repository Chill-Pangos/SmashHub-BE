import { Router } from "express";
import scheduleRoutes from "./routes/schedule.routes";
import scheduleConfigRoutes from "./routes/scheduleConfig.routes";
import matchRoutes from "./routes/match.routes";
import subMatchRoutes from "./routes/subMatch.routes";
import subMatchPlayerRoutes from "./routes/subMatchPlayer.routes";
import matchSetRoutes from "./routes/matchSet.routes";
import groupStandingRoutes from "./routes/groupStanding.routes";
import knockoutBracketRoutes from "./routes/knockoutBracket.routes";
import type { AppModule } from "../module.types";

const router = Router();

router.use("/schedules", scheduleRoutes);
router.use("/schedule-configs", scheduleConfigRoutes);
router.use("/matches", matchRoutes);
router.use("/sub-matches", subMatchRoutes);
router.use("/sub-match-players", subMatchPlayerRoutes);
router.use("/match-sets", matchSetRoutes);
router.use("/group-standings", groupStandingRoutes);
router.use("/knockout-brackets", knockoutBracketRoutes);

export const competitionModule: AppModule = {
  name: "competition",
  router,
};

