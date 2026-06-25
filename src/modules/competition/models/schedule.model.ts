import {
  Table,
  Column,
  Model,
  DataType,
  BeforeValidate,
} from "sequelize-typescript";
export { KNOCKOUT_ROUNDS, STAGES } from "./schedule.constants";
export type { KnockoutRound, Stage } from "./schedule.constants";
import {
  KNOCKOUT_ROUNDS,
  STAGES,
  type KnockoutRound,
  type Stage,
} from "./schedule.constants";

// ─── Constants ────────────────────────────────────────────────────────────────

const GROUP_NAME_MAX_LENGTH = 50;
const MIN_TABLE_NUMBER = 1;
const MAX_TABLE_NUMBER = 100;
const GROUP_NAME_REGEX = /^[\p{L}\p{N}\s\-]+$/u;

@Table({
  tableName: "schedules",
  timestamps: true,
  indexes: [
    { fields: ["scheduledAt"] },
    { fields: ["stage"] },
    { fields: ["categoryId", "stage"] },
    { fields: ["categoryId", "groupName"] },
    { fields: ["categoryId", "knockoutRound"] },
  ],
})
export default class Schedule extends Model {
  @Column({
    type: DataType.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  })
  declare id: number;

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: false,
  })
  declare categoryId: number;

  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  declare scheduledAt: Date;

  @Column({
    type: DataType.ENUM(...STAGES),
    allowNull: false,
    defaultValue: "group" satisfies Stage,
  })
  declare stage: Stage;

  // ── Group Stage Fields ────────────────────────────────────────────────────

  @Column({
    type: DataType.STRING(GROUP_NAME_MAX_LENGTH),
    allowNull: true,
  })
  declare groupName?: string;

  // ── Knockout Stage Fields ─────────────────────────────────────────────────

  @Column({
    type: DataType.ENUM(...KNOCKOUT_ROUNDS),
    allowNull: true,
  })
  declare knockoutRound?: KnockoutRound;

  // ── Venue ─────────────────────────────────────────────────────────────────

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: true,
  })
  declare tableNumber?: number;

  // ─── Associations ─────────────────────────────────────────────────────────

  declare tournamentCategory?: any;

  declare scheduledMatches?: any[];

  // ─── Validators ───────────────────────────────────────────────────────────

  @BeforeValidate
  static validateScheduledAt(instance: Schedule): void {
    if (!instance.isNewRecord && !instance.changed("scheduledAt")) return;

    const { scheduledAt } = instance;

    if (scheduledAt === undefined) return;

    if (!scheduledAt) {
      throw new Error("Scheduled time is required");
    }

    const oneMinuteAgo = new Date(Date.now() - 60_000);
    if (new Date(scheduledAt) < oneMinuteAgo) {
      throw new Error("Scheduled time must not be in the past");
    }
  }

  @BeforeValidate
  static validateStageConsistency(instance: Schedule): void {
    if (
      !instance.isNewRecord &&
      !instance.changed("stage") &&
      !instance.changed("groupName") &&
      !instance.changed("knockoutRound")
    ) {
      return;
    }

    const { stage, groupName, knockoutRound } = instance;

    if (stage === undefined && groupName === undefined && knockoutRound === undefined) return;

    if (stage === "group") {
      if (!groupName?.trim()) {
        throw new Error("Group stage requires groupName");
      }
      if (knockoutRound) {
        throw new Error("knockoutRound must not be set for group stage");
      }
      return;
    }

    if (stage === "knockout") {
      if (!knockoutRound) {
        throw new Error("Knockout stage requires knockoutRound");
      }
      if (groupName?.trim()) {
        throw new Error("groupName must not be set for knockout stage");
      }
    }
  }

  @BeforeValidate
  static validateTableNumber(instance: Schedule): void {
    const { tableNumber } = instance;

    if (tableNumber == null) return;

    if (
      !Number.isInteger(tableNumber) ||
      tableNumber < MIN_TABLE_NUMBER ||
      tableNumber > MAX_TABLE_NUMBER
    ) {
      throw new Error(
        `Table number must be an integer between ${MIN_TABLE_NUMBER} and ${MAX_TABLE_NUMBER}`
      );
    }
  }

  @BeforeValidate
  static validateGroupName(instance: Schedule): void {
    const { groupName } = instance;

    if (groupName == null) return;

    const trimmed = groupName.trim();

    if (trimmed.length === 0) {
      throw new Error("Group name must not be empty or whitespace only");
    }
    if (trimmed.length > GROUP_NAME_MAX_LENGTH) {
      throw new Error(
        `Group name must not exceed ${GROUP_NAME_MAX_LENGTH} characters`
      );
    }
    if (!GROUP_NAME_REGEX.test(trimmed)) {
      throw new Error(
        "Group name must only contain letters, numbers, spaces, or hyphens"
      );
    }
  }
}
