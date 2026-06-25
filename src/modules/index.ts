import { Router } from "express";
import { adminModule } from "./admin/admin.module";
import { competitionModule } from "./competition/competition.module";
import { identityModule } from "./identity/identity.module";
import { notificationModule } from "./notification/notification.module";
import { rankingModule } from "./ranking/ranking.module";
import { registrationModule } from "./registration/registration.module";
import { tournamentModule } from "./tournament/tournament.module";
import { registerModules } from "./module.registry";
import type { AppModule } from "./module.types";

export const appModules: readonly AppModule[] = [
  identityModule,
  tournamentModule,
  registrationModule,
  competitionModule,
  rankingModule,
  notificationModule,
  adminModule,
];

export function createApiRouter(): Router {
  const router = Router();
  registerModules(router, appModules);
  return router;
}

