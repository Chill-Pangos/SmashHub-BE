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
import ScheduleConfig from "../models/scheduleConfig.model";
import { PUBLIC_USER_ATTRIBUTES } from "../utils/userProjection.helper";

// ─── Constants ────────────────────────────────────────────────────────────────

const REFEREE_PUBLIC_INCLUDE = {
  model: User,
  as: "referee",
  attributes: [...PUBLIC_USER_ATTRIBUTES],
};

const REFEREE_INCLUDE = {
  model: User,
  as: "referee",
  attributes: ["id", "firstName", "lastName", "email"],
};

const USER_ATTRIBUTES = ["id", "firstName", "lastName", "email", "avatarUrl"];
const REINVITABLE_INVITATION_STATUSES = ["cancelled", "expired"];

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

function buildPagination(count: number, offset: number, limit: number) {
  const totalPages = Math.ceil(count / limit);
  const page = Math.floor(offset / limit) + 1;

  return {
    total: count,
    page,
    limit,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}

function getUserDisplayName(user: Pick<User, "id" | "firstName" | "lastName">): string {
  return `${user.firstName} ${user.lastName}`.trim() || `User ${user.id}`;
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
  await this.assertNoOverlappingTournament(refereeId, tournamentId);

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
      await this.assertNoChiefReferee(invitation.tournamentId, invitation.refereeId);
    }
    await this.assertNoOverlappingTournament(refereeId, invitation.tournamentId);

    const referee = await sequelize.transaction(async (t) => {
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

    await this.notifyOrganizerOfInvitationResponse(invitation, "accepted");

    return referee;
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

    const updatedInvitation = await invitation.update({
      status: "rejected",
      respondedAt: new Date(),
      ...(rejectionReason ? { rejectionReason } : {}),
    });

    await this.notifyOrganizerOfInvitationResponse(
      updatedInvitation,
      "rejected",
      rejectionReason,
    );

    return updatedInvitation;
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
    options?: { offset?: number; limit?: number }
  ): Promise<{ referees?: TournamentReferee[], pagination?: any } | TournamentReferee[]> {
    const offset = options?.offset || 0;
    const limit = options?.limit || 10;

    // If pagination is requested
    if (options && (options.offset !== undefined || options.limit !== undefined)) {
      const { count, rows } = await TournamentReferee.findAndCountAll({
        where: {
          tournamentId,
          ...(role ? { role } : {}),
        },
        include: [REFEREE_PUBLIC_INCLUDE],
        order: [["role", "ASC"]],
        offset,
        limit: limit,
      });

      const totalPages = Math.ceil(count / limit);
      const page = Math.floor(offset / limit) + 1;

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
      include: [REFEREE_PUBLIC_INCLUDE],
      order: [["role", "ASC"]],
    });
  }

  async getInvitationsByTournament(
    organizerId: number,
    tournamentId: number,
    status?: RefereeInvitation["status"],
    options?: { offset?: number; limit?: number }
  ): Promise<{ invitations?: RefereeInvitation[], pagination?: any } | RefereeInvitation[]> {
    const tournament = await getTournament(tournamentId);
    assertOrganizer(organizerId, tournament);

    const offset = options?.offset || 0;
    const limit = options?.limit || 10;

    // If pagination is requested
    if (options && (options.offset !== undefined || options.limit !== undefined)) {
      const { count, rows } = await RefereeInvitation.findAndCountAll({
        where: {
          tournamentId,
          ...(status ? { status } : {}),
        },
        include: [REFEREE_INCLUDE],
        order: [["createdAt", "DESC"]],
        offset,
        limit: limit,
      });

      const totalPages = Math.ceil(count / limit);
      const page = Math.floor(offset / limit) + 1;

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

  async getAvailableRefereesForTournament(
    organizerId: number,
    tournamentId: number,
    filters?: {
      role?: "referee" | "chief";
      search?: string;
      offset?: number;
      limit?: number;
    },
  ): Promise<{
    referees: User[];
    pagination: ReturnType<typeof buildPagination>;
  }> {
    const tournament = await getTournament(tournamentId);
    assertOrganizer(organizerId, tournament);

    const offset = filters?.offset ?? 0;
    const limit = filters?.limit ?? 10;
    const acceptedSystemRoles =
      filters?.role === "chief"
        ? ["chief_referee"]
        : filters?.role === "referee"
          ? ["referee", "chief_referee"]
          : ["referee", "chief_referee"];

    const eligibleRoleRows = await UserRole.findAll({
      attributes: ["userId"],
      include: [
        {
          model: Role,
          where: { name: { [Op.in]: acceptedSystemRoles } },
          required: true,
          attributes: [],
        },
      ],
    });
    const roleUserIds = [...new Set(eligibleRoleRows.map((row) => row.userId))];
    if (roleUserIds.length === 0) {
      return {
        referees: [],
        pagination: buildPagination(0, offset, limit),
      };
    }

    const excludedUserIds = await this.getUnavailableRefereeIds(tournamentId);
    excludedUserIds.add(tournament.createdBy);

    const search = filters?.search?.trim();
    const where: any = {
      id: {
        [Op.in]: roleUserIds,
        [Op.notIn]: [...excludedUserIds],
      },
    };
    if (search) {
      where[Op.or] = [
        { firstName: { [Op.like]: `%${search}%` } },
        { lastName: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
      ];
    }

    const { count, rows } = await User.findAndCountAll({
      where,
      attributes: USER_ATTRIBUTES,
      order: [
        ["firstName", "ASC"],
        ["lastName", "ASC"],
      ],
      offset,
      limit,
      distinct: true,
    });

    return {
      referees: rows,
      pagination: buildPagination(count, offset, limit),
    };
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

  async getMyInvitations(
    refereeId: number,
    filters?: {
      status?: "pending" | "accepted" | "rejected" | "cancelled" | "expired";
      offset?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: "ASC" | "DESC";
    }
  ): Promise<{
    invitations: RefereeInvitation[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  }> {
    const { status, offset = 0, limit = 10, sortBy = "createdAt", sortOrder = "DESC" } = filters || {};

    const where: any = { refereeId };
    if (status) {
      where.status = status;
    }

    const { count, rows } = await RefereeInvitation.findAndCountAll({
      where,
      include: [
        {
          model: Tournament,
          as: "tournament",
          attributes: ["id", "name", "location", "tier", "status", "createdBy"],
        },
        {
          model: User,
          as: "inviter",
          attributes: ["id", "firstName", "lastName", "email"],
        },
      ],
      offset,
      ...(limit > 0 && { limit }),
      order: [[sortBy, sortOrder]],
      distinct: true,
    });

    const currentLimit = limit > 0 ? limit : count;
    const currentPage = currentLimit > 0 ? Math.floor(offset / currentLimit) + 1 : 1;
    const totalPages = currentLimit > 0 ? Math.ceil(count / currentLimit) : 1;

    return {
      invitations: rows,
      pagination: {
        total: count,
        page: currentPage,
        limit: currentLimit,
        totalPages,
        hasNextPage: currentPage < totalPages,
        hasPrevPage: currentPage > 1,
      },
    };
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

  private async notifyOrganizerOfInvitationResponse(
    invitation: RefereeInvitation,
    status: "accepted" | "rejected",
    rejectionReason?: string,
  ): Promise<void> {
    const [tournament, referee] = await Promise.all([
      Tournament.findByPk(invitation.tournamentId),
      User.findByPk(invitation.refereeId, {
        attributes: ["id", "firstName", "lastName"],
      }),
    ]);

    if (!tournament || !referee) return;

    const refereeName = getUserDisplayName(referee);
    const template = status === "accepted"
      ? NotificationTemplates.refereeInvitationAccepted(tournament.name, refereeName)
      : NotificationTemplates.refereeInvitationRejected(tournament.name, refereeName);

    const data: Record<string, unknown> = {
      invitationId: invitation.id,
      tournamentId: invitation.tournamentId,
      refereeId: invitation.refereeId,
      role: invitation.role,
      status,
    };
    if (rejectionReason) data.rejectionReason = rejectionReason;

    try {
      await notificationService.create(invitation.invitedBy, {
        ...template,
        referenceId: invitation.id,
        referenceType: "referee_invitation_response",
        data,
      });
    } catch (error) {
      console.error("Failed to notify organizer about referee invitation response:", error);
    }
  }

  private async assertNoChiefReferee(
    tournamentId: number,
    excludedRefereeId?: number
  ): Promise<void> {
    const existingChief = await TournamentReferee.findOne({
      where: { tournamentId, role: "chief" },
    });
    if (existingChief) {
      throw new Error("This tournament already has a chief referee");
    }

    // Kiểm tra cả pending invitation cho chief
    const pendingChiefWhere: any = {
      tournamentId,
      role: "chief",
      status: "pending",
      // Bỏ qua chính referee đang được accept
      ...(excludedRefereeId !== undefined
        ? { refereeId: { [Op.ne]: excludedRefereeId } }
        : {}),
    };

    const pendingChief = await RefereeInvitation.findOne({
      where: pendingChiefWhere,
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

  private async assertNoOverlappingTournament(
    refereeId: number,
    tournamentId: number
  ): Promise<void> {
    const overlappingRefereeIds = await this.getOverlappingTournamentRefereeIds(tournamentId);
    if (overlappingRefereeIds.includes(refereeId)) {
      throw new Error("Referee is already assigned to another tournament at this time");
    }
  }

  private async getUnavailableRefereeIds(tournamentId: number): Promise<Set<number>> {
    const unavailableIds = new Set<number>();

    for (const id of await this.getCurrentTournamentBlockedRefereeIds(tournamentId)) {
      unavailableIds.add(id);
    }
    for (const id of await this.getOverlappingTournamentRefereeIds(tournamentId)) {
      unavailableIds.add(id);
    }
    for (const id of await this.getTournamentCompetitorUserIds(tournamentId)) {
      unavailableIds.add(id);
    }

    return unavailableIds;
  }

  private async getCurrentTournamentBlockedRefereeIds(tournamentId: number): Promise<number[]> {
    const [currentReferees, currentInvitations] = await Promise.all([
      TournamentReferee.findAll({
        where: { tournamentId },
        attributes: ["refereeId"],
      }),
      RefereeInvitation.findAll({
        where: {
          tournamentId,
          status: { [Op.notIn]: REINVITABLE_INVITATION_STATUSES },
        },
        attributes: ["refereeId"],
      }),
    ]);

    return [
      ...currentReferees.map((row) => row.refereeId),
      ...currentInvitations.map((row) => row.refereeId),
    ];
  }

  private async getOverlappingTournamentRefereeIds(tournamentId: number): Promise<number[]> {
    const targetConfig = await ScheduleConfig.findOne({ where: { tournamentId } });
    if (!targetConfig) {
      throw new Error("Schedule config not found for this tournament");
    }

    const overlappingConfigs = await ScheduleConfig.findAll({
      where: {
        tournamentId: { [Op.ne]: tournamentId },
        startDate: { [Op.lt]: targetConfig.endDate },
        endDate: { [Op.gt]: targetConfig.startDate },
      },
      attributes: ["tournamentId"],
    });
    const overlappingTournamentIds = overlappingConfigs.map((config) => config.tournamentId);
    if (overlappingTournamentIds.length === 0) return [];

    const activeOverlappingTournaments = await Tournament.findAll({
      where: {
        id: { [Op.in]: overlappingTournamentIds },
        status: { [Op.ne]: "cancelled" },
      },
      attributes: ["id"],
    });
    const activeOverlappingTournamentIds = activeOverlappingTournaments.map((row) => row.id);
    if (activeOverlappingTournamentIds.length === 0) return [];

    const busyRefs = await TournamentReferee.findAll({
      where: { tournamentId: { [Op.in]: activeOverlappingTournamentIds } },
      attributes: ["refereeId"],
    });

    return busyRefs.map((row) => row.refereeId);
  }

  private async getTournamentCompetitorUserIds(tournamentId: number): Promise<number[]> {
    const categories = await TournamentCategory.findAll({
      where: { tournamentId },
      attributes: ["id"],
    });
    const categoryIds = categories.map((category) => category.id);
    if (categoryIds.length === 0) return [];

    const entries = await Entry.findAll({
      where: { categoryId: { [Op.in]: categoryIds } },
      attributes: ["id", "captainId"],
    });
    const entryIds = entries.map((entry) => entry.id);
    const captainIds = entries
      .map((entry) => entry.captainId)
      .filter((captainId): captainId is number => captainId != null);

    const members = entryIds.length
      ? await EntryMember.findAll({
          where: { entryId: { [Op.in]: entryIds } },
          attributes: ["userId"],
        })
      : [];

    return [...captainIds, ...members.map((member) => member.userId)];
  }
}

export default new TournamentRefereeService();
