// matchSet.model.ts
import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  BeforeValidate,
} from "sequelize-typescript";
import SubMatch from "./subMatch.model";

// ─── Constants ────────────────────────────────────────────────────────────────

const MIN_SET_NUMBER = 1;
const MAX_SET_NUMBER = 7;
const MAX_SCORE = 30;     

// ─── Model ────────────────────────────────────────────────────────────────────

@Table({
  tableName: "match_sets",
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ["subMatchId", "setNumber"],
    },
  ],
})
export default class MatchSet extends Model {
  @Column({
    type: DataType.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  })
  declare id: number;

  @ForeignKey(() => SubMatch)
  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: false,
  })
  declare subMatchId: number;

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: false,
  })
  declare setNumber: number;

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0,
  })
  declare entryAScore: number;

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0,
  })
  declare entryBScore: number;

  // ─── Associations ──────────────────────────────────────────────────────────

  @BelongsTo(() => SubMatch, { foreignKey: "subMatchId" })
  declare subMatch?: SubMatch;

  // ─── Validators ────────────────────────────────────────────────────────────

  @BeforeValidate
  static validateSetNumber(instance: MatchSet): void {
    if (instance.setNumber === undefined) return;

    const { setNumber } = instance;

    if (
      !Number.isInteger(setNumber) ||
      setNumber < MIN_SET_NUMBER ||
      setNumber > MAX_SET_NUMBER
    ) {
      throw new Error(
        `Set number must be an integer between ${MIN_SET_NUMBER} and ${MAX_SET_NUMBER}`
      );
    }
  }

  @BeforeValidate
  static validateScores(instance: MatchSet): void {
    if (instance.entryAScore === undefined && instance.entryBScore === undefined) return;

    const { entryAScore, entryBScore } = instance;

    if (!Number.isInteger(entryAScore) || entryAScore < 0 || entryAScore > MAX_SCORE) {
      throw new Error(`Entry A score must be between 0 and ${MAX_SCORE}`);
    }

    if (!Number.isInteger(entryBScore) || entryBScore < 0 || entryBScore > MAX_SCORE) {
      throw new Error(`Entry B score must be between 0 and ${MAX_SCORE}`);
    }

    if (entryAScore === entryBScore && entryAScore > 0) {
      throw new Error("A set cannot end in a draw");
    }
  }
}