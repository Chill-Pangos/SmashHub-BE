import { DataTypes, Model, Optional } from "sequelize";
import db from "../config/database";

interface RoleAttributes {
  id: number;
  name: string;
  createdAt?: Date;
  updateAt?: Date;
}

interface RoleCreationAttributes
  extends Optional<RoleAttributes, "id" | "createdAt" | "updateAt"> {}

export class Role
  extends Model<RoleAttributes, RoleCreationAttributes>
  implements RoleAttributes
{
  public id!: number;
  public name!: string;
  public readonly createdAt!: Date;
  public readonly updateAt!: Date;
}

Role.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
  },
  {
    sequelize: db,
    tableName: "roles",
    timestamps: true,
  }
);
