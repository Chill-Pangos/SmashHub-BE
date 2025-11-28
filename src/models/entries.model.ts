import { DataTypes, Model, Optional } from "sequelize";
import db from "../config/database";

interface EntriesAttributes {
  id: number;
  contentId: number;
  name: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface EntriesCreationAttributes
  extends Optional<EntriesAttributes, "id" | "createdAt" | "updatedAt"> {}

export class Entries
  extends Model<EntriesAttributes, EntriesCreationAttributes>
  implements EntriesAttributes
{
  public id!: number;
  public contentId!: number;
  public name!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Entries.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    contentId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: "tournament_contents",
        key: "id",
      },
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
  },
  {
    sequelize: db,
    tableName: "entries",
    timestamps: true,
  }
);
