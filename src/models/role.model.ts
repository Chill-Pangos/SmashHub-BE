import {
  Table,
  Column,
  Model,
  DataType,
  BelongsToMany,
} from "sequelize-typescript";
import User from "./user.model";
import UserRole from "./userRole.model";
import Permission from "./permission.model";
import RolePermission from "./rolePermission.model";

@Table({
  tableName: "roles",
  timestamps: true,
})
export default class Role extends Model {
  @Column({
    type: DataType.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  })
  declare id: number;

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
    unique: true,
  })
  declare name: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare description?: string;

  @BelongsToMany(() => User, () => UserRole)
  users?: User[];

  @BelongsToMany(() => Permission, () => RolePermission)
  permissions?: Permission[];
}
