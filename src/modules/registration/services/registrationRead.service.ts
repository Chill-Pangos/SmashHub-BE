import { Op } from "sequelize";
import Entry from "../models/entry.model";
import EntryMember from "../models/entryMember.model";
import Payment from "../models/payment.model";
import type {
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
        "requiredMemberCount",
        "currentMemberCount",
        "isConfirmed",
      ],
    });

    return entries.map((entry) => this.toEntrySummary(entry));
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
        "requiredMemberCount",
        "currentMemberCount",
        "isConfirmed",
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
    return {
      id: entry.id,
      categoryId: entry.categoryId,
      captainId: entry.captainId ?? null,
      name: entry.name,
      requiredMemberCount: entry.requiredMemberCount ?? null,
      currentMemberCount: entry.currentMemberCount,
      isConfirmed: entry.isConfirmed,
    };
  }

  private toEntryMemberSummary(member: EntryMember): RegistrationEntryMemberSummary {
    return {
      id: member.id,
      entryId: member.entryId,
      userId: member.userId,
      eloAtEntry: member.eloAtEntry,
    };
  }
}

export default new RegistrationReadService();
