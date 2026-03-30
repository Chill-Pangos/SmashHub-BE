import { Router } from "express";
import authRoutes from "./auth.routes";
import userRoutes from "./user.routes";
import roleRoutes from "./role.routes";
import permissionRoutes from "./permission.routes";
import tournamentRoutes from "./tournament.routes";
import tournamentCategoryRoutes from "./tournamentCategory.routes";
import tournamentRefereeRoutes from "./tournamentReferee.routes";
import entryRoutes from "./entry.routes";
import scheduleRoutes from "./schedule.routes";
import matchRoutes from "./match.routes";
import matchSetRoutes from "./matchSet.routes";
import eloScoreRoutes from "./eloScore.routes";
import eloHistoryRoutes from "./eloHistory.routes";
import entryImportRoutes from "./entryImport.routes";
import groupStandingRoutes from "./groupStanding.routes";
import knockoutBracketRoutes from "./knockoutBracket.routes";
import notificationRoutes from "./notification.routes";
import paymentRoutes from "./payment.routes";

const router = Router();

// Mount all routes
router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/roles", roleRoutes);
router.use("/permissions", permissionRoutes);
router.use("/tournaments", tournamentRoutes);
router.use("/tournament-categories", tournamentCategoryRoutes);
router.use("/tournament-referees", tournamentRefereeRoutes);
router.use("/entries", entryRoutes);
router.use("/entries", entryImportRoutes);
router.use("/schedules", scheduleRoutes);
router.use("/matches", matchRoutes);
router.use("/match-sets", matchSetRoutes);
router.use("/elo-scores", eloScoreRoutes);
router.use("/elo-histories", eloHistoryRoutes);
router.use("/group-standings", groupStandingRoutes);
router.use("/knockout-brackets", knockoutBracketRoutes);
router.use("/notifications", notificationRoutes);
router.use("/payments", paymentRoutes);

export default router;
