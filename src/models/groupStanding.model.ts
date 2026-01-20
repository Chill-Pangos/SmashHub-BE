import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from "sequelize-typescript";
import TournamentContent from "./tournamentContent.model";
import Entries from "./entries.model";

@Table({
  tableName: "group_standings",
  timestamps: true,
})
export default class GroupStanding extends Model {
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
    type: DataType.STRING(50),
    allowNull: false,
  })
  declare groupName: string;

  @ForeignKey(() => Entries)
  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: false,
  })
  declare entryId: number;

  // Match statistics
  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0,
  })
  declare matchesPlayed: number;

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0,
  })
  declare matchesWon: number;

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0,
  })
  declare matchesLost: number;

  // Game/Set statistics
  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0,
  })
  declare setsWon: number;

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0,
  })
  declare setsLost: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
  })
  declare setsDiff: number; // setsWon - setsLost

  // Ranking
  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: true,
  })
  declare position?: number;

  @BelongsTo(() => TournamentContent)
  content?: TournamentContent;

  @BelongsTo(() => Entries)
  entry?: Entries;
}
