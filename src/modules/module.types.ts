import type { Router } from "express";

export interface AppModule {
  readonly name: string;
  readonly router: Router;
}

