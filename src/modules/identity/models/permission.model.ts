// permission.model.ts
import {
  Table,
  Column,
  Model,
  DataType,
  BeforeValidate,
} from "sequelize-typescript";

// ─── Constants ────────────────────────────────────────────────────────────────

const NAME_MAX_LENGTH = 100;
// Format: resource:action — VD: "match:read", "tournament:create"
const NAME_REGEX = /^[a-z0-9_]+:[a-z0-9_]+$/;

// ─── Model ────────────────────────────────────────────────────────────────────

@Table({
  tableName: "permissions",
  timestamps: true,
  indexes: [
    { unique: true, fields: ["name"] },
  ],
})
export default class Permission extends Model {
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

  // ─── Associations ──────────────────────────────────────────────────────────

  declare roles?: any[];

  // ─── Validators ────────────────────────────────────────────────────────────

  @BeforeValidate
  static validateName(instance: Permission): void {
    if (instance.name === undefined) return;

    const name = instance.name?.trim();

    if (!name) {
      throw new Error("Permission name is required");
    }
    if (name.length > NAME_MAX_LENGTH) {
      throw new Error(
        `Permission name must not exceed ${NAME_MAX_LENGTH} characters`
      );
    }
    if (!NAME_REGEX.test(name)) {
      throw new Error(
        "Permission name must follow the format 'resource:action' (e.g. 'match:read')"
      );
    }
  }
}
