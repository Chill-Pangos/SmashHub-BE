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

function timeToMinutes(hour?: number, minute?: number): number | null {
  if (hour == null || minute == null) return null;
  return hour * 60 + minute;
}

// ─── Model ────────────────────────────────────────────────────────────────────

@Table({
  tableName: "schedule_configs",
  timestamps: true,
  indexes: [
    { fields: ["tournamentId"] },
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
    defaultValue: 20,
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
    defaultValue: 8,
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
    defaultValue: 22,
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
  declare lunchBreakStartHour?: number; // Giờ bắt đầu break (giữa trưa)

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: true,
    defaultValue: 0,
  })
  declare lunchBreakStartMinute?: number;

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: true,
  })
  declare lunchBreakEndHour?: number; // Giờ kết thúc break (giữa trưa)

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: true,
    defaultValue: 0,
  })
  declare lunchBreakEndMinute?: number;

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: true,
  })
  declare lunchBreakDurationMinutes?: number; // Duration của break

  // ─── Description ─────────────────────────────────────────────────────────

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare notes?: string; // Ghi chú/mô tả config

  // ─── Associations ────────────────────────────────────────────────────────

  @BelongsTo(() => Tournament)
  declare tournament?: Tournament;

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

    const startTotalMinutes = dailyStartHour * 60 + dailyStartMinute;
    const endTotalMinutes = dailyEndHour * 60 + dailyEndMinute;

    if (endTotalMinutes <= startTotalMinutes) {
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
    } = instance;

    // Nếu không có lunch break, skip validation
    if (lunchBreakStartHour == null && lunchBreakEndHour == null) {
      return;
    }

    // Nếu có 1 trong 2, phải có cả 2
    if (
      (lunchBreakStartHour != null && lunchBreakEndHour == null) ||
      (lunchBreakStartHour == null && lunchBreakEndHour != null)
    ) {
      throw new Error(
        "Both lunch break start and end times must be provided if lunch break is configured"
      );
    }

    const startTotalMinutes =
      lunchBreakStartHour! * 60 + (lunchBreakStartMinute ?? 0);
    const endTotalMinutes =
      lunchBreakEndHour! * 60 + (lunchBreakEndMinute ?? 0);

    if (endTotalMinutes <= startTotalMinutes) {
      throw new Error(
        "Lunch break end time must be after lunch break start time"
      );
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

    const dailyStartTotalMinutes = dailyStartHour * 60 + (dailyStartMinute ?? 0);
    const dailyEndTotalMinutes = dailyEndHour * 60 + (dailyEndMinute ?? 0);
    const breakStartTotalMinutes =
      lunchBreakStartHour * 60 + (lunchBreakStartMinute ?? 0);
    const breakEndTotalMinutes =
      lunchBreakEndHour * 60 + (lunchBreakEndMinute ?? 0);

    // Lunch break phải nằm trong daily schedule
    if (
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
        const dailyStart = timeToMinutes(dailyStartHour, dailyStartMinute);
        const dailyEnd = timeToMinutes(dailyEndHour, dailyEndMinute);

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
