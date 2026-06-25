import { Router } from "express";
import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";
import roleRoutes from "./routes/role.routes";
import permissionRoutes from "./routes/permission.routes";
import rolePermissionRoutes from "./routes/rolePermission.routes";
import userRoleRoutes from "./routes/userRole.routes";
import type { AppModule } from "../module.types";

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/roles", roleRoutes);
router.use("/permissions", permissionRoutes);
router.use("/role-permissions", rolePermissionRoutes);
router.use("/user-roles", userRoleRoutes);

export const identityModule: AppModule = {
  name: "identity",
  router,
};
