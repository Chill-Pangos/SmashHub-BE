// rolePermission.model.ts
import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from "sequelize-typescript";
import Role from "./role.model";
import Permission from "./permission.model";

@Table({
  tableName: "role_permissions",
  timestamps: true,
  indexes: [
    { fields: ["permissionId"] },
    { unique: true, fields: ["roleId", "permissionId"] },
  ],
})
export default class RolePermission extends Model {
  @ForeignKey(() => Role)
  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: false,
    primaryKey: true,
  })
  declare roleId: number;

  @ForeignKey(() => Permission)
  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: false,
    primaryKey: true,
  })
  declare permissionId: number;

  // ─── Associations ──────────────────────────────────────────────────────────

  @BelongsTo(() => Role, { foreignKey: "roleId" })
  declare role?: Role;

  @BelongsTo(() => Permission, { foreignKey: "permissionId" })
  declare permission?: Permission;
}