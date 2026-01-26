import MatchSet from "../models/matchSet.model";
import { CreateMatchSetDto, UpdateMatchSetDto, UpdateMatchSetScoreDto } from "../dto/matchSet.dto";
import Match from "../models/match.model";
import Schedule from "../models/schedule.model";
import TournamentContent from "../models/tournamentContent.model";

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
    // Lấy thông tin match để kiểm tra maxSets và status
    const matchInstance = await Match.findByPk(data.matchId, {
      include: [
        {
          model: Schedule,
          include: [
            {
              model: TournamentContent,
            }
          ],
        },
      ],
    });

    const match = matchInstance?.get({ plain: true }) as any;

    if (!match) {
      throw new Error("Match not found");
    }

    const schedule = match.schedule;
    if (!schedule || !schedule.tournamentContent) {
      throw new Error("Cannot find tournament information for this match");
    }

    const maxSets = schedule.tournamentContent.maxSets;

    // Kiểm tra match phải đang in_progress
    if (match.status !== "in_progress") {
      throw new Error(`Cannot add set. Match status is ${match.status}, must be in_progress`);
    }

    // Lấy danh sách các set hiện có
    const existingSets = await MatchSet.findAll({
      where: { matchId: data.matchId },
      order: [["setNumber", "ASC"]],
    });

    // Kiểm tra không vượt quá maxSets
    if (existingSets.length >= maxSets) {
      throw new Error(`Cannot create more sets. Maximum sets is ${maxSets}`);
    }

    // Tính số set đã thắng của mỗi entry
    let entryASetsWon = 0;
    let entryBSetsWon = 0;

    existingSets.forEach((set) => {
      if (set.entryAScore > set.entryBScore) {
        entryASetsWon++;
      } else if (set.entryBScore > set.entryAScore) {
        entryBSetsWon++;
      }
    });

    // Tính số set cần thắng để kết thúc: maxSets / 2 + 1
    const setsToWin = Math.floor(maxSets / 2) + 1;

    // Kiểm tra đã có người thắng chưa
    if (entryASetsWon >= setsToWin) {
      throw new Error(`Entry A has already won ${entryASetsWon} sets (needed ${setsToWin}). Cannot add more sets`);
    }
    if (entryBSetsWon >= setsToWin) {
      throw new Error(`Entry B has already won ${entryBSetsWon} sets (needed ${setsToWin}). Cannot add more sets`);
    }

    // Tính setNumber tiếp theo
    const nextSetNumber = existingSets.length > 0 ? existingSets[existingSets.length - 1]!.setNumber + 1 : 1;

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
