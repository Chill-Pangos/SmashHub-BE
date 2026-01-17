import TournamentContent from "../models/tournamentContent.model";
import {
  CreateTournamentContentDto,
  UpdateTournamentContentDto,
} from "../dto/tournamentContent.dto";

export class TournamentContentService {
  /**
   * Validate gender based on type
   */
  private validateGender(type: string, gender?: string): void {
    if (gender === 'mixed' && type !== 'double') {
      throw new Error('Only double type content can have mixed gender');
    }
  }

  async create(data: CreateTournamentContentDto): Promise<TournamentContent> {
    // Validate gender before creating
    if (data.gender) {
      this.validateGender(data.type, data.gender);
    }
    return await TournamentContent.create(data as any);
  }

  async findAll(skip = 0, limit = 10): Promise<TournamentContent[]> {
    return await TournamentContent.findAll({
      offset: skip,
      limit,
    });
  }

  async findById(id: number): Promise<TournamentContent | null> {
    return await TournamentContent.findByPk(id);
  }

  async findByTournamentId(
    tournamentId: number,
    skip = 0,
    limit = 10
  ): Promise<TournamentContent[]> {
    return await TournamentContent.findAll({
      where: { tournamentId },
      offset: skip,
      limit,
    });
  }

  async update(
    id: number,
    data: UpdateTournamentContentDto
  ): Promise<[number, TournamentContent[]]> {
    // If updating gender or type, validate the combination
    if (data.gender || data.type) {
      // Get current content to check existing values
      const currentContent = await TournamentContent.findByPk(id);
      if (!currentContent) {
        throw new Error('Content not found');
      }

      const finalType = data.type || currentContent.type;
      const finalGender = data.gender !== undefined ? data.gender : currentContent.gender;

      if (finalGender) {
        this.validateGender(finalType, finalGender);
      }
    }

    return await TournamentContent.update(data, {
      where: { id },
      returning: true,
    });
  }

  async delete(id: number): Promise<number> {
    return await TournamentContent.destroy({ where: { id } });
  }
}

export default new TournamentContentService();
