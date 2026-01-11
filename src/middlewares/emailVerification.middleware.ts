import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth.middleware";
import { AuthErrors, UnauthorizedError } from "../utils/errors";

/**
 * Middleware to check if user's email is verified
 * Use this middleware after authenticate middleware
 */
export const requireEmailVerification = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  const user = req.user;

  if (!user) {
    throw new UnauthorizedError("Unauthorized");
  }

  if (!user.isEmailVerified) {
    throw AuthErrors.EmailNotVerified();
  }

  next();
};

/**
 * Optional middleware - warns but doesn't block if email is not verified
 */
export const warnEmailNotVerified = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  const user = req.user;

  if (user && !user.isEmailVerified) {
    // Add warning header
    res.setHeader("X-Email-Verification-Warning", "Email not verified");
  }

  next();
};
