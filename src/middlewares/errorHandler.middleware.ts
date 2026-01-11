import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/errors";

/**
 * Global error handler middleware
 */
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Default error values
  let statusCode = 500;
  let errorCode = "INTERNAL_ERROR";
  let message = "Internal server error";
  let errors: any[] | undefined;

  // Handle AppError instances
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    errorCode = err.errorCode;
    message = err.message;

    // Include validation errors if present
    if ("errors" in err) {
      errors = (err as any).errors;
    }
  }

  // Send error response
  const errorResponse: any = {
    success: false,
    error: {
      code: errorCode,
      message: message,
    },
  };

  // Include validation errors if present
  if (errors && errors.length > 0) {
    errorResponse.error.errors = errors;
  }

  // Include stack trace in development mode
  if (process.env.NODE_ENV === "development") {
    errorResponse.error.stack = err.stack;
  }

  res.status(statusCode).json(errorResponse);
};

/**
 * 404 Not Found handler
 */
export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  res.status(404).json({
    success: false,
    error: {
      code: "ROUTE_NOT_FOUND",
      message: `Route ${req.method} ${req.path} not found`,
    },
  });
};
