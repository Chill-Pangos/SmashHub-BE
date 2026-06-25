import type { AuditLog, CronLog } from "../../modules/admin/public.models";

import { DomainEventBus } from "./domainEvent.bus";

export type DomainEventMap = {
  "auditLog.created": { auditLog: AuditLog };
  "cronLog.created": { log: CronLog };
};

export const domainEvents = new DomainEventBus<DomainEventMap>();

