import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from "sequelize-typescript";
import TournamentCategory from "./tournamentCategory.model";
import Entry from "./entry.model";

@Table({
  tableName: "group_standings",
  timestamps: true,
  indexes: [
    { fields: ["entryId"] },
    { fields: ["categoryId", "groupName"] },
    { fields: ["categoryId", "position"] },
  ],
})
export default class GroupStanding extends Model {
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
    type: DataType.STRING(50),
    allowNull: false,
  })
  declare groupName: string;

  @ForeignKey(() => Entry)
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

  @BelongsTo(() => TournamentCategory)
  category?: TournamentCategory;

  @BelongsTo(() => Entry)
  entry?: Entry;
}
