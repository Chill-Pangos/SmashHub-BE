// token.model.ts
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

// ─── Constants ────────────────────────────────────────────────────────────────

export const TOKEN_TYPES = ["access", "refresh"] as const;
export type TokenType = (typeof TOKEN_TYPES)[number];

// ─── Model ────────────────────────────────────────────────────────────────────

@Table({
  tableName: "tokens",
  timestamps: true,
  indexes: [
    { fields: ["userId"] },
    { fields: ["expiresAt"] },
    { fields: ["type"] },
    { fields: ["userId", "type"] },
    { fields: ["isBlacklisted", "expiresAt"] },
    { unique: true, fields: ["token"] }, // token phải là duy nhất
  ],
})
export default class Token extends Model {
  @Column({
    type: DataType.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  })
  declare id: number;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: false,
  })
  declare userId: number;

  @Column({
    type: DataType.ENUM(...TOKEN_TYPES),
    allowNull: false,
  })
  declare type: TokenType;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  declare token: string;

  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  declare expiresAt: Date;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  declare isBlacklisted: boolean;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  declare blacklistedAt?: Date;

  // ─── Associations ──────────────────────────────────────────────────────────

  @BelongsTo(() => User, { foreignKey: "userId" })
  declare user?: User;

  // ─── Validators ────────────────────────────────────────────────────────────

  @BeforeValidate
  static validateToken(instance: Token): void {
    if (instance.token === undefined) return;

    if (!instance.token?.trim()) {
      throw new Error("Token value is required");
    }
  }

  @BeforeValidate
  static validateExpiresAt(instance: Token): void {
    const { expiresAt } = instance;

    if (expiresAt === undefined) return;

    if (!expiresAt) {
      throw new Error("Expiry time is required");
    }
    if (new Date(expiresAt) <= new Date()) {
      throw new Error("Expiry time must be in the future");
    }
  }

  @BeforeValidate
  static validateBlacklistedAt(instance: Token): void {
    if (instance.isBlacklisted === undefined && instance.blacklistedAt === undefined) return;

    const { isBlacklisted, blacklistedAt } = instance;

    if (blacklistedAt != null && !isBlacklisted) {
      throw new Error("blacklistedAt can only be set when isBlacklisted is true");
    }
    if (isBlacklisted && blacklistedAt == null) {
      throw new Error("blacklistedAt must be set when isBlacklisted is true");
    }
  }
}