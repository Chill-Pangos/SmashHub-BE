import MatchSet from "../models/matchSet.model";
import { CreateMatchSetDto, UpdateMatchSetDto, UpdateMatchSetScoreDto } from "../dto/matchSet.dto";

export class MatchSetService {
  async create(data: CreateMatchSetDto): Promise<MatchSet> {
    return await MatchSet.create(data as any);
  }

  async findAll(skip = 0, limit = 10): Promise<MatchSet[]> {
    return await MatchSet.findAll({
      offset: skip,
      limit,
    });
  }

  async findById(id: number): Promise<MatchSet | null> {
    return await MatchSet.findByPk(id);
  }

  async findByMatchId(
    matchId: number,
    skip = 0,
    limit = 10
  ): Promise<MatchSet[]> {
    return await MatchSet.findAll({
      where: { matchId },
      offset: skip,
      limit,
      order: [["setNumber", "ASC"]],
    });
  }

  async update(
    id: number,
    data: UpdateMatchSetDto
  ): Promise<[number, MatchSet[]]> {
    return await MatchSet.update(data, {
      where: { id },
      returning: true,
    });
  }

  async delete(id: number): Promise<number> {
    return await MatchSet.destroy({ where: { id } });
  }

  /**
   * Validate điểm số cuối cùng của set theo quy tắc cầu lông:
   * - Đội nào đạt 11 điểm trước và đối kia < 10 thắng
   * - Từ 10-10 trở đi phải cách nhau 2 điểm
   * - Phải có người thắng (kết quả cuối cùng)
   */
  private validateFinalSetScore(entryAScore: number, entryBScore: number): { isValid: boolean; winner: 'A' | 'B'; error?: string } | { isValid: false; winner: null; error: string } {
    // Kiểm tra điểm số không âm
    if (entryAScore < 0 || entryBScore < 0) {
      return { isValid: false, winner: null, error: "Score cannot be negative" };
    }

    // Phải có ít nhất 1 đội đạt 11 điểm
    if (entryAScore < 11 && entryBScore < 11) {
      return { isValid: false, winner: null, error: "At least one team must reach 11 points" };
    }

    const maxScore = Math.max(entryAScore, entryBScore);
    const minScore = Math.min(entryAScore, entryBScore);
    const scoreDiff = maxScore - minScore;

    // Nếu điểm thấp < 10, người có điểm cao phải >= 11
    if (minScore < 10) {
      if (maxScore >= 11) {
        return { 
          isValid: true, 
          winner: entryAScore > entryBScore ? 'A' : 'B' 
        };
      }
      return { isValid: false, winner: null, error: "Invalid score: winner must have at least 11 points" };
    }

    // Từ 10-10 trở đi, phải cách nhau đúng 2 điểm
    if (minScore >= 10) {
      if (scoreDiff >= 2) {
        return { 
          isValid: true, 
          winner: entryAScore > entryBScore ? 'A' : 'B' 
        };
      }
      return { isValid: false, winner: null, error: `Invalid score: from 10-10 onwards, must win by 2 points (current difference: ${scoreDiff})` };
    }

    return { isValid: false, winner: null, error: "Invalid score" };
  }

  async createSetWithScore(data: UpdateMatchSetScoreDto): Promise<MatchSet> {
    // Kiểm tra match có tồn tại không
    const existingSets = await MatchSet.findAll({
      where: { matchId: data.matchId },
      order: [["setNumber", "DESC"]],
      limit: 1,
    });

    // Tính setNumber tiếp theo
    const nextSetNumber = existingSets.length > 0 ? existingSets[0]!.setNumber + 1 : 1;

    // Validate điểm số cuối cùng
    const validation = this.validateFinalSetScore(data.entryAScore, data.entryBScore);
    
    if (!validation.isValid) {
      throw new Error(validation.error || "Invalid score");
    }

    // Tạo matchSet mới với điểm số
    const matchSet = await MatchSet.create({
      matchId: data.matchId,
      setNumber: nextSetNumber,
      entryAScore: data.entryAScore,
      entryBScore: data.entryBScore,
    } as any);

    return matchSet;
  }
}

export default new MatchSetService();
