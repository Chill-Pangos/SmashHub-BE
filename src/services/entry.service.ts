import { Op, WhereOptions, Includeable, Transaction } from "sequelize";
import { sequelize } from "../config/database";
import Entry from "../models/entry.model";
import EntryMember from "../models/entryMember.model";
import TournamentCategory from "../models/tournamentCategory.model";
import Tournament from "../models/tournament.model";
import EloScore from "../models/eloScore.model";
import User from "../models/user.model";
import JoinRequest from "../models/joinRequest.model";
import Payment from "../models/payment.model";
import notificationService, { NotificationTemplates } from "./notification.service";

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getCategoryWithTournament(
  categoryId: number,
): Promise<TournamentCategory> {
  const category = await TournamentCategory.findByPk(categoryId, {
    include: [{ model: Tournament }],
  });
  if (!category) throw new Error("Category not found");
  return category;
}

async function assertRegistrationOpen(tournament: Tournament): Promise<void> {
  const now = new Date();
  if (
    now < tournament.registrationStartDate ||
    now > tournament.registrationEndDate
  ) {
    throw new Error("Registration is not open at this time");
  }
}

async function assertRegistrationClosed(tournament: Tournament): Promise<void> {
  if (new Date() <= tournament.registrationEndDate) {
    throw new Error("Registration must be closed before disqualifying entries");
  }
}

async function assertUserEligible(
  user: User,
  category: TournamentCategory,
): Promise<void> {
  const errors: string[] = [];

  // Gender check
  if (category.gender && category.gender !== "mixed") {
    if (user.gender !== category.gender) {
      errors.push(`This category is for ${category.gender} players only`);
    }
  }

  // Age check
  if (user.dob) {
    const today = new Date();
    const birth = new Date(user.dob);
    const age =
      today.getFullYear() -
      birth.getFullYear() -
      (today < new Date(today.getFullYear(), birth.getMonth(), birth.getDate())
        ? 1
        : 0);

    if (category.minAge != null && age < category.minAge) {
      errors.push(`Minimum age requirement is ${category.minAge}`);
    }
    if (category.maxAge != null && age > category.maxAge) {
      errors.push(`Maximum age requirement is ${category.maxAge}`);
    }
  } else if (category.minAge != null || category.maxAge != null) {
    errors.push("Date of birth is required for this category");
  }

  // ELO check
  const eloScore = await EloScore.findOne({ where: { userId: user.id } });
  const elo = eloScore?.score ?? 0;

  if (category.minElo != null && elo < category.minElo) {
    errors.push(`Minimum ELO requirement is ${category.minElo}`);
  }
  if (category.maxElo != null && elo > category.maxElo) {
    errors.push(`Maximum ELO requirement is ${category.maxElo}`);
  }

  if (errors.length > 0) {
    throw new Error(`User is not eligible: ${errors.join("; ")}`);
  }
}

async function assertNotAlreadyRegistered(
  userId: number,
  categoryId: number,
): Promise<void> {
  // Check nếu user đã là captain của 1 entry trong category này
  const existingEntry = await Entry.findOne({
    where: { categoryId, captainId: userId },
  });
  if (existingEntry) {
    throw new Error("User is already registered in this category as captain");
  }

  // Check nếu user đã là member của 1 entry trong category này
  const existingMember = await EntryMember.findOne({
    include: [
      {
        model: Entry,
        where: { categoryId },
        required: true,
      },
    ],
    where: { userId },
  });
  if (existingMember) {
    throw new Error("User is already a member of an entry in this category");
  }
}

// ─── Service ──────────────────────────────────────────────────────────────────

export class EntryService {
  /**
   * 1. Đăng ký tham gia giải đấu
   * - single: tạo entry + tự động thêm user vào làm member
   * - double/team: tạo đội mới (user là captain) hoặc xin vào đội có sẵn
   */
  async register(
    userId: number,
    categoryId: number,
    action: "create_team" | "join_team",
    targetEntryId?: number, // chỉ dùng khi action = "join_team"
  ): Promise<{ entry: Entry; message: string }> {
    const category = await getCategoryWithTournament(categoryId);
    const tournament = category.tournament!;

    await assertRegistrationOpen(tournament);

    const user = await User.findByPk(userId);
    if (!user) throw new Error("User not found");

    await assertUserEligible(user, category);
    await assertNotAlreadyRegistered(userId, categoryId);

    // ── Single: tạo entry và thêm member luôn ─────────────────────────────
    if (category.type === "single") {
      const entry = await sequelize.transaction(async (t) => {
        const newEntry = await Entry.create(
          {
            categoryId,
            captainId: userId,
            isAcceptingMembers: false,
            requiredMemberCount: 1,
            currentMemberCount: 1,
          },
          { transaction: t },
        );

        const eloScore = await EloScore.findOne({ where: { userId } });
        await EntryMember.create(
          {
            entryId: newEntry.id,
            userId,
            eloAtEntry: eloScore?.score ?? 0,
          },
          { transaction: t },
        );

        return newEntry;
      });

      return { entry, message: "Successfully registered for the tournament" };
    }

    // ── Double / Team: tạo đội mới ────────────────────────────────────────
    if (action === "create_team") {
      const requiredMemberCount = category.type === "double" ? 2 : undefined; // team: captain tự set sau

      const entry = await sequelize.transaction(async (t) => {
        const newEntry = await Entry.create(
          {
            categoryId,
            captainId: userId,
            isAcceptingMembers: true,
            requiredMemberCount,
            currentMemberCount: 1,
          },
          { transaction: t },
        );

        const eloScore = await EloScore.findOne({ where: { userId } });
        await EntryMember.create(
          {
            entryId: newEntry.id,
            userId,
            eloAtEntry: eloScore?.score ?? 0,
          },
          { transaction: t },
        );

        return newEntry;
      });

      return { entry, message: "Team created successfully" };
    }

    // ── Double / Team: xin vào đội có sẵn ────────────────────────────────
    if (action === "join_team") {
      if (!targetEntryId) {
        throw new Error("targetEntryId is required when joining a team");
      }

      const targetEntry = await Entry.findByPk(targetEntryId);
      if (!targetEntry || targetEntry.categoryId !== categoryId) {
        throw new Error("Entry not found in this category");
      }
      if (!targetEntry.isAcceptingMembers) {
        throw new Error("This team is not accepting new members");
      }
      if (
        targetEntry.requiredMemberCount != null &&
        targetEntry.currentMemberCount >= targetEntry.requiredMemberCount
      ) {
        throw new Error("This team is already full");
      }

      // Kiểm tra đã có pending request chưa
      const existingRequest = await JoinRequest.findOne({
        where: { entryId: targetEntryId, userId, status: "pending" },
      });
      if (existingRequest) {
        throw new Error(
          "You already have a pending join request for this team",
        );
      }

      const joinRequest = await JoinRequest.create({ entryId: targetEntryId, userId });

      const requesterName = `${user.firstName} ${user.lastName}`.trim();

      if (targetEntry.captainId) {
        await notificationService.create(targetEntry.captainId, {
          ...NotificationTemplates.joinRequest(requesterName, targetEntry.name),
          referenceId: joinRequest.id,
          referenceType: "join_request",
        });
      }

      return {
        entry: targetEntry,
        message: "Join request sent to team captain. Waiting for approval.",
      };
    }

    throw new Error("Invalid action");
  }

  /**
   * 2. Thêm thành viên vào đội (chỉ captain, trong thời gian đăng ký)
   */
  async addMember(
    captainId: number,
    entryId: number,
    newMemberId: number,
  ): Promise<EntryMember> {
    const entry = await Entry.findByPk(entryId, {
      include: [{ model: TournamentCategory, include: [Tournament] }],
    });
    if (!entry) throw new Error("Entry not found");
    if (entry.captainId !== captainId) {
      throw new Error("Only the team captain can add members");
    }
    if (entry.category?.type === "single") {
      throw new Error("Cannot add members to a single entry");
    }

    const tournament = entry.category?.tournament!;
    await assertRegistrationOpen(tournament);

    if (!entry.isAcceptingMembers) {
      throw new Error("This team is not accepting new members");
    }
    if (
      entry.requiredMemberCount != null &&
      entry.currentMemberCount >= entry.requiredMemberCount
    ) {
      throw new Error("Team is already full");
    }

    // Kiểm tra maxMembersPerEntry của category
    if (
      entry.category?.maxMembersPerEntry != null &&
      entry.currentMemberCount >= entry.category.maxMembersPerEntry
    ) {
      throw new Error(
        `Team cannot exceed ${entry.category.maxMembersPerEntry} members`,
      );
    }

    const newMember = await User.findByPk(newMemberId);
    if (!newMember) throw new Error("User not found");

    await assertUserEligible(newMember, entry.category!);
    await assertNotAlreadyRegistered(newMemberId, entry.categoryId);

    return await sequelize.transaction(async (t) => {
      const eloScore = await EloScore.findOne({
        where: { userId: newMemberId },
      });
      const member = await EntryMember.create(
        {
          entryId,
          userId: newMemberId,
          eloAtEntry: eloScore?.score ?? 0,
        },
        { transaction: t },
      );

      await entry.increment("currentMemberCount", { by: 1, transaction: t });

      // Tự động đóng đăng ký nếu đã đủ thành viên
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

  /**
   * 3. Xóa thành viên khỏi đội (chỉ captain, trong thời gian đăng ký)
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
    if (entry.captainId !== captainId) {
      throw new Error("Only the team captain can remove members");
    }

    const tournament = entry.category?.tournament!;
    await assertRegistrationOpen(tournament);

    // Không cho xóa captain
    if (memberId === captainId) {
      throw new Error(
        "Captain cannot be removed. Transfer captaincy or delete the entry instead",
      );
    }

    const member = await EntryMember.findOne({
      where: { entryId, userId: memberId },
    });
    if (!member) throw new Error("Member not found in this team");

    await sequelize.transaction(async (t) => {
      await member.destroy({ transaction: t });
      await entry.decrement("currentMemberCount", { by: 1, transaction: t });

      // Mở lại đăng ký nếu đang đóng
      if (!entry.isAcceptingMembers) {
        await entry.update({ isAcceptingMembers: true }, { transaction: t });
      }
    });
  }

  /**
   * 4. Lấy danh sách đội đã đăng ký (có filter)
   */
  async findByCategoryId(
    categoryId: number,
    options: {
      skip?: number;
      limit?: number;
      isFull?: boolean;
      isAcceptingMembers?: boolean;
      captainName?: string;
    } = {},
  ): Promise<{ rows: Entry[]; count: number }> {
    const {
      skip = 0,
      limit = 10,
      isFull,
      isAcceptingMembers,
      captainName,
    } = options;

    const where: WhereOptions = { categoryId };

    if (isAcceptingMembers !== undefined) {
      where.isAcceptingMembers = isAcceptingMembers;
    }

    if (isFull === true) {
      where.currentMemberCount = {
        [Op.gte]: sequelize.col("requiredMemberCount"),
      };
    } else if (isFull === false) {
      where.currentMemberCount = {
        [Op.lt]: sequelize.col("requiredMemberCount"),
      };
    }

    // Build captain include riêng để tránh where: undefined
    const captainInclude: Includeable = captainName?.trim()
      ? {
          model: User,
          as: "captain",
          where: {
            [Op.or]: [
              { firstName: { [Op.like]: `%${captainName.trim()}%` } },
              { lastName: { [Op.like]: `%${captainName.trim()}%` } },
            ],
          },
          attributes: ["id", "firstName", "lastName", "email"],
        }
      : {
          model: User,
          as: "captain",
          attributes: ["id", "firstName", "lastName", "email"],
        };

    return await Entry.findAndCountAll({
      where,
      include: [
        captainInclude,
        {
          model: EntryMember,
          as: "members",
          include: [
            {
              model: User,
              attributes: ["id", "firstName", "lastName"],
            },
          ],
        },
      ],
      offset: skip,
      limit,
      distinct: true,
    });
  }

  /**
   * 5. Captain duyệt hoặc từ chối join request
   */
  async respondToJoinRequest(
    captainId: number,
    joinRequestId: number,
    action: "approve" | "reject",
    rejectionReason?: string,
  ): Promise<JoinRequest> {
    const joinRequest = await JoinRequest.findByPk(joinRequestId, {
      include: [
        {
          model: Entry,
          include: [{ model: TournamentCategory, include: [Tournament] }],
        },
      ],
    });
    if (!joinRequest) throw new Error("Join request not found");
    if (joinRequest.status !== "pending") {
      throw new Error("This join request has already been responded to");
    }

    const entry = joinRequest.entry!;
    if (entry.captainId !== captainId) {
      throw new Error("Only the team captain can respond to join requests");
    }

    const tournament = entry.category?.tournament!;
    await assertRegistrationOpen(tournament);

    // ── Reject ────────────────────────────────────────────────────────────────
    if (action === "reject") {
      await joinRequest.update({
        status: "rejected",
        rejectionReason: rejectionReason ?? null,
        respondedAt: new Date(),
      });

      // Gửi thông báo cho người dùng
      // await notificationService.send(joinRequest.userId, {
      //   type: "join_request_rejected",
      //   entryId: entry.id,
      //   reason: rejectionReason,
      // });

      return joinRequest;
    }

    // ── Approve ───────────────────────────────────────────────────────────────
    if (!entry.isAcceptingMembers) {
      throw new Error("This team is no longer accepting members");
    }
    if (
      entry.requiredMemberCount != null &&
      entry.currentMemberCount >= entry.requiredMemberCount
    ) {
      throw new Error("Team is already full");
    }
    if (
      entry.category?.maxMembersPerEntry != null &&
      entry.currentMemberCount >= entry.category.maxMembersPerEntry
    ) {
      throw new Error(
        `Team cannot exceed ${entry.category.maxMembersPerEntry} members`,
      );
    }

    // Re-validate điều kiện user tại thời điểm approve
    const user = await User.findByPk(joinRequest.userId);
    if (!user) throw new Error("User not found");
    await assertUserEligible(user, entry.category!);
    await assertNotAlreadyRegistered(joinRequest.userId, entry.categoryId);

    await sequelize.transaction(async (t) => {
      const eloScore = await EloScore.findOne({
        where: { userId: joinRequest.userId },
      });

      await EntryMember.create(
        {
          entryId: entry.id,
          userId: joinRequest.userId,
          eloAtEntry: eloScore?.score ?? 0,
        },
        { transaction: t },
      );

      await entry.increment("currentMemberCount", { by: 1, transaction: t });

      // Tự động đóng đăng ký nếu đủ thành viên
      const updatedCount = entry.currentMemberCount + 1;
      if (
        entry.requiredMemberCount != null &&
        updatedCount >= entry.requiredMemberCount
      ) {
        await entry.update({ isAcceptingMembers: false }, { transaction: t });
      }

      await joinRequest.update(
        { status: "approved", respondedAt: new Date() },
        { transaction: t },
      );
    });

    // Gửi thông báo cho người dùng
    // await notificationService.send(joinRequest.userId, {
    //   type: "join_request_approved",
    //   entryId: entry.id,
    // });

    return joinRequest;
  }

  /**
   * 6. Lấy danh sách join request của 1 entry (chỉ captain)
   */
  async getJoinRequests(
    captainId: number,
    entryId: number,
    status?: "pending" | "approved" | "rejected",
    options?: { skip?: number; limit?: number }
  ): Promise<{ requests?: JoinRequest[], joinRequests?: JoinRequest[], pagination?: any } | JoinRequest[]> {
    const entry = await Entry.findByPk(entryId);
    if (!entry) throw new Error("Entry not found");
    if (entry.captainId !== captainId) {
      throw new Error("Only the team captain can view join requests");
    }

    const skip = options?.skip || 0;
    const limit = options?.limit || 10;

    // If pagination is requested
    if (options && (options.skip !== undefined || options.limit !== undefined)) {
      const { count, rows } = await JoinRequest.findAndCountAll({
        where: {
          entryId,
          ...(status ? { status } : {}),
        },
        include: [
          {
            model: User,
            attributes: ["id", "firstName", "lastName", "email", "gender", "dob"],
          },
        ],
        order: [["createdAt", "DESC"]],
        offset: skip,
        limit: limit,
      });

      const totalPages = Math.ceil(count / limit);
      const page = Math.floor(skip / limit) + 1;

      return {
        joinRequests: rows,
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
    return await JoinRequest.findAll({
      where: {
        entryId,
        ...(status ? { status } : {}),
      },
      include: [
        {
          model: User,
          attributes: ["id", "firstName", "lastName", "email", "gender", "dob"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });
  }

  /**
   * 7. Lấy chi tiết 1 entry
   */
  async getById(entryId: number): Promise<Entry> {
    const entry = await Entry.findByPk(entryId, {
      include: [
        { model: TournamentCategory, include: [Tournament] },
        {
          model: User,
          as: "captain",
          attributes: ["id", "firstName", "lastName", "email"],
        },
        {
          model: EntryMember,
          as: "members",
          include: [
            {
              model: User,
              attributes: ["id", "firstName", "lastName", "email", "gender"],
            },
          ],
        },
      ],
    });
    if (!entry) throw new Error("Entry not found");
    return entry;
  }

  /**
   * 8. Cập nhật entry (chỉ captain, trong thời gian đăng ký)
   */
  async update(
    captainId: number,
    entryId: number,
    data: {
      name?: string;
      requiredMemberCount?: number;
      isAcceptingMembers?: boolean;
    },
  ): Promise<Entry> {
    const entry = await Entry.findByPk(entryId, {
      include: [{ model: TournamentCategory, include: [Tournament] }],
    });
    if (!entry) throw new Error("Entry not found");
    if (entry.captainId !== captainId) {
      throw new Error("Only the team captain can update the entry");
    }

    const tournament = entry.category?.tournament!;
    await assertRegistrationOpen(tournament);

    // Kiểm tra requiredMemberCount nếu thay đổi
    if (data.requiredMemberCount != null) {
      if (entry.category?.type === "single") {
        throw new Error(
          "Cannot change required member count for single entries",
        );
      }
      if (data.requiredMemberCount < entry.currentMemberCount) {
        throw new Error(
          "Required member count cannot be less than current member count",
        );
      }

      // Kiểm tra maxMembersPerEntry
      if (
        entry.category?.type === "team" &&
        entry.category?.maxMembersPerEntry != null &&
        data.requiredMemberCount > entry.category.maxMembersPerEntry
      ) {
        throw new Error(
          `Required member count cannot exceed ${entry.category.maxMembersPerEntry}`,
        );
      }
    }

    return await entry.update(data);
  }

  /**
   * 9. Xóa entry (chỉ captain, phải trong thời gian đăng ký)
   */
  async delete(captainId: number, entryId: number): Promise<void> {
    const entry = await Entry.findByPk(entryId, {
      include: [{ model: TournamentCategory, include: [Tournament] }],
    });
    if (!entry) throw new Error("Entry not found");
    if (entry.captainId !== captainId) {
      throw new Error("Only the team captain can delete the entry");
    }

    const tournament = entry.category?.tournament!;
    await assertRegistrationOpen(tournament);

    await sequelize.transaction(async (t) => {
      // Xóa tất cả join request
      await JoinRequest.destroy({ where: { entryId }, transaction: t });

      // Xóa tất cả entry member
      await EntryMember.destroy({ where: { entryId }, transaction: t });

      // Xóa entry
      await entry.destroy({ transaction: t });
    });
  }

  /**
   * 10. Chuyển quyền captain cho thành viên khác
   */
  async transferCaptaincy(
    currentCaptainId: number,
    entryId: number,
    newCaptainId: number,
  ): Promise<Entry> {
    const entry = await Entry.findByPk(entryId, {
      include: [{ model: TournamentCategory, include: [Tournament] }],
    });
    if (!entry) throw new Error("Entry not found");
    if (entry.captainId !== currentCaptainId) {
      throw new Error("Only the current captain can transfer captaincy");
    }

    const tournament = entry.category?.tournament!;
    await assertRegistrationOpen(tournament);

    // Kiểm tra new captain là member của entry
    const newCaptainMember = await EntryMember.findOne({
      where: { entryId, userId: newCaptainId },
    });
    if (!newCaptainMember) {
      throw new Error("New captain must be a member of the entry");
    }

    const newCaptain = await User.findByPk(newCaptainId);
    if (!newCaptain) throw new Error("User not found");

    return await entry.update({ captainId: newCaptainId });
  }

  /**
   * 11. Lấy danh sách tất cả thành viên của entry
   */
  async getAllMembers(entryId: number, options?: { skip?: number; limit?: number }): Promise<{ members?: EntryMember[], pagination?: any } | EntryMember[]> {
    const entry = await Entry.findByPk(entryId);
    if (!entry) throw new Error("Entry not found");

    const skip = options?.skip || 0;
    const limit = options?.limit || 10;

    // If pagination is requested
    if (options && (options.skip !== undefined || options.limit !== undefined)) {
      const { count, rows } = await EntryMember.findAndCountAll({
        where: { entryId },
        include: [
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
        ],
        order: [["createdAt", "ASC"]],
        offset: skip,
        limit: limit,
      });

      const totalPages = Math.ceil(count / limit);
      const page = Math.floor(skip / limit) + 1;

      return {
        members: rows,
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
    return await EntryMember.findAll({
      where: { entryId },
      include: [
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
      ],
      order: [["createdAt", "ASC"]],
    });
  }

  /**
   * 12. Thành viên rời đội
   */
  async leaveEntry(userId: number, entryId: number): Promise<void> {
    const entry = await Entry.findByPk(entryId, {
      include: [{ model: TournamentCategory, include: [Tournament] }],
    });
    if (!entry) throw new Error("Entry not found");

    const tournament = entry.category?.tournament!;
    await assertRegistrationOpen(tournament);

    // Không cho captain rời
    if (entry.captainId === userId) {
      throw new Error(
        "Captain cannot leave the team. Transfer captaincy or delete the entry instead",
      );
    }

    const member = await EntryMember.findOne({
      where: { entryId, userId },
    });
    if (!member) throw new Error("Member not found in this entry");

    await sequelize.transaction(async (t) => {
      await member.destroy({ transaction: t });
      await entry.decrement("currentMemberCount", { by: 1, transaction: t });

      // Mở lại đăng ký nếu đang đóng
      if (!entry.isAcceptingMembers) {
        await entry.update({ isAcceptingMembers: true }, { transaction: t });
      }
    });
  }

  /**
   * 13. Set số thành viên cần (chỉ cho team category)
   */
  async setRequiredMemberCount(
    captainId: number,
    entryId: number,
    count: number,
  ): Promise<Entry> {
    const entry = await Entry.findByPk(entryId, {
      include: [{ model: TournamentCategory, include: [Tournament] }],
    });
    if (!entry) throw new Error("Entry not found");
    if (entry.captainId !== captainId) {
      throw new Error("Only the team captain can set required member count");
    }

    if (entry.category?.type !== "team") {
      throw new Error("Required member count can only be set for team entries");
    }

    const tournament = entry.category?.tournament!;
    await assertRegistrationOpen(tournament);

    // Kiểm tra count >= currentMemberCount
    if (count < entry.currentMemberCount) {
      throw new Error(
        "Required member count cannot be less than current member count",
      );
    }

    // Kiểm tra maxMembersPerEntry
    if (
      entry.category?.maxMembersPerEntry != null &&
      count > entry.category.maxMembersPerEntry
    ) {
      throw new Error(
        `Required member count cannot exceed ${entry.category.maxMembersPerEntry}`,
      );
    }

    return await entry.update({ requiredMemberCount: count });
  }

  /**
   * 14. Captain xác nhận đội hình lần cuối.
   * Chỉ được confirm khi đã đủ thành viên và trong thời gian đăng ký.
   */
  async confirmLineup(captainId: number, entryId: number): Promise<Entry> {
    const entry = await Entry.findByPk(entryId, {
      include: [
        { model: TournamentCategory, include: [{ model: Tournament }] },
      ],
    });
    if (!entry) throw new Error("Entry not found");
    if (entry.captainId !== captainId) {
      throw new Error("Only the team captain can confirm the lineup");
    }
    if (entry.isConfirmed) {
      throw new Error("Lineup has already been confirmed");
    }

    const tournament = entry.category?.tournament;
    if (!tournament) throw new Error("Tournament not found");
    await assertRegistrationOpen(tournament);

    // Kiểm tra đủ thành viên
    if (
      entry.requiredMemberCount != null &&
      entry.currentMemberCount < entry.requiredMemberCount
    ) {
      throw new Error(
        `Cannot confirm lineup: need ${entry.requiredMemberCount} members, currently have ${entry.currentMemberCount}`,
      );
    }

    await entry.update({ isConfirmed: true, confirmedAt: new Date() });
    return entry;
  }

  /**
   * 15. Lọc danh sách entry đủ điều kiện tham gia thi đấu:
   * 1. Đủ số thành viên
   * 2. Captain đã xác nhận đội hình
   * 3. Đã thanh toán lệ phí (nếu category có lệ phí)
   *
   * Dùng bởi groupStanding.service trước khi chia bảng.
   */
  async getEligibleEntries(categoryId: number, options?: { skip?: number; limit?: number }): Promise<{
    eligible?: Entry[];
    ineligible?: { entry: Entry; reasons: string[] }[];
    pagination?: any;
  } | {
    eligible: Entry[];
    ineligible: { entry: Entry; reasons: string[] }[];
  }> {
    const category = await TournamentCategory.findByPk(categoryId);
    if (!category) throw new Error("Category not found");

    const entries = await Entry.findAll({
      where: { categoryId },
      include: [{ model: EntryMember, as: "members" }],
    });

    const eligible: Entry[] = [];
    const ineligible: { entry: Entry; reasons: string[] }[] = [];

    for (const entry of entries) {
      const reasons: string[] = [];

      // 1. Đủ số thành viên
      if (
        entry.requiredMemberCount != null &&
        entry.currentMemberCount < entry.requiredMemberCount
      ) {
        reasons.push(
          `Insufficient members: ${entry.currentMemberCount}/${entry.requiredMemberCount}`,
        );
      }

      // 2. Captain đã xác nhận đội hình
      if (!entry.isConfirmed) {
        reasons.push("Lineup not confirmed by captain");
      }

      // 3. Đã thanh toán lệ phí
      if (category.entryFee && category.entryFee > 0) {
        const payment = await Payment.findOne({
          where: { entryId: entry.id, status: "completed" },
        });
        if (!payment) {
          reasons.push("Entry fee not paid");
        }
      }

      if (reasons.length === 0) {
        eligible.push(entry);
      } else {
        ineligible.push({ entry, reasons });
      }
    }

    const skip = options?.skip || 0;
    const limit = options?.limit || 10;

    // If pagination is requested, combine and paginate the results
    if (options && (options.skip !== undefined || options.limit !== undefined)) {
      const combined = [...eligible, ...ineligible.map(item => item.entry)];
      const total = combined.length;
      const paginatedCombined = combined.slice(skip, skip + limit);

      const eligibleMap = new Set(eligible.map(e => e.id));
      const paginatedEligible = paginatedCombined.filter(e => eligibleMap.has(e.id));
      const paginatedIneligible = ineligible.filter(item =>
        paginatedCombined.some(e => e.id === item.entry.id)
      );

      const totalPages = Math.ceil(total / limit);
      const page = Math.floor(skip / limit) + 1;

      return {
        eligible: paginatedEligible,
        ineligible: paginatedIneligible,
        pagination: {
          total,
          page,
          limit,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      };
    }

    // Without pagination (backward compatibility)
    return { eligible, ineligible };
  }

  /**
   * 16. Xóa hàng loạt tất cả entry không đủ điều kiện khỏi DB.
   * Chỉ người quản lý giải được thực hiện, sau khi đóng đăng ký.
   * Trả về danh sách entryId đã xóa và lý do.
   */
  async disqualifyIneligibleEntries(
    organizerId: number,
    categoryId: number,
  ): Promise<{
    deletedCount: number;
    deleted: { entryId: number; reasons: string[] }[];
  }> {
    // Kiểm tra organizer — người tạo giải hoặc có role organizer
    const category = await getCategoryWithTournament(categoryId);
    const tournament = category.tournament!;

    if (tournament.createdBy !== organizerId) {
      throw new Error("Only the tournament organizer can disqualify entries");
    }

    await assertRegistrationClosed(tournament);

    // Lấy danh sách không đủ điều kiện
    const result = await this.getEligibleEntries(categoryId);
    const ineligible = Array.isArray(result)
      ? [] // fallback, should not happen
      : (result.ineligible || []);

    if (ineligible.length === 0) {
      return { deletedCount: 0, deleted: [] };
    }

    const ineligibleEntryIds = ineligible.map((i) => i.entry.id);

    await sequelize.transaction(async (t: Transaction) => {
      // Xóa theo đúng thứ tự FK

      // 1. JoinRequest
      await JoinRequest.destroy({
        where: { entryId: { [Op.in]: ineligibleEntryIds } },
        transaction: t,
      });

      // 2. Payment
      await Payment.destroy({
        where: { entryId: { [Op.in]: ineligibleEntryIds } },
        transaction: t,
      });

      // 3. EntryMember
      await EntryMember.destroy({
        where: { entryId: { [Op.in]: ineligibleEntryIds } },
        transaction: t,
      });

      // 4. Entry
      await Entry.destroy({
        where: { id: { [Op.in]: ineligibleEntryIds } },
        transaction: t,
      });
    });

    return {
      deletedCount: ineligible.length,
      deleted: ineligible.map((i) => ({
        entryId: i.entry.id,
        reasons: i.reasons,
      })),
    };
  }

  /**
   * 17. Lấy danh sách entries mà user tham gia (captain hoặc member) kèm role
   */
  async getUserEntries(
    userId: number,
    options: {
      skip?: number;
      limit?: number;
    } = {},
  ): Promise<{
    rows: Array<Entry & { userRole: "captain" | "member" }>;
    count: number;
  }> {
    const { skip = 0, limit = 10 } = options;

    // Lấy tất cả unique entry IDs mà user tham gia
    const userEntryIds = new Set<number>();

    // 1. Entries mà user là captain
    const captainEntries = await Entry.findAll({
      where: { captainId: userId },
      attributes: ["id"],
      raw: true,
    });

    captainEntries.forEach((entry) => userEntryIds.add(entry.id));

    // 2. Entries mà user là member
    const memberEntries = await EntryMember.findAll({
      where: { userId },
      attributes: ["entryId"],
      raw: true,
    });

    memberEntries.forEach((member) => userEntryIds.add(member.entryId));

    const allEntryIds = Array.from(userEntryIds);
    const count = allEntryIds.length;

    if (count === 0) {
      return { rows: [], count: 0 };
    }

    // Paginate results
    const paginatedEntryIds = allEntryIds.slice(skip, skip + limit);

    // Lấy entries với thông tin chi tiết kèm Tournament và TournamentCategory
    const entries = await Entry.findAll({
      where: { id: { [Op.in]: paginatedEntryIds } },
      include: [
        {
          model: TournamentCategory,
          include: [{ model: Tournament }],
        },
        { model: EntryMember, as: "members" },
      ],
    });

    // Thêm role cho mỗi entry
    const rowsWithRole = entries.map((entry) => ({
      ...entry.toJSON(),
      userRole: entry.captainId === userId ? ("captain" as const) : ("member" as const),
    }));

    return { rows: rowsWithRole, count };
  }

  /**
   * 18. Lấy role của user trong một entry cụ thể
   * Return: "captain" | "member" | null
   */
  async getUserRoleInEntry(entryId: number, userId: number): Promise<"captain" | "member" | null> {
    const entry = await Entry.findByPk(entryId, {
      attributes: ["id", "captainId"],
    });

    if (!entry) {
      return null;
    }

    // Check if user is captain
    if (entry.captainId === userId) {
      return "captain";
    }

    // Check if user is member
    const member = await EntryMember.findOne({
      where: { entryId, userId },
      attributes: ["id"],
    });

    if (member) {
      return "member";
    }

    return null;
  }
}

export default new EntryService();
