import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  HasMany,
} from "sequelize-typescript";
import SubMatch from "./subMatch.model";

@Table({
  tableName: "sub_match_players",
  timestamps: true,
  indexes: [
    { fields: ["subMatchId"] },
    { fields: ["entryMemberId"] },
    { fields: ["subMatchId", "team"] },
  ],
})
export default class SubMatchPlayer extends Model {
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
  declare entryMemberId: number;

  @Column({
    type: DataType.ENUM("A", "B"),
    allowNull: false,
  })
  declare team: "A" | "B";

  @BelongsTo(() => SubMatch)
  subMatch?: SubMatch;
}
