import { BadRequestError } from "./errors.helper";
import config from "../config/config";

const UTC_ISO_DATETIME_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

export function formatDateUTC(date: Date | string | null | undefined): string {
  if (!date) return "N/A";

  return new Intl.DateTimeFormat("en-GB", {
    timeZone: config.app.timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date(date));
}

export function assertUtcIsoDateTime(value: unknown, fieldName = "date"): string {
  if (typeof value !== "string" || !UTC_ISO_DATETIME_REGEX.test(value)) {
    throw new BadRequestError(`${fieldName} must be an ISO 8601 UTC datetime ending with Z`);
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime()) || date.toISOString() !== value) {
    throw new BadRequestError(`${fieldName} must be an ISO 8601 UTC datetime ending with Z`);
  }

  return value;
}

export function toUtcDate(
  value: Date | string | number,
  fieldName = "date",
): Date {
  if (typeof value === "string") {
    assertUtcIsoDateTime(value, fieldName);
    return new Date(value);
  }

  if (!(value instanceof Date)) {
    throw new BadRequestError(`${fieldName} must be an ISO 8601 UTC datetime ending with Z`);
  }

  const date = value;

  if (Number.isNaN(date.getTime())) {
    throw new BadRequestError(`${fieldName} must be a valid date`);
  }

  return new Date(date.toISOString());
}
