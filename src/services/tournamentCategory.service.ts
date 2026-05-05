import TournamentCategory from "../models/tournamentCategory.model";
import {
  CreateTournamentCategoryDto,
  UpdateTournamentCategoryDto,
} from "../dto/tournamentCategory.dto";
import { NotFoundError } from "../utils/errors";

export class TournamentCategoryService {
  /**
   * Validate gender based on type
   */
  private validateGender(type: string, gender?: string): void {
    if (gender === 'mixed' && type !== 'double') {
      throw new Error('Only double type category can have mixed gender');
    }
  }

  async create(data: CreateTournamentCategoryDto): Promise<TournamentCategory> {
    // Validate gender before creating
    if (data.gender) {
      this.validateGender(data.type, data.gender);
    }
    return await TournamentCategory.create(data as any);
  }

  async findAll(skip = 0, limit = 10): Promise<TournamentCategory[]> {
    return await TournamentCategory.findAll({
      offset: skip,
      limit,
    });
  }

  async findById(id: number): Promise<TournamentCategory | null> {
    return await TournamentCategory.findByPk(id);
  }

  async findByTournamentId(
    tournamentId: number,
    skip = 0,
    limit = 10
  ): Promise<TournamentCategory[]> {
    return await TournamentCategory.findAll({
      where: { tournamentId },
      offset: skip,
      limit,
    });
  }

  async update(
    id: number,
    data: UpdateTournamentCategoryDto
  ): Promise<[number, TournamentCategory[]]> {
    // Always check if category exists
    const currentCategory = await TournamentCategory.findByPk(id);
    if (!currentCategory) {
      throw new NotFoundError('Category not found', 'CATEGORY_NOT_FOUND');
    }

    // If updating gender or type, validate the combination
    if (data.gender !== undefined || data.type !== undefined) {
      const finalType = data.type || currentCategory.type;
      const finalGender = data.gender !== undefined ? data.gender : currentCategory.gender;

      if (finalGender) {
        this.validateGender(finalType, finalGender);
      }
    }

    return await TournamentCategory.update(data, {
      where: { id },
      returning: true,
    });
  }

  async delete(id: number): Promise<number> {
    return await TournamentCategory.destroy({ where: { id } });
  }
}

export default new TournamentCategoryService();