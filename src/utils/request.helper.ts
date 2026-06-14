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
}): { page: number; limit: number; offset: number } {
  const page = query.page === undefined ? 1 : parsePositiveInt(query.page, "page");
  const limit = query.limit === undefined ? 10 : parsePositiveInt(query.limit, "limit");

  return {
    page,
    limit,
    offset: (page - 1) * limit,
  };
}
