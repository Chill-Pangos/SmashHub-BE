import { Op } from "sequelize";
import { sequelize } from "../config/database";
import Entry from "../models/entry.model";
import EntryMember from "../models/entryMember.model";
import TournamentCategory from "../models/tournamentCategory.model";
import Tournament from "../models/tournament.model";
import EloScore from "../models/eloScore.model";
import User from "../models/user.model";
import JoinRequest from "../models/joinRequest.model";
import {
  CreateEntryMemberDto,
  UpdateEntryMemberDto,
} from "../dto/entryMember.dto";

import {
  assertRegistrationOpen,
  assertUserEligible,
  assertNotAlreadyRegistered,
} from "./entry.service";
import notificationService, {
  NotificationTemplates,
} from "./notification.service";

export class EntryMemberService {
  // ─── CRUD gốc ─────────────────────────────────────────────────────────────

  async create(data: CreateEntryMemberDto): Promise<EntryMember> {
    return await EntryMember.create(data as any);
  }

  async findAll(offset = 0, limit = 10): Promise<EntryMember[]> {
    return await EntryMember.findAll({ offset, limit });
  }

  async findById(id: number): Promise<EntryMember | null> {
    return await EntryMember.findByPk(id);
  }

  async findByEntryId(
    entryId: number,
    offset = 0,
    limit = 10,
  ): Promise<EntryMember[]> {
    return await EntryMember.findAll({ where: { entryId }, offset, limit });
  }

  async findByUserId(
    userId: number,
    offset = 0,
    limit = 10,
  ): Promise<EntryMember[]> {
    return await EntryMember.findAll({ where: { userId }, offset, limit });
  }

  async findByEntryIdAndUserId(
    entryId: number,
    userId: number,
  ): Promise<EntryMember | null> {
    return await EntryMember.findOne({ where: { entryId, userId } });
  }

  async update(
    id: number,
    data: UpdateEntryMemberDto,
  ): Promise<[number, EntryMember[]]> {
    return await EntryMember.update(data, { where: { id }, returning: true });
  }

  async delete(id: number): Promise<number> {
    return await EntryMember.destroy({ where: { id } });
  }

  async deleteByEntryIdAndUserId(
    entryId: number,
    userId: number,
  ): Promise<number> {
    return await EntryMember.destroy({ where: { entryId, userId } });
  }

  // ─── Business logic (chuyển từ EntryService) ──────────────────────────────

  /**
   * Thêm thành viên vào đội (chỉ captain, trong thời gian đăng ký)
   * Moved from EntryService.addMember
   */
  async inviteMember(
    captainId: number,
    entryId: number,
    inviteeId: number,
  ): Promise<JoinRequest> {
    const entry = await Entry.findByPk(entryId, {
      include: [{ model: TournamentCategory, include: [Tournament] }],
    });
    if (!entry) throw new Error("Entry not found");
    if (entry.captainId !== captainId)
      throw new Error("Only the team captain can invite members");
    if (entry.category?.type === "single")
      throw new Error("Cannot invite members to a single entry");

    await assertRegistrationOpen(entry.category?.tournament!);

    if (!entry.isAcceptingMembers)
      throw new Error("This team is not accepting new members");
    if (
      entry.requiredMemberCount != null &&
      entry.currentMemberCount >= entry.requiredMemberCount
    )
      throw new Error("Team is already full");
    if (
      entry.category?.maxMembersPerEntry != null &&
      entry.currentMemberCount >= entry.category.maxMembersPerEntry
    )
      throw new Error(
        `Team cannot exceed ${entry.category.maxMembersPerEntry} members`,
      );

    const invitee = await User.findByPk(inviteeId);
    if (!invitee) throw new Error("User not found");

    // Kiểm tra eligibility sớm (age, gender, elo...) — check lại lần nữa lúc accept
    await assertUserEligible(invitee, entry.category!);
    await assertNotAlreadyRegistered(inviteeId, entry.categoryId);

    // Kiểm tra đã có pending invitation/request chưa
    const existing = await JoinRequest.findOne({
      where: { entryId, userId: inviteeId, status: "pending" },
    });
    if (existing) {
      throw new Error(
        existing.type === "invited"
          ? "This user has already been invited"
          : "This user already has a pending join request for this team",
      );
    }

    const invitation = await JoinRequest.create({
      entryId,
      userId: inviteeId,
      status: "pending",
      type: "invited",
    });

    // Notify invitee
    const entryName = entry.name ?? `Entry #${entryId}`;
    const captainName = `Captain`; // hoặc truyền vào nếu có
    await notificationService.create(inviteeId, {
      ...NotificationTemplates.joinRequest(captainName, entryName),
      referenceId: invitation.id,
      referenceType: "join_request",
    });

    return invitation;
  }

  // ── acceptInvitation ──────────────────────────────────────────────────────

  async acceptInvitation(
    userId: number,
    invitationId: number,
  ): Promise<EntryMember> {
    const invitation = await JoinRequest.findOne({
      where: { id: invitationId, userId, type: "invited", status: "pending" },
      include: [
        {
          model: Entry,
          include: [{ model: TournamentCategory, include: [Tournament] }],
        },
      ],
    });
    if (!invitation) throw new Error("Invitation not found");

    const entry = invitation.entry!;

    // Re-check tất cả điều kiện tại thời điểm accept
    await assertRegistrationOpen(entry.category?.tournament!);

    if (!entry.isAcceptingMembers)
      throw new Error("This team is no longer accepting new members");
    if (
      entry.requiredMemberCount != null &&
      entry.currentMemberCount >= entry.requiredMemberCount
    )
      throw new Error("Team is already full");
    if (
      entry.category?.maxMembersPerEntry != null &&
      entry.currentMemberCount >= entry.category.maxMembersPerEntry
    )
      throw new Error(
        `Team cannot exceed ${entry.category.maxMembersPerEntry} members`,
      );

    const invitee = await User.findByPk(userId);
    if (!invitee) throw new Error("User not found");

    await assertUserEligible(invitee, entry.category!);
    await assertNotAlreadyRegistered(userId, entry.categoryId);

    return await sequelize.transaction(async (t) => {
      await invitation.update(
        { status: "approved", respondedAt: new Date() },
        { transaction: t },
      );

      const eloScore = await EloScore.findOne({ where: { userId } });
      const member = await EntryMember.create(
        { entryId: entry.id, userId, eloAtEntry: eloScore?.score ?? 0 },
        { transaction: t },
      );

      await entry.increment("currentMemberCount", { by: 1, transaction: t });

      const updatedCount = entry.currentMemberCount + 1;
      if (
        entry.requiredMemberCount != null &&
        updatedCount >= entry.requiredMemberCount
      ) {
        await entry.update({ isAcceptingMembers: false }, { transaction: t });
      }

      return member;
    });
  }

  // ── rejectInvitation ──────────────────────────────────────────────────────

  async rejectInvitation(userId: number, invitationId: number): Promise<void> {
    const invitation = await JoinRequest.findOne({
      where: { id: invitationId, userId, type: "invited", status: "pending" },
    });
    if (!invitation) throw new Error("Invitation not found");

    await invitation.update({ status: "rejected", respondedAt: new Date() });
  }

  /**
   * Xóa thành viên khỏi đội (chỉ captain, trong thời gian đăng ký)
   * Moved from EntryService.removeMember
   */
  async removeMember(
    captainId: number,
    entryId: number,
    memberId: number,
  ): Promise<void> {
    const entry = await Entry.findByPk(entryId, {
      include: [{ model: TournamentCategory, include: [Tournament] }],
    });
    if (!entry) throw new Error("Entry not found");
    if (entry.captainId !== captainId)
      throw new Error("Only the team captain can remove members");

    await assertRegistrationOpen(entry.category?.tournament!);

    if (memberId === captainId)
      throw new Error(
        "Captain cannot be removed. Transfer captaincy or delete the entry instead",
      );

    const member = await EntryMember.findOne({
      where: { entryId, userId: memberId },
    });
    if (!member) throw new Error("Member not found in this team");

    await sequelize.transaction(async (t) => {
      await member.destroy({ transaction: t });
      await entry.decrement("currentMemberCount", { by: 1, transaction: t });
      if (!entry.isAcceptingMembers)
        await entry.update({ isAcceptingMembers: true }, { transaction: t });
    });
  }

  /**
   * Lấy danh sách tất cả thành viên của entry (có pagination)
   * Moved from EntryService.getAllMembers
   */
  async getAllMembers(
    entryId: number,
    options?: { offset?: number; limit?: number },
  ): Promise<{ members?: EntryMember[]; pagination?: any } | EntryMember[]> {
    const entry = await Entry.findByPk(entryId);
    if (!entry) throw new Error("Entry not found");

    const offset = options?.offset ?? 0;
    const limit = options?.limit ?? 10;

    const memberInclude = [
      {
        model: User,
        attributes: [
          "id",
          "firstName",
          "lastName",
          "email",
          "gender",
          "dob",
          "avatarUrl",
        ],
      },
    ];

    if (
      options &&
      (options.offset !== undefined || options.limit !== undefined)
    ) {
      const { count, rows } = await EntryMember.findAndCountAll({
        where: { entryId },
        include: memberInclude,
        order: [["createdAt", "ASC"]],
        offset,
        limit,
      });

      const totalPages = Math.ceil(count / limit);
      const page = Math.floor(offset / limit) + 1;

      return {
        members: rows,
        pagination: {
          total: count,
          page,
          limit,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      };
    }

    return await EntryMember.findAll({
      where: { entryId },
      include: memberInclude,
      order: [["createdAt", "ASC"]],
    });
  }

  /**
   * Thành viên rời đội (trong thời gian đăng ký)
   * Moved from EntryService.leaveEntry
   */
  async leaveEntry(userId: number, entryId: number): Promise<void> {
    const entry = await Entry.findByPk(entryId, {
      include: [{ model: TournamentCategory, include: [Tournament] }],
    });
    if (!entry) throw new Error("Entry not found");

    await assertRegistrationOpen(entry.category?.tournament!);

    if (entry.captainId === userId)
      throw new Error(
        "Captain cannot leave the team. Transfer captaincy or delete the entry instead",
      );

    const member = await EntryMember.findOne({ where: { entryId, userId } });
    if (!member) throw new Error("Member not found in this entry");

    await sequelize.transaction(async (t) => {
      await member.destroy({ transaction: t });
      await entry.decrement("currentMemberCount", { by: 1, transaction: t });
      if (!entry.isAcceptingMembers)
        await entry.update({ isAcceptingMembers: true }, { transaction: t });
    });
  }
}

export default new EntryMemberService();
