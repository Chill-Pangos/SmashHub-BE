import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  BeforeValidate,
} from "sequelize-typescript";
import Tournament from "./tournament.model";
import {
  scheduleConfigHourFromUtc,
  scheduleConfigTimesFromUtc,
} from "../utils/scheduleConfigTime.helper";

// ─── Constants ────────────────────────────────────────────────────────────────

const MATCH_DURATION_MIN = 30; // phút
const MATCH_DURATION_MAX = 90; // phút
const BREAK_DURATION_MIN = 5; // phút
const BREAK_DURATION_MAX = 30; // phút
const HOUR_MIN = 0;
const HOUR_MAX = 23;
const MINUTE_MIN = 0;
const MINUTE_MAX = 59;

function dateOnlyTime(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function isSameCalendarDate(a: Date, b: Date): boolean {
  return dateOnlyTime(a) === dateOnlyTime(b);
}

function utcTimeToLocalMinutes(hour?: number | null, minute?: number | null): number | null {
  if (hour == null || minute == null) return null;
  return scheduleConfigHourFromUtc(hour) * 60 + minute;
}

function assertIntegerRange(
  value: number | null | undefined,
  label: string,
  min: number,
  max: number,
): void {
  if (value == null) return;

  if (!Number.isInteger(value) || value < min || value > max) {
    throw new Error(`${label} must be an integer between ${min} and ${max}`);
  }
}

// ─── Model ────────────────────────────────────────────────────────────────────

@Table({
  tableName: "schedule_configs",
  timestamps: true,
  indexes: [
    { fields: ["tournamentId"] },
    { fields: ["startDate"] },
    { fields: ["registrationStartDate"] },
    { fields: ["registrationEndDate"] },
    { fields: ["bracketGenerationDate"] },
  ],
})
export default class ScheduleConfig extends Model {
  @Column({
    type: DataType.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  })
  declare id: number;

  @ForeignKey(() => Tournament)
  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: false,
    unique: true,
  })
  declare tournamentId: number;

  // ─── Tournament Dates ─────────────────────────────────────────────────────

  @Column({ type: DataType.DATE, allowNull: false })
  declare startDate: Date;

  @Column({ type: DataType.DATE, allowNull: false })
  declare endDate: Date;

  // ─── Registration & Bracket Dates ────────────────────────────────────────

  @Column({ type: DataType.DATE, allowNull: false })
  declare registrationStartDate: Date;

  @Column({ type: DataType.DATE, allowNull: false })
  declare registrationEndDate: Date;

  @Column({ type: DataType.DATE, allowNull: false })
  declare bracketGenerationDate: Date;

  // ─── Tables ───────────────────────────────────────────────────────────────

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 1,
  })
  declare numberOfTables: number;

  // ─── Match Configuration ──────────────────────────────────────────────────

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 30,
  })
  declare matchDurationMinutes: number; // Thời lượng mỗi trận (phút)

  // ─── Break Configuration ──────────────────────────────────────────────────

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 10,
  })
  declare breakDurationMinutes: number; // Thời gian nghỉ giữa các trận

  // ─── Daily Schedule ───────────────────────────────────────────────────────

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 1,
  })
  declare dailyStartHour: number; // Giờ bắt đầu (0-23)

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0,
  })
  declare dailyStartMinute: number; // Phút bắt đầu (0-59)

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 15,
  })
  declare dailyEndHour: number; // Giờ kết thúc (0-23)

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0,
  })
  declare dailyEndMinute: number; // Phút kết thúc (0-59)

  // ─── Break Time (Optional) ────────────────────────────────────────────────

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: true,
  })
  declare lunchBreakStartHour?: number | null; // Giờ bắt đầu break (giữa trưa)

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: true,
    defaultValue: 0,
  })
  declare lunchBreakStartMinute?: number | null;

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: true,
  })
  declare lunchBreakEndHour?: number | null; // Giờ kết thúc break (giữa trưa)

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: true,
    defaultValue: 0,
  })
  declare lunchBreakEndMinute?: number | null;

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: true,
  })
  declare lunchBreakDurationMinutes?: number | null; // Duration của break

  // ─── Description ─────────────────────────────────────────────────────────

  @Column({
    type: DataType.TEXT("long"),
    allowNull: true,
  })
  declare notes?: string | null; // Ghi chú/mô tả config

  // ─── Associations ────────────────────────────────────────────────────────

  @BelongsTo(() => Tournament)
  declare tournament?: Tournament;

  override toJSON(): object {
    const values = super.toJSON() as Record<string, unknown>;
    return scheduleConfigTimesFromUtc(values);
  }

  // ─── Validators ──────────────────────────────────────────────────────────

  @BeforeValidate
  static validateMatchDuration(instance: ScheduleConfig): void {
    const { matchDurationMinutes } = instance;

    if (matchDurationMinutes == null) return;

    if (
      !Number.isInteger(matchDurationMinutes) ||
      matchDurationMinutes < MATCH_DURATION_MIN ||
      matchDurationMinutes > MATCH_DURATION_MAX
    ) {
      throw new Error(
        `Match duration must be an integer between ${MATCH_DURATION_MIN} and ${MATCH_DURATION_MAX} minutes`
      );
    }
  }

  @BeforeValidate
  static validateBreakDuration(instance: ScheduleConfig): void {
    const { breakDurationMinutes } = instance;

    if (breakDurationMinutes == null) return;

    if (
      !Number.isInteger(breakDurationMinutes) ||
      breakDurationMinutes < BREAK_DURATION_MIN ||
      breakDurationMinutes > BREAK_DURATION_MAX
    ) {
      throw new Error(
        `Break duration must be an integer between ${BREAK_DURATION_MIN} and ${BREAK_DURATION_MAX} minutes`
      );
    }
  }

  @BeforeValidate
  static validateDailyStartTime(instance: ScheduleConfig): void {
    const { dailyStartHour, dailyStartMinute } = instance;

    if (dailyStartHour == null || dailyStartMinute == null) return;

    if (
      !Number.isInteger(dailyStartHour) ||
      dailyStartHour < HOUR_MIN ||
      dailyStartHour > HOUR_MAX
    ) {
      throw new Error(
        `Daily start hour must be an integer between ${HOUR_MIN} and ${HOUR_MAX}`
      );
    }

    if (
      !Number.isInteger(dailyStartMinute) ||
      dailyStartMinute < MINUTE_MIN ||
      dailyStartMinute > MINUTE_MAX
    ) {
      throw new Error(
        `Daily start minute must be an integer between ${MINUTE_MIN} and ${MINUTE_MAX}`
      );
    }
  }

  @BeforeValidate
  static validateDailyEndTime(instance: ScheduleConfig): void {
    const { dailyEndHour, dailyEndMinute } = instance;

    if (dailyEndHour == null || dailyEndMinute == null) return;

    if (
      !Number.isInteger(dailyEndHour) ||
      dailyEndHour < HOUR_MIN ||
      dailyEndHour > HOUR_MAX
    ) {
      throw new Error(
        `Daily end hour must be an integer between ${HOUR_MIN} and ${HOUR_MAX}`
      );
    }

    if (
      !Number.isInteger(dailyEndMinute) ||
      dailyEndMinute < MINUTE_MIN ||
      dailyEndMinute > MINUTE_MAX
    ) {
      throw new Error(
        `Daily end minute must be an integer between ${MINUTE_MIN} and ${MINUTE_MAX}`
      );
    }
  }

  @BeforeValidate
  static validateDailyTimeRange(instance: ScheduleConfig): void {
    const {
      dailyStartHour,
      dailyStartMinute,
      dailyEndHour,
      dailyEndMinute,
    } = instance;

    if (
      dailyStartHour == null ||
      dailyStartMinute == null ||
      dailyEndHour == null ||
      dailyEndMinute == null
    ) {
      return;
    }

    const startTotalMinutes = utcTimeToLocalMinutes(dailyStartHour, dailyStartMinute);
    const endTotalMinutes = utcTimeToLocalMinutes(dailyEndHour, dailyEndMinute);

    if (
      startTotalMinutes != null &&
      endTotalMinutes != null &&
      endTotalMinutes <= startTotalMinutes
    ) {
      throw new Error(
        "Daily end time must be after daily start time"
      );
    }
  }

  @BeforeValidate
  static validateLunchBreakTime(instance: ScheduleConfig): void {
    const {
      lunchBreakStartHour,
      lunchBreakStartMinute,
      lunchBreakEndHour,
      lunchBreakEndMinute,
      lunchBreakDurationMinutes,
    } = instance;

    assertIntegerRange(lunchBreakStartHour, "Lunch break start hour", HOUR_MIN, HOUR_MAX);
    assertIntegerRange(lunchBreakStartMinute, "Lunch break start minute", MINUTE_MIN, MINUTE_MAX);
    assertIntegerRange(lunchBreakEndHour, "Lunch break end hour", HOUR_MIN, HOUR_MAX);
    assertIntegerRange(lunchBreakEndMinute, "Lunch break end minute", MINUTE_MIN, MINUTE_MAX);

    if (lunchBreakStartHour == null && lunchBreakEndHour == null) {
      if (lunchBreakDurationMinutes != null) {
        throw new Error(
          "Lunch break duration requires lunch break start and end times"
        );
      }
      return;
    }

    if (
      lunchBreakStartHour == null ||
      lunchBreakEndHour == null
    ) {
      throw new Error(
        "Both lunch break start and end times must be provided if lunch break is configured"
      );
    }

    const startTotalMinutes = utcTimeToLocalMinutes(
      lunchBreakStartHour,
      lunchBreakStartMinute ?? 0,
    );
    const endTotalMinutes = utcTimeToLocalMinutes(
      lunchBreakEndHour,
      lunchBreakEndMinute ?? 0,
    );

    if (
      startTotalMinutes != null &&
      endTotalMinutes != null &&
      endTotalMinutes <= startTotalMinutes
    ) {
      throw new Error(
        "Lunch break end time must be after lunch break start time"
      );
    }

    if (lunchBreakDurationMinutes != null) {
      if (!Number.isInteger(lunchBreakDurationMinutes) || lunchBreakDurationMinutes <= 0) {
        throw new Error("Lunch break duration must be a positive integer");
      }

      if (
        startTotalMinutes != null &&
        endTotalMinutes != null &&
        lunchBreakDurationMinutes !== endTotalMinutes - startTotalMinutes
      ) {
        throw new Error(
          "Lunch break duration must match lunch break start and end times"
        );
      }
    }
  }

  @BeforeValidate
  static validateTimerangeConsistency(instance: ScheduleConfig): void {
    const {
      dailyStartHour,
      dailyStartMinute,
      dailyEndHour,
      dailyEndMinute,
      lunchBreakStartHour,
      lunchBreakStartMinute,
      lunchBreakEndHour,
      lunchBreakEndMinute,
    } = instance;

    if (
      dailyStartHour == null ||
      dailyEndHour == null ||
      lunchBreakStartHour == null ||
      lunchBreakEndHour == null
    ) {
      return;
    }

    const dailyStartTotalMinutes = utcTimeToLocalMinutes(
      dailyStartHour,
      dailyStartMinute ?? 0,
    );
    const dailyEndTotalMinutes = utcTimeToLocalMinutes(
      dailyEndHour,
      dailyEndMinute ?? 0,
    );
    const breakStartTotalMinutes = utcTimeToLocalMinutes(
      lunchBreakStartHour,
      lunchBreakStartMinute ?? 0,
    );
    const breakEndTotalMinutes = utcTimeToLocalMinutes(
      lunchBreakEndHour,
      lunchBreakEndMinute ?? 0,
    );

    // Lunch break phải nằm trong daily schedule
    if (
      dailyStartTotalMinutes == null ||
      dailyEndTotalMinutes == null ||
      breakStartTotalMinutes == null ||
      breakEndTotalMinutes == null ||
      breakStartTotalMinutes < dailyStartTotalMinutes ||
      breakEndTotalMinutes > dailyEndTotalMinutes
    ) {
      throw new Error(
        "Lunch break times must be within the daily schedule range"
      );
    }
  }

  @BeforeValidate
  static validateDates(instance: ScheduleConfig): void {
    const {
      startDate,
      endDate,
      registrationStartDate,
      registrationEndDate,
      bracketGenerationDate,
      dailyStartHour,
      dailyStartMinute,
      dailyEndHour,
      dailyEndMinute,
      isNewRecord,
    } = instance;

    const now = new Date();

    // Khi tạo mới, startDate không được là quá khứ
    if (isNewRecord && startDate && startDate < now) {
      throw new Error("Start date cannot be in the past");
    }

    // Khi tạo mới, registrationStartDate không được là quá khứ
    if (isNewRecord && registrationStartDate && registrationStartDate < now) {
      throw new Error("Registration start date cannot be in the past");
    }

    if (startDate && endDate) {
      const startDay = dateOnlyTime(startDate);
      const endDay = dateOnlyTime(endDate);

      if (endDay < startDay) {
        throw new Error("End date must be after start date");
      }

      if (isSameCalendarDate(startDate, endDate)) {
        const dailyStart = utcTimeToLocalMinutes(dailyStartHour, dailyStartMinute);
        const dailyEnd = utcTimeToLocalMinutes(dailyEndHour, dailyEndMinute);

        if (dailyStart != null && dailyEnd != null && dailyEnd <= dailyStart) {
          throw new Error(
            "Daily end time must be after daily start time when start date and end date are the same day"
          );
        }
      }
    }

    // registrationEndDate phải sau registrationStartDate
    if (
      registrationStartDate &&
      registrationEndDate &&
      registrationEndDate <= registrationStartDate
    ) {
      throw new Error("Registration end date must be after registration start date");
    }

    // Đăng ký phải đóng trước khi giải bắt đầu
    if (registrationEndDate && startDate && registrationEndDate >= startDate) {
      throw new Error("Registration must close before the tournament starts");
    }

    // bracketGenerationDate phải sau registrationEndDate
    if (
      bracketGenerationDate &&
      registrationEndDate &&
      bracketGenerationDate < registrationEndDate
    ) {
      throw new Error("Bracket generation date must be after registration end date");
    }

    // bracketGenerationDate phải trước startDate ít nhất 2 ngày
    if (bracketGenerationDate && startDate) {
      const twoDaysBeforeStart = new Date(startDate.getTime() - 2 * 24 * 60 * 60 * 1000);
      if (bracketGenerationDate > twoDaysBeforeStart) {
        throw new Error(
          "Bracket generation date must be at least 2 days (48 hours) before the start date"
        );
      }
    }
  }

  @BeforeValidate
  static validateNumberOfTables(instance: ScheduleConfig): void {
    const { numberOfTables } = instance;
    if (numberOfTables == null) return;

    if (!Number.isInteger(numberOfTables) || numberOfTables < 1) {
      throw new Error("Number of tables must be at least 1");
    }
  }
}
