export type AuditLogPayload = {
  id?: number;
  actorUserId?: number | null;
  action: string;
  resourceType?: string | null;
  resourceId?: string | null;
  method: string;
  path: string;
  statusCode?: number | null;
  ip?: string | null;
  userAgent?: string | null;
  durationMs?: number | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
};

export type CreateAuditLogInput = {
  actorUserId?: number | null;
  action: string;
  resourceType?: string | null;
  resourceId?: string | null;
  method: string;
  path: string;
  statusCode?: number | null;
  ip?: string | null;
  userAgent?: string | null;
  durationMs?: number | null;
};

export type CronLogPayload = {
  id?: number;
  jobName: string;
  tournamentId?: number | null;
  level: "info" | "warn" | "error";
  status: "success" | "failed" | "skipped";
  message: string;
  meta?: unknown;
  startedAt: Date | string;
  finishedAt?: Date | string | null;
  durationMs?: number | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
};
