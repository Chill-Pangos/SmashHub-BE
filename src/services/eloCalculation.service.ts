import Match from "../models/match.model";
import MatchSet from "../models/matchSet.model";
import Entries from "../models/entries.model";
import EntryMember from "../models/entrymember.model";
import EloScore from "../models/eloScore.model";
import EloHistory from "../models/eloHistory.model";
import eloScoreService from "./eloScore.service";
import eloHistoryService from "./eloHistory.service";

/**
 * Service tính toán và cập nhật điểm Elo cho các vận động viên
 * Sử dụng công thức Elo cải tiến cho bóng bàn
 */
export class EloCalculationService {
  private readonly K_FACTOR = 12; // Hệ số K theo yêu cầu

  /**
   * Tính xác suất thắng theo công thức Elo chuẩn
   * E_A = 1 / (1 + 10^((R_B - R_A) / 400))
   */
  private calculateExpectedScore(ratingA: number, ratingB: number): number {
    return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
  }

  /**
   * Tính kết quả thực tế theo bóng bàn (dựa trên số set)
   * S_A = số set A thắng / tổng số set
   */
  private calculateActualScore(setsWon: number, totalSets: number): number {
    if (totalSets === 0) return 0;
    return setsWon / totalSets;
  }

  /**
   * Tính hệ số chênh lệch set (Margin Multiplier)
   * M = 1 + |set thắng - set thua| / tổng set
   */
  private calculateMarginMultiplier(setsWon: number, setsLost: number): number {
    const totalSets = setsWon + setsLost;
    if (totalSets === 0) return 1;
    return 1 + Math.abs(setsWon - setsLost) / totalSets;
  }

  /**
   * Tính điểm Elo mới cho một vận động viên
   * R'_A = R_A + K × M × (S_A - E_A)
   */
  private calculateNewElo(
    currentElo: number,
    expectedScore: number,
    actualScore: number,
    marginMultiplier: number
  ): number {
    const change = this.K_FACTOR * marginMultiplier * (actualScore - expectedScore);
    return Math.round(currentElo + change);
  }

  /**
   * Lấy điểm Elo hiện tại của một user, nếu chưa có thì tạo mới với điểm 1000
   */
  private async getOrCreateEloScore(userId: number): Promise<EloScore> {
    let eloScore = await eloScoreService.findByUserId(userId);
    
    if (!eloScore) {
      eloScore = await eloScoreService.create({
        userId,
        score: 1000, // Điểm Elo khởi tạo
      });
    }
    
    return eloScore;
  }

  /**
   * Tính điểm Elo trung bình của một entry (team/đôi)
   */
  private async calculateEntryAverageElo(entryId: number, members?: EntryMember[]): Promise<number> {
    // Nếu có members được pass vào, sử dụng nó; nếu không thì query
    let entryMembers = members;
    
    if (!entryMembers) {
      const entry = await Entries.findByPk(entryId, {
        include: [
          {
            model: EntryMember,
            as: 'members',
          },
        ],
      });
      
      entryMembers = entry?.members || [];
    }

    if (entryMembers.length === 0) {
      return 1000; // Điểm mặc định nếu không có thành viên
    }

    let totalElo = 0;
    for (const member of entryMembers) {
      const eloScore = await this.getOrCreateEloScore(member.userId);
      totalElo += eloScore.score;
    }

    return totalElo / entryMembers.length;
  }

  /**
   * Cập nhật điểm Elo cho tất cả các vận động viên trong một trận đấu
   */
  async updateEloForMatch(matchId: number): Promise<void> {
    // Lấy thông tin trận đấu kèm theo các set
    const match = await Match.findByPk(matchId, {
      include: [
        {
          model: MatchSet,
          order: [["setNumber", "ASC"]],
        },
        {
          model: Entries,
          as: "entryA",
          include: [
            {
              model: EntryMember,
              as: "members",
            },
          ],
        },
        {
          model: Entries,
          as: "entryB",
          include: [
            {
              model: EntryMember,
              as: "members",
            },
          ],
        },
      ],
    });

    if (!match) {
      throw new Error("Match not found");
    }

    if (match.status !== "completed") {
      throw new Error("Cannot update Elo for a match that is not completed");
    }

    const matchSets = match.matchSets || [];
    if (matchSets.length === 0) {
      throw new Error("No sets found for this match");
    }

    // Đếm số set thắng của mỗi entry
    let entryASetsWon = 0;
    let entryBSetsWon = 0;

    matchSets.forEach((set) => {
      if (set.entryAScore > set.entryBScore) {
        entryASetsWon++;
      } else if (set.entryBScore > set.entryAScore) {
        entryBSetsWon++;
      }
    });

    const totalSets = entryASetsWon + entryBSetsWon;

    // Extract members từ entries
    const entryAMembers = match.entryA?.members || [];
    const entryBMembers = match.entryB?.members || [];

    // Tính Elo trung bình của mỗi entry
    const entryAElo = await this.calculateEntryAverageElo(match.entryAId, entryAMembers);
    const entryBElo = await this.calculateEntryAverageElo(match.entryBId, entryBMembers);

    // Tính các thông số chung cho trận đấu
    const expectedScoreA = this.calculateExpectedScore(entryAElo, entryBElo);
    const expectedScoreB = 1 - expectedScoreA; // E_B = 1 - E_A

    const actualScoreA = this.calculateActualScore(entryASetsWon, totalSets);
    const actualScoreB = this.calculateActualScore(entryBSetsWon, totalSets);

    const marginMultiplier = this.calculateMarginMultiplier(
      entryASetsWon,
      entryBSetsWon
    );

    // Tạo change reason
    const changeReason = `Match ${matchId}: ${entryASetsWon}-${entryBSetsWon}`;

    // Cập nhật Elo cho từng thành viên của entry A
    for (const member of entryAMembers) {
      await this.updatePlayerElo(
        member.userId,
        matchId,
        expectedScoreA,
        actualScoreA,
        marginMultiplier,
        changeReason
      );
    }

    // Cập nhật Elo cho từng thành viên của entry B
    for (const member of entryBMembers) {
      await this.updatePlayerElo(
        member.userId,
        matchId,
        expectedScoreB,
        actualScoreB,
        marginMultiplier,
        changeReason
      );
    }
  }

  /**
   * Cập nhật điểm Elo cho một vận động viên cụ thể
   */
  private async updatePlayerElo(
    userId: number,
    matchId: number,
    expectedScore: number,
    actualScore: number,
    marginMultiplier: number,
    changeReason: string
  ): Promise<void> {
    // Lấy điểm Elo hiện tại
    const eloScore = await this.getOrCreateEloScore(userId);
    const previousElo = eloScore.score;

    // Tính điểm Elo mới
    const newElo = this.calculateNewElo(
      previousElo,
      expectedScore,
      actualScore,
      marginMultiplier
    );

    // Cập nhật điểm Elo
    await eloScoreService.update(eloScore.id, { score: newElo });

    // Tạo lịch sử thay đổi
    await eloHistoryService.create({
      matchId,
      userId,
      previousElo,
      newElo,
      changeReason,
    });
  }

  /**
   * Tính toán và trả về thông tin chi tiết về sự thay đổi Elo (để preview)
   */
  async previewEloChanges(matchId: number): Promise<{
    entryA: { averageElo: number; expectedScore: number; actualScore: number };
    entryB: { averageElo: number; expectedScore: number; actualScore: number };
    marginMultiplier: number;
    changes: Array<{
      userId: number;
      currentElo: number;
      expectedElo: number;
      change: number;
    }>;
  }> {
    const match = await Match.findByPk(matchId, {
      include: [
        {
          model: MatchSet,
          order: [["setNumber", "ASC"]],
        },
        {
          model: Entries,
          as: "entryA",
          include: [
            {
              model: EntryMember,
              as: "members",
            },
          ],
        },
        {
          model: Entries,
          as: "entryB",
          include: [
            {
              model: EntryMember,
              as: "members",
            },
          ],
        },
      ],
    });

    if (!match) {
      throw new Error("Match not found");
    }

    const matchSets = match.matchSets || [];
    let entryASetsWon = 0;
    let entryBSetsWon = 0;

    matchSets.forEach((set) => {
      if (set.entryAScore > set.entryBScore) {
        entryASetsWon++;
      } else if (set.entryBScore > set.entryAScore) {
        entryBSetsWon++;
      }
    });

    const totalSets = entryASetsWon + entryBSetsWon;

    const entryAMembers = match.entryA?.members || [];
    const entryBMembers = match.entryB?.members || [];
    
    const entryAElo = await this.calculateEntryAverageElo(match.entryAId, entryAMembers);
    const entryBElo = await this.calculateEntryAverageElo(match.entryBId, entryBMembers);

    const expectedScoreA = this.calculateExpectedScore(entryAElo, entryBElo);
    const expectedScoreB = 1 - expectedScoreA;

    const actualScoreA = this.calculateActualScore(entryASetsWon, totalSets);
    const actualScoreB = this.calculateActualScore(entryBSetsWon, totalSets);

    const marginMultiplier = this.calculateMarginMultiplier(
      entryASetsWon,
      entryBSetsWon
    );

    const changes: Array<{
      userId: number;
      currentElo: number;
      expectedElo: number;
      change: number;
    }> = [];

    // Tính toán cho entry A
    for (const member of entryAMembers) {
      const eloScore = await this.getOrCreateEloScore(member.userId);
      const newElo = this.calculateNewElo(
        eloScore.score,
        expectedScoreA,
        actualScoreA,
        marginMultiplier
      );
      changes.push({
        userId: member.userId,
        currentElo: eloScore.score,
        expectedElo: newElo,
        change: newElo - eloScore.score,
      });
    }

    // Tính toán cho entry B
    for (const member of entryBMembers) {
      const eloScore = await this.getOrCreateEloScore(member.userId);
      const newElo = this.calculateNewElo(
        eloScore.score,
        expectedScoreB,
        actualScoreB,
        marginMultiplier
      );
      changes.push({
        userId: member.userId,
        currentElo: eloScore.score,
        expectedElo: newElo,
        change: newElo - eloScore.score,
      });
    }

    return {
      entryA: {
        averageElo: entryAElo,
        expectedScore: expectedScoreA,
        actualScore: actualScoreA,
      },
      entryB: {
        averageElo: entryBElo,
        expectedScore: expectedScoreB,
        actualScore: actualScoreB,
      },
      marginMultiplier,
      changes,
    };
  }
}

export default new EloCalculationService();
