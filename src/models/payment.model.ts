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

// ─── Constants ────────────────────────────────────────────────────────────────

const PROOF_IMAGE_URL_MAX_LENGTH = 500;
const TRANSACTION_REF_MAX_LENGTH = 100;

export const PAYMENT_METHODS = [
  "cash",
  "bank_transfer",
  "online",
] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_STATUSES = [
  "pending",
  "completed",
  "failed",
  "refunded",
] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

// ─── Model ────────────────────────────────────────────────────────────────────

@Table({
  tableName: "payments",
  timestamps: true,
  indexes: [
    { fields: ["entryId"] },
    { fields: ["status"] },
    { fields: ["method"] },
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
    type: DataType.ENUM(...PAYMENT_METHODS),
    allowNull: false,
  })
  declare method: PaymentMethod;

  @Column({
    type: DataType.ENUM(...PAYMENT_STATUSES),
    allowNull: false,
    defaultValue: "pending" satisfies PaymentStatus,
  })
  declare status: PaymentStatus;

  @Column({
    type: DataType.STRING(PROOF_IMAGE_URL_MAX_LENGTH),
    allowNull: true,
    comment: "Required for bank_transfer method",
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
    type: DataType.STRING(TRANSACTION_REF_MAX_LENGTH),
    allowNull: true,
    comment: "Transaction reference for online payments (Stripe/VNPay)",
  })
  declare transactionRef?: string;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  declare refundedAt?: Date;

  // ─── Associations ──────────────────────────────────────────────────────────

  @BelongsTo(() => Entry, { foreignKey: "entryId" })
  declare entry?: Entry;

  @BelongsTo(() => User, { foreignKey: "confirmedBy" })
  declare confirmer?: User;

  // ─── Validators ────────────────────────────────────────────────────────────

  @BeforeValidate
  static validateAmount(instance: Payment): void {
    if (instance.amount === undefined) return;

    if (instance.amount <= 0) {
      throw new Error("Payment amount must be greater than 0");
    }
  }

  @BeforeValidate
  static validateProofImage(instance: Payment): void {
    if (instance.method === undefined && instance.proofImageUrl === undefined && instance.status === undefined) return;

    const { method, proofImageUrl, status } = instance;

    if (method === "bank_transfer" && status === "completed" && !proofImageUrl) {
      throw new Error("Proof image is required for completed bank transfer payments");
    }
    if (method !== "bank_transfer" && proofImageUrl) {
      throw new Error("Proof image is only applicable for bank transfer payments");
    }
    if (proofImageUrl && proofImageUrl.length > PROOF_IMAGE_URL_MAX_LENGTH) {
      throw new Error(`Proof image URL must not exceed ${PROOF_IMAGE_URL_MAX_LENGTH} characters`);
    }
  }

  @BeforeValidate
  static validateTransactionRef(instance: Payment): void {
    if (instance.method === undefined && instance.transactionRef === undefined && instance.status === undefined) return;

    const { method, transactionRef } = instance;

    if (transactionRef && method !== "online") {
      throw new Error("Transaction reference is only applicable for online payments");
    }
    if (method === "online" && instance.status === "completed" && !transactionRef) {
      throw new Error("Transaction reference is required for completed online payments");
    }
  }

  @BeforeValidate
  static validateConfirmedAt(instance: Payment): void {
    if (instance.confirmedAt === undefined && instance.confirmedBy === undefined && instance.status === undefined) return;

    const { confirmedAt, confirmedBy, status } = instance;

    if (confirmedAt && status !== "completed") {
      throw new Error("confirmedAt can only be set when status is completed");
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
    if (instance.refundedAt === undefined && instance.status === undefined) return;

    const { refundedAt, status } = instance;

    if (refundedAt && status !== "refunded") {
      throw new Error("refundedAt can only be set when status is refunded");
    }
    if (status === "refunded" && !refundedAt) {
      throw new Error("refundedAt must be set when status is refunded");
    }
  }

  @BeforeValidate
  static validateManualConfirmation(instance: Payment): void {
    if (instance.method === undefined && instance.confirmedBy === undefined) return;

    const { method, confirmedBy } = instance;

    // Online payments được xác nhận qua webhook, không cần confirmedBy
    if (method === "online" && confirmedBy) {
      throw new Error("Online payments are confirmed automatically, not manually");
    }
  }
}