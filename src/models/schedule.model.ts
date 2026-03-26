import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  HasMany,
} from "sequelize-typescript";
import TournamentCategory from "./tournamentCategory.model";
import Match from "./match.model";
import GroupStanding from "./groupStanding.model";

@Table({
  tableName: "schedules",
  timestamps: true,
  indexes: [
    { fields: ["scheduledAt"] },
    { fields: ["stage"] },
    { fields: ["categoryId", "stage"] },
    { fields: ["categoryId", "groupName"] },
    { fields: ["categoryId", "roundNumber"] },
  ],
})
export default class Schedule extends Model {
  @Column({
    type: DataType.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  })
  declare id: number;

  @ForeignKey(() => TournamentCategory)
  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: false,
  })
  declare categoryId: number;

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
    type: DataType.ENUM('group', 'knockout'),
    allowNull: true,
    defaultValue: 'group',
  })
  declare stage?: 'group' | 'knockout';

  @Column({
    type: DataType.STRING(50),
    allowNull: true,
  })
  declare knockoutRound?: string; // e.g., 'Round of 16', 'Quarter-final', 'Semi-final', 'Final'

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  declare tableNumber?: number; // Số bàn thi đấu (1-N)

  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  declare scheduledAt: Date;

  @BelongsTo(() => TournamentCategory, {
    foreignKey: 'categoryId',
  })
  TournamentCategory?: TournamentCategory;

  @HasMany(() => Match)
  matches?: Match[];

  @HasMany(() => Match, "scheduledId")
  scheduledMatches?: Match[];
}
