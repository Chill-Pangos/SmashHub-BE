// refereeInvitation.model.ts
import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  BeforeValidate,
} from "sequelize-typescript";
import Tournament from "./tournament.model";
import User from "./user.model";
import { REFEREE_ROLES, RefereeRole } from "./tournamentReferee.model";

// ─── Constants ────────────────────────────────────────────────────────────────

const REJECTION_REASON_MAX_LENGTH = 255;
export const INVITATION_EXPIRY_HOURS = 48;

export const INVITATION_STATUSES = [
  "pending",
  "accepted",
  "rejected",
  "cancelled",
  "expired",
] as const;
export type InvitationStatus = (typeof INVITATION_STATUSES)[number];

// ─── Model ────────────────────────────────────────────────────────────────────

@Table({
  tableName: "referee_invitations",
  timestamps: true,
  indexes: [
    { fields: ["tournamentId"] },
    { fields: ["refereeId"] },
    { fields: ["invitedBy"] },
    { fields: ["status"] },
    { fields: ["expiresAt"] },
    { fields: ["tournamentId", "refereeId", "status"] },
    {
      // 1 referee chỉ có 1 pending/accepted invitation per tournament
      unique: true,
      fields: ["tournamentId", "refereeId"],
    },
  ],
})
export default class RefereeInvitation extends Model {
  @Column({
    type: DataType.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  })
  declare id: number;

  @ForeignKey(() => Tournament)
  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: false,
  })
  declare tournamentId: number;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: false,
    comment: "Referee được mời",
  })
  declare refereeId: number;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: false,
    comment: "Organizer gửi lời mời",
  })
  declare invitedBy: number;

  @Column({
    type: DataType.ENUM(...REFEREE_ROLES),
    allowNull: false,
    defaultValue: "referee" satisfies RefereeRole,
  })
  declare role: RefereeRole;

  @Column({
    type: DataType.ENUM(...INVITATION_STATUSES),
    allowNull: false,
    defaultValue: "pending" satisfies InvitationStatus,
  })
  declare status: InvitationStatus;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    comment: "Thời hạn phản hồi",
  })
  declare expiresAt: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    comment: "Khi referee accept/reject hoặc organizer cancel",
  })
  declare respondedAt?: Date;

  @Column({
    type: DataType.STRING(REJECTION_REASON_MAX_LENGTH),
    allowNull: true,
    comment: "Lý do từ chối (optional)",
  })
  declare rejectionReason?: string;

  // ─── Associations ──────────────────────────────────────────────────────────

  @BelongsTo(() => Tournament, { foreignKey: "tournamentId" })
  declare tournament?: Tournament;

  @BelongsTo(() => User, { foreignKey: "refereeId" })
  declare referee?: User;

  @BelongsTo(() => User, { foreignKey: "invitedBy" })
  declare inviter?: User;

  // ─── Validators ────────────────────────────────────────────────────────────

  @BeforeValidate
  static validateExpiresAt(instance: RefereeInvitation): void {
    if (!instance.expiresAt) {
      throw new Error("Expiry time is required");
    }
    if (instance.isNewRecord && new Date(instance.expiresAt) <= new Date()) {
      throw new Error("Expiry time must be in the future");
    }
  }

  @BeforeValidate
  static validateRejectionReason(instance: RefereeInvitation): void {
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
  static validateRespondedAt(instance: RefereeInvitation): void {
    const { respondedAt, status } = instance;

    if (respondedAt == null) return;

    if (status === "pending") {
      throw new Error("respondedAt cannot be set when status is pending");
    }
  }
}