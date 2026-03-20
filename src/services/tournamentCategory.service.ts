import TournamentCategory from "../models/tournamentCategory.model";
import {
  CreateTournamentCategoryDto,
  UpdateTournamentCategoryDto,
} from "../dto/tournamentCategory.dto";

export class TournamentCategoryService {
  /**
   * Validate gender based on type
   */
  private validateGender(type: string, gender?: string): void {
    if (gender === 'mixed' && type !== 'double') {
      throw new Error('Only double type content can have mixed gender');
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
    // If updating gender or type, validate the combination
    if (data.gender || data.type) {
      // Get current content to check existing values
      const currentContent = await TournamentCategory.findByPk(id);
      if (!currentContent) {
        throw new Error('Content not found');
      }

      const finalType = data.type || currentContent.type;
      const finalGender = data.gender !== undefined ? data.gender : currentContent.gender;

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
