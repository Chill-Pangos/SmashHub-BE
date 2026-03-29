// knockoutBracket.model.ts
import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  BeforeValidate,
} from "sequelize-typescript";
import TournamentCategory from "./tournamentCategory.model";
import Schedule from "./schedule.model";
import Match from "./match.model";
import Entry from "./entry.model";
import { KNOCKOUT_ROUNDS, KnockoutRound } from "./schedule.model";

// ─── Constants ────────────────────────────────────────────────────────────────

const MIN_ROUND_NUMBER = 1;
const MAX_ROUND_NUMBER = 6; // R64=1, R32=2, R16=3, QF=4, SF=5, F=6
const MIN_BRACKET_POSITION = 0;

export const BRACKET_STATUSES = [
  "pending",
  "ready",
  "in_progress",
  "completed",
] as const;
export type BracketStatus = (typeof BRACKET_STATUSES)[number];

// ─── Model ────────────────────────────────────────────────────────────────────

@Table({
  tableName: "knockout_brackets",
  timestamps: true,
  indexes: [
    { fields: ["categoryId"] },
    { fields: ["scheduleId"] },
    { fields: ["matchId"] },
    { fields: ["entryAId"] },
    { fields: ["entryBId"] },
    { fields: ["winnerEntryId"] },
    { fields: ["nextBracketId"] },
    { fields: ["status"] },
    { fields: ["categoryId", "roundNumber", "bracketPosition"] },
    {
      unique: true,
      fields: ["categoryId", "roundNumber", "bracketPosition"], // vị trí trong bracket là duy nhất
    },
  ],
})
export default class KnockoutBracket extends Model {
  @Column({
    type: DataType.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  })
  declare id: number;

  @ForeignKey(() => TournamentCategory)
  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: false,
  })
  declare categoryId: number;

  // ── Bracket position ───────────────────────────────────────────────────────

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: false,
    comment: "1=R64, 2=R32, 3=R16, 4=QF, 5=SF, 6=Final",
  })
  declare roundNumber: number;

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: false,
    comment: "0-based position within the round",
  })
  declare bracketPosition: number;

  @Column({
    type: DataType.ENUM(...KNOCKOUT_ROUNDS),
    allowNull: false,
    comment: "Human-readable round name",
  })
  declare roundName: KnockoutRound;

  // ── Match ──────────────────────────────────────────────────────────────────

  @ForeignKey(() => Schedule)
  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: true,
  })
  declare scheduleId?: number;

  @ForeignKey(() => Match)
  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: true,
  })
  declare matchId?: number;

  // ── Entries ────────────────────────────────────────────────────────────────

  @ForeignKey(() => Entry)
  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: true,
  })
  declare entryAId?: number;

  @ForeignKey(() => Entry)
  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: true,
  })
  declare entryBId?: number;

  @ForeignKey(() => Entry)
  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: true,
  })
  declare winnerEntryId?: number;

  // ── Bracket tree navigation ────────────────────────────────────────────────

  @ForeignKey(() => KnockoutBracket)
  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: true,
  })
  declare nextBracketId?: number;

  @ForeignKey(() => KnockoutBracket)
  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: true,
  })
  declare previousBracketAId?: number;

  @ForeignKey(() => KnockoutBracket)
  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: true,
  })
  declare previousBracketBId?: number;

  // ── Status ─────────────────────────────────────────────────────────────────

  @Column({
    type: DataType.ENUM(...BRACKET_STATUSES),
    allowNull: false,
    defaultValue: "pending" satisfies BracketStatus,
  })
  declare status: BracketStatus;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: "True if one entry advances without playing",
  })
  declare isByeMatch: boolean;

  // ─── Associations ──────────────────────────────────────────────────────────

  @BelongsTo(() => TournamentCategory, { foreignKey: "categoryId" })
  declare category?: TournamentCategory;

  @BelongsTo(() => Schedule, { foreignKey: "scheduleId" })
  declare schedule?: Schedule;

  @BelongsTo(() => Match, { foreignKey: "matchId" })
  declare match?: Match;

  @BelongsTo(() => Entry, { foreignKey: "entryAId" })
  declare entryA?: Entry;

  @BelongsTo(() => Entry, { foreignKey: "entryBId" })
  declare entryB?: Entry;

  @BelongsTo(() => Entry, { foreignKey: "winnerEntryId" })
  declare winnerEntry?: Entry;

  @BelongsTo(() => KnockoutBracket, { foreignKey: "nextBracketId" })
  declare nextBracket?: KnockoutBracket;

  @BelongsTo(() => KnockoutBracket, { foreignKey: "previousBracketAId" })
  declare previousBracketA?: KnockoutBracket;

  @BelongsTo(() => KnockoutBracket, { foreignKey: "previousBracketBId" })
  declare previousBracketB?: KnockoutBracket;

  // ─── Validators ────────────────────────────────────────────────────────────

  @BeforeValidate
  static validateRoundNumber(instance: KnockoutBracket): void {
    const { roundNumber } = instance;

    if (
      !Number.isInteger(roundNumber) ||
      roundNumber < MIN_ROUND_NUMBER ||
      roundNumber > MAX_ROUND_NUMBER
    ) {
      throw new Error(
        `Round number must be an integer between ${MIN_ROUND_NUMBER} and ${MAX_ROUND_NUMBER}`
      );
    }
  }

  @BeforeValidate
  static validateBracketPosition(instance: KnockoutBracket): void {
    const { bracketPosition, roundNumber } = instance;

    if (!Number.isInteger(bracketPosition) || bracketPosition < MIN_BRACKET_POSITION) {
      throw new Error("Bracket position must be a non-negative integer");
    }

    // Số vị trí tối đa trong mỗi round = 2^(maxRound - roundNumber)
    const maxPositions = Math.pow(2, MAX_ROUND_NUMBER - roundNumber);
    if (bracketPosition >= maxPositions) {
      throw new Error(
        `Bracket position must be less than ${maxPositions} for round ${roundNumber}`
      );
    }
  }

  @BeforeValidate
  static validateEntries(instance: KnockoutBracket): void {
    const { entryAId, entryBId } = instance;

    if (entryAId != null && entryBId != null && entryAId === entryBId) {
      throw new Error("Entry A and Entry B must be different");
    }
  }

  @BeforeValidate
  static validateWinner(instance: KnockoutBracket): void {
    const { winnerEntryId, entryAId, entryBId, status, isByeMatch } = instance;

    if (winnerEntryId == null) return;

    if (status !== "completed") {
      throw new Error("Winner can only be set when bracket status is completed");
    }

    // Bye match: winner không cần đối thủ
    if (!isByeMatch && winnerEntryId !== entryAId && winnerEntryId !== entryBId) {
      throw new Error("Winner must be either Entry A or Entry B");
    }
  }

  @BeforeValidate
  static validateByeMatch(instance: KnockoutBracket): void {
    const { isByeMatch, entryAId, entryBId } = instance;

    if (!isByeMatch) return;

    // Bye match chỉ có 1 entry
    if (entryAId != null && entryBId != null) {
      throw new Error("Bye match must have only one entry");
    }
  }

  @BeforeValidate
  static validateSelfReference(instance: KnockoutBracket): void {
    const { id, nextBracketId, previousBracketAId, previousBracketBId } = instance;

    if (!id) return; // create mới chưa có id

    if (nextBracketId === id || previousBracketAId === id || previousBracketBId === id) {
      throw new Error("Bracket cannot reference itself");
    }
  }
}