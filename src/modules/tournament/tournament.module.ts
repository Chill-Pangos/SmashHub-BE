import { Router } from "express";
import tournamentRoutes from "./routes/tournament.routes";
import tournamentCategoryRoutes from "./routes/tournamentCategory.routes";
import tournamentRefereeRoutes from "./routes/tournamentReferee.routes";
import type { AppModule } from "../module.types";

const router = Router();

router.use("/tournaments", tournamentRoutes);
router.use("/tournament-categories", tournamentCategoryRoutes);
router.use("/tournament-referees", tournamentRefereeRoutes);

export const tournamentModule: AppModule = {
  name: "tournament",
  router,
};
