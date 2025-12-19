import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  HasMany,
  HasOne,
} from "sequelize-typescript";
import Tournament from "./tournament.model";
import FormatType from "./formatType.model";
import Entries from "./entries.model";
import Schedule from "./schedule.model";
import ContentRule from "./contentRule.model";

@Table({
  tableName: "tournament_contents",
  timestamps: true,
})
export default class TournamentContent extends Model {
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

  @ForeignKey(() => FormatType)
  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: false,
  })
  declare formatTypeId: number;

  @BelongsTo(() => Tournament)
  tournament?: Tournament;

  @BelongsTo(() => FormatType)
  formatType?: FormatType;

  @HasMany(() => Entries)
  entries?: Entries[];

  @HasMany(() => Schedule)
  schedules?: Schedule[];

  @HasOne(() => ContentRule)
  contentRule?: ContentRule;
}
