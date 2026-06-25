import { Request, Response, NextFunction } from "express";
import { AuditLog } from "../modules/admin/public.models";
import { Role, User } from "../modules/identity/public.models";
import { domainEvents } from "../shared/events/domainEvents";
import type { AuthRequest } from "./auth.middleware";

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function actionFromMethod(method: string): string {
  if (method === "POST") return "create";
  if (method === "PUT" || method === "PATCH") return "update";
  if (method === "DELETE") return "delete";
  return method.toLowerCase();
}

function resourceFromPath(path: string): { resourceType: string | null; resourceId: string | null } {
  const segments = path.split("?")[0]?.split("/").filter(Boolean) ?? [];
  const apiIndex = segments[0] === "api" ? 1 : 0;
  const resourceType = segments[apiIndex] ?? null;
  const maybeId = segments[apiIndex + 1] ?? null;
  const resourceId = maybeId && /^\d+$/.test(maybeId) ? maybeId : null;
  return { resourceType, resourceId };
}

async function isAdmin(userId: number): Promise<boolean> {
  const user = await User.findByPk(userId, {
    attributes: ["id"],
    include: [
      {
        model: Role,
        as: "roles",
        attributes: ["name"],
        through: { attributes: [] },
        required: true,
        where: { name: "admin" },
      },
    ],
  });

  return !!user;
}

export const auditMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): void => {
  if (!MUTATING_METHODS.has(req.method)) {
    next();
    return;
  }

  const startedAt = process.hrtime.bigint();

  res.on("finish", () => {
    const actorUserId = req.userId;
    if (!actorUserId) return;

    void (async () => {
      try {
        if (!(await isAdmin(actorUserId))) return;

        const durationMs = Math.round(Number(process.hrtime.bigint() - startedAt) / 1_000_000);
        const { resourceType, resourceId } = resourceFromPath(req.originalUrl);
        const log = await AuditLog.create({
          actorUserId,
          action: actionFromMethod(req.method),
          resourceType,
          resourceId,
          method: req.method,
          path: req.originalUrl.slice(0, 500),
          statusCode: res.statusCode,
          ip: req.ip?.slice(0, 100) ?? null,
          userAgent: req.get("user-agent")?.slice(0, 500) ?? null,
          durationMs,
        } as any);

        domainEvents.publish("auditLog.created", { auditLog: log });
      } catch (error) {
        console.error("Failed to write audit log:", error);
      }
    })();
  });

  next();
};
