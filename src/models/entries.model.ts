import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  HasMany,
} from "sequelize-typescript";
import TournamentContent from "./tournamentContent.model";
import EntryMember from "./entrymember.model";
import Match from "./match.model";

@Table({
  tableName: "entries",
  timestamps: true,
})
export default class Entries extends Model {
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
    type: DataType.STRING(100),
    allowNull: false,
  })
  declare name: string;

  @BelongsTo(() => TournamentContent)
  content?: TournamentContent;

  @HasMany(() => EntryMember)
  members?: EntryMember[];

  @HasMany(() => Match, "entryAId")
  matchesAsA?: Match[];

  @HasMany(() => Match, "entryBId")
  matchesAsB?: Match[];

  @HasMany(() => Match, "winnerEntryId")
  wonMatches?: Match[];
}
