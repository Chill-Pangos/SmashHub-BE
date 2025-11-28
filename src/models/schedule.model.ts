import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from "sequelize-typescript";
import TournamentContent from "./tournamentContent.model";

@Table({
  tableName: "schedules",
  timestamps: true,
})
export default class Schedule extends Model {
  @Column({
    type: DataType.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  })
  declare id: number;

  @ForeignKey(() => TournamentContent)
  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: false,
  })
  declare contentId: number;

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: true,
  })
  declare roundNumber?: number;

  @Column({
    type: DataType.STRING(50),
    allowNull: true,
  })
  declare groupName?: string;

  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  declare scheduledAt: Date;

  @BelongsTo(() => TournamentContent)
  content?: TournamentContent;
}
