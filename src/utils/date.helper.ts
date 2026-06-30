import { BadRequestError } from "./errors.helper";

export function formatDateGMT7(date: Date | string | null | undefined): string {
  if (!date) return "N/A";

  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date(date));
}

export function toUtcDate(
  value: Date | string | number,
  fieldName = "date",
): Date {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new BadRequestError(`${fieldName} must be a valid date`);
  }

  return new Date(date.toISOString());
}
