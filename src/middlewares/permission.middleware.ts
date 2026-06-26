import { Request, Response, NextFunction } from "express";
import { AuthRequest } from "./auth.middleware";
import { identityReadService, type UserAccessSummary } from "../modules/identity/public.read";

async function getRequiredUserAccess(
  req: AuthRequest,
  res: Response,
): Promise<UserAccessSummary | null> {
  if (!req.userId) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
    });
    return null;
  }

  const access = await identityReadService.getUserAccess(req.userId);
  if (!access.exists) {
    res.status(401).json({
      success: false,
      message: "User not found",
    });
    return null;
  }

  return access;
}

export const checkPermission = (requiredPermission: string) => {
  return async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const access = await getRequiredUserAccess(req, res);
      if (!access) return;

      if (access.roles.length === 0) {
        res.status(403).json({
          success: false,
          message: "No roles assigned",
        });
        return;
      }

      const hasPermission = access.permissions.includes(requiredPermission);

      if (!hasPermission) {
        res.status(403).json({
          success: false,
          message: `Permission denied. Required: ${requiredPermission}`,
        });
        return;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

export const checkAnyPermission = (requiredPermissions: string[]) => {
  return async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const access = await getRequiredUserAccess(req, res);
      if (!access) return;

      if (access.roles.length === 0) {
        res.status(403).json({
          success: false,
          message: "No roles assigned",
        });
        return;
      }

      const hasAnyPermission = requiredPermissions.some(permission =>
        access.permissions.includes(permission)
      );

      if (!hasAnyPermission) {
        res.status(403).json({
          success: false,
          message: `Permission denied. Required one of: ${requiredPermissions.join(", ")}`,
        });
        return;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

export const checkAllPermissions = (requiredPermissions: string[]) => {
  return async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const access = await getRequiredUserAccess(req, res);
      if (!access) return;

      if (access.roles.length === 0) {
        res.status(403).json({
          success: false,
          message: "No roles assigned",
        });
        return;
      }

      const hasAllPermissions = requiredPermissions.every(permission =>
        access.permissions.includes(permission)
      );

      if (!hasAllPermissions) {
        const missingPermissions = requiredPermissions.filter(
          permission => !access.permissions.includes(permission)
        );
        res.status(403).json({
          success: false,
          message: `Permission denied. Missing: ${missingPermissions.join(", ")}`,
        });
        return;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

export const checkRole = (requiredRole: string | string[]) => {
  return async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const access = await getRequiredUserAccess(req, res);
      if (!access) return;

      if (access.roles.length === 0) {
        res.status(403).json({
          success: false,
          message: "No roles assigned",
        });
        return;
      }

      const requiredRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
      
      const hasRole = requiredRoles.some(role => access.roles.includes(role));

      if (!hasRole) {
        res.status(403).json({
          success: false,
          message: `Role required: ${requiredRoles.join(" or ")}`,
        });
        return;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
