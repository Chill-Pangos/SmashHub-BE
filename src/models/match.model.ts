import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  HasMany,
} from "sequelize-typescript";
import Schedule from "./schedule.model";
import User from "./user.model";
import MatchSet from "./matchSet.model";
import EloHistory from "./eloHistory.model";
import Entries from "./entry.model";

@Table({
  tableName: "matches",
  timestamps: true,
})
export default class Match extends Model {
  @Column({
    type: DataType.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  })
  declare id: number;

  @ForeignKey(() => Schedule)
  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: false,
  })
  declare scheduleId: number;

  @ForeignKey(() => Entries)
  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: false,
  })
  declare entryAId: number;

  @ForeignKey(() => Entries)
  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: false,
  })
  declare entryBId: number;

  @Column({
    type: DataType.ENUM("scheduled", "in_progress", "completed", "cancelled"),
    allowNull: false,
  })
  declare status: string;

  @ForeignKey(() => Entries)
  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: true,
  })
  declare winnerEntryId?: number;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: true,
  })
  declare umpire?: number;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: true,
  })
  declare assistantUmpire?: number;

  @Column({
    type: DataType.ENUM("pending", "approved", "rejected"),
    allowNull: true,
    comment: "Status of match result approval by chief referee",
  })
  declare resultStatus?: "pending" | "approved" | "rejected";

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    comment: "Review notes from chief referee",
  })
  declare reviewNotes?: string;

  @BelongsTo(() => Schedule, 'scheduleId')
  schedule?: Schedule;

  @BelongsTo(() => Entries, "entryAId")
  entryA?: Entries;

  @BelongsTo(() => Entries, "entryBId")
  entryB?: Entries;

  @BelongsTo(() => Entries, "winnerEntryId")
  winnerEntry?: Entries;

  @BelongsTo(() => User, "umpire")
  umpireUser?: User;

  @BelongsTo(() => User, "assistantUmpire")
  assistantUser?: User;

  @HasMany(() => EloHistory)
  eloHistories?: EloHistory[];
}
