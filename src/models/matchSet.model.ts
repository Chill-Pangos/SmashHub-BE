import { DataTypes, Model, Optional } from "sequelize";
import db from "../config/database";
import { Match } from "./match.model";

interface MatchSetAttributes {
  id: number;
  matchId: number;
  setNumber: number;
  entryAScore: number;
  entryBScore: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface MatchSetCreationAttributes
  extends Optional<MatchSetAttributes, "id" | "createdAt" | "updatedAt"> {}

export class MatchSet
  extends Model<MatchSetAttributes, MatchSetCreationAttributes>
  implements MatchSetAttributes
{
  public id!: number;
  public matchId!: number;
  public setNumber!: number;
  public entryAScore!: number;
  public entryBScore!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

MatchSet.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    matchId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: Match,
        key: "id",
      },
    },
    setNumber: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    entryAScore: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
    },
    entryBScore: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    sequelize: db,
    tableName: "match_sets",
    timestamps: true,
  }
);
