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
import Team from "./team.model";
import EntryMember from "./entryMember.model";

@Table({
  tableName: "entries",
  timestamps: true,
  indexes: [
    { fields: ["contentId"] },
    { fields: ["teamId"] },
  ],
})
export default class Entries extends Model {
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
  declare contentId: number;

  @ForeignKey(() => Team)
  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: false,
  })
  declare teamId: number;

  @BelongsTo(() => TournamentCategory)
  content?: TournamentCategory;

  @BelongsTo(() => Team)
  team?: Team;

  @HasMany(() => EntryMember)
  members?: EntryMember[];

  @HasMany(() => Match, "entryAId")
  matchesAsA?: Match[];

  @HasMany(() => Match, "entryBId")
  matchesAsB?: Match[];

  @HasMany(() => Match, "winnerEntryId")
  wonMatches?: Match[];
}
