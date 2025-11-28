import { DataTypes, Model, Optional } from "sequelize";
import db from "../config/database";

interface PermissionAttributes {
  id: number;
  name: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface PermissionCreationAttributes
  extends Optional<PermissionAttributes, "id" | "createdAt" | "updatedAt"> {}

export class Permission
  extends Model<PermissionAttributes, PermissionCreationAttributes>
  implements PermissionAttributes
{
  public id!: number;
  public name!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Permission.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
  },
  {
    sequelize: db,
    tableName: "permissions",
    timestamps: true,
  }
);
