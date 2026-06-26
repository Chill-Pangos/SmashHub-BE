import { Op } from "sequelize";
import type {
  CompetitionCategoryContext,
  CompetitionRefereeAssignment,
  CompetitionTournamentContext,
  TournamentCategoryRegistrationContext,
  TournamentForElo,
} from "../public.contracts";
import Tournament from "../models/tournament.model";
import TournamentCategory from "../models/tournamentCategory.model";
import TournamentReferee from "../models/tournamentReferee.model";
import type { RefereeRole } from "../models/referee.constants";

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

  async getCategoryCompetitionContext(
    categoryId: number,
  ): Promise<CompetitionCategoryContext | null> {
    const contexts = await this.getCategoriesCompetitionContext([categoryId]);
    return contexts[0] ?? null;
  }

  async getCategoriesCompetitionContext(
    categoryIds: number[],
  ): Promise<CompetitionCategoryContext[]> {
    const uniqueCategoryIds = Array.from(new Set(categoryIds));
    if (uniqueCategoryIds.length === 0) return [];

    const categories = await TournamentCategory.findAll({
      where: { id: { [Op.in]: uniqueCategoryIds } },
      include: [{ model: Tournament, as: "tournament" }],
    });

    return categories.map((category) => this.toCompetitionCategoryContext(category));
  }

  async getTournamentCompetitionContext(
    tournamentId: number,
  ): Promise<CompetitionTournamentContext | null> {
    const tournament = await Tournament.findByPk(tournamentId, {
      include: [{ model: TournamentCategory, as: "categories" }],
    });
    if (!tournament) return null;

    const context = this.toCompetitionTournamentContext(tournament);
    context.categories = (tournament.categories ?? []).map((category) =>
      this.toCompetitionCategoryContext(category as TournamentCategory, context),
    );

    return context;
  }

  async getCategoryIdsByTournamentId(tournamentId: number): Promise<number[]> {
    const categories = await TournamentCategory.findAll({
      where: { tournamentId },
      attributes: ["id"],
      raw: true,
    });

    return categories.map((category) => category.id);
  }

  async getTournamentRefereeIds(
    tournamentId: number,
    role?: RefereeRole,
  ): Promise<number[]> {
    const refs = await TournamentReferee.findAll({
      where: {
        tournamentId,
        ...(role ? { role } : {}),
      },
      attributes: ["refereeId"],
      raw: true,
    });

    return refs.map((ref) => ref.refereeId);
  }

  async getTournamentRefereeAssignments(
    tournamentId: number,
    role?: RefereeRole,
  ): Promise<CompetitionRefereeAssignment[]> {
    const refs = await TournamentReferee.findAll({
      where: {
        tournamentId,
        ...(role ? { role } : {}),
      },
      attributes: ["id", "tournamentId", "refereeId", "role"],
    });

    return refs.map((ref) => ({
      id: ref.id,
      tournamentId: ref.tournamentId,
      refereeId: ref.refereeId,
      role: ref.role,
    }));
  }

  async isTournamentReferee(
    tournamentId: number,
    userId: number,
    roles?: RefereeRole[],
  ): Promise<boolean> {
    const count = await TournamentReferee.count({
      where: {
        tournamentId,
        refereeId: userId,
        ...(roles && roles.length > 0 ? { role: { [Op.in]: roles } } : {}),
      },
    });

    return count > 0;
  }

  async getActiveTournamentIds(tournamentIds: number[]): Promise<number[]> {
    const uniqueTournamentIds = Array.from(new Set(tournamentIds));
    if (uniqueTournamentIds.length === 0) return [];

    const tournaments = await Tournament.findAll({
      where: {
        id: { [Op.in]: uniqueTournamentIds },
        status: { [Op.ne]: "cancelled" },
      },
      attributes: ["id"],
      raw: true,
    });

    return tournaments.map((tournament) => tournament.id);
  }

  async getAssignedChiefRefereeIds(): Promise<number[]> {
    const refs = await TournamentReferee.findAll({
      attributes: ["refereeId"],
      where: { role: "chief" },
      raw: true,
    });

    return refs.map((ref) => ref.refereeId);
  }

  private toCompetitionTournamentContext(tournament: Tournament): CompetitionTournamentContext {
    return {
      id: tournament.id,
      name: tournament.name,
      tier: tournament.tier,
      status: tournament.status,
      location: tournament.location,
      createdBy: tournament.createdBy,
    };
  }

  private toCompetitionCategoryContext(
    category: TournamentCategory,
    tournamentContext?: CompetitionTournamentContext,
  ): CompetitionCategoryContext {
    const tournament = tournamentContext ??
      this.toCompetitionTournamentContext(category.tournament as Tournament);
    const context: CompetitionCategoryContext = {
      id: category.id,
      tournamentId: category.tournamentId,
      name: category.name,
      type: category.type,
      maxEntries: category.maxEntries,
      maxSets: category.maxSets,
      teamFormat: category.teamFormat ?? null,
      minAge: category.minAge ?? null,
      maxAge: category.maxAge ?? null,
      minElo: category.minElo ?? null,
      maxElo: category.maxElo ?? null,
      maxMembersPerEntry: category.maxMembersPerEntry ?? null,
      gender: category.gender ?? null,
      isGroupStage: category.isGroupStage,
      entryFee: category.entryFee ?? null,
      tournament,
    };

    return context;
  }
}

export default new TournamentReadService();
