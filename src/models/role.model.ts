// role.model.ts
import {
  Table,
  Column,
  Model,
  DataType,
  BelongsToMany,
  BeforeValidate,
} from "sequelize-typescript";
import User from "./user.model";
import UserRole from "./userRole.model";
import Permission from "./permission.model";
import RolePermission from "./rolePermission.model";

// ─── Constants ────────────────────────────────────────────────────────────────

export const SYSTEM_ROLES = ["admin", "user", "referee", "chief_referee", "organizer"] as const;
export type SystemRole = (typeof SYSTEM_ROLES)[number];

// Các role có thể tồn tại đồng thời trên 1 user
// VD: user có thể đồng thời là referee, nhưng không thể vừa là admin vừa là user
export const COMPATIBLE_ROLES: Partial<Record<SystemRole, SystemRole[]>> = {
  user: ["referee", "chief_referee", "organizer"],
  referee: ["user", "chief_referee"],
  chief_referee: ["user", "referee"],
  organizer: ["user"],
};

const NAME_MAX_LENGTH = 50;
const DESCRIPTION_MAX_LENGTH = 500;

// ─── Model ────────────────────────────────────────────────────────────────────

@Table({
  tableName: "roles",
  timestamps: true,
  indexes: [
    { unique: true, fields: ["name"] },
  ],
})
export default class Role extends Model {
  @Column({
    type: DataType.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  })
  declare id: number;

  @Column({
    type: DataType.STRING(NAME_MAX_LENGTH),
    allowNull: false,
    unique: true,
  })
  declare name: string;

  @Column({
    type: DataType.STRING(DESCRIPTION_MAX_LENGTH),
    allowNull: true,
  })
  declare description?: string;

  // ─── Associations ──────────────────────────────────────────────────────────

  @BelongsToMany(() => User, () => UserRole)
  declare users?: User[];

  @BelongsToMany(() => Permission, () => RolePermission)
  declare permissions?: Permission[];

  // ─── Validators ────────────────────────────────────────────────────────────

  @BeforeValidate
  static validateName(instance: Role): void {
    const name = instance.name?.trim();

    if (!name) {
      throw new Error("Role name is required");
    }
    if (name.length > NAME_MAX_LENGTH) {
      throw new Error(`Role name must not exceed ${NAME_MAX_LENGTH} characters`);
    }
    if (!/^[a-zA-Z0-9_]+$/.test(name)) {
      throw new Error(
        "Role name can only contain letters, numbers, and underscores"
      );
    }
  }

  @BeforeValidate
  static validateDescription(instance: Role): void {
    const { description } = instance;

    if (description == null) return;

    if (description.trim().length === 0) {
      throw new Error("Description must not be empty or whitespace only");
    }
    if (description.length > DESCRIPTION_MAX_LENGTH) {
      throw new Error(
        `Description must not exceed ${DESCRIPTION_MAX_LENGTH} characters`
      );
    }
  }
}