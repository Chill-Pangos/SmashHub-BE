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

@Table({
  tableName: "elo_histories",
  timestamps: true,
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
    type: DataType.STRING(255),
    allowNull: false,
  })
  declare changeReason: string;

  @BelongsTo(() => Match)
  match?: Match;

  @BelongsTo(() => User)
  user?: User;
}
