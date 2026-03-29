// matchReferee.model.ts
import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from "sequelize-typescript";
import Match from "./match.model";
import User from "./user.model";

// ─── Model ────────────────────────────────────────────────────────────────────

@Table({
  tableName: "match_referees",
  timestamps: true,
  indexes: [
    { fields: ["matchId"] },
    { fields: ["refereeId"] },
    {
      unique: true,
      fields: ["matchId", "refereeId"], // 1 referee chỉ xuất hiện 1 lần trong 1 trận
    },
  ],
})
export default class MatchReferee extends Model {
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
  declare refereeId: number;

  // ─── Associations ──────────────────────────────────────────────────────────

  @BelongsTo(() => Match, { foreignKey: "matchId" })
  declare match?: Match;

  @BelongsTo(() => User, { foreignKey: "refereeId" })
  declare referee?: User;
}