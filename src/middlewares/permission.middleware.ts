import { Request, Response, NextFunction } from "express";
import { AuthRequest } from "./auth.middleware";
import permissionCacheService, { UserAccessSnapshot } from "../services/permissionCache.service";

async function getAccessSnapshot(req: AuthRequest, res: Response): Promise<UserAccessSnapshot | null> {
  if (!req.userId) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
    });
    return null;
  }

  const snapshot = await permissionCacheService.getUserAccess(req.userId);
  if (!snapshot) {
    res.status(401).json({
      success: false,
      message: "User not found",
    });
    return null;
  }

  if (snapshot.roles.size === 0) {
    res.status(403).json({
      success: false,
      message: "No roles assigned",
    });
    return null;
  }

  return snapshot;
}

export const checkPermission = (requiredPermission: string) => {
  return async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const snapshot = await getAccessSnapshot(req, res);
      if (!snapshot) return;

      if (!snapshot.permissions.has(requiredPermission)) {
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
      const snapshot = await getAccessSnapshot(req, res);
      if (!snapshot) return;

      const hasAnyPermission = requiredPermissions.some(permission =>
        snapshot.permissions.has(permission)
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
      const snapshot = await getAccessSnapshot(req, res);
      if (!snapshot) return;

      const hasAllPermissions = requiredPermissions.every(permission =>
        snapshot.permissions.has(permission)
      );

      if (!hasAllPermissions) {
        const missingPermissions = requiredPermissions.filter(
          permission => !snapshot.permissions.has(permission)
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
      const snapshot = await getAccessSnapshot(req, res);
      if (!snapshot) return;

      const requiredRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
      
      const hasRole = requiredRoles.some(role => snapshot.roles.has(role));

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
