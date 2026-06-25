// eloScore.model.ts
import {
  Table,
  Column,
  Model,
  DataType,
  BeforeValidate,
} from "sequelize-typescript";

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_ELO = 1000;
const MIN_ELO = 0;
const MAX_ELO = 10000;

// ─── Model ────────────────────────────────────────────────────────────────────

@Table({
  tableName: "elo_scores",
  timestamps: true,
  indexes: [
    { unique: true, fields: ["userId"] },
  ],
})
export default class EloScore extends Model {
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
  declare userId: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: DEFAULT_ELO,
  })
  declare score: number;

  // ─── Associations ──────────────────────────────────────────────────────────

  declare user?: any;

  // ─── Validators ────────────────────────────────────────────────────────────

  @BeforeValidate
  static validateScore(instance: EloScore): void {
    if (instance.score === undefined) return;

    const { score } = instance;

    if (!Number.isInteger(score) || score < MIN_ELO || score > MAX_ELO) {
      throw new Error(
        `ELO score must be an integer between ${MIN_ELO} and ${MAX_ELO}`
      );
    }
  }
}
