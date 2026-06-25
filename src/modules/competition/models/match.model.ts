// match.model.ts
import {
  Table,
  Column,
  Model,
  DataType,
  BeforeValidate,
} from "sequelize-typescript";

// ─── Constants ────────────────────────────────────────────────────────────────

const REVIEW_NOTES_MAX_LENGTH = 1000;

export const MATCH_STATUSES = [
  "scheduled",
  "in_progress",
  "completed",
  "cancelled",
] as const;
export type MatchStatus = (typeof MATCH_STATUSES)[number];

export const RESULT_STATUSES = ["pending", "approved"] as const;
export type ResultStatus = (typeof RESULT_STATUSES)[number];

// ─── Model ────────────────────────────────────────────────────────────────────

@Table({
  tableName: "matches",
  timestamps: true,
  indexes: [
    { fields: ["entryAId"] },
    { fields: ["entryBId"] },
    { fields: ["winnerEntryId"] },
    { fields: ["status"] },
    { fields: ["resultStatus"] },
    { fields: ["scheduleId", "status"] },
  ],
})
export default class Match extends Model {
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
  declare scheduleId: number;

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: true,
  })
  declare entryAId?: number | null;

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: true,
  })
  declare entryBId?: number | null;

  @Column({
    type: DataType.ENUM(...MATCH_STATUSES),
    allowNull: false,
    defaultValue: "scheduled" satisfies MatchStatus,
  })
  declare status: MatchStatus;

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: true,
  })
  declare winnerEntryId?: number | null;

  @Column({
    type: DataType.ENUM(...RESULT_STATUSES),
    allowNull: true,
    comment: "Status of match result approval by chief referee",
  })
  declare resultStatus?: ResultStatus | null;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    comment: "Review notes from chief referee",
  })
  declare reviewNotes?: string;

  // ─── Associations ──────────────────────────────────────────────────────────

  declare schedule?: any;

  declare entryA?: any;

  declare entryB?: any;

  declare winnerEntry?: any;

  declare eloHistories?: any[];

  declare subMatches?: any[];

  declare matchReferees?: any[];

  // ─── Validators ────────────────────────────────────────────────────────────

  @BeforeValidate
  static validateEntries(instance: Match): void {
    if (instance.entryAId === undefined && instance.entryBId === undefined) return;

    if (
      instance.entryAId != null &&
      instance.entryBId != null &&
      instance.entryAId === instance.entryBId
    ) {
      throw new Error("Entry A and Entry B must be different");
    }
  }

  @BeforeValidate
  static validateWinner(instance: Match): void {
    const { winnerEntryId, entryAId, entryBId, status } = instance;

    if (winnerEntryId == null) return;

    if (winnerEntryId !== entryAId && winnerEntryId !== entryBId) {
      throw new Error("Winner must be either Entry A or Entry B");
    }
    if (status !== "completed") {
      throw new Error("Winner can only be set when match status is completed");
    }
  }

  @BeforeValidate
  static validateResultStatus(instance: Match): void {
    const { resultStatus, status } = instance;

    if (resultStatus == null) return;

    if (status !== "completed") {
      throw new Error(
        "Result status can only be set when match status is completed"
      );
    }
  }

  @BeforeValidate
  static validateReviewNotes(instance: Match): void {
    const { reviewNotes } = instance;

    if (reviewNotes == null) return;

    if (reviewNotes.trim().length === 0) {
      throw new Error("Review notes must not be empty or whitespace only");
    }
    if (reviewNotes.length > REVIEW_NOTES_MAX_LENGTH) {
      throw new Error(
        `Review notes must not exceed ${REVIEW_NOTES_MAX_LENGTH} characters`
      );
    }
  }
}
