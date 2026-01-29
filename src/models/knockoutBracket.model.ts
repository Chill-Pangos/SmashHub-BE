import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from "sequelize-typescript";
import TournamentContent from "./tournamentContent.model";
import Schedule from "./schedule.model";
import Match from "./match.model";
import Entries from "./entries.model";

@Table({
  tableName: "knockout_brackets",
  timestamps: true,
})
export default class KnockoutBracket extends Model {
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

  // Bracket position information
  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: false,
  })
  declare roundNumber: number; // 1 (R64), 2 (R32), 3 (R16), 4 (QF), 5 (SF), 6 (F)

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: false,
  })
  declare bracketPosition: number; // Position within the round (0-based)

  // Match information
  @ForeignKey(() => Schedule)
  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: true,
  })
  declare scheduleId?: number;

  @ForeignKey(() => Match)
  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: true,
  })
  declare matchId?: number;

  // Entries (teams/players)
  @ForeignKey(() => Entries)
  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: true,
  })
  declare entryAId?: number;

  @ForeignKey(() => Entries)
  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: true,
  })
  declare entryBId?: number;

  @ForeignKey(() => Entries)
  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: true,
  })
  declare winnerEntryId?: number;

  // Navigation in bracket tree
  @ForeignKey(() => KnockoutBracket)
  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: true,
  })
  declare nextBracketId?: number;

  @ForeignKey(() => KnockoutBracket)
  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: true,
  })
  declare previousBracketAId?: number;

  @ForeignKey(() => KnockoutBracket)
  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: true,
  })
  declare previousBracketBId?: number;

  // Status
  @Column({
    type: DataType.ENUM("pending", "ready", "in_progress", "completed"),
    allowNull: false,
    defaultValue: "pending",
  })
  declare status: "pending" | "ready" | "in_progress" | "completed";

  // Metadata
  @Column({
    type: DataType.STRING(50),
    allowNull: true,
  })
  declare roundName?: string; // "Round of 16", "Quarter-final", "Semi-final", "Final"

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  declare isByeMatch: boolean;

  // Associations
  @BelongsTo(() => TournamentContent)
  content?: TournamentContent;

  @BelongsTo(() => Schedule)
  schedule?: Schedule;

  @BelongsTo(() => Match)
  match?: Match;

  @BelongsTo(() => Entries, "entryAId")
  entryA?: Entries;

  @BelongsTo(() => Entries, "entryBId")
  entryB?: Entries;

  @BelongsTo(() => Entries, "winnerEntryId")
  winnerEntry?: Entries;

  @BelongsTo(() => KnockoutBracket, "nextBracketId")
  nextBracket?: KnockoutBracket;

  @BelongsTo(() => KnockoutBracket, "previousBracketAId")
  previousBracketA?: KnockoutBracket;

  @BelongsTo(() => KnockoutBracket, "previousBracketBId")
  previousBracketB?: KnockoutBracket;
}
