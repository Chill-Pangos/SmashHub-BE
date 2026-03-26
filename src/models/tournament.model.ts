import { Table, Column, Model, DataType, HasMany, ForeignKey } from "sequelize-typescript";
import TournamentCategory from "./tournamentCategory.model";
import User from "./user.model";
import TournamentReferee from "./tournamentReferee.model";
import TournamentEstimate from "./tournamentEstimate.model";
import TableStatus from "./tableStatus.model";

@Table({
  tableName: "tournaments",
  timestamps: true,
  indexes: [
    { fields: ["createdBy"] },
    { fields: ["startDate"] },
    { fields: ["tier"] },
    { fields: ["status", "startDate"] },
    { fields: ["registrationStartDate"] },
    { fields: ["registrationEndDate"] },
    { fields: ["bracketGenerationDate"] },
    { fields: ["tournamentStatus"] },
    { fields: ["tournamentStatus", "registrationEndDate", "bracketGenerationDate"] },
  ],
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
    type: DataType.INTEGER.UNSIGNED,
    allowNull: false,

  })
  declare tier: number;

  @Column({
    type: DataType.ENUM("upcoming", "ongoing", "completed"),
    allowNull: false,
    defaultValue: "upcoming",
  })
  declare status: string;

  @Column({
    type: DataType.ENUM("draft", "registration_open", "registration_closed", "brackets_generated", "ongoing", "completed", "cancelled"),
    allowNull: false,
    defaultValue: "draft",
  })
  declare tournamentStatus: "draft" | "registration_open" | "registration_closed" | "brackets_generated" | "ongoing" | "completed" | "cancelled";

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  declare registrationStartDate?: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  declare registrationEndDate?: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  declare bracketGenerationDate?: Date;

  @Column({
    type: DataType.DECIMAL(5, 2),
    allowNull: true,
  })
  declare estimatedDurationHours?: number;

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

  @HasMany(() => TournamentCategory)
  category?: TournamentCategory[];

  @HasMany(() => TournamentReferee)
  referees?: TournamentReferee[];

  @HasMany(() => TournamentEstimate)
  estimates?: TournamentEstimate[];

  @HasMany(() => TableStatus)
  tableStatus?: TableStatus[];
}
