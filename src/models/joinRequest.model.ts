// joinRequest.model.ts
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

export const JOIN_REQUEST_STATUSES = [
  "pending",
  "approved",
  "rejected",
] as const;
export type JoinRequestStatus = (typeof JOIN_REQUEST_STATUSES)[number];

const REJECTION_REASON_MAX_LENGTH = 255;

// ─── Model ────────────────────────────────────────────────────────────────────

@Table({
  tableName: "join_requests",
  timestamps: true,
  indexes: [
    { fields: ["entryId"] },
    { fields: ["userId"] },
    { fields: ["status"] },
    { fields: ["entryId", "status"] },
    {
      unique: true,
      fields: ["entryId", "userId"], // 1 user chỉ có 1 request pending cho 1 entry
    },
  ],
})
export default class JoinRequest extends Model {
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

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: false,
    comment: "User requesting to join",
  })
  declare userId: number;

  @Column({
    type: DataType.ENUM(...JOIN_REQUEST_STATUSES),
    allowNull: false,
    defaultValue: "pending" satisfies JoinRequestStatus,
  })
  declare status: JoinRequestStatus;

  @Column({
    type: DataType.STRING(REJECTION_REASON_MAX_LENGTH),
    allowNull: true,
    comment: "Optional reason when captain rejects",
  })
  declare rejectionReason?: string;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    comment: "When captain approved or rejected",
  })
  declare respondedAt?: Date;

  // ─── Associations ──────────────────────────────────────────────────────────

  @BelongsTo(() => Entry, { foreignKey: "entryId" })
  declare entry?: Entry;

  @BelongsTo(() => User, { foreignKey: "userId" })
  declare user?: User;

  // ─── Validators ────────────────────────────────────────────────────────────

  @BeforeValidate
  static validateRejectionReason(instance: JoinRequest): void {
    const { rejectionReason, status } = instance;

    if (rejectionReason == null) return;

    if (status !== "rejected") {
      throw new Error("Rejection reason can only be set when status is rejected");
    }
    if (rejectionReason.trim().length === 0) {
      throw new Error("Rejection reason must not be empty or whitespace only");
    }
    if (rejectionReason.length > REJECTION_REASON_MAX_LENGTH) {
      throw new Error(
        `Rejection reason must not exceed ${REJECTION_REASON_MAX_LENGTH} characters`
      );
    }
  }

  @BeforeValidate
  static validateRespondedAt(instance: JoinRequest): void {
    const { respondedAt, status } = instance;

    if (respondedAt == null) return;

    if (status === "pending") {
      throw new Error("respondedAt cannot be set when status is pending");
    }
  }
}