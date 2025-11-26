import { Model, DataTypes, Optional } from "sequelize";
import { Role } from "./role.model";
import db from "../config/database";
import { Permission } from "./permisison.model";

interface RolePermissionAttributes {
  id: number;
  roleId: number;
  permissionId: number;
  createdAt?: Date;
  updateAt?: Date;
}

interface RolePermissionCreationAttributes
  extends Optional<RolePermissionAttributes, "id" | "createdAt" | "updateAt"> {}

export class RolePermission
  extends Model<RolePermissionAttributes, RolePermissionCreationAttributes>
  implements RolePermissionAttributes
{
  public id!: number;
  public roleId!: number;
  public permissionId!: number;
  public readonly createdAt!: Date;
  public readonly updateAt!: Date;
}

RolePermission.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    roleId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: Role,
        key: "id",
      },
    },
    permissionId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: Permission,
        key: "id",
      },
    },
  },
  {
    sequelize: db,
    tableName: "role_permissions",
    timestamps: true,
  }
);
