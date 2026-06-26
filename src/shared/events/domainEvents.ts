import type { AuditLogPayload, CronLogPayload } from "../../modules/admin/public.contracts";

import { DomainEventBus } from "./domainEvent.bus";

export type DomainEventMap = {
  "auditLog.created": { auditLog: AuditLogPayload };
  "cronLog.created": { log: CronLogPayload };
};

export const domainEvents = new DomainEventBus<DomainEventMap>();
