import { Request, Response, NextFunction } from "express";
import { identityReadService } from "../modules/identity/public.read";
import { AuthErrors } from "../utils/errors.helper";

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
      throw AuthErrors.NoTokenProvided();
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Check if token is blacklisted
    const isBlacklisted = await identityReadService.isTokenBlacklisted(token);
    if (isBlacklisted) {
      throw AuthErrors.TokenRevoked();
    }

    // Verify token
    const decoded = await identityReadService.verifyToken(token);

    // Get user from token
    const user = await identityReadService.getAuthenticatedUserByToken(token);

    if (!user) {
      throw AuthErrors.UserNotFound();
    }

    // Attach user info and token to request
    req.userId = decoded.userId;
    req.user = user;
    req.token = token;

    next();
  } catch (error) {
    next(error);
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
      const isBlacklisted = await identityReadService.isTokenBlacklisted(token);
      
      if (!isBlacklisted) {
        const decoded = await identityReadService.verifyToken(token);
        const user = await identityReadService.getAuthenticatedUserByToken(token);

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
