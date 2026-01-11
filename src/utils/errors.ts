/**
 * Base Application Error
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly errorCode: string;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number,
    errorCode: string,
    isOperational = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = isOperational;

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

  static UsernameAlreadyExists() {
    return new ConflictError("Username already exists", "USERNAME_ALREADY_EXISTS");
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
}
