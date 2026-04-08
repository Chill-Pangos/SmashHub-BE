// eloHistory.model.ts
import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  BeforeValidate,
} from "sequelize-typescript";
import Match from "./match.model";
import User from "./user.model";
import Tournament from "./tournament.model";

// ─── Constants ────────────────────────────────────────────────────────────────

const CHANGE_REASON_MAX_LENGTH = 255;
const MIN_ELO = 0;
const MAX_ELO = 10000;

// ─── Model ────────────────────────────────────────────────────────────────────

@Table({
  tableName: "elo_histories",
  timestamps: true,
  indexes: [{ fields: ["matchId"] }, { fields: ["userId", "createdAt"] }],
})
export default class EloHistory extends Model {
  @Column({
    type: DataType.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  })
  declare id: number;

  @ForeignKey(() => Match)
  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: false,
  })
  declare matchId: number;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: false,
  })
  declare userId: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare previousElo: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare newElo: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    comment: "newElo - previousElo",
  })
  declare eloDelta: number;

  @Column({
    type: DataType.STRING(CHANGE_REASON_MAX_LENGTH),
    allowNull: false,
  })
  declare changeReason: string;

  @ForeignKey(() => Tournament)
  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: true, // null = legacy records từ trước khi đổi logic
    comment: "Tournament this ELO change belongs to",
  })
  declare tournamentId?: number;

  // ─── Associations ──────────────────────────────────────────────────────────
  
  @BelongsTo(() => Tournament, { foreignKey: "tournamentId" })
  declare tournament?: Tournament;

  @BelongsTo(() => Match, { foreignKey: "matchId" })
  declare match?: Match;

  @BelongsTo(() => User, { foreignKey: "userId" })
  declare user?: User;

  // ─── Validators ────────────────────────────────────────────────────────────

  @BeforeValidate
  static validateEloValues(instance: EloHistory): void {
    if (instance.previousElo === undefined && instance.newElo === undefined) return;

    const { previousElo, newElo } = instance;

    if (
      !Number.isInteger(previousElo) ||
      previousElo < MIN_ELO ||
      previousElo > MAX_ELO
    ) {
      throw new Error(
        `Previous ELO must be an integer between ${MIN_ELO} and ${MAX_ELO}`,
      );
    }
    if (!Number.isInteger(newElo) || newElo < MIN_ELO || newElo > MAX_ELO) {
      throw new Error(
        `New ELO must be an integer between ${MIN_ELO} and ${MAX_ELO}`,
      );
    }
  }

  @BeforeValidate
  static validateEloDelta(instance: EloHistory): void {
    if (instance.previousElo === undefined && instance.newElo === undefined && instance.eloDelta === undefined) return;

    const { previousElo, newElo, eloDelta } = instance;

    if (eloDelta !== newElo - previousElo) {
      throw new Error("ELO delta must equal newElo minus previousElo");
    }
  }

  @BeforeValidate
  static validateChangeReason(instance: EloHistory): void {
    if (instance.changeReason === undefined) return;

    const trimmed = instance.changeReason?.trim();

    if (!trimmed) {
      throw new Error("Change reason is required");
    }
    if (trimmed.length > CHANGE_REASON_MAX_LENGTH) {
      throw new Error(
        `Change reason must not exceed ${CHANGE_REASON_MAX_LENGTH} characters`,
      );
    }
  }
}
