// tournamentReferee.model.ts — sửa lại
import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from "sequelize-typescript";
import Tournament from "./tournament.model";
import User from "./user.model";

// ─── Constants ────────────────────────────────────────────────────────────────

export const REFEREE_ROLES = ["chief", "referee"] as const;
export type RefereeRole = (typeof REFEREE_ROLES)[number];

// ─── Model ────────────────────────────────────────────────────────────────────

@Table({
  tableName: "tournament_referees",
  timestamps: true,
  indexes: [
    { fields: ["tournamentId"] },
    { fields: ["refereeId"] },
    { fields: ["tournamentId", "role"] },
    {
      unique: true,
      fields: ["tournamentId", "refereeId"],
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
    defaultValue: "referee" satisfies RefereeRole,
  })
  declare role: RefereeRole;

  // ─── Associations ──────────────────────────────────────────────────────────

  @BelongsTo(() => Tournament, { foreignKey: "tournamentId" })
  declare tournament?: Tournament;

  @BelongsTo(() => User, { foreignKey: "refereeId" })
  declare referee?: User;
}