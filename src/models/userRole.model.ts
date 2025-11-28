import { DataTypes, Model, Optional } from "sequelize";
import { User } from "./user.model";
import { Role } from "./role.model";
import db from "../config/database";

interface UserRoleAttributes {
  id: number;
  userId: number;
  roleId: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface UserRoleCreationAttributes
  extends Optional<UserRoleAttributes, "id" | "createdAt" | "updatedAt"> {}

export class UserRole
  extends Model<UserRoleAttributes, UserRoleCreationAttributes>
  implements UserRoleAttributes
{
  public id!: number;
  public userId!: number;
  public roleId!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

UserRole.init(
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
        model: User,
        key: "id",
      },
    },
    roleId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: Role,
        key: "id",
      },
    },
  },
  {
    sequelize: db,
    tableName: "user_roles",
    timestamps: true,
  }
);
