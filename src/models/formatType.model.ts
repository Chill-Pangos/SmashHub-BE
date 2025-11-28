import { DataTypes, Model, Optional } from "sequelize";
import db from "../config/database";

interface FormatTypeAttributes {
  id: number;
  typeName: string;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface FormatTypeCreationAttributes
  extends Optional<FormatTypeAttributes, "id" | "createdAt" | "updatedAt"> {}

export class FormatType
  extends Model<FormatTypeAttributes, FormatTypeCreationAttributes>
  implements FormatTypeAttributes
{
  public id!: number;
  public typeName!: string;
  public description?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

FormatType.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    typeName: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize: db,
    tableName: "format_types",
    timestamps: true,
  }
);
