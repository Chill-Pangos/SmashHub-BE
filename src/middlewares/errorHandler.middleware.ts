import { Request, Response, NextFunction } from "express";
import { AppError, formatErrorResponse } from "../utils/errors";

/**
 * Global error handler middleware
 */
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  // Default error values
  let statusCode = 500;
  let errorCode = "INTERNAL_ERROR";
  let message = "Internal server error";

  // Handle AppError instances
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    errorCode = err.errorCode;
    message = err.message;
  }

  // Format error response with details
  const errorResponse = formatErrorResponse(err);

  // Send error response with standardized format
  const response: any = {
    success: false,
    error: {
      statusCode: statusCode,
      code: errorCode,
      message: errorResponse.message,
    },
  };

  // Include detailed information if available
  if (errorResponse.details) {
    response.error.details = errorResponse.details;
  }

  // Include stack trace in development mode
  if (process.env.NODE_ENV === "development") {
    response.error.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

/**
 * 404 Not Found handler
 */
export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  res.status(404).json({
    success: false,
    error: {
      statusCode: 404,
      code: "ROUTE_NOT_FOUND",
      message: `Route ${req.method} ${req.path} not found`,
    },
  });
};
