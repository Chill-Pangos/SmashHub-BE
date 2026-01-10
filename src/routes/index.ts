import { Router } from "express";
import authRoutes from "./auth.routes";
import userRoutes from "./user.routes";
import profileRoutes from "./profile.routes";
import roleRoutes from "./role.routes";
import permissionRoutes from "./permission.routes";
import tournamentRoutes from "./tournament.routes";
import formatTypeRoutes from "./formatType.routes";
import tournamentContentRoutes from "./tournamentContent.routes";
import entryRoutes from "./entry.routes";
import scheduleRoutes from "./schedule.routes";
import matchRoutes from "./match.routes";
import matchSetRoutes from "./matchSet.routes";
import matchFormatRoutes from "./matchFormat.routes";
import contentRuleRoutes from "./contentRule.routes";
import eloScoreRoutes from "./eloScore.routes";
import eloHistoryRoutes from "./eloHistory.routes";
import complaintRoutes from "./complaint.routes";
import complaintMessageRoutes from "./complaintMessage.routes";
import complaintWorkflowRoutes from "./complaintWorkflow.routes";

const router = Router();

// Mount all routes
router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/profiles", profileRoutes);
router.use("/roles", roleRoutes);
router.use("/permissions", permissionRoutes);
router.use("/tournaments", tournamentRoutes);
router.use("/format-types", formatTypeRoutes);
router.use("/tournament-contents", tournamentContentRoutes);
router.use("/entries", entryRoutes);
router.use("/schedules", scheduleRoutes);
router.use("/matches", matchRoutes);
router.use("/match-sets", matchSetRoutes);
router.use("/match-formats", matchFormatRoutes);
router.use("/content-rules", contentRuleRoutes);
router.use("/elo-scores", eloScoreRoutes);
router.use("/elo-histories", eloHistoryRoutes);
router.use("/complaints", complaintRoutes);
router.use("/complaint-messages", complaintMessageRoutes);
router.use("/complaint-workflows", complaintWorkflowRoutes);

export default router;
