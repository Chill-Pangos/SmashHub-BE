// rolePermission.model.ts
import {
  Table,
  Column,
  Model,
  DataType,
} from "sequelize-typescript";

@Table({
  tableName: "role_permissions",
  timestamps: true,
  indexes: [
    { fields: ["permissionId"] },
    { unique: true, fields: ["roleId", "permissionId"] },
  ],
})
export default class RolePermission extends Model {
  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: false,
    primaryKey: true,
  })
  declare roleId: number;

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: false,
    primaryKey: true,
  })
  declare permissionId: number;

  // ─── Associations ──────────────────────────────────────────────────────────

  declare role?: any;

  declare permission?: any;
}
