// tournamentReferee.service.ts
import { Op } from "sequelize";
import { sequelize } from "../config/database";
import TournamentReferee, { RefereeRole } from "../models/tournamentReferee.model";
import RefereeInvitation, {
  INVITATION_EXPIRY_HOURS,
} from "../models/refereeInvitation.model";
import Tournament from "../models/tournament.model";
import User from "../models/user.model";
import notificationService from "./notification.service";
import { NotificationTemplates } from "./notification.service";
import UserRole from "../models/userRole.model";
import Role from "../models/role.model";
import EntryMember from "../models/entryMember.model";
import TournamentCategory from "../models/tournamentCategory.model";
import Entry from "../models/entry.model";

// ─── Constants ────────────────────────────────────────────────────────────────

const REFEREE_INCLUDE = {
  model: User,
  as: "referee",
  attributes: ["id", "firstName", "lastName", "email"],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getTournament(tournamentId: number): Promise<Tournament> {
  const tournament = await Tournament.findByPk(tournamentId);
  if (!tournament) throw new Error("Tournament not found");
  return tournament;
}

function assertOrganizer(userId: number, tournament: Tournament): void {
  if (tournament.createdBy !== userId) {
    throw new Error("Only the tournament organizer can perform this action");
  }
}

function buildExpiresAt(): Date {
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + INVITATION_EXPIRY_HOURS);
  return expiresAt;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export class TournamentRefereeService {
  // ── 1. Gửi lời mời ────────────────────────────────────────────────────────

  /**
   * Organizer mời referee tham gia giải.
   * Mỗi referee chỉ có 1 invitation per tournament.
   * Không thể mời lại nếu đã rejected.
   */
  async inviteReferee(
  organizerId: number,
  tournamentId: number,
  refereeId: number,
  role: RefereeRole
): Promise<RefereeInvitation> {
  const tournament = await getTournament(tournamentId);
  assertOrganizer(organizerId, tournament);

  if (organizerId === refereeId) {
    throw new Error("Organizer cannot invite themselves as referee");
  }

  const referee = await User.findByPk(refereeId);
  if (!referee) throw new Error("User not found");

  // Check system role — áp dụng cho cả chief và referee
  await this.assertHasRefereeRole(refereeId, role);

  // Check không thi đấu trong giải này
  await this.assertNotCompetingInTournament(refereeId, tournamentId);

  const existing = await RefereeInvitation.findOne({
    where: { tournamentId, refereeId },
  });
  if (existing) {
    if (existing.status === "rejected") {
      throw new Error("Cannot re-invite a referee who has rejected the invitation");
    }
    if (existing.status === "accepted") {
      throw new Error("Referee is already part of this tournament");
    }
    if (existing.status === "pending") {
      throw new Error("A pending invitation already exists for this referee");
    }
    // cancelled → xóa cũ, cho phép mời lại
    await existing.destroy();
  }

  if (role === "chief") {
    await this.assertNoChiefReferee(tournamentId);
  }

  const invitation = await RefereeInvitation.create({
    tournamentId,
    refereeId,
    invitedBy: organizerId,
    role,
    status: "pending",
    expiresAt: buildExpiresAt(),
  });

  await notificationService.create(refereeId, {
    ...NotificationTemplates.refereeInvitation(tournament.name),
    referenceId: invitation.id,
    referenceType: "referee_invitation",
  });

  return invitation;
}

  // ── 2. Referee phản hồi ───────────────────────────────────────────────────

  async acceptInvitation(
    refereeId: number,
    invitationId: number
  ): Promise<TournamentReferee> {
    const invitation = await this.getValidPendingInvitation(
      invitationId,
      refereeId
    );

    // Enforce 1 chief khi accept
    if (invitation.role === "chief") {
      await this.assertNoChiefReferee(invitation.tournamentId);
    }

    return await sequelize.transaction(async (t) => {
      await invitation.update(
        { status: "accepted", respondedAt: new Date() },
        { transaction: t }
      );

      const referee = await TournamentReferee.create(
        {
          tournamentId: invitation.tournamentId,
          refereeId: invitation.refereeId,
          role: invitation.role,
        },
        { transaction: t }
      );

      return referee;
    });
  }

  async rejectInvitation(
    refereeId: number,
    invitationId: number,
    rejectionReason?: string
  ): Promise<RefereeInvitation> {
    const invitation = await this.getValidPendingInvitation(
      invitationId,
      refereeId
    );

    return await invitation.update({
      status: "rejected",
      respondedAt: new Date(),
      ...(rejectionReason ? { rejectionReason } : {}),
    });
  }

  // ── 3. Organizer hủy invitation ───────────────────────────────────────────

  async cancelInvitation(
    organizerId: number,
    invitationId: number
  ): Promise<RefereeInvitation> {
    const invitation = await RefereeInvitation.findByPk(invitationId, {
      include: [{ model: Tournament }],
    });
    if (!invitation) throw new Error("Invitation not found");
    assertOrganizer(organizerId, invitation.tournament!);

    if (invitation.status !== "pending") {
      throw new Error("Only pending invitations can be cancelled");
    }

    return await invitation.update({
      status: "cancelled",
      respondedAt: new Date(),
    });
  }

  // ── 4. Xóa referee khỏi giải ──────────────────────────────────────────────

  async removeReferee(
    organizerId: number,
    tournamentId: number,
    refereeId: number
  ): Promise<void> {
    const tournament = await getTournament(tournamentId);
    assertOrganizer(organizerId, tournament);

    const referee = await TournamentReferee.findOne({
      where: { tournamentId, refereeId },
    });
    if (!referee) throw new Error("Referee not found in this tournament");

    await referee.destroy();
  }

  // ── 5. Đổi role referee ───────────────────────────────────────────────────

  async updateRole(
  organizerId: number,
  tournamentId: number,
  refereeId: number,
  newRole: RefereeRole
): Promise<TournamentReferee> {
  const tournament = await getTournament(tournamentId);
  assertOrganizer(organizerId, tournament);

  const referee = await TournamentReferee.findOne({
    where: { tournamentId, refereeId },
  });
  if (!referee) throw new Error("Referee not found in this tournament");

  if (newRole === "chief" && referee.role !== "chief") {
    await this.assertNoChiefReferee(tournamentId);
    await this.assertHasRefereeRole(refereeId, "chief"); // thêm check
  }

  return await referee.update({ role: newRole });
}

// Thêm assertNotCompetingInTournament
private async assertNotCompetingInTournament(
  userId: number,
  tournamentId: number
): Promise<void> {
  const categories = await TournamentCategory.findAll({
    where: { tournamentId },
    attributes: ["id"],
  });
  const categoryIds = categories.map((c) => c.id);
  if (categoryIds.length === 0) return;

  const asCaptain = await Entry.findOne({
    where: {
      categoryId: { [Op.in]: categoryIds },
      captainId: userId,
    },
  });
  if (asCaptain) {
    throw new Error(
      "This user is already competing in this tournament and cannot be a referee"
    );
  }

  const asMember = await EntryMember.findOne({
    where: { userId },
    include: [{
      model: Entry,
      where: { categoryId: { [Op.in]: categoryIds } },
      required: true,
    }],
  });
  if (asMember) {
    throw new Error(
      "This user is already competing in this tournament and cannot be a referee"
    );
  }
}

  // ── 6. Queries ────────────────────────────────────────────────────────────

  async getRefereesByTournament(
    tournamentId: number,
    role?: RefereeRole,
    options?: { skip?: number; limit?: number }
  ): Promise<{ referees?: TournamentReferee[], pagination?: any } | TournamentReferee[]> {
    const skip = options?.skip || 0;
    const limit = options?.limit || 10;

    // If pagination is requested
    if (options && (options.skip !== undefined || options.limit !== undefined)) {
      const { count, rows } = await TournamentReferee.findAndCountAll({
        where: {
          tournamentId,
          ...(role ? { role } : {}),
        },
        include: [REFEREE_INCLUDE],
        order: [["role", "ASC"]],
        offset: skip,
        limit: limit,
      });

      const totalPages = Math.ceil(count / limit);
      const page = Math.floor(skip / limit) + 1;

      return {
        referees: rows,
        pagination: {
          total: count,
          page,
          limit,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      };
    }

    // Without pagination (backward compatibility)
    return await TournamentReferee.findAll({
      where: {
        tournamentId,
        ...(role ? { role } : {}),
      },
      include: [REFEREE_INCLUDE],
      order: [["role", "ASC"]],
    });
  }

  async getInvitationsByTournament(
    organizerId: number,
    tournamentId: number,
    status?: RefereeInvitation["status"],
    options?: { skip?: number; limit?: number }
  ): Promise<{ invitations?: RefereeInvitation[], pagination?: any } | RefereeInvitation[]> {
    const tournament = await getTournament(tournamentId);
    assertOrganizer(organizerId, tournament);

    const skip = options?.skip || 0;
    const limit = options?.limit || 10;

    // If pagination is requested
    if (options && (options.skip !== undefined || options.limit !== undefined)) {
      const { count, rows } = await RefereeInvitation.findAndCountAll({
        where: {
          tournamentId,
          ...(status ? { status } : {}),
        },
        include: [REFEREE_INCLUDE],
        order: [["createdAt", "DESC"]],
        offset: skip,
        limit: limit,
      });

      const totalPages = Math.ceil(count / limit);
      const page = Math.floor(skip / limit) + 1;

      return {
        invitations: rows,
        pagination: {
          total: count,
          page,
          limit,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      };
    }

    // Without pagination (backward compatibility)
    return await RefereeInvitation.findAll({
      where: {
        tournamentId,
        ...(status ? { status } : {}),
      },
      include: [REFEREE_INCLUDE],
      order: [["createdAt", "DESC"]],
    });
  }

  // ── 7. Expire invitations (gọi từ cron job) ───────────────────────────────

  async expireInvitations(): Promise<number> {
    const [count] = await RefereeInvitation.update(
      { status: "expired", respondedAt: new Date() },
      {
        where: {
          status: "pending",
          expiresAt: { [Op.lt]: new Date() },
        },
      }
    );
    return count;
  }

  // ── Helpers nội bộ ────────────────────────────────────────────────────────

  private async getValidPendingInvitation(
    invitationId: number,
    refereeId: number
  ): Promise<RefereeInvitation> {
    const invitation = await RefereeInvitation.findOne({
      where: { id: invitationId, refereeId },
    });
    if (!invitation) throw new Error("Invitation not found");
    if (invitation.status !== "pending") {
      throw new Error("This invitation is no longer pending");
    }
    if (new Date() > invitation.expiresAt) {
      await invitation.update({ status: "expired", respondedAt: new Date() });
      throw new Error("This invitation has expired");
    }
    return invitation;
  }

  private async assertNoChiefReferee(tournamentId: number): Promise<void> {
    const existingChief = await TournamentReferee.findOne({
      where: { tournamentId, role: "chief" },
    });
    if (existingChief) {
      throw new Error("This tournament already has a chief referee");
    }

    // Kiểm tra cả pending invitation cho chief
    const pendingChief = await RefereeInvitation.findOne({
      where: { tournamentId, role: "chief", status: "pending" },
    });
    if (pendingChief) {
      throw new Error(
        "A pending chief referee invitation already exists for this tournament"
      );
    }
  }

  private async assertHasRefereeRole(
  userId: number,
  role: RefereeRole
): Promise<void> {
  const requiredSystemRole =
    role === "chief" ? "chief_referee" : "referee";

  // chief_referee cũng có thể làm referee thường
  const acceptedSystemRoles =
    role === "chief"
      ? ["chief_referee"]
      : ["referee", "chief_referee"];

  const userRole = await UserRole.findOne({
    include: [{
      model: Role,
      where: { name: { [Op.in]: acceptedSystemRoles } },
      required: true,
    }],
    where: { userId },
  });

  if (!userRole) {
    throw new Error(
      role === "chief"
        ? "User does not have the chief_referee role"
        : "User does not have the referee or chief_referee role"
    );
  }
}
}

export default new TournamentRefereeService();