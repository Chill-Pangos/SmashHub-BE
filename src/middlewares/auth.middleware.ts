import { Request, Response, NextFunction } from "express";
import authService from "../services/auth.service";

export interface AuthRequest extends Request {
  userId?: number;
  user?: any;
  token?: string;
}

/**
 * Middleware to verify JWT token
 */
export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({
        success: false,
        message: "No token provided",
      });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Check if token is blacklisted
    const isBlacklisted = await authService.isTokenBlacklisted(token);
    if (isBlacklisted) {
      res.status(401).json({
        success: false,
        message: "Token has been revoked",
      });
      return;
    }

    // Verify token
    const decoded = await authService.verifyToken(token);

    // Get user from token
    const user = await authService.getUserByToken(token);

    if (!user) {
      res.status(401).json({
        success: false,
        message: "Invalid token or user not found",
      });
      return;
    }

    // Attach user info and token to request
    req.userId = decoded.userId;
    req.user = user;
    req.token = token;

    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

/**
 * Optional authentication middleware
 * Doesn't fail if no token is provided
 */
export const optionalAuthenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      
      // Check if token is blacklisted
      const isBlacklisted = await authService.isTokenBlacklisted(token);
      
      if (!isBlacklisted) {
        const decoded = await authService.verifyToken(token);
        const user = await authService.getUserByToken(token);

        if (user) {
          req.userId = decoded.userId;
          req.user = user;
          req.token = token;
        }
      }
    }

    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};
