// notification.model.ts
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

const TITLE_MAX_LENGTH = 100;
const MESSAGE_MAX_LENGTH = 500;

export const NOTIFICATION_TYPES = [
  // Entry / Team
  "join_request",
  "join_request_approved",
  "join_request_rejected",
  // Payment
  "payment_confirmed",
  "payment_rejected",
  "payment_refunded",
  // Match
  "match_scheduled",
  "match_starting_soon",
  "match_result",
  // Tournament
  "tournament_announcement",
  "referee_invitation",
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];
// ─── Model ────────────────────────────────────────────────────────────────────

@Table({
  tableName: "notifications",
  timestamps: true,
  indexes: [
    { fields: ["userId"] },
    { fields: ["type"] },
    { fields: ["isRead"] },
    { fields: ["userId", "isRead"] }, // unread count
    { fields: ["userId", "createdAt"] }, // chronological feed
    { fields: ["referenceId", "type"] }, // tìm notification theo entity
  ],
})
export default class Notification extends Model {
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
    comment: "Người nhận notification",
  })
  declare userId: number;

  @Column({
    type: DataType.ENUM(...NOTIFICATION_TYPES),
    allowNull: false,
  })
  declare type: NotificationType;

  @Column({
    type: DataType.STRING(TITLE_MAX_LENGTH),
    allowNull: false,
  })
  declare title: string;

  @Column({
    type: DataType.STRING(MESSAGE_MAX_LENGTH),
    allowNull: false,
  })
  declare message: string;

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: true,
    comment: "ID của entity liên quan (entryId, matchId, paymentId...)",
  })
  declare referenceId?: number;

  @Column({
    type: DataType.STRING(50),
    allowNull: true,
    comment: "Loại entity: entry, match, payment, tournament...",
  })
  declare referenceType?: string;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  declare isRead: boolean;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  declare readAt?: Date;

  // ─── Associations ──────────────────────────────────────────────────────────

  @BelongsTo(() => User, { foreignKey: "userId" })
  declare user?: User;

  // ─── Validators ────────────────────────────────────────────────────────────

  @BeforeValidate
  static validateTitle(instance: Notification): void {
    const title = instance.title?.trim();
    if (!title) throw new Error("Notification title is required");
    if (title.length > TITLE_MAX_LENGTH) {
      throw new Error(`Title must not exceed ${TITLE_MAX_LENGTH} characters`);
    }
  }

  @BeforeValidate
  static validateMessage(instance: Notification): void {
    const message = instance.message?.trim();
    if (!message) throw new Error("Notification message is required");
    if (message.length > MESSAGE_MAX_LENGTH) {
      throw new Error(
        `Message must not exceed ${MESSAGE_MAX_LENGTH} characters`,
      );
    }
  }

  @BeforeValidate
  static validateReadAt(instance: Notification): void {
    const { isRead, readAt } = instance;
    if (readAt && !isRead) {
      throw new Error("readAt can only be set when isRead is true");
    }
    if (isRead && !readAt) {
      throw new Error("readAt must be set when isRead is true");
    }
  }
}
