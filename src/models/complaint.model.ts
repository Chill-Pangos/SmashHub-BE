import {
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from "sequelize-typescript";
import User from "./user.model";
import Tournament from "./tournament.model";
import Match from "./match.model";

@Table({
  tableName: "complaints",
  timestamps: true,
})
export default class Complaint extends Model {
  @Column({
    type: DataType.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  })
  declare id: number;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: false,
  })
  declare createdBy: number;

  @ForeignKey(() => Tournament)
  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: false,
  })
  declare tournamentId: number;

  @ForeignKey(() => Match)
  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: true,
  })
  declare matchId: number;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  declare topic: string;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  declare description: string;

  @Column({
    type: DataType.ENUM(
      "submitted",
      "under_review",
      "escalated",
      "resolved",
      "rejected"
    ),
    allowNull: false,
    defaultValue: "submitted",
  })
  declare status:
    | "submitted"
    | "under_review"
    | "escalated"
    | "resolved"
    | "rejected";

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: true,
  })
  declare currentHandlerId: number;
}
