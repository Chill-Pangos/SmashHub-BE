import { Request, Response, NextFunction } from "express";
import { AppError, formatErrorResponse, getErrorStatusCode } from "../utils/errors.helper";
import { adminMetricsRuntimeService } from "../modules/admin/public.runtime";

function getDefaultErrorCode(statusCode: number): string {
  switch (statusCode) {
    case 400:
      return "BAD_REQUEST";
    case 401:
      return "UNAUTHORIZED";
    case 403:
      return "FORBIDDEN";
    case 404:
      return "NOT_FOUND";
    case 409:
      return "CONFLICT";
    case 422:
      return "VALIDATION_ERROR";
    default:
      return "INTERNAL_ERROR";
  }
}

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
  } else {
    statusCode = getErrorStatusCode(err);
    errorCode = getDefaultErrorCode(statusCode);
  }

  // Format error response with details
  const errorResponse = formatErrorResponse(err);
  const responseMessage =
    !(err instanceof AppError) && statusCode === 500
      ? "Internal server error"
      : errorResponse.message;

  // Send error response with standardized format
  const response: any = {
    success: false,
    error: {
      statusCode: statusCode,
      code: errorCode,
      message: responseMessage,
    },
  };

  // Include detailed information if available
  if (errorResponse.details && (!(err instanceof AppError) ? statusCode !== 500 : true)) {
    response.error.details = errorResponse.details;
  }

  // Include stack trace in development mode
  if (process.env.NODE_ENV === "development") {
    response.error.stack = err.stack;
  }

  const errorEvent = {
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.originalUrl,
    statusCode,
    errorCode,
    message: errorResponse.message,
  };
  if (typeof req.headers["x-request-id"] === "string") {
    adminMetricsRuntimeService.recordError({ ...errorEvent, requestId: req.headers["x-request-id"] });
  } else {
    adminMetricsRuntimeService.recordError(errorEvent);
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
