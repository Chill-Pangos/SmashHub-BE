import { Router } from "express";
import eloScoreRoutes from "./routes/eloScore.routes";
import eloHistoryRoutes from "./routes/eloHistory.routes";
import type { AppModule } from "../module.types";

const router = Router();

router.use("/elo-scores", eloScoreRoutes);
router.use("/elo-histories", eloHistoryRoutes);

export const rankingModule: AppModule = {
  name: "ranking",
  router,
};
