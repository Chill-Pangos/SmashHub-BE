import {
  Table,
  Column,
  Model,
  DataType,
  HasMany,
  ForeignKey,
  BelongsTo,
} from "sequelize-typescript";
import User from "./user.model";

@Table({
  tableName: "tournament_participants",
  timestamps: true,
})
export default class TournamentParticipant extends Model {
  @Column({
    type: DataType.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  })
  declare id: number;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: false,
  })
  declare userId: number;

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: false,
  })
  declare tournamentId: number;

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: false,
  })
  declare teamId: number;

  @BelongsTo(() => User)
  user?: User;
}
