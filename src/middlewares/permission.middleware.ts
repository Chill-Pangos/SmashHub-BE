import { Request, Response, NextFunction } from "express";
import { AuthRequest } from "./auth.middleware";
import Role from "../models/role.model";
import Permission from "../models/permission.model";
import User from "../models/user.model";


export const checkPermission = (requiredPermission: string) => {
  return async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.userId) {
        res.status(401).json({
          success: false,
          message: "Authentication required",
        });
        return;
      }

      const userInstance = await User.findByPk(req.userId, {
        include: [
          {
            model: Role,
            as: "roles",
            include: [
              {
                model: Permission,
                as: "permissions",
              },
            ],
          },
        ],
      });

      if (!userInstance) {
        res.status(401).json({
          success: false,
          message: "User not found",
        });
        return;
      }

      const user = userInstance.get({ plain: true });

      if (!user.roles || user.roles.length === 0) {
        res.status(403).json({
          success: false,
          message: "No roles assigned",
        });
        return;
      }

      const userPermissions = new Set<string>();
      
      for (const role of user.roles) {
        if (role.permissions) {
          for (const permission of role.permissions) {
            userPermissions.add(permission.name);
          }
        }
      }

      const hasPermission = userPermissions.has(requiredPermission);

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
      if (!req.userId) {
        res.status(401).json({
          success: false,
          message: "Authentication required",
        });
        return;
      }

      const userInstance = await User.findByPk(req.userId, {
        include: [
          {
            model: Role,
            as: "roles",
            include: [
              {
                model: Permission,
                as: "permissions",
              },
            ],
          },
        ],
      });

      if (!userInstance) {
        res.status(401).json({
          success: false,
          message: "User not found",
        });
        return;
      }

      const user = userInstance.get({ plain: true });

      if (!user.roles || user.roles.length === 0) {
        res.status(403).json({
          success: false,
          message: "No roles assigned",
        });
        return;
      }

      const userPermissions = new Set<string>();
      
      for (const role of user.roles) {
        if (role.permissions) {
          for (const permission of role.permissions) {
            userPermissions.add(permission.name);
          }
        }
      }

      const hasAnyPermission = requiredPermissions.some(permission =>
        userPermissions.has(permission)
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
      if (!req.userId) {
        res.status(401).json({
          success: false,
          message: "Authentication required",
        });
        return;
      }

      const user = await User.findByPk(req.userId, {
        include: [
          {
            model: Role,
            as: "roles",
            include: [
              {
                model: Permission,
                as: "permissions",
              },
            ],
          },
        ],
      });

      if (!user) {
        res.status(401).json({
          success: false,
          message: "User not found",
        });
        return;
      }

      if (!user.roles || user.roles.length === 0) {
        res.status(403).json({
          success: false,
          message: "No roles assigned",
        });
        return;
      }

      const userPermissions = new Set<string>();
      
      for (const role of user.roles) {
        if (role.permissions) {
          for (const permission of role.permissions) {
            userPermissions.add(permission.name);
          }
        }
      }

      const hasAllPermissions = requiredPermissions.every(permission =>
        userPermissions.has(permission)
      );

      if (!hasAllPermissions) {
        const missingPermissions = requiredPermissions.filter(
          permission => !userPermissions.has(permission)
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
      if (!req.userId) {
        res.status(401).json({
          success: false,
          message: "Authentication required",
        });
        return;
      }

      const user = await User.findByPk(req.userId, {
        include: [
          {
            model: Role,
            as: "roles",
          },
        ],
      });

      if (!user) {
        res.status(401).json({
          success: false,
          message: "User not found",
        });
        return;
      }

      if (!user.roles || user.roles.length === 0) {
        res.status(403).json({
          success: false,
          message: "No roles assigned",
        });
        return;
      }

      const userRoles = user.roles.map(role => role.name);
      const requiredRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
      
      const hasRole = requiredRoles.some(role => userRoles.includes(role));

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
