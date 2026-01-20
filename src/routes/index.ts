import { Router } from "express";
import authRoutes from "./auth.routes";
import userRoutes from "./user.routes";
import roleRoutes from "./role.routes";
import permissionRoutes from "./permission.routes";
import tournamentRoutes from "./tournament.routes";
import tournamentContentRoutes from "./tournamentContent.routes";
import entryRoutes from "./entry.routes";
import scheduleRoutes from "./schedule.routes";
import matchRoutes from "./match.routes";
import matchSetRoutes from "./matchSet.routes";
import eloScoreRoutes from "./eloScore.routes";
import eloHistoryRoutes from "./eloHistory.routes";
import complaintRoutes from "./complaint.routes";
import complaintMessageRoutes from "./complaintMessage.routes";
import complaintWorkflowRoutes from "./complaintWorkflow.routes";
import teamRoutes from "./team.routes";
import teamMemberRoutes from "./teamMember.routes";
import teamImportRoutes from "./teamImport.routes";
import entryImportRoutes from "./entryImport.routes";
import groupStandingRoutes from "./groupStanding.routes";
import knockoutBracketRoutes from "./knockoutBracket.routes";

const router = Router();

// Mount all routes
router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/roles", roleRoutes);
router.use("/permissions", permissionRoutes);
router.use("/tournaments", tournamentRoutes);
router.use("/tournament-contents", tournamentContentRoutes);
router.use("/entries", entryRoutes);
router.use("/entries", entryImportRoutes);
router.use("/schedules", scheduleRoutes);
router.use("/matches", matchRoutes);
router.use("/match-sets", matchSetRoutes);
router.use("/elo-scores", eloScoreRoutes);
router.use("/elo-histories", eloHistoryRoutes);
router.use("/complaints", complaintRoutes);
router.use("/complaint-messages", complaintMessageRoutes);
router.use("/complaint-workflows", complaintWorkflowRoutes);
router.use("/teams", teamRoutes);
router.use("/teams", teamImportRoutes);
router.use("/team-members", teamMemberRoutes);
router.use("/group-standings", groupStandingRoutes);
router.use("/knockout-brackets", knockoutBracketRoutes);

export default router;
