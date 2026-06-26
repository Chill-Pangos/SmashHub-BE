import { identityReadService } from "../modules/identity/public.read";
import { ForbiddenError } from "./errors.helper";

export async function isAdmin(userId: number): Promise<boolean> {
  return identityReadService.isAdmin(userId);
}

export async function assertAdmin(userId: number): Promise<void> {
  if (!(await isAdmin(userId))) {
    throw new ForbiddenError("Admin access required");
  }
}
