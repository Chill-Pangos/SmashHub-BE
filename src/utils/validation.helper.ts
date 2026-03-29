import TournamentCategory from "../models/tournamentCategory.model";
import { Transaction } from "sequelize";

export class ValidationHelper {
  /**
   * Verify category capacity
   */
  static async verifyCategoryCapacity(
    categoryId: number,
    currentCount: number,
    transaction?: Transaction | null
  ): Promise<void> {
    const category = await TournamentCategory.findByPk(categoryId, {
      ...(transaction && { transaction }),
    });

    if (!category) {
      throw new Error('Category not found');
    }

    if (currentCount >= category.maxEntries) {
      throw new Error('Maximum number of entries has been reached for this category');
    }
  }
}
