export const SCHEDULE_CONFIG_LOCAL_UTC_OFFSET_HOURS = 7;

export const SCHEDULE_CONFIG_HOUR_FIELDS = [
  "dailyStartHour",
  "dailyEndHour",
  "lunchBreakStartHour",
  "lunchBreakEndHour",
] as const;

type ScheduleConfigHourField = (typeof SCHEDULE_CONFIG_HOUR_FIELDS)[number];
type ScheduleConfigTimeData = Partial<Record<ScheduleConfigHourField, unknown>>;
type ScheduleConfigTimeInstance = {
  getDataValue(key: string): unknown;
  setDataValue(key: string, value: unknown): void;
};

function shiftHour(hour: number, offsetHours: number): number {
  return ((hour + offsetHours) % 24 + 24) % 24;
}

export function scheduleConfigHourToUtc(hour: number): number {
  return shiftHour(hour, -SCHEDULE_CONFIG_LOCAL_UTC_OFFSET_HOURS);
}

export function scheduleConfigHourFromUtc(hour: number): number {
  return shiftHour(hour, SCHEDULE_CONFIG_LOCAL_UTC_OFFSET_HOURS);
}

function convertScheduleConfigHourFields<T extends ScheduleConfigTimeData>(
  data: T,
  convertHour: (hour: number) => number,
): T {
  const converted: Record<string, unknown> = { ...data };

  for (const field of SCHEDULE_CONFIG_HOUR_FIELDS) {
    const value = converted[field];
    if (typeof value === "number") {
      converted[field] = convertHour(value);
    }
  }

  return converted as T;
}

export function scheduleConfigTimesToUtc<T extends ScheduleConfigTimeData>(data: T): T {
  return convertScheduleConfigHourFields(data, scheduleConfigHourToUtc);
}

export function scheduleConfigTimesFromUtc<T extends ScheduleConfigTimeData>(data: T): T {
  return convertScheduleConfigHourFields(data, scheduleConfigHourFromUtc);
}

export function localizeScheduleConfigInstance<T extends ScheduleConfigTimeInstance>(
  config: T,
): T {
  for (const field of SCHEDULE_CONFIG_HOUR_FIELDS) {
    const value = config.getDataValue(field);
    if (typeof value === "number") {
      config.setDataValue(field, scheduleConfigHourFromUtc(value));
    }
  }

  return config;
}
