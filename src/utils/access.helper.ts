import { Tournament, TournamentCategory } from "../modules/tournament/public.models";
import { identityReadService } from "../modules/identity/public.read";
import { ForbiddenError, NotFoundError } from "./errors.helper";

export async function isAdmin(userId: number): Promise<boolean> {
  return identityReadService.isAdmin(userId);
}

export async function assertAdmin(userId: number): Promise<void> {
  if (!(await isAdmin(userId))) {
    throw new ForbiddenError("Admin access required");
  }
}

export async function assertTournamentOwnerOrAdmin(
  userId: number,
  tournamentId: number,
): Promise<Tournament> {
  const tournament = await Tournament.findByPk(tournamentId);
  if (!tournament) throw new NotFoundError("Tournament not found");

  if (tournament.createdBy !== userId && !(await isAdmin(userId))) {
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
