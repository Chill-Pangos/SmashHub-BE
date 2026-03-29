// userRole.model.ts
import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  BeforeValidate,
} from "sequelize-typescript";
import User from "./user.model";
import Role from "./role.model";
import { SYSTEM_ROLES, COMPATIBLE_ROLES, type SystemRole } from "./role.model";

@Table({
  tableName: "user_roles",
  timestamps: true,
  indexes: [
    { fields: ["roleId"] },
    { unique: true, fields: ["userId", "roleId"] },
  ],
})
export default class UserRole extends Model {
  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: false,
    primaryKey: true,
  })
  declare userId: number;

  @ForeignKey(() => Role)
  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: false,
    primaryKey: true,
  })
  declare roleId: number;

  // ─── Associations ──────────────────────────────────────────────────────────

  @BelongsTo(() => User, { foreignKey: "userId" })
  declare user?: User;

  @BelongsTo(() => Role, { foreignKey: "roleId" })
  declare role?: Role;
}