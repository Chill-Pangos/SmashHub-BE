import { domainEvents } from "../../shared/events/domainEvents";
import { notificationService } from "../notification/public.services";
import adminSystemService from "./services/adminSystem.service";

const REALTIME_ROOM = "admin:system";

let registered = false;

export function registerAdminEventHandlers(): void {
  if (registered) return;
  registered = true;

  domainEvents.subscribe("cronLog.created", async ({ log }) => {
    await notificationService.publishCronLog(log);
    await adminSystemService.publishCronEvent(log);
  });

  domainEvents.subscribe("auditLog.created", ({ auditLog }) => {
    notificationService.sendEventToRoom(REALTIME_ROOM, "admin_system_audit_created", {
      auditLog: auditLog.get({ plain: true }),
      generatedAt: new Date().toISOString(),
    });
  });
}

