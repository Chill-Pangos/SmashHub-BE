import type { Router } from "express";
import type { AppModule } from "./module.types";

export function registerModules(router: Router, modules: readonly AppModule[]): void {
  for (const module of modules) {
    router.use(module.router);
  }
}

