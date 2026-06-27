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

function minutesOfDay(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
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

  // ─── Break Time (Optional) ────────────────────────────────────────────────

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  declare startLunchBreak?: Date | null;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  declare endLunchBreak?: Date | null;

  // ─── Description ─────────────────────────────────────────────────────────

  @Column({
    type: DataType.TEXT("long"),
    allowNull: true,
  })
  declare notes?: string | null; // Ghi chú/mô tả config

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
  static validateLunchBreakTime(instance: ScheduleConfig): void {
    const { startDate, endDate, startLunchBreak, endLunchBreak } = instance;

    if (startLunchBreak == null && endLunchBreak == null) return;

    if (startLunchBreak == null || endLunchBreak == null) {
      throw new Error(
        "Both startLunchBreak and endLunchBreak must be provided if lunch break is configured"
      );
    }

    if (endLunchBreak <= startLunchBreak) {
      throw new Error(
        "Lunch break end time must be after lunch break start time"
      );
    }

    if (startDate && endDate && (startLunchBreak < startDate || endLunchBreak > endDate)) {
      throw new Error(
        "Lunch break times must be within the tournament schedule range"
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

    if (startDate && endDate && endDate <= startDate) {
      throw new Error("End date must be after start date");
    }

    if (startDate && endDate && minutesOfDay(endDate) <= minutesOfDay(startDate)) {
      throw new Error("End time must be after start time");
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
