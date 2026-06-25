// userRole.model.ts
import {
  Table,
  Column,
  Model,
  DataType,
} from "sequelize-typescript";

@Table({
  tableName: "user_roles",
  timestamps: true,
  indexes: [
    { fields: ["roleId"] },
    { unique: true, fields: ["userId", "roleId"] },
  ],
})
export default class UserRole extends Model {
  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: false,
    primaryKey: true,
  })
  declare userId: number;

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: false,
    primaryKey: true,
  })
  declare roleId: number;

  // ─── Associations ──────────────────────────────────────────────────────────

  declare user?: any;

  declare role?: any;
}
