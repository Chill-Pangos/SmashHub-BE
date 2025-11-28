import { DataTypes, Model, Optional } from "sequelize";
import db from "../config/database";

interface MatchFormatAttributes {
  id: number;
  numberOfSingles: number;
  numberOfDoubles: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface MatchFormatCreationAttributes
  extends Optional<MatchFormatAttributes, "id" | "createdAt" | "updatedAt"> {}

export class MatchFormat
  extends Model<MatchFormatAttributes, MatchFormatCreationAttributes>
  implements MatchFormatAttributes
{
  public id!: number;
  public numberOfSingles!: number;
  public numberOfDoubles!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

MatchFormat.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    numberOfSingles: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    numberOfDoubles: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
  },
  {
    sequelize: db,
    tableName: "match_formats",
    timestamps: true,
  }
);
