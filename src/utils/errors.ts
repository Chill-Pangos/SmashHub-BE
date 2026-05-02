/**
 * Base Application Error
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly errorCode: string;
  public readonly isOperational: boolean;
  public readonly details?: string;

  constructor(
    message: string,
    statusCode: number,
    errorCode: string,
    isOperational = true,
    details?: string
  ) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = isOperational;
    if (details) {
      this.details = details;
    }

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Bad Request Error - 400
 */
export class BadRequestError extends AppError {
  constructor(message: string, errorCode = "BAD_REQUEST") {
    super(message, 400, errorCode);
  }
}

/**
 * Unauthorized Error - 401
 */
export class UnauthorizedError extends AppError {
  constructor(message: string, errorCode = "UNAUTHORIZED") {
    super(message, 401, errorCode);
  }
}

/**
 * Forbidden Error - 403
 */
export class ForbiddenError extends AppError {
  constructor(message: string, errorCode = "FORBIDDEN") {
    super(message, 403, errorCode);
  }
}

/**
 * Not Found Error - 404
 */
export class NotFoundError extends AppError {
  constructor(message: string, errorCode = "NOT_FOUND") {
    super(message, 404, errorCode);
  }
}

/**
 * Conflict Error - 409
 */
export class ConflictError extends AppError {
  constructor(message: string, errorCode = "CONFLICT") {
    super(message, 409, errorCode);
  }
}

/**
 * Validation Error - 422
 */
export class ValidationError extends AppError {
  public readonly errors: any[];

  constructor(message: string, errors: any[] = [], errorCode = "VALIDATION_ERROR") {
    super(message, 422, errorCode);
    this.errors = errors;
  }
}

/**
 * Internal Server Error - 500
 */
export class InternalServerError extends AppError {
  constructor(message = "Internal server error", errorCode = "INTERNAL_ERROR") {
    super(message, 500, errorCode, false);
  }
}

/**
 * Auth specific errors
 */
export class AuthErrors {
  static InvalidCredentials() {
    return new UnauthorizedError("Invalid email or password", "INVALID_CREDENTIALS");
  }

  static EmailAlreadyExists() {
    return new ConflictError("Email already exists", "EMAIL_ALREADY_EXISTS");
  }

  static UserNotFound() {
    return new NotFoundError("User not found", "USER_NOT_FOUND");
  }

  static InvalidToken() {
    return new UnauthorizedError("Invalid or expired token", "INVALID_TOKEN");
  }

  static TokenRevoked() {
    return new UnauthorizedError("Token has been revoked", "TOKEN_REVOKED");
  }

  static NoTokenProvided() {
    return new UnauthorizedError("No token provided", "NO_TOKEN_PROVIDED");
  }

  static InvalidOTP() {
    return new BadRequestError("Invalid OTP code", "INVALID_OTP");
  }

  static ExpiredOTP() {
    return new BadRequestError("OTP code has expired", "EXPIRED_OTP");
  }

  static InvalidOldPassword() {
    return new BadRequestError("Invalid old password", "INVALID_OLD_PASSWORD");
  }

  static SamePasswordError() {
    return new BadRequestError("New password must be different from the old password", "SAME_PASSWORD");
  }

  static EmailNotVerified() {
    return new ForbiddenError("Email not verified. Please verify your email to proceed.", "EMAIL_NOT_VERIFIED");
  }

  static RoleNotFound() {
    return new NotFoundError("Role not found", "ROLE_NOT_FOUND");
  }

  static EmailSendError() {
    return new InternalServerError("Unable to send email. Please try again later.", "EMAIL_SEND_ERROR");
  }

  static ValidationError(message: string) {
    return new BadRequestError(message, "VALIDATION_ERROR");
  }
}

/**
 * Error response formatter
 */
export interface ErrorResponse {
  message: string;
  details?: string;
  timestamp: string;
  errorCode?: string;
}

/**
 * Extract error details and format response
 */
export function formatErrorResponse(error: unknown, contextMessage?: string): ErrorResponse {
  const timestamp = new Date().toISOString();

  // If it's an AppError, use its properties
  if (error instanceof AppError) {
    const response: ErrorResponse = {
      message: error.message,
      timestamp,
      errorCode: error.errorCode,
    };

    if (error.details) {
      response.details = error.details;
    }

    return response;
  }

  // If it's a ValidationError with specific errors array
  if (error instanceof ValidationError) {
    const errorList = error.errors
      .map((e: any) => `${e.path || e.field}: ${e.message}`)
      .join("; ");

    const response: ErrorResponse = {
      message: error.message,
      timestamp,
      errorCode: error.errorCode,
    };

    if (errorList) {
      response.details = errorList;
    }

    return response;
  }

  // Handle standard Error
  if (error instanceof Error) {
    let message = error.message || contextMessage || "An error occurred";
    let details: string | undefined;

    // Extract validation error details
    if (error.message.includes("Validation error")) {
      details = error.message.replace("Validation error: ", "");
    } else {
      details = error.message;
    }

    const response: ErrorResponse = {
      message: contextMessage || message,
      timestamp,
    };

    if (details && details !== message) {
      response.details = details;
    }

    return response;
  }

  // Handle Sequelize validation errors
  if (typeof error === "object" && error !== null) {
    const errorObj = error as any;

    if (errorObj.errors && Array.isArray(errorObj.errors)) {
      const validationErrors = errorObj.errors
        .map((e: any) => `${e.path}: ${e.message}`)
        .join("; ");

      const response: ErrorResponse = {
        message: contextMessage || errorObj.message || "Validation error",
        timestamp,
      };

      if (validationErrors) {
        response.details = validationErrors;
      }

      return response;
    }

    if (errorObj.message) {
      const response: ErrorResponse = {
        message: contextMessage || errorObj.message,
        timestamp,
      };

      if (errorObj.details) {
        response.details = errorObj.details;
      }

      return response;
    }
  }

  // Fallback
  return {
    message: contextMessage || "An unexpected error occurred",
    timestamp,
  };
}

/**
 * Get HTTP status code from error
 */
export function getErrorStatusCode(error: unknown): number {
  if (error instanceof AppError) {
    return error.statusCode;
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    // Validation errors
    if (message.includes("validation") || message.includes("required")) {
      return 400;
    }
    // Not found
    if (message.includes("not found")) {
      return 404;
    }
    // Conflict
    if (message.includes("already exists") || message.includes("conflict")) {
      return 409;
    }
    // Unauthorized
    if (message.includes("unauthorized") || message.includes("not authenticated")) {
      return 401;
    }
    // Forbidden
    if (message.includes("forbidden") || message.includes("permission")) {
      return 403;
    }
  }

  // Default to internal server error
  return 500;
}
