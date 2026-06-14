export function removeUndefinedFields<T extends Record<string, unknown>>(
  data: T,
): Partial<T> {
  const cleaned: Partial<T> = {};

  for (const [key, value] of Object.entries(data) as [keyof T, T[keyof T]][]) {
    if (value !== undefined) {
      cleaned[key] = value;
    }
  }

  return cleaned;
}
