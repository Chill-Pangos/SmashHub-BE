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
import User from "./user.model";

// ─── Constants ────────────────────────────────────────────────────────────────

export const REFEREE_ROLES = ["main", "assistant"] as const;
export type RefereeRole = (typeof REFEREE_ROLES)[number];

// ─── Model ────────────────────────────────────────────────────────────────────

@Table({
  tableName: "tournament_referees",
  timestamps: true,
  indexes: [
    { fields: ["tournamentId"] },
    { fields: ["refereeId"] },
    { fields: ["tournamentId", "role", "isAvailable"] },
    {
      unique: true,
      fields: ["tournamentId", "refereeId"], // 1 referee chỉ có 1 role trong 1 tournament
    },
  ],
})
export default class TournamentReferee extends Model {
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
  })
  declare tournamentId: number;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: false,
  })
  declare refereeId: number;

  @Column({
    type: DataType.ENUM(...REFEREE_ROLES),
    allowNull: false,
    defaultValue: "assistant" satisfies RefereeRole,
  })
  declare role: RefereeRole;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  })
  declare isAvailable: boolean;

  // ─── Associations ──────────────────────────────────────────────────────────

  @BelongsTo(() => Tournament, { foreignKey: "tournamentId" })
  declare tournament?: Tournament;

  @BelongsTo(() => User, { foreignKey: "refereeId" })
  declare referee?: User;

  // ─── Validators ────────────────────────────────────────────────────────────

  @BeforeValidate
  static validateMainRefereeUnique(instance: TournamentReferee): void {
    // Mỗi tournament chỉ có 1 main referee
    // Logic này cần check ở Service layer vì cần query DB
    // Ở đây chỉ validate những gì model tự biết được
    if (!REFEREE_ROLES.includes(instance.role)) {
      throw new Error(`Role must be one of: ${REFEREE_ROLES.join(", ")}`);
    }
  }
}