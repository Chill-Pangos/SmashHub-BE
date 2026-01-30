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

@Table({
  tableName: "tournament_referees",
  timestamps: true,
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
    type: DataType.ENUM("main", "assistant"),
    allowNull: false,
    defaultValue: "assistant",
  })
  declare role: string;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  })
  declare isAvailable: boolean;

  @BelongsTo(() => Tournament)
  tournament?: Tournament;

  @BelongsTo(() => User)
  referee?: User;
}
