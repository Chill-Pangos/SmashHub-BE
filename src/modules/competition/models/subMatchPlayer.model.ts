// subMatchPlayer.model.ts
import {
  Table,
  Column,
  Model,
  DataType,
} from "sequelize-typescript";

const PLAYER_TEAMS = ["A", "B"] as const;
type Team = (typeof PLAYER_TEAMS)[number];

// ─── Model ────────────────────────────────────────────────────────────────────

@Table({
  tableName: "sub_match_players",
  timestamps: true,
  indexes: [
    { fields: ["subMatchId"] },
    { fields: ["entryMemberId"] },
    { fields: ["subMatchId", "team"] },
    {
      // Mỗi entryMember chỉ xuất hiện 1 lần trong 1 sub-match
      unique: true,
      fields: ["subMatchId", "entryMemberId"],
    },
  ],
})
export default class SubMatchPlayer extends Model {
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
  declare subMatchId: number;

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: false,
  })
  declare entryMemberId: number;

  @Column({
    type: DataType.ENUM(...PLAYER_TEAMS),
    allowNull: false,
  })
  declare team: Team;

  // ─── Associations ──────────────────────────────────────────────────────────

  declare subMatch?: any;

  declare entryMember?: any;
}
