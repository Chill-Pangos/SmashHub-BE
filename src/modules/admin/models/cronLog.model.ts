import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  BeforeValidate,
} from "sequelize-typescript";
import Tournament from "../../../models/tournament.model";

export const CRON_LOG_LEVELS = ["info", "warn", "error"] as const;
export type CronLogLevel = (typeof CRON_LOG_LEVELS)[number];

export const CRON_LOG_STATUSES = ["success", "failed", "skipped"] as const;
export type CronLogStatus = (typeof CRON_LOG_STATUSES)[number];

const JOB_NAME_MAX_LENGTH = 100;
const MESSAGE_MAX_LENGTH = 500;

@Table({
  tableName: "cron_logs",
  timestamps: true,
  indexes: [
    { fields: ["jobName", "createdAt"] },
    { fields: ["tournamentId", "createdAt"] },
    { fields: ["status", "createdAt"] },
  ],
})
export default class CronLog extends Model {
  @Column({
    type: DataType.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  })
  declare id: number;

  @Column({
    type: DataType.STRING(JOB_NAME_MAX_LENGTH),
    allowNull: false,
  })
  declare jobName: string;

  @ForeignKey(() => Tournament)
  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: true,
  })
  declare tournamentId?: number | null;

  @Column({
    type: DataType.ENUM(...CRON_LOG_LEVELS),
    allowNull: false,
    defaultValue: "info",
  })
  declare level: CronLogLevel;

  @Column({
    type: DataType.ENUM(...CRON_LOG_STATUSES),
    allowNull: false,
    defaultValue: "success",
  })
  declare status: CronLogStatus;

  @Column({
    type: DataType.STRING(MESSAGE_MAX_LENGTH),
    allowNull: false,
  })
  declare message: string;

  @Column({
    type: DataType.JSON,
    allowNull: true,
  })
  declare meta?: unknown;

  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  declare startedAt: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  declare finishedAt?: Date | null;

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: true,
  })
  declare durationMs?: number | null;

  @BelongsTo(() => Tournament, { foreignKey: "tournamentId" })
  declare tournament?: Tournament;

  @BeforeValidate
  static validateJobName(instance: CronLog): void {
    if (instance.jobName === undefined) return;

    const jobName = instance.jobName?.trim();
    if (!jobName) throw new Error("Job name is required");
    if (jobName.length > JOB_NAME_MAX_LENGTH) {
      throw new Error(`Job name must not exceed ${JOB_NAME_MAX_LENGTH} characters`);
    }
  }

  @BeforeValidate
  static validateMessage(instance: CronLog): void {
    if (instance.message === undefined) return;

    const message = instance.message?.trim();
    if (!message) throw new Error("Cron log message is required");
    if (message.length > MESSAGE_MAX_LENGTH) {
      throw new Error(`Cron log message must not exceed ${MESSAGE_MAX_LENGTH} characters`);
    }
  }
}
