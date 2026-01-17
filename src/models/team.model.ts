import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  HasMany,
} from "sequelize-typescript";
import TeamMember from "./teamMember.model";
import Tournament from "./tournament.model";

@Table({
  tableName: "teams",
  timestamps: true,
})
export default class Team extends Model {
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

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
  })
  declare name: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
  })
  declare description?: string;

  @BelongsTo(() => Tournament)
  tournament?: Tournament;

  @HasMany(() => TeamMember)
  members?: TeamMember[];
}
