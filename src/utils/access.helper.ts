import Role from "../models/role.model";
import Tournament from "../models/tournament.model";
import TournamentCategory from "../models/tournamentCategory.model";
import User from "../models/user.model";
import { ForbiddenError, NotFoundError } from "./errors.helper";

export async function isAdmin(userId: number): Promise<boolean> {
  const count = await User.count({
    where: { id: userId },
    include: [
      {
        model: Role,
        as: "roles",
        where: { name: "admin" },
        required: true,
        through: { attributes: [] },
      },
    ],
  });
  return count > 0;
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
