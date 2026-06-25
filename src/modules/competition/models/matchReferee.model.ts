// matchReferee.model.ts
import {
  Table,
  Column,
  Model,
  DataType,
} from "sequelize-typescript";

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

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: false,
  })
  declare matchId: number;

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: false,
  })
  declare refereeId: number;

  // ─── Associations ──────────────────────────────────────────────────────────

  declare match?: any;

  declare referee?: any;
}
