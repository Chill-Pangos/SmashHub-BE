// otp.model.ts
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

const OTP_CODE_LENGTH = 6;

export const OTP_TYPES = ["password_reset", "email_verification"] as const;
export type OtpType = (typeof OTP_TYPES)[number];

// ─── Model ────────────────────────────────────────────────────────────────────

@Table({
  tableName: "otps",
  timestamps: true,
  indexes: [
    { fields: ["expiresAt"] },
    { fields: ["userId", "type", "isUsed"] },
  ],
})
export default class Otp extends Model {
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
    type: DataType.STRING(OTP_CODE_LENGTH),
    allowNull: false,
  })
  declare code: string;

  @Column({
    type: DataType.ENUM(...OTP_TYPES),
    allowNull: false,
  })
  declare type: OtpType;

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
  declare isUsed: boolean;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  declare usedAt?: Date;

  // ─── Associations ──────────────────────────────────────────────────────────

  @BelongsTo(() => User, { foreignKey: "userId" })
  declare user?: User;

  // ─── Validators ────────────────────────────────────────────────────────────

  @BeforeValidate
  static validateCode(instance: Otp): void {
    const { code } = instance;

    if (!code) {
      throw new Error("OTP code is required");
    }
    if (!/^\d+$/.test(code)) {
      throw new Error("OTP code must contain only digits");
    }
    if (code.length !== OTP_CODE_LENGTH) {
      throw new Error(`OTP code must be exactly ${OTP_CODE_LENGTH} digits`);
    }
  }

  @BeforeValidate
  static validateExpiresAt(instance: Otp): void {
    const { expiresAt } = instance;

    if (!expiresAt) {
      throw new Error("Expiry time is required");
    }

    if (new Date(expiresAt) <= new Date()) {
      throw new Error("Expiry time must be in the future");
    }
  }

  @BeforeValidate
  static validateUsedAt(instance: Otp): void {
    const { isUsed, usedAt } = instance;

    if (usedAt != null && !isUsed) {
      throw new Error("usedAt can only be set when isUsed is true");
    }
    if (isUsed && usedAt == null) {
      throw new Error("usedAt must be set when isUsed is true");
    }
  }
}