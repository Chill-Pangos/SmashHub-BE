import { DataTypes, Model, Optional } from "sequelize";
import db from "../config/database";

interface MatchAttributes {
  id: number;
  scheduleId: number;
  entryAId: number;
  entryBId: number;
  status: string;
  winnerEntryId?: number;
  umpire?: number;
  assistantUmpire?: number;
  coachAId?: number;
  coachBId?: number;
  isConfirmedByWinner?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface MatchCreationAttributes
  extends Optional<
    MatchAttributes,
    | "id"
    | "createdAt"
    | "updatedAt"
    | "winnerEntryId"
    | "umpire"
    | "assistantUmpire"
    | "coachAId"
    | "coachBId"
    | "isConfirmedByWinner"
  > {}

export class Match
  extends Model<MatchAttributes, MatchCreationAttributes>
  implements MatchAttributes
{
  public id!: number;
  public scheduleId!: number;
  public entryAId!: number;
  public entryBId!: number;
  public status!: string;
  public winnerEntryId?: number;
  public umpire?: number;
  public assistantUmpire?: number;
  public coachAId?: number;
  public coachBId?: number;
  public isConfirmedByWinner?: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Match.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    scheduleId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: "schedules",
        key: "id",
      },
    },
    entryAId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: "tournament_entries",
        key: "id",
      },
    },
    entryBId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: "tournament_entries",
        key: "id",
      },
    },
    status: {
      type: DataTypes.ENUM(
        "scheduled",
        "in_progress",
        "completed",
        "cancelled"
      ),
      allowNull: false,
    },
    winnerEntryId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: {
        model: "tournament_entries",
        key: "id",
      },
    },
    umpire: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: {
        model: "users",
        key: "id",
      },
    },
    assistantUmpire: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: {
        model: "users",
        key: "id",
      },
    },
    coachAId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: {
        model: "users",
        key: "id",
      },
    },
    coachBId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: {
        model: "users",
        key: "id",
      },
    },
    isConfirmedByWinner: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
  },
  {
    sequelize: db,
    tableName: "matches",
    timestamps: true,
  }
);
