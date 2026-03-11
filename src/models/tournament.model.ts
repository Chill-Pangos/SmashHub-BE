import { Table, Column, Model, DataType, HasMany, ForeignKey, BelongsTo } from "sequelize-typescript";
import TournamentContent from "./tournamentContent.model";
import Complaint from "./complaint.model";
import User from "./user.model";
import TournamentReferee from "./tournamentReferee.model";

@Table({
  tableName: "tournaments",
  timestamps: true,
})
export default class Tournament extends Model {
  @Column({
    type: DataType.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  })
  declare id: number;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
    unique: true,
  })
  declare name: string;

  @Column({
    type: DataType.ENUM("upcoming", "ongoing", "completed"),
    allowNull: false,
    defaultValue: "upcoming",
  })
  declare status: string;

  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  declare startDate: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  declare endDate?: Date;

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
  })
  declare location: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: false,
  })
  declare createdBy: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 1,
  })
  declare numberOfTables: number;

  @HasMany(() => TournamentContent)
  contents?: TournamentContent[];

  @HasMany(() => Complaint)
  complaints?: Complaint[];

  @HasMany(() => TournamentReferee)
  referees?: TournamentReferee[];
}
