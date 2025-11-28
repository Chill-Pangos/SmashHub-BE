import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from "sequelize-typescript";
import Role from "./role.model";
import Permission from "./permisison.model";

@Table({
  tableName: "role_permissions",
  timestamps: true,
})
export default class RolePermission extends Model {
  @Column({
    type: DataType.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  })
  declare id: number;

  @ForeignKey(() => Role)
  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: false,
  })
  declare roleId: number;

  @ForeignKey(() => Permission)
  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: false,
  })
  declare permissionId: number;

  @BelongsTo(() => Role)
  role?: Role;

  @BelongsTo(() => Permission)
  permission?: Permission;
}
