import { identityReadService } from "../../identity/public.read";
import { ForbiddenError, NotFoundError } from "../../../utils/errors.helper";
import Tournament from "../models/tournament.model";
import TournamentCategory from "../models/tournamentCategory.model";

export async function assertTournamentOwnerOrAdmin(
  userId: number,
  tournamentId: number,
): Promise<Tournament> {
  const tournament = await Tournament.findByPk(tournamentId);
  if (!tournament) throw new NotFoundError("Tournament not found");

  if (tournament.createdBy !== userId && !(await identityReadService.isAdmin(userId))) {
    throw new ForbiddenError("Only the tournament organizer or admin can perform this action");
  }

  return tournament;
}

export async function assertCategoryOwnerOrAdmin(
  userId: number,
  categoryId: number,
): Promise<TournamentCategory> {
  const category = await TournamentCategory.findByPk(categoryId);
  if (!category) throw new NotFoundError("Category not found");

  await assertTournamentOwnerOrAdmin(userId, category.tournamentId);
  return category;
}
