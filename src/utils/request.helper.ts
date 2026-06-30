import { BadRequestError } from "./errors.helper";

export function parsePositiveInt(value: unknown, fieldName: string): number {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new BadRequestError(`${fieldName} must be a positive integer`);
  }

  return parsed;
}

export function parsePagination(query: {
  page?: unknown;
  limit?: unknown;
  offset?: unknown;
  skip?: unknown;
}): { page: number; limit: number; offset: number } {
  if (query.offset !== undefined || query.skip !== undefined) {
    throw new BadRequestError("offset/skip pagination is not supported; use page and limit");
  }

  const page = query.page === undefined ? 1 : parsePositiveInt(query.page, "page");
  const requestedLimit = query.limit === undefined ? 10 : parsePositiveInt(query.limit, "limit");
  const limit = Math.min(requestedLimit, 100);

  return {
    page,
    limit,
    offset: (page - 1) * limit,
  };
}

export function parseEnumQuery<T extends string>(
  value: unknown,
  fieldName: string,
  allowedValues: readonly T[],
): T | undefined {
  if (value === undefined) return undefined;
  if (Array.isArray(value)) {
    throw new BadRequestError(`${fieldName} must be one of: ${allowedValues.join(", ")}`);
  }

  const parsed = String(value).trim();
  if (!allowedValues.includes(parsed as T)) {
    throw new BadRequestError(`${fieldName} must be one of: ${allowedValues.join(", ")}`);
  }

  return parsed as T;
}

export function parseSortQuery<T extends string>(
  value: unknown,
  fieldName: string,
  allowedValues: readonly T[],
  defaultValue: T,
): T {
  return parseEnumQuery(value, fieldName, allowedValues) ?? defaultValue;
}
