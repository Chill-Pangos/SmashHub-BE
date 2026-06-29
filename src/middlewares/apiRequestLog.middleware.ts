import { Response, NextFunction } from "express";
import ApiRequestLog from "../models/apiRequestLog.model";
import systemRuntimeService from "../services/systemRuntime.service";
import type { AuthRequest } from "./auth.middleware";
import config from "../config/config";

const MASKED = "[REDACTED]";
const MAX_DEPTH = 5;
const MAX_ARRAY_LENGTH = 25;
const MAX_STRING_LENGTH = 2_000;
const MAX_JSON_CHARS = 20_000;
const SENSITIVE_KEYS = [
  "authorization",
  "cookie",
  "password",
  "oldpassword",
  "newpassword",
  "confirmpassword",
  "token",
  "accesstoken",
  "refreshtoken",
  "secret",
  "otp",
  "otpcode",
];

function truncate(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value;
  return value.slice(0, maxLength);
}

function isSensitiveKey(key: string): boolean {
  const normalized = key.replace(/[_-]/g, "").toLowerCase();
  return SENSITIVE_KEYS.some((sensitive) => normalized.includes(sensitive));
}

function sanitize(value: unknown, depth = 0, seen = new WeakSet<object>()): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value === "string") return truncate(value, MAX_STRING_LENGTH);
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (value instanceof Date) return value.toISOString();
  if (Buffer.isBuffer(value)) return `[Buffer ${value.length} bytes]`;
  if (depth >= MAX_DEPTH) return "[MaxDepth]";
  if (typeof value !== "object") return String(value);

  if (seen.has(value)) return "[Circular]";
  seen.add(value);

  if (Array.isArray(value)) {
    const items = value
      .slice(0, MAX_ARRAY_LENGTH)
      .map((item) => sanitize(item, depth + 1, seen));
    if (value.length > MAX_ARRAY_LENGTH) {
      items.push(`[${value.length - MAX_ARRAY_LENGTH} more item(s)]`);
    }
    return items;
  }

  const output: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(value)) {
    output[key] = isSensitiveKey(key) ? MASKED : sanitize(child, depth + 1, seen);
  }
  return output;
}

function limitJson(value: unknown): unknown {
  const sanitized = sanitize(value);
  if (sanitized === undefined) return null;

  const serialized = JSON.stringify(sanitized) ?? "null";
  if (serialized.length <= MAX_JSON_CHARS) return sanitized;
  return {
    truncated: true,
    originalChars: serialized.length,
    preview: serialized.slice(0, MAX_JSON_CHARS),
  };
}

function getResponseError(responseBody: unknown, statusCode: number) {
  if (typeof responseBody !== "object" || responseBody === null) {
    return {
      errorCode: statusCode >= 400 ? "HTTP_ERROR" : null,
      errorMessage: statusCode >= 400 ? `HTTP ${statusCode}` : null,
    };
  }

  const body = responseBody as {
    success?: boolean;
    error?: {
      code?: unknown;
      message?: unknown;
    };
  };
  const errorCode =
    body.error?.code !== undefined ? truncate(String(body.error.code), 100) : null;
  const errorMessage =
    body.error?.message !== undefined ? truncate(String(body.error.message), 500) : null;

  return {
    errorCode: errorCode ?? (statusCode >= 400 ? "HTTP_ERROR" : null),
    errorMessage: errorMessage ?? (statusCode >= 400 ? `HTTP ${statusCode}` : null),
  };
}

function getLoggedError(res: Response, responseBody: unknown, statusCode: number) {
  const loggedError = res.locals.apiRequestLogError as
    | {
        errorCode?: unknown;
        errorMessage?: unknown;
        details?: unknown;
        stack?: unknown;
      }
    | undefined;

  if (!loggedError) {
    return {
      ...getResponseError(responseBody, statusCode),
      errorDetails: null,
    };
  }

  const fallback = getResponseError(responseBody, statusCode);
  return {
    errorCode:
      loggedError.errorCode !== undefined
        ? truncate(String(loggedError.errorCode), 100)
        : fallback.errorCode,
    errorMessage:
      loggedError.errorMessage !== undefined
        ? truncate(String(loggedError.errorMessage), 500)
        : fallback.errorMessage,
    errorDetails: limitJson({
      details: loggedError.details ?? null,
      stack: loggedError.stack ?? null,
    }),
  };
}

export const apiRequestLogMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): void => {
  if (
    !config.logging.apiRequest.enabled ||
    !req.originalUrl.startsWith("/api") ||
    req.originalUrl.startsWith("/api/admin/system/events")
  ) {
    next();
    return;
  }

  const startedAt = new Date();
  const startedHr = process.hrtime.bigint();
  const originalJson = res.json.bind(res);
  let responseBody: unknown;

  res.json = ((body?: unknown) => {
    responseBody = body;
    return originalJson(body);
  }) as Response["json"];

  res.on("finish", () => {
    const finishedAt = new Date();
    const durationMs = Math.round(Number(process.hrtime.bigint() - startedHr) / 1_000_000);
    const statusCode = res.statusCode;
    const { errorCode, errorMessage, errorDetails } = getLoggedError(
      res,
      responseBody,
      statusCode,
    );
    const shouldCaptureResponse =
      statusCode < 400
        ? config.logging.apiRequest.captureSuccessResponse
        : config.logging.apiRequest.captureErrorResponse;
    const requestId =
      typeof req.headers["x-request-id"] === "string"
        ? truncate(req.headers["x-request-id"], 100)
        : null;

    void ApiRequestLog.create({
      requestId,
      userId: req.userId ?? null,
      method: req.method,
      path: truncate(req.originalUrl, 500),
      route: truncate(systemRuntimeService.routeFromRequest(req), 500),
      statusCode,
      success: statusCode < 400,
      errorCode,
      errorMessage,
      ip: truncate(req.ip ?? "", 100) || null,
      userAgent: truncate(req.get("user-agent") ?? "", 500) || null,
      requestMeta: limitJson({
        query: req.query,
        params: req.params,
        ...(config.logging.apiRequest.captureRequestBody && { body: req.body }),
      }),
      responseMeta: shouldCaptureResponse
        ? errorDetails
          ? limitJson({ response: responseBody ?? null, internalError: errorDetails })
          : limitJson(responseBody)
        : errorDetails,
      startedAt,
      finishedAt,
      durationMs,
    } as any).catch((error) => {
      console.error("Failed to write API request log:", error);
    });
  });

  next();
};
