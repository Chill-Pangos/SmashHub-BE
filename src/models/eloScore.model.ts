import { DataTypes, Model, Optional } from "sequelize";
import db from "../config/database";

interface EloScoreAttributes {
  id: number;
  userId: number;
  score: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface EloScoreCreationAttributes
  extends Optional<EloScoreAttributes, "id" | "createdAt" | "updatedAt"> {}
export class EloScore
  extends Model<EloScoreAttributes, EloScoreCreationAttributes>
  implements EloScoreAttributes
{
  public id!: number;
  public userId!: number;
  public score!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

EloScore.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
    score: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1000,
    },
  },
  {
    sequelize: db,
    tableName: "elo_scores",
    timestamps: true,
  }
);
