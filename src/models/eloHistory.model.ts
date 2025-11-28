import { DataTypes, Model, Optional } from "sequelize";
import db from "../config/database";

interface EloHistoryAttributes {
  id: number;
  matchId: number;
  userId: number;
  previousElo: number;
  newElo: number;
  changeReason: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface EloHistoryCreationAttributes
  extends Optional<EloHistoryAttributes, "id" | "createdAt" | "updatedAt"> {}

export class EloHistory
  extends Model<EloHistoryAttributes, EloHistoryCreationAttributes>
  implements EloHistoryAttributes
{
  public id!: number;
  public matchId!: number;
  public userId!: number;
  public previousElo!: number;
  public newElo!: number;
  public changeReason!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

EloHistory.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    matchId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    previousElo: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    newElo: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    changeReason: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
  },
  {
    sequelize: db,
    tableName: "elo_histories",
    timestamps: true,
  }
);
