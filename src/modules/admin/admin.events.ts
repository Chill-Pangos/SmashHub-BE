import { domainEvents } from "../../shared/events/domainEvents";
import { notificationWriteService } from "../notification/public.write";
import adminSystemService from "./services/adminSystem.service";

const REALTIME_ROOM = "admin:system";

let registered = false;

export function registerAdminEventHandlers(): void {
  if (registered) return;
  registered = true;

  domainEvents.subscribe("cronLog.created", async ({ log }) => {
    await notificationWriteService.publishCronLog(log);
    await adminSystemService.publishCronEvent(log);
  });

  domainEvents.subscribe("auditLog.created", ({ auditLog }) => {
    notificationWriteService.emitRoomEvent(REALTIME_ROOM, "admin_system_audit_created", {
      auditLog,
      generatedAt: new Date().toISOString(),
    });
  });
}
