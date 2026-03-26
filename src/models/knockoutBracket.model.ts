import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from "sequelize-typescript";
import TournamentCategory from "./tournamentCategory.model";
import Schedule from "./schedule.model";
import Match from "./match.model";
import Entry from "./entry.model";

@Table({
  tableName: "knockout_brackets",
  timestamps: true,
  indexes: [
    { fields: ["categoryId"] },
    { fields: ["scheduleId"] },
    { fields: ["matchId"] },
    { fields: ["entryAId"] },
    { fields: ["entryBId"] },
    { fields: ["winnerEntryId"] },
    { fields: ["nextBracketId"] },
    { fields: ["previousBracketAId"] },
    { fields: ["previousBracketBId"] },
    { fields: ["categoryId", "roundNumber", "bracketPosition"] },
    { fields: ["status"] },
  ],
})
export default class KnockoutBracket extends Model {
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
  @ForeignKey(() => Entry)
  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: true,
  })
  declare entryAId?: number;

  @ForeignKey(() => Entry)
  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: true,
  })
  declare entryBId?: number;

  @ForeignKey(() => Entry)
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
  @BelongsTo(() => TournamentCategory)
  category?: TournamentCategory;

  @BelongsTo(() => Schedule)
  schedule?: Schedule;

  @BelongsTo(() => Match)
  match?: Match;

  @BelongsTo(() => Entry, "entryAId")
  entryA?: Entry;

  @BelongsTo(() => Entry, "entryBId")
  entryB?: Entry;

  @BelongsTo(() => Entry, "winnerEntryId")
  winnerEntry?: Entry;

  @BelongsTo(() => KnockoutBracket, "nextBracketId")
  nextBracket?: KnockoutBracket;

  @BelongsTo(() => KnockoutBracket, "previousBracketAId")
  previousBracketA?: KnockoutBracket;

  @BelongsTo(() => KnockoutBracket, "previousBracketBId")
  previousBracketB?: KnockoutBracket;
}
