import { col, Op } from "sequelize";
import Entry from "../models/entry.model";
import EntryMember from "../models/entryMember.model";
import Payment from "../models/payment.model";
import type {
  CompetitionEntryMemberSummary,
  CompetitionEntrySummary,
  CompetitionEntryWithMembers,
  RegistrationEntryMemberSummary,
  RegistrationEntrySummary,
  RegistrationEntryWithMembers,
} from "../public.contracts";

export class RegistrationReadService {
  async getEntryCategoryIdsByUserId(userId: number): Promise<number[]> {
    const [captainEntries, memberRows] = await Promise.all([
      Entry.findAll({
        where: { captainId: userId },
        attributes: ["categoryId"],
        raw: true,
      }),
      EntryMember.findAll({
        where: { userId },
        attributes: ["entryId"],
        include: [
          {
            model: Entry,
            as: "entry",
            attributes: ["categoryId"],
            required: true,
          },
        ],
      }),
    ]);

    const categoryIds = new Set<number>();
    for (const entry of captainEntries) {
      categoryIds.add(entry.categoryId);
    }
    for (const member of memberRows) {
      const entry = member.entry as { categoryId?: number } | undefined;
      if (entry?.categoryId != null) categoryIds.add(entry.categoryId);
    }

    return [...categoryIds];
  }

  async getEntriesByCategoryIds(categoryIds: number[]): Promise<RegistrationEntrySummary[]> {
    const uniqueCategoryIds = Array.from(new Set(categoryIds));
    if (uniqueCategoryIds.length === 0) return [];

    const entries = await Entry.findAll({
      where: { categoryId: { [Op.in]: uniqueCategoryIds } },
      attributes: [
        "id",
        "categoryId",
        "captainId",
        "name",
        "isAcceptingMembers",
        "requiredMemberCount",
        "currentMemberCount",
        "isConfirmed",
        "confirmedAt",
      ],
    });

    return entries.map((entry) => this.toEntrySummary(entry));
  }

  async getCompetitionEntriesByIds(entryIds: number[]): Promise<CompetitionEntrySummary[]> {
    const uniqueEntryIds = Array.from(new Set(entryIds));
    if (uniqueEntryIds.length === 0) return [];

    const entries = await Entry.findAll({
      where: { id: { [Op.in]: uniqueEntryIds } },
    });

    return entries.map((entry) => this.toEntrySummary(entry));
  }

  async getCompetitionEntriesByCategoryId(categoryId: number): Promise<CompetitionEntrySummary[]> {
    const entries = await Entry.findAll({
      where: { categoryId },
      order: [["id", "ASC"]],
    });

    return entries.map((entry) => this.toEntrySummary(entry));
  }

  async getCompetitionEntryIdsByUserId(userId: number): Promise<number[]> {
    const members = await EntryMember.findAll({
      where: { userId },
      attributes: ["entryId"],
    });

    return Array.from(new Set(members.map((member) => member.entryId)));
  }

  async searchCompetitionEntryIdsByName(input: {
    name: string;
    categoryIds?: number[];
  }): Promise<number[]> {
    const query = input.name.trim();
    if (!query) return [];

    const uniqueCategoryIds = Array.from(new Set(input.categoryIds ?? []));
    const where: Record<string | symbol, unknown> = {
      name: { [Op.like]: `%${query}%` },
    };
    if (uniqueCategoryIds.length > 0) {
      where.categoryId = { [Op.in]: uniqueCategoryIds };
    }

    const entries = await Entry.findAll({
      where,
      attributes: ["id"],
    });

    return entries.map((entry) => entry.id);
  }

  async getEligibleEntriesByCategory(input: {
    categoryId: number;
    categoryType?: string;
    requireConfirmed?: boolean;
  }): Promise<CompetitionEntrySummary[]> {
    const where: Record<string, unknown> = { categoryId: input.categoryId };
    if (input.categoryType && input.categoryType !== "single") {
      where.currentMemberCount = { [Op.gte]: col("requiredMemberCount") };
    }
    if (input.requireConfirmed) {
      where.isConfirmed = true;
    }

    const entries = await Entry.findAll({
      where,
      order: [["id", "ASC"]],
    });

    return entries.map((entry) => this.toEntrySummary(entry));
  }

  async getEntryByNameInCategory(
    categoryId: number,
    name: string,
  ): Promise<CompetitionEntrySummary | null> {
    const entry = await Entry.findOne({
      where: { categoryId, name: { [Op.like]: `%${name.trim()}%` } },
    });

    return entry ? this.toEntrySummary(entry) : null;
  }

  async entryExistsInCategory(entryId: number, categoryId: number): Promise<boolean> {
    const count = await Entry.count({ where: { id: entryId, categoryId } });
    return count > 0;
  }

  async countEntriesByCategoryIds(categoryIds: number[]): Promise<number> {
    const uniqueCategoryIds = Array.from(new Set(categoryIds));
    if (uniqueCategoryIds.length === 0) return 0;
    return Entry.count({ where: { categoryId: { [Op.in]: uniqueCategoryIds } } });
  }

  async getEntryNamesByIds(entryIds: number[]): Promise<Array<{ id: number; name: string }>> {
    const entries = await this.getCompetitionEntriesByIds(entryIds);
    return entries.map((entry) => ({ id: entry.id, name: entry.name }));
  }

  async getEntriesWithMembersByIds(entryIds: number[]): Promise<RegistrationEntryWithMembers[]> {
    const uniqueEntryIds = Array.from(new Set(entryIds));
    if (uniqueEntryIds.length === 0) return [];

    const entries = await Entry.findAll({
      where: { id: { [Op.in]: uniqueEntryIds } },
      attributes: [
        "id",
        "categoryId",
        "captainId",
        "name",
        "isAcceptingMembers",
        "requiredMemberCount",
        "currentMemberCount",
        "isConfirmed",
        "confirmedAt",
      ],
      include: [
        {
          model: EntryMember,
          as: "members",
          attributes: ["id", "entryId", "userId", "eloAtEntry"],
        },
      ],
    });

    return entries.map((entry) => ({
      ...this.toEntrySummary(entry),
      members: ((entry.members ?? []) as EntryMember[]).map((member) =>
        this.toEntryMemberSummary(member),
      ),
    }));
  }

  async getEntryMembersByEntryIds(entryIds: number[]): Promise<RegistrationEntryMemberSummary[]> {
    const uniqueEntryIds = Array.from(new Set(entryIds));
    if (uniqueEntryIds.length === 0) return [];

    const members = await EntryMember.findAll({
      where: { entryId: { [Op.in]: uniqueEntryIds } },
      attributes: ["id", "entryId", "userId", "eloAtEntry"],
    });

    return members.map((member) => this.toEntryMemberSummary(member));
  }

  async getCompetitionEntryMembersByIds(
    memberIds: number[],
  ): Promise<CompetitionEntryMemberSummary[]> {
    const uniqueMemberIds = Array.from(new Set(memberIds));
    if (uniqueMemberIds.length === 0) return [];

    const members = await EntryMember.findAll({
      where: { id: { [Op.in]: uniqueMemberIds } },
      include: [{ model: Entry, as: "entry" }],
    });

    return members.map((member) => {
      const summary: CompetitionEntryMemberSummary = this.toEntryMemberSummary(member);
      if (member.entry) {
        summary.entry = this.toEntrySummary(member.entry as Entry);
      }
      return summary;
    });
  }

  async getCompetitionEntryMembersByEntryIds(
    entryIds: number[],
  ): Promise<CompetitionEntryMemberSummary[]> {
    const uniqueEntryIds = Array.from(new Set(entryIds));
    if (uniqueEntryIds.length === 0) return [];

    const members = await EntryMember.findAll({
      where: { entryId: { [Op.in]: uniqueEntryIds } },
      include: [{ model: Entry, as: "entry" }],
      order: [["id", "ASC"]],
    });

    return members.map((member) => {
      const summary: CompetitionEntryMemberSummary = this.toEntryMemberSummary(member);
      if (member.entry) {
        summary.entry = this.toEntrySummary(member.entry as Entry);
      }
      return summary;
    });
  }

  async getCompetitionEntriesWithMembersByIds(
    entryIds: number[],
  ): Promise<CompetitionEntryWithMembers[]> {
    const entries = await this.getCompetitionEntriesByIds(entryIds);
    const members = await this.getCompetitionEntryMembersByEntryIds(
      entries.map((entry) => entry.id),
    );
    const membersByEntryId = new Map<number, CompetitionEntryMemberSummary[]>();

    for (const member of members) {
      const group = membersByEntryId.get(member.entryId) ?? [];
      group.push(member);
      membersByEntryId.set(member.entryId, group);
    }

    return entries.map((entry) => ({
      ...entry,
      members: membersByEntryId.get(entry.id) ?? [],
    }));
  }

  async getCompletedPaymentEntryIds(entryIds: number[]): Promise<number[]> {
    const uniqueEntryIds = Array.from(new Set(entryIds));
    if (uniqueEntryIds.length === 0) return [];

    const payments = await Payment.findAll({
      where: {
        entryId: { [Op.in]: uniqueEntryIds },
        status: "completed",
      },
      attributes: ["entryId"],
      raw: true,
    });

    return Array.from(new Set(payments.map((payment) => payment.entryId)));
  }

  async userCompetesInCategories(userId: number, categoryIds: number[]): Promise<boolean> {
    const uniqueCategoryIds = Array.from(new Set(categoryIds));
    if (uniqueCategoryIds.length === 0) return false;

    const asCaptain = await Entry.findOne({
      where: {
        categoryId: { [Op.in]: uniqueCategoryIds },
        captainId: userId,
      },
      attributes: ["id"],
    });
    if (asCaptain) return true;

    const asMember = await EntryMember.findOne({
      where: { userId },
      attributes: ["entryId"],
      include: [
        {
          model: Entry,
          as: "entry",
          where: { categoryId: { [Op.in]: uniqueCategoryIds } },
          required: true,
          attributes: ["id"],
        },
      ],
    });

    return Boolean(asMember);
  }

  async getParticipantUserIdsByCategoryIds(categoryIds: number[]): Promise<number[]> {
    const entries = await this.getEntriesByCategoryIds(categoryIds);
    const entryIds = entries.map((entry) => entry.id);
    const members = await this.getEntryMembersByEntryIds(entryIds);
    const userIds = new Set<number>();

    for (const entry of entries) {
      if (entry.captainId != null) userIds.add(entry.captainId);
    }
    for (const member of members) {
      userIds.add(member.userId);
    }

    return [...userIds];
  }

  private toEntrySummary(entry: Entry): RegistrationEntrySummary {
    const plain = entry.get({ plain: true }) as Record<string, unknown>;
    const summary: RegistrationEntrySummary = {
      id: entry.id,
      categoryId: entry.categoryId,
      captainId: entry.captainId ?? null,
      name: entry.name,
      isAcceptingMembers: entry.isAcceptingMembers,
      requiredMemberCount: entry.requiredMemberCount ?? null,
      currentMemberCount: entry.currentMemberCount,
      isConfirmed: entry.isConfirmed,
      confirmedAt: entry.confirmedAt ?? null,
    };
    if (plain.createdAt instanceof Date) summary.createdAt = plain.createdAt;
    if (plain.updatedAt instanceof Date) summary.updatedAt = plain.updatedAt;
    return summary;
  }

  private toEntryMemberSummary(member: EntryMember): RegistrationEntryMemberSummary {
    const plain = member.get({ plain: true }) as Record<string, unknown>;
    const summary: RegistrationEntryMemberSummary = {
      id: member.id,
      entryId: member.entryId,
      userId: member.userId,
      eloAtEntry: member.eloAtEntry,
    };
    if (plain.createdAt instanceof Date) summary.createdAt = plain.createdAt;
    if (plain.updatedAt instanceof Date) summary.updatedAt = plain.updatedAt;
    return summary;
  }
}

export default new RegistrationReadService();
