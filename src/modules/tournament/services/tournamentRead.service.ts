import { Op } from "sequelize";
import type {
  TournamentCategoryRegistrationContext,
  TournamentForElo,
} from "../public.contracts";
import Tournament from "../models/tournament.model";
import TournamentCategory from "../models/tournamentCategory.model";

export class TournamentReadService {
  async getTournamentForElo(tournamentId: number): Promise<TournamentForElo | null> {
    const tournament = await Tournament.findByPk(tournamentId, {
      attributes: ["id", "tier", "status"],
    });
    if (!tournament) return null;

    return {
      id: tournament.id,
      tier: tournament.tier,
      status: tournament.status,
    };
  }

  async getCategoryRegistrationContext(
    categoryId: number,
  ): Promise<TournamentCategoryRegistrationContext | null> {
    const contexts = await this.getCategoriesRegistrationContext([categoryId]);
    return contexts[0] ?? null;
  }

  async getCategoriesRegistrationContext(
    categoryIds: number[],
  ): Promise<TournamentCategoryRegistrationContext[]> {
    const uniqueCategoryIds = Array.from(new Set(categoryIds));
    if (uniqueCategoryIds.length === 0) return [];

    const categories = await TournamentCategory.findAll({
      where: { id: { [Op.in]: uniqueCategoryIds } },
      include: [{ model: Tournament, as: "tournament" }],
    });

    return categories.map((category) =>
      category.get({ plain: true }) as TournamentCategoryRegistrationContext
    );
  }

  async getCategoryPaymentContext(
    categoryId: number,
  ): Promise<TournamentCategoryRegistrationContext | null> {
    return this.getCategoryRegistrationContext(categoryId);
  }
}

export default new TournamentReadService();
