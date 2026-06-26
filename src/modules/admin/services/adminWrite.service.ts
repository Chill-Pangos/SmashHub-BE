import { domainEvents } from "../../../shared/events/domainEvents";
import type { AuditLogPayload, CreateAuditLogInput } from "../public.contracts";
import { registerAdminEventHandlers } from "../admin.events";
import AuditLog from "../models/auditLog.model";

function toAuditLogPayload(log: AuditLog): AuditLogPayload {
  return log.get({ plain: true }) as AuditLogPayload;
}

export class AdminWriteService {
  async createAuditLog(input: CreateAuditLogInput): Promise<AuditLogPayload> {
    registerAdminEventHandlers();

    const log = await AuditLog.create({
      actorUserId: input.actorUserId ?? null,
      action: input.action,
      resourceType: input.resourceType ?? null,
      resourceId: input.resourceId ?? null,
      method: input.method,
      path: input.path,
      statusCode: input.statusCode ?? null,
      ip: input.ip ?? null,
      userAgent: input.userAgent ?? null,
      durationMs: input.durationMs ?? null,
    } as any);

    const payload = toAuditLogPayload(log);
    domainEvents.publish("auditLog.created", { auditLog: payload });
    return payload;
  }
}

export default new AdminWriteService();
