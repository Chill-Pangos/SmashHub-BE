import { Op, WhereOptions, Transaction } from "sequelize";
import { sequelize } from "../../../config/database";
import Entry from "../models/entry.model";
import EntryMember from "../models/entryMember.model";
import JoinRequest from "../models/joinRequest.model";
import Payment from "../models/payment.model";
import { notificationService, NotificationTemplates } from "../../notification/public.services";
import { removeUndefinedFields } from "../../../utils/object.helper";
import { identityReadService } from "../../identity/public.read";
import { rankingReadService } from "../../ranking/public.read";
import { tournamentReadService } from "../../tournament/public.read";
import { competitionReadService } from "../../competition/public.read";
import type { RegistrationUserSummary } from "../../identity/public.contracts";
import type {
  TournamentCategoryRegistrationContext,
  TournamentRegistrationContext,
} from "../../tournament/public.contracts";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function setAssociation(
  instance: { setDataValue?: (key: string, value: unknown) => void },
  key: string,
  value: unknown,
): void {
  if (instance.setDataValue) {
    instance.setDataValue(key, value);
    return;
  }
  (instance as Record<string, unknown>)[key] = value;
}

function asNumber(value: number | string | null | undefined): number {
  if (value == null) return 0;
  return typeof value === "number" ? value : Number(value);
}

function userMap(users: RegistrationUserSummary[]): Map<number, RegistrationUserSummary> {
  return new Map(users.map((user) => [user.id, user]));
}

function categoryMap(
  categories: TournamentCategoryRegistrationContext[],
): Map<number, TournamentCategoryRegistrationContext> {
  return new Map(categories.map((category) => [category.id, category]));
}

async function attachCaptains(entries: Entry[]): Promise<void> {
  const captainIds = entries
    .map((entry) => entry.captainId)
    .filter((id): id is number => id != null);
  const users = userMap(await identityReadService.getRegistrationUsersByIds(captainIds));

  for (const entry of entries) {
    setAssociation(entry, "captain", entry.captainId ? users.get(entry.captainId) ?? null : null);
  }
}

export async function attachMemberUsers(members: EntryMember[]): Promise<void> {
  const users = userMap(
    await identityReadService.getRegistrationUsersByIds(members.map((member) => member.userId)),
  );

  for (const member of members) {
    setAssociation(member, "user", users.get(member.userId) ?? null);
  }
}

async function attachEntryMembers(entries: Entry[]): Promise<void> {
  const entryIds = entries.map((entry) => entry.id);
  if (entryIds.length === 0) return;

  const members = await EntryMember.findAll({
    where: { entryId: { [Op.in]: entryIds } },
    order: [["createdAt", "ASC"]],
  });
  await attachMemberUsers(members);

  const membersByEntryId = new Map<number, EntryMember[]>();
  for (const member of members) {
    const list = membersByEntryId.get(member.entryId) ?? [];
    list.push(member);
    membersByEntryId.set(member.entryId, list);
  }

  for (const entry of entries) {
    setAssociation(entry, "members", membersByEntryId.get(entry.id) ?? []);
  }
}

async function attachCategories(entries: Entry[]): Promise<void> {
  const categories = categoryMap(
    await tournamentReadService.getCategoriesRegistrationContext(
      entries.map((entry) => entry.categoryId),
    ),
  );

  for (const entry of entries) {
    setAssociation(entry, "category", categories.get(entry.categoryId) ?? null);
  }
}

async function attachJoinRequestUsers(joinRequests: JoinRequest[]): Promise<void> {
  const users = userMap(
    await identityReadService.getRegistrationUsersByIds(
      joinRequests.map((request) => request.userId),
    ),
  );

  for (const request of joinRequests) {
    setAssociation(request, "user", users.get(request.userId) ?? null);
  }
}

async function attachEntryDetails(entry: Entry): Promise<Entry> {
  await Promise.all([
    attachCategories([entry]),
    attachCaptains([entry]),
    attachEntryMembers([entry]),
  ]);
  return entry;
}

export async function getCategoryWithTournament(
  categoryId: number,
): Promise<TournamentCategoryRegistrationContext> {
  const category = await tournamentReadService.getCategoryRegistrationContext(categoryId);
  if (!category) throw new Error("Category not found");
  return category;
}

export async function getEntryCategory(entry: Entry): Promise<TournamentCategoryRegistrationContext> {
  return getCategoryWithTournament(entry.categoryId);
}

export async function assertRegistrationOpen(
  tournament: TournamentRegistrationContext,
): Promise<void> {
  const now = new Date();
  const registrationWindow = await competitionReadService.getRegistrationWindow(tournament.id);
  const regStart = registrationWindow?.registrationStartDate;
  const regEnd = registrationWindow?.registrationEndDate;

  if (!regStart || !regEnd) {
    throw new Error("Registration window is not configured for this tournament");
  }

  if (now < regStart || now > regEnd) {
    throw new Error("Registration is not open at this time");
  }
}

export async function assertRegistrationClosed(
  tournament: TournamentRegistrationContext,
): Promise<void> {
  const registrationWindow = await competitionReadService.getRegistrationWindow(tournament.id);
  const regEnd = registrationWindow?.registrationEndDate;

  if (!regEnd) {
    throw new Error("Registration end date is not configured for this tournament");
  }

  if (new Date() <= regEnd) {
    throw new Error("Registration must be closed before disqualifying entries");
  }
}

export async function assertUserEligible(
  user: RegistrationUserSummary,
  category: TournamentCategoryRegistrationContext,
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
  const elo = await rankingReadService.getUserElo(user.id);

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

export async function assertNotAlreadyRegistered(
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
        as: "entry",
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
  async searchByName(
    name: string,
    options: { offset?: number; limit?: number } = {},
  ): Promise<{ entries: Entry[]; pagination: any }> {
    const { offset = 0, limit = 10 } = options;
    const query = name.trim();

    const { count, rows } = await Entry.findAndCountAll({
      where: {
        name: { [Op.like]: `%${query}%` },
      },
      offset,
      limit,
      order: [["name", "ASC"]],
      distinct: true,
    });
    await Promise.all([attachCategories(rows), attachCaptains(rows)]);

    const totalPages = Math.ceil(count / limit);
    const page = Math.floor(offset / limit) + 1;

    return {
      entries: rows,
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
    entryName?: string,
  ): Promise<{ entry: Entry; message: string }> {
    const category = await getCategoryWithTournament(categoryId);
    const tournament = category.tournament!;

    await assertRegistrationOpen(tournament);

    const user = await identityReadService.getRegistrationUser(userId);
    if (!user) throw new Error("User not found");
    const defaultEntryName = `${user.firstName} ${user.lastName}`.trim() || `Entry ${user.id}`;
    const name = entryName?.trim() || defaultEntryName;

    await assertUserEligible(user, category);
    await assertNotAlreadyRegistered(userId, categoryId);

    // ── Single: tạo entry và thêm member luôn ─────────────────────────────
    if (category.type === "single") {
      const entry = await sequelize.transaction(async (t) => {
        const newEntry = await Entry.create(
          {
            categoryId,
            captainId: userId,
            name,
            isAcceptingMembers: false,
            requiredMemberCount: 1,
            currentMemberCount: 1,
          },
          { transaction: t },
        );

        const eloAtEntry = await rankingReadService.getUserElo(userId);
        await EntryMember.create(
          {
            entryId: newEntry.id,
            userId,
            eloAtEntry,
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
            name,
            isAcceptingMembers: true,
            requiredMemberCount,
            currentMemberCount: 1,
          },
          { transaction: t },
        );

        const eloAtEntry = await rankingReadService.getUserElo(userId);
        await EntryMember.create(
          {
            entryId: newEntry.id,
            userId,
            eloAtEntry,
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

      const joinRequest = await JoinRequest.create({
        entryId: targetEntryId,
        userId,
        type: "requested",
      });

      const requesterName = `${user.firstName} ${user.lastName}`.trim();

      if (targetEntry.captainId) {
        await notificationService.notifyUser(targetEntry.captainId, {
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
   * 4. Lấy danh sách đội đã đăng ký (có filter)
   */
  async findByCategoryId(
    categoryId: number,
    options: {
      offset?: number;
      limit?: number;
      isFull?: boolean;
      isAcceptingMembers?: boolean;
      captainName?: string;
    } = {},
  ): Promise<{ rows: Entry[]; count: number }> {
    const {
      offset = 0,
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

    if (captainName?.trim()) {
      const captainIds = await identityReadService.searchUserIdsByName(captainName);
      if (captainIds.length === 0) return { rows: [], count: 0 };
      where.captainId = { [Op.in]: captainIds };
    }

    const result = await Entry.findAndCountAll({
      where,
      offset,
      limit,
      distinct: true,
    });
    await Promise.all([attachCaptains(result.rows), attachEntryMembers(result.rows)]);
    return result;
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
          as: "entry",
        },
      ],
    });
    if (!joinRequest) throw new Error("Join request not found");
    if (joinRequest.status !== "pending") {
      throw new Error("This join request has already been responded to");
    }

    const entry = joinRequest.entry!;
    const category = await getEntryCategory(entry);
    setAssociation(entry, "category", category);
    if (entry.captainId !== captainId) {
      throw new Error("Only the team captain can respond to join requests");
    }

    await assertRegistrationOpen(category.tournament);

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
      category.maxMembersPerEntry != null &&
      entry.currentMemberCount >= category.maxMembersPerEntry
    ) {
      throw new Error(
        `Team cannot exceed ${category.maxMembersPerEntry} members`,
      );
    }

    // Re-validate điều kiện user tại thời điểm approve
    const user = await identityReadService.getRegistrationUser(joinRequest.userId);
    if (!user) throw new Error("User not found");
    await assertUserEligible(user, category);
    await assertNotAlreadyRegistered(joinRequest.userId, entry.categoryId);

    await sequelize.transaction(async (t) => {
      const eloAtEntry = await rankingReadService.getUserElo(joinRequest.userId);

      await EntryMember.create(
        {
          entryId: entry.id,
          userId: joinRequest.userId,
          eloAtEntry,
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
    options?: { offset?: number; limit?: number }
  ): Promise<{ requests?: JoinRequest[], joinRequests?: JoinRequest[], pagination?: any } | JoinRequest[]> {
    const entry = await Entry.findByPk(entryId);
    if (!entry) throw new Error("Entry not found");
    if (entry.captainId !== captainId) {
      throw new Error("Only the team captain can view join requests");
    }

    const offset = options?.offset || 0;
    const limit = options?.limit || 10;

    // If pagination is requested
    if (options && (options.offset !== undefined || options.limit !== undefined)) {
      const { count, rows } = await JoinRequest.findAndCountAll({
        where: {
          entryId,
          ...(status ? { status } : {}),
        },
        order: [["createdAt", "DESC"]],
        offset,
        limit: limit,
      });
      await attachJoinRequestUsers(rows);

      const totalPages = Math.ceil(count / limit);
      const page = Math.floor(offset / limit) + 1;

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
    const rows = await JoinRequest.findAll({
      where: {
        entryId,
        ...(status ? { status } : {}),
      },
      order: [["createdAt", "DESC"]],
    });
    await attachJoinRequestUsers(rows);
    return rows;
  }

  /**
   * 7. Lấy chi tiết 1 entry
   */
  async getById(entryId: number): Promise<Entry> {
    const entry = await Entry.findByPk(entryId);
    if (!entry) throw new Error("Entry not found");
    return attachEntryDetails(entry);
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
    const entry = await Entry.findByPk(entryId);
    if (!entry) throw new Error("Entry not found");
    if (entry.captainId !== captainId) {
      throw new Error("Only the team captain can update the entry");
    }

    const category = await getEntryCategory(entry);
    setAssociation(entry, "category", category);
    await assertRegistrationOpen(category.tournament);

    // Kiểm tra requiredMemberCount nếu thay đổi
    if (data.requiredMemberCount != null) {
      if (category.type === "single") {
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
        category.type === "team" &&
        category.maxMembersPerEntry != null &&
        data.requiredMemberCount > category.maxMembersPerEntry
      ) {
        throw new Error(
          `Required member count cannot exceed ${category.maxMembersPerEntry}`,
        );
      }
    }

    const updated = await entry.update(removeUndefinedFields(data as Record<string, unknown>));
    setAssociation(updated, "category", category);
    return updated;
  }

  /**
   * 9. Xóa entry (chỉ captain, phải trong thời gian đăng ký)
   */
  async delete(captainId: number, entryId: number): Promise<void> {
    const entry = await Entry.findByPk(entryId);
    if (!entry) throw new Error("Entry not found");
    if (entry.captainId !== captainId) {
      throw new Error("Only the team captain can delete the entry");
    }

    const category = await getEntryCategory(entry);
    await assertRegistrationOpen(category.tournament);

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
    const entry = await Entry.findByPk(entryId);
    if (!entry) throw new Error("Entry not found");
    if (entry.captainId !== currentCaptainId) {
      throw new Error("Only the current captain can transfer captaincy");
    }

    const category = await getEntryCategory(entry);
    setAssociation(entry, "category", category);
    await assertRegistrationOpen(category.tournament);

    // Kiểm tra new captain là member của entry
    const newCaptainMember = await EntryMember.findOne({
      where: { entryId, userId: newCaptainId },
    });
    if (!newCaptainMember) {
      throw new Error("New captain must be a member of the entry");
    }

    const newCaptain = await identityReadService.getRegistrationUser(newCaptainId);
    if (!newCaptain) throw new Error("User not found");

    const updated = await entry.update({ captainId: newCaptainId });
    setAssociation(updated, "category", category);
    return updated;
  }

  /**
   * 13. Set số thành viên cần (chỉ cho team category)
   */
  async setRequiredMemberCount(
    captainId: number,
    entryId: number,
    count: number,
  ): Promise<Entry> {
    const entry = await Entry.findByPk(entryId);
    if (!entry) throw new Error("Entry not found");
    if (entry.captainId !== captainId) {
      throw new Error("Only the team captain can set required member count");
    }

    const category = await getEntryCategory(entry);
    setAssociation(entry, "category", category);

    if (category.type !== "team") {
      throw new Error("Required member count can only be set for team entries");
    }

    await assertRegistrationOpen(category.tournament);

    // Kiểm tra count >= currentMemberCount
    if (count < entry.currentMemberCount) {
      throw new Error(
        "Required member count cannot be less than current member count",
      );
    }

    // Kiểm tra maxMembersPerEntry
    if (
      category.maxMembersPerEntry != null &&
      count > category.maxMembersPerEntry
    ) {
      throw new Error(
        `Required member count cannot exceed ${category.maxMembersPerEntry}`,
      );
    }

    const updated = await entry.update({ requiredMemberCount: count });
    setAssociation(updated, "category", category);
    return updated;
  }

  /**
   * 14. Captain xác nhận đội hình lần cuối.
   * Chỉ được confirm khi đã đủ thành viên và trong thời gian đăng ký.
   */
  async confirmLineup(captainId: number, entryId: number): Promise<Entry> {
    const entry = await Entry.findByPk(entryId);
    if (!entry) throw new Error("Entry not found");
    if (entry.captainId !== captainId) {
      throw new Error("Only the team captain can confirm the lineup");
    }
    if (entry.isConfirmed) {
      throw new Error("Lineup has already been confirmed");
    }

    const category = await getEntryCategory(entry);
    setAssociation(entry, "category", category);
    await assertRegistrationOpen(category.tournament);

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
    setAssociation(entry, "category", category);
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
  async getEligibleEntries(categoryId: number, options?: { offset?: number; limit?: number }): Promise<{
    eligible?: Entry[];
    ineligible?: { entry: Entry; reasons: string[] }[];
    pagination?: any;
  } | {
    eligible: Entry[];
    ineligible: { entry: Entry; reasons: string[] }[];
  }> {
    const category = await getCategoryWithTournament(categoryId);

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
      if (asNumber(category.entryFee) > 0) {
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

    const offset = options?.offset || 0;
    const limit = options?.limit || 10;

    // If pagination is requested, combine and paginate the results
    if (options && (options.offset !== undefined || options.limit !== undefined)) {
      const combined = [...eligible, ...ineligible.map(item => item.entry)];
      const total = combined.length;
      const paginatedCombined = combined.slice(offset, offset + limit);

      const eligibleMap = new Set(eligible.map(e => e.id));
      const paginatedEligible = paginatedCombined.filter(e => eligibleMap.has(e.id));
      const paginatedIneligible = ineligible.filter(item =>
        paginatedCombined.some(e => e.id === item.entry.id)
      );

      const totalPages = Math.ceil(total / limit);
      const page = Math.floor(offset / limit) + 1;

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
      offset?: number;
      limit?: number;
    } = {},
  ): Promise<{
    rows: Array<Entry & { userRole: "captain" | "member" }>;
    count: number;
  }> {
    const { offset = 0, limit = 10 } = options;

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
    const paginatedEntryIds = allEntryIds.slice(offset, offset + limit);

    const entries = await Entry.findAll({
      where: { id: { [Op.in]: paginatedEntryIds } },
    });
    await Promise.all([attachCategories(entries), attachEntryMembers(entries)]);

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
