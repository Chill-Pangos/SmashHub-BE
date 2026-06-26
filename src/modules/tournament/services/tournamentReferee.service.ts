// tournamentReferee.service.ts
import { Op } from "sequelize";
import { sequelize } from "../../../config/database";
import TournamentReferee, { RefereeRole } from "../models/tournamentReferee.model";
import RefereeInvitation, {
  INVITATION_EXPIRY_HOURS,
} from "../models/refereeInvitation.model";
import Tournament from "../models/tournament.model";
import { notificationService, NotificationTemplates } from "../../notification/public.services";
import { identityReadService, type TournamentUserSummary } from "../../identity/public.read";
import { registrationReadService } from "../../registration/public.read";
import TournamentCategory from "../models/tournamentCategory.model";
import { competitionReadService } from "../../competition/public.read";

// ─── Constants ────────────────────────────────────────────────────────────────

const REINVITABLE_INVITATION_STATUSES = ["cancelled", "expired"];

type PublicRefereeUserSummary = {
  id: number;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  gender?: "male" | "female";
};

type InvitationUserSummary = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
};

type AvailableRefereeSummary = InvitationUserSummary & {
  avatarUrl?: string;
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

  const referee = await identityReadService.getTournamentUser(refereeId);
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

  await notificationService.notifyUser(refereeId, {
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
      include: [{ model: Tournament, as: "tournament" }],
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

  const isCompeting = await registrationReadService.userCompetesInCategories(
    userId,
    categoryIds,
  );
  if (isCompeting) {
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
        order: [["role", "ASC"]],
        offset,
        limit: limit,
      });
      await this.attachRefereeUsers(rows);

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
    const rows = await TournamentReferee.findAll({
      where: {
        tournamentId,
        ...(role ? { role } : {}),
      },
      order: [["role", "ASC"]],
    });
    await this.attachRefereeUsers(rows);
    return rows;
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
        order: [["createdAt", "DESC"]],
        offset,
        limit: limit,
      });
      await this.attachInvitationUsers(rows, "referee");

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
    const rows = await RefereeInvitation.findAll({
      where: {
        tournamentId,
        ...(status ? { status } : {}),
      },
      order: [["createdAt", "DESC"]],
    });
    await this.attachInvitationUsers(rows, "referee");
    return rows;
  }

  async getAvailableRefereesForTournament(
    organizerId: number,
    tournamentId: number,
    filters?: {
      role?: "referee" | "chief_referee";
      search?: string;
      offset?: number;
      limit?: number;
    },
  ): Promise<{
    referees: AvailableRefereeSummary[];
    pagination: ReturnType<typeof buildPagination>;
  }> {
    const tournament = await getTournament(tournamentId);
    assertOrganizer(organizerId, tournament);

    const offset = filters?.offset ?? 0;
    const limit = filters?.limit ?? 10;
    const acceptedSystemRoles =
      filters?.role === "chief_referee"
        ? ["chief_referee"]
        : filters?.role === "referee"
          ? ["referee", "chief_referee"]
          : ["referee", "chief_referee"];

    const roleUserIds = await identityReadService.getUserIdsByRoles(acceptedSystemRoles);
    if (roleUserIds.length === 0) {
      return {
        referees: [],
        pagination: buildPagination(0, offset, limit),
      };
    }

    const excludedUserIds = await this.getUnavailableRefereeIds(tournamentId);
    excludedUserIds.add(tournament.createdBy);

    const userSearchInput: {
      includeIds: number[];
      excludeIds: number[];
      search?: string;
      offset: number;
      limit: number;
    } = {
      includeIds: roleUserIds,
      excludeIds: [...excludedUserIds],
      offset,
      limit,
    };
    if (filters?.search) userSearchInput.search = filters.search;

    const result = await identityReadService.findTournamentUsersByIds(userSearchInput);

    return {
      referees: result.users.map((user) => this.toAvailableRefereeSummary(user)),
      pagination: buildPagination(result.total, offset, limit),
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
      ],
      offset,
      ...(limit > 0 && { limit }),
      order: [[sortBy, sortOrder]],
      distinct: true,
    });
    await this.attachInvitationUsers(rows, "inviter");

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

  private async attachRefereeUsers(rows: TournamentReferee[]): Promise<void> {
    const users = await identityReadService.getTournamentUsersByIds(
      rows.map((row) => row.refereeId),
    );
    const userById = new Map(users.map((user) => [user.id, user]));

    for (const row of rows) {
      const user = userById.get(row.refereeId);
      row.setDataValue("referee", user ? this.toPublicRefereeUserSummary(user) : null);
    }
  }

  private async attachInvitationUsers(
    rows: RefereeInvitation[],
    relation: "referee" | "inviter",
  ): Promise<void> {
    const userIds = rows.map((row) =>
      relation === "referee" ? row.refereeId : row.invitedBy,
    );
    const users = await identityReadService.getTournamentUsersByIds(userIds);
    const userById = new Map(users.map((user) => [user.id, user]));

    for (const row of rows) {
      const userId = relation === "referee" ? row.refereeId : row.invitedBy;
      const user = userById.get(userId);
      if (relation === "referee") {
        row.setDataValue("referee", user ? this.toInvitationUserSummary(user) : null);
      } else {
        row.setDataValue("inviter", user ? this.toInvitationUserSummary(user) : null);
      }
    }
  }

  private toPublicRefereeUserSummary(user: TournamentUserSummary): PublicRefereeUserSummary {
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      ...(user.avatarUrl ? { avatarUrl: user.avatarUrl } : {}),
      ...(user.gender ? { gender: user.gender } : {}),
    };
  }

  private toInvitationUserSummary(user: TournamentUserSummary): InvitationUserSummary {
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
    };
  }

  private toAvailableRefereeSummary(user: TournamentUserSummary): AvailableRefereeSummary {
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      ...(user.avatarUrl ? { avatarUrl: user.avatarUrl } : {}),
    };
  }

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

  const hasRole = await identityReadService.userHasAnyRole(userId, acceptedSystemRoles);

  if (!hasRole) {
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
    const overlappingTournamentIds = await competitionReadService.getOverlappingTournamentIds(
      tournamentId,
    );
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

    return registrationReadService.getParticipantUserIdsByCategoryIds(categoryIds);
  }
}

export default new TournamentRefereeService();
