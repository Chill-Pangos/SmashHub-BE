// match.model.ts
import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  HasMany,
  BeforeValidate,
} from "sequelize-typescript";
import Schedule from "./schedule.model";
import EloHistory from "./eloHistory.model";
import Entry from "./entry.model";
import SubMatch from "./subMatch.model";
import MatchReferee from "./matchReferee.model";

// ─── Constants ────────────────────────────────────────────────────────────────

const REVIEW_NOTES_MAX_LENGTH = 1000;

export const MATCH_STATUSES = [
  "scheduled",
  "in_progress",
  "completed",
  "cancelled",
] as const;
export type MatchStatus = (typeof MATCH_STATUSES)[number];

export const RESULT_STATUSES = ["pending", "approved", "rejected"] as const;
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

  @ForeignKey(() => Schedule)
  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: false,
  })
  declare scheduleId: number;

  @ForeignKey(() => Entry)
  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: false,
  })
  declare entryAId: number;

  @ForeignKey(() => Entry)
  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: false,
  })
  declare entryBId: number;

  @Column({
    type: DataType.ENUM(...MATCH_STATUSES),
    allowNull: false,
    defaultValue: "scheduled" satisfies MatchStatus,
  })
  declare status: MatchStatus;

  @ForeignKey(() => Entry)
  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: true,
  })
  declare winnerEntryId?: number;

  @Column({
    type: DataType.ENUM(...RESULT_STATUSES),
    allowNull: true,
    comment: "Status of match result approval by chief referee",
  })
  declare resultStatus?: ResultStatus;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    comment: "Review notes from chief referee",
  })
  declare reviewNotes?: string;

  // ─── Associations ──────────────────────────────────────────────────────────

  @BelongsTo(() => Schedule, { foreignKey: "scheduleId" })
  declare schedule?: Schedule;

  @BelongsTo(() => Entry, { foreignKey: "entryAId" })
  declare entryA?: Entry;

  @BelongsTo(() => Entry, { foreignKey: "entryBId" })
  declare entryB?: Entry;

  @BelongsTo(() => Entry, { foreignKey: "winnerEntryId" })
  declare winnerEntry?: Entry;

  @HasMany(() => EloHistory, { foreignKey: "matchId" })
  declare eloHistories?: EloHistory[];

  @HasMany(() => SubMatch, { foreignKey: "matchId" })
  declare subMatches?: SubMatch[];

  @HasMany(() => MatchReferee, { foreignKey: "matchId" })
  declare matchReferees?: MatchReferee[];

  // ─── Validators ────────────────────────────────────────────────────────────

  @BeforeValidate
  static validateEntries(instance: Match): void {
    if (instance.entryAId === undefined && instance.entryBId === undefined) return;

    if (instance.entryAId === instance.entryBId) {
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