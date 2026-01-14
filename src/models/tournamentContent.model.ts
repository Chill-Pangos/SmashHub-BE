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
import Entries from "./entries.model";
import Schedule from "./schedule.model";

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

  @Column({
    type: DataType.ENUM('single', 'team', 'double'),
    allowNull: false,
  })
  declare type: 'single' | 'team' | 'double';

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: false,
  })
  declare maxEntries: number;

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: false,
  })
  declare maxSets: number;

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: true,
  })
  declare numberOfSingles: number;

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: true,
  })
  declare numberOfDoubles: number;

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: true,
  })
  declare minAge: number;

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: true,
  })
  declare maxAge: number;

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: true,
  })
  declare minElo: number;

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: true,
  })
  declare maxElo: number;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
  })
  declare racketCheck: boolean;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: true,
  })
  declare isGroupStage?: boolean;

  @BelongsTo(() => Tournament)
  tournament?: Tournament;

  @HasMany(() => Entries)
  entries?: Entries[];

  @HasMany(() => Schedule)
  schedules?: Schedule[];
}
