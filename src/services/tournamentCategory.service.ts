import TournamentCategory from "../models/tournamentCategory.model";
import {
  CreateTournamentCategoryDto,
  UpdateTournamentCategoryDto,
} from "../dto/tournamentCategory.dto";
import { ForbiddenError, NotFoundError } from "../utils/errors.helper";
import { removeUndefinedFields } from "../utils/object.helper";
import { assertCategoryOwnerOrAdmin, assertTournamentOwnerOrAdmin } from "../utils/access.helper";

export class TournamentCategoryService {
  /**
   * Validate gender based on type
   */
  private validateGender(type: string, gender?: string): void {
    if (gender === 'mixed' && type !== 'double') {
      throw new ForbiddenError('Only double type category can have mixed gender');
    }
  }

  async create(
    data: CreateTournamentCategoryDto,
    userId: number,
  ): Promise<TournamentCategory> {
    await assertTournamentOwnerOrAdmin(userId, data.tournamentId);
    // Validate gender before creating
    if (data.gender) {
      this.validateGender(data.type, data.gender);
    }
    return await TournamentCategory.create(data as any);
  }

  async findAll(offset = 0, limit = 10): Promise<TournamentCategory[]> {
    return await TournamentCategory.findAll({
      offset,
      limit,
    });
  }

  async findById(id: number): Promise<TournamentCategory | null> {
    return await TournamentCategory.findByPk(id);
  }

  async findByTournamentId(
    tournamentId: number,
    offset = 0,
    limit = 10
  ): Promise<TournamentCategory[]> {
    return await TournamentCategory.findAll({
      where: { tournamentId },
      offset,
      limit,
    });
  }

  async update(
    id: number,
    data: UpdateTournamentCategoryDto,
    userId: number,
  ): Promise<[number, TournamentCategory[]]> {
    const updateData = removeUndefinedFields(data as Record<string, unknown>) as UpdateTournamentCategoryDto;
    await assertCategoryOwnerOrAdmin(userId, id);

    // Always check if category exists
    const currentCategory = await TournamentCategory.findByPk(id);
    if (!currentCategory) {
      throw new NotFoundError('Category not found', 'CATEGORY_NOT_FOUND');
    }

    // If updating gender or type, validate the combination
    if (updateData.gender !== undefined || updateData.type !== undefined) {
      const finalType = updateData.type || currentCategory.type;
      const finalGender = updateData.gender !== undefined ? updateData.gender : currentCategory.gender;

      if (finalGender) {
        this.validateGender(finalType, finalGender);
      }
    }

    return await TournamentCategory.update(updateData, {
      where: { id },
      returning: true,
    });
  }

  async delete(id: number, userId: number): Promise<number> {
    await assertCategoryOwnerOrAdmin(userId, id);
    return await TournamentCategory.destroy({ where: { id } });
  }
}

export default new TournamentCategoryService();
