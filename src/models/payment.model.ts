// payment.model.ts
import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  BeforeValidate,
} from "sequelize-typescript";
import Entry from "./entry.model";
import User from "./user.model";

const PROOF_IMAGE_URL_MAX_LENGTH = 500;

export const PAYMENT_STATUSES = [
  "pending",
  "completed",
  "failed",
  "refunded",
] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

@Table({
  tableName: "payments",
  timestamps: true,
  indexes: [
    { fields: ["entryId"] },
    { fields: ["status"] },
    { fields: ["confirmedBy"] },
    { fields: ["entryId", "status"] },
  ],
})
export default class Payment extends Model {
  @Column({
    type: DataType.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  })
  declare id: number;

  @ForeignKey(() => Entry)
  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: false,
  })
  declare entryId: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
  })
  declare amount: number;

  @Column({
    type: DataType.ENUM(...PAYMENT_STATUSES),
    allowNull: false,
    defaultValue: "pending" satisfies PaymentStatus,
  })
  declare status: PaymentStatus;

  @Column({
    type: DataType.STRING(PROOF_IMAGE_URL_MAX_LENGTH),
    allowNull: true,
    comment: "Required before payment confirmation",
  })
  declare proofImageUrl?: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: true,
    comment: "Tournament organizer who confirmed the payment",
  })
  declare confirmedBy?: number;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  declare confirmedAt?: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  declare refundedAt?: Date;

  @Column({
    type: DataType.STRING(PROOF_IMAGE_URL_MAX_LENGTH),
    allowNull: true,
    comment: "Required before payment refund",
  })
  declare refundProofImageUrl?: string;

  @BelongsTo(() => Entry, { foreignKey: "entryId" })
  declare entry?: Entry;

  @BelongsTo(() => User, { foreignKey: "confirmedBy" })
  declare confirmer?: User;

  @BeforeValidate
  static validateAmount(instance: Payment): void {
    if (instance.amount === undefined) return;

    if (instance.amount <= 0) {
      throw new Error("Payment amount must be greater than 0");
    }
  }

  @BeforeValidate
  static validateProofImage(instance: Payment): void {
    if (instance.proofImageUrl === undefined && instance.status === undefined) return;

    const { proofImageUrl, status } = instance;

    if (status === "completed" && !proofImageUrl) {
      throw new Error("Proof image is required for completed payments");
    }
    if (proofImageUrl && proofImageUrl.length > PROOF_IMAGE_URL_MAX_LENGTH) {
      throw new Error(`Proof image URL must not exceed ${PROOF_IMAGE_URL_MAX_LENGTH} characters`);
    }
  }

  @BeforeValidate
  static validateConfirmedAt(instance: Payment): void {
    if (instance.confirmedAt === undefined && instance.confirmedBy === undefined && instance.status === undefined) return;

    const { confirmedAt, confirmedBy, status } = instance;

    if (confirmedAt && !["completed", "refunded"].includes(status)) {
      throw new Error("confirmedAt can only be set when status is completed or refunded");
    }
    if (confirmedAt && !confirmedBy) {
      throw new Error("confirmedBy must be set when confirmedAt is set");
    }
    if (confirmedBy && !confirmedAt) {
      throw new Error("confirmedAt must be set when confirmedBy is set");
    }
  }

  @BeforeValidate
  static validateRefundedAt(instance: Payment): void {
    if (instance.refundedAt === undefined && instance.refundProofImageUrl === undefined && instance.status === undefined) return;

    const { refundedAt, refundProofImageUrl, status } = instance;

    if (refundedAt && status !== "refunded") {
      throw new Error("refundedAt can only be set when status is refunded");
    }
    if (status === "refunded" && !refundedAt) {
      throw new Error("refundedAt must be set when status is refunded");
    }
    if (status === "refunded" && !refundProofImageUrl) {
      throw new Error("Refund proof image is required when status is refunded");
    }
    if (refundProofImageUrl && refundProofImageUrl.length > PROOF_IMAGE_URL_MAX_LENGTH) {
      throw new Error(`Refund proof image URL must not exceed ${PROOF_IMAGE_URL_MAX_LENGTH} characters`);
    }
  }
}
