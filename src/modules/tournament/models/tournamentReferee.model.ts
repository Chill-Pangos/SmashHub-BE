// tournamentReferee.model.ts — sửa lại
import {
  Table,
  Column,
  Model,
  DataType,
} from "sequelize-typescript";
export { REFEREE_ROLES } from "./referee.constants";
export type { RefereeRole } from "./referee.constants";
import { REFEREE_ROLES, type RefereeRole } from "./referee.constants";

// ─── Constants ────────────────────────────────────────────────────────────────

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

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: false,
  })
  declare tournamentId: number;

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

  declare tournament?: any;

  declare referee?: any;
}
