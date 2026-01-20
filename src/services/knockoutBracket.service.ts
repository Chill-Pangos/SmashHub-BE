import KnockoutBracket from "../models/knockoutBracket.model";
import {
  CreateKnockoutBracketDto,
  UpdateKnockoutBracketDto,
  GenerateKnockoutBracketDto,
  BracketTreeDto,
  RoundDto,
} from "../dto/knockoutBracket.dto";
import TournamentContent from "../models/tournamentContent.model";
import Entries from "../models/entries.model";
import GroupStanding from "../models/groupStanding.model";

export class KnockoutBracketService {
  async create(data: CreateKnockoutBracketDto): Promise<KnockoutBracket> {
    return await KnockoutBracket.create(data as any);
  }

  async findAll(skip = 0, limit = 10): Promise<KnockoutBracket[]> {
    return await KnockoutBracket.findAll({
      offset: skip,
      limit,
    });
  }

  async findById(id: number): Promise<KnockoutBracket | null> {
    return await KnockoutBracket.findByPk(id);
  }

  async findByContentId(contentId: number): Promise<KnockoutBracket[]> {
    return await KnockoutBracket.findAll({
      where: { contentId },
      order: [
        ["roundNumber", "ASC"],
        ["bracketPosition", "ASC"],
      ],
    });
  }

  async update(
    id: number,
    data: UpdateKnockoutBracketDto
  ): Promise<[number, KnockoutBracket[]]> {
    return await KnockoutBracket.update(data, {
      where: { id },
      returning: true,
    });
  }

  async delete(id: number): Promise<number> {
    return await KnockoutBracket.destroy({ where: { id } });
  }

  /**
   * Tạo cấu trúc nhánh đấu knockout với các điều kiện:
   * 1. Bracket size phải là lũy thừa của 2, tối thiểu 16
   * 2. Entries cùng team không gặp nhau ở vòng đầu
   * 3. Bye matches được random, không ưu tiên ELO
   * 4. Cân bằng 2 nhánh đấu
   * 5. Tối thiểu 12 đội
   */
  async generateKnockoutBracket(contentId: number): Promise<BracketTreeDto> {
    // Lấy tất cả entries
    const entries = await Entries.findAll({
      where: { contentId },
    });

    if (entries.length < 12) {
      throw new Error(
        `Không đủ entries để tạo nhánh đấu. Cần tối thiểu 12 đội, hiện có ${entries.length}`
      );
    }

    // Tính bracket size (16, 32, 64...)
    const bracketSize = this.calculateBracketSize(entries.length);
    const numByes = bracketSize - entries.length;

    // Random shuffle entries
    const shuffledEntries = this.shuffleArray([...entries]);

    // Phân chia entries vào 2 nửa bracket, đảm bảo cùng team ở khác nửa
    const { topHalf, bottomHalf } = this.splitEntriesByTeam(
      shuffledEntries,
      bracketSize
    );

    // Xóa brackets cũ nếu có
    await KnockoutBracket.destroy({ where: { contentId } });

    // Tạo cấu trúc bracket tree
    const brackets = await this.createBracketTree(
      contentId,
      bracketSize,
      topHalf,
      bottomHalf,
      numByes
    );

    // Trả về bracket tree
    return this.formatBracketTree(contentId, brackets);
  }

  /**
   * Tính bracket size là lũy thừa của 2, tối thiểu 16
   */
  private calculateBracketSize(numEntries: number): number {
    const possibleSizes = [16, 32, 64, 128, 256];

    for (const size of possibleSizes) {
      if (size >= numEntries) {
        return size;
      }
    }

    throw new Error(`Số lượng entries quá lớn: ${numEntries}`);
  }

  /**
   * Fisher-Yates shuffle
   */
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!];
    }
    return shuffled;
  }

  /**
   * Phân chia entries vào 2 nửa bracket
   * Đảm bảo entries cùng team ở khác nửa
   */
  private splitEntriesByTeam(
    entries: Entries[],
    bracketSize: number
  ): { topHalf: (Entries | null)[]; bottomHalf: (Entries | null)[] } {
    const halfSize = bracketSize / 2;
    const topHalf: (Entries | null)[] = new Array(halfSize).fill(null);
    const bottomHalf: (Entries | null)[] = new Array(halfSize).fill(null);

    // Group entries by teamId
    const entriesByTeam = new Map<number, Entries[]>();
    for (const entry of entries) {
      if (!entriesByTeam.has(entry.teamId)) {
        entriesByTeam.set(entry.teamId, []);
      }
      entriesByTeam.get(entry.teamId)!.push(entry);
    }

    // Teams có nhiều entries cần phân chia vào 2 nửa
    const teamsNeedSplit: Array<Entries[]> = [];
    const singleEntries: Entries[] = [];

    for (const [teamId, teamEntries] of entriesByTeam) {
      if (teamEntries.length > 1) {
        teamsNeedSplit.push(teamEntries);
      } else {
        singleEntries.push(...teamEntries);
      }
    }

    // Phân chia các teams có nhiều entries
    let topIndex = 0;
    let bottomIndex = 0;

    for (const teamEntries of teamsNeedSplit) {
      const half = Math.ceil(teamEntries.length / 2);

      // Nửa vào top, nửa vào bottom
      for (let i = 0; i < half && topIndex < halfSize; i++) {
        topHalf[topIndex++] = teamEntries[i]!;
      }

      for (let i = half; i < teamEntries.length && bottomIndex < halfSize; i++) {
        bottomHalf[bottomIndex++] = teamEntries[i]!;
      }
    }

    // Phân chia các single entries
    for (const entry of singleEntries) {
      if (topIndex < halfSize) {
        topHalf[topIndex++] = entry;
      } else if (bottomIndex < halfSize) {
        bottomHalf[bottomIndex++] = entry;
      }
    }

    return { topHalf, bottomHalf };
  }

  /**
   * Tạo cấu trúc cây bracket
   */
  private async createBracketTree(
    contentId: number,
    bracketSize: number,
    topHalf: (Entries | null)[],
    bottomHalf: (Entries | null)[],
    numByes: number
  ): Promise<KnockoutBracket[]> {
    const allBrackets: KnockoutBracket[] = [];
    const totalRounds = Math.log2(bracketSize);

    // Tạo brackets cho vòng đầu tiên (Round 1)
    const round1Brackets = await this.createRound1Brackets(
      contentId,
      bracketSize,
      topHalf,
      bottomHalf,
      numByes
    );
    allBrackets.push(...round1Brackets);

    // Tạo brackets cho các vòng tiếp theo
    let previousRoundBrackets = round1Brackets;

    for (let round = 2; round <= totalRounds; round++) {
      const roundBrackets = await this.createNextRoundBrackets(
        contentId,
        bracketSize,
        round,
        previousRoundBrackets
      );
      allBrackets.push(...roundBrackets);
      previousRoundBrackets = roundBrackets;
    }

    return allBrackets;
  }

  /**
   * Tạo brackets cho vòng đầu tiên
   */
  private async createRound1Brackets(
    contentId: number,    bracketSize: number,    topHalf: (Entries | null)[],
    bottomHalf: (Entries | null)[],
    numByes: number
  ): Promise<KnockoutBracket[]> {
    const brackets: KnockoutBracket[] = [];
    const allPositions = [...topHalf, ...bottomHalf];
    const totalBrackets = allPositions.length / 2;

    // Phân bổ bye matches cân bằng
    const byePositions = this.distributeByePositions(allPositions.length, numByes);

    for (let i = 0; i < totalBrackets; i++) {
      const entryAIndex = i * 2;
      const entryBIndex = i * 2 + 1;

      const entryA = allPositions[entryAIndex];
      const entryB = allPositions[entryBIndex];

      const isByeMatch = !entryA || !entryB;
      const status = isByeMatch ? "completed" : entryA && entryB ? "ready" : "pending";

      // Nếu là bye match, winner là đội có mặt
      let winnerEntryId: number | undefined;
      if (isByeMatch) {
        winnerEntryId = entryA?.id || entryB?.id;
      }

      const bracket = await KnockoutBracket.create({
        contentId,
        roundNumber: 1,
        bracketPosition: i,
        entryAId: entryA?.id,
        entryBId: entryB?.id,
        winnerEntryId,
        status,
        roundName: this.getRoundName(1, totalBrackets * 2),
        isByeMatch,bracketSize
      } as any);

      brackets.push(bracket);
    }

    return brackets;
  }

  /**
   * Phân bổ bye positions cân bằng
   */
  private distributeByePositions(totalPositions: number, numByes: number): Set<number> {
    const byePositions = new Set<number>();
    const positions = Array.from({ length: totalPositions }, (_, i) => i);

    // Random select bye positions
    for (let i = 0; i < numByes; i++) {
      const randomIndex = Math.floor(Math.random() * positions.length);
      byePositions.add(positions[randomIndex]!);
      positions.splice(randomIndex, 1);
    }

    return byePositions;
  }

  /**
   * Tạo brackets cho các vòng tiếp theo
   */
  private async createNextRoundBrackets(
    contentId: number,
    bracketSize: number,
    roundNumber: number,
    previousRoundBrackets: KnockoutBracket[]
  ): Promise<KnockoutBracket[]> {
    const brackets: KnockoutBracket[] = [];
    const numBrackets = previousRoundBrackets.length / 2;

    for (let i = 0; i < numBrackets; i++) {
      const prevBracketA = previousRoundBrackets[i * 2]!;
      const prevBracketB = previousRoundBrackets[i * 2 + 1]!;

      const bracket = await KnockoutBracket.create({
        contentId,
        roundNumber,
        bracketPosition: i,
        previousBracketAId: prevBracketA.id,
        previousBracketBId: prevBracketB.id,
        status: "pending",
        roundName: this.getRoundName(roundNumber, bracketSize),
        isByeMatch: false,
      } as any);

      brackets.push(bracket);

      // Cập nhật nextBracketId cho previous brackets
      await KnockoutBracket.update(
        { nextBracketId: bracket.id },
        { where: { id: prevBracketA.id } }
      );
      await KnockoutBracket.update(
        { nextBracketId: bracket.id },
        { where: { id: prevBracketB.id } }
      );
    }

    return brackets;
  }

  /**
   * Lấy tên vòng đấu
   * totalParticipants: Tổng số đội ban đầu (bracket size)
   * roundNumber: Số vòng (1, 2, 3...)
   * "Round of X" = Vòng có X đội thi đấu (TRƯỚC khi đấu)
   */
  private getRoundName(roundNumber: number, totalParticipants: number): string {
    // Số người thi đấu TRONG vòng này = totalParticipants / 2^(roundNumber - 1)
    const playersInRound = totalParticipants / Math.pow(2, roundNumber - 1);

    if (playersInRound === 2) return "Final"; // Chung kết: 2 đội
    if (playersInRound === 4) return "Semi-final"; // Bán kết: 4 đội
    if (playersInRound === 8) return "Quarter-final"; // Tứ kết: 8 đội
    if (playersInRound === 16) return "Round of 16"; // Vòng 1/8: 16 đội
    if (playersInRound === 32) return "Round of 32"; // Vòng 1/16: 32 đội
    if (playersInRound === 64) return "Round of 64"; // Vòng 1/32: 64 đội
    if (playersInRound === 128) return "Round of 128"; // Vòng 1/64: 128 đội

    return `Round ${roundNumber}`;
  }

  /**
   * Format bracket tree để trả về client
   */
  private async formatBracketTree(
    contentId: number,
    brackets: KnockoutBracket[]
  ): Promise<BracketTreeDto> {
    // Group by round
    const roundsMap = new Map<number, KnockoutBracket[]>();
    for (const bracket of brackets) {
      if (!roundsMap.has(bracket.roundNumber)) {
        roundsMap.set(bracket.roundNumber, []);
      }
      roundsMap.get(bracket.roundNumber)!.push(bracket);
    }

    const rounds: RoundDto[] = [];
    for (const [roundNumber, roundBrackets] of roundsMap) {
      rounds.push({
        roundNumber,
        roundName: roundBrackets[0]?.roundName || `Round ${roundNumber}`,
        brackets: roundBrackets.map((b) => b.toJSON()),
      });
    }

    rounds.sort((a, b) => a.roundNumber - b.roundNumber);

    return {
      contentId,
      totalRounds: rounds.length,
      totalBrackets: brackets.length,
      rounds,
    };
  }

  /**
   * Advance winner sang vòng tiếp theo
   */
  async advanceWinner(bracketId: number, winnerEntryId: number): Promise<void> {
    const bracket = await KnockoutBracket.findByPk(bracketId);
    if (!bracket) {
      throw new Error("Bracket not found");
    }

    // Cập nhật winner
    await KnockoutBracket.update(
      { winnerEntryId, status: "completed" },
      { where: { id: bracketId } }
    );

    // Cập nhật bracket tiếp theo
    if (bracket.nextBracketId) {
      const nextBracket = await KnockoutBracket.findByPk(bracket.nextBracketId);
      if (!nextBracket) return;

      // Xác định vị trí (A hoặc B)
      let updateData: any = {};
      if (nextBracket.previousBracketAId === bracketId) {
        updateData.entryAId = winnerEntryId;
      } else if (nextBracket.previousBracketBId === bracketId) {
        updateData.entryBId = winnerEntryId;
      }

      // Kiểm tra nếu cả 2 entries đã có thì set status = ready
      const updated = await KnockoutBracket.findByPk(bracket.nextBracketId);
      if (updated?.entryAId && updated?.entryBId) {
        updateData.status = "ready";
      } else if (updateData.entryAId || updateData.entryBId) {
        updateData.status = "pending";
      }

      await KnockoutBracket.update(updateData, {
        where: { id: bracket.nextBracketId },
      });
    }
  }
  /**
   * Tạo knockout bracket từ kết quả vòng bảng
   * Lấy top 2 mỗi bảng, phân bổ vào nhánh đấu
   */
  async generateKnockoutBracketFromGroups(contentId: number): Promise<BracketTreeDto> {
    // Lấy tất cả group standings với position
    const standings = await GroupStanding.findAll({
      where: { contentId },
      order: [
        ["groupName", "ASC"],
        ["position", "ASC"],
      ],
      include: [{ model: Entries, as: "entry" }],
    });

    if (standings.length === 0) {
      throw new Error("Không tìm thấy kết quả vòng bảng");
    }

    // Group by groupName và lấy top 2
    const groupsMap = new Map<string, GroupStanding[]>();
    for (const standing of standings) {
      if (!groupsMap.has(standing.groupName)) {
        groupsMap.set(standing.groupName, []);
      }
      const group = groupsMap.get(standing.groupName)!;
      if (group.length < 2) {
        group.push(standing);
      }
    }

    // Tách đội nhất và đội nhì
    const firstPlaceTeams: { groupName: string; entryId: number }[] = [];
    const secondPlaceTeams: { groupName: string; entryId: number }[] = [];

    for (const [groupName, groupStandings] of groupsMap) {
      if (groupStandings.length >= 1) {
        firstPlaceTeams.push({
          groupName,
          entryId: groupStandings[0]!.entryId,
        });
      }
      if (groupStandings.length >= 2) {
        secondPlaceTeams.push({
          groupName,
          entryId: groupStandings[1]!.entryId,
        });
      }
    }

    const totalTeams = firstPlaceTeams.length + secondPlaceTeams.length;

    if (totalTeams < 4) {
      throw new Error(`Không đủ đội để tạo nhánh đấu. Cần tối thiểu 4 đội, hiện có ${totalTeams}`);
    }

    // Tính bracket size
    const bracketSize = this.calculateBracketSize(totalTeams);
    const numByes = bracketSize - totalTeams;
    const halfSize = bracketSize / 2;

    // Kiểm tra xem đã có brackets chưa
    const existingBrackets = await KnockoutBracket.findAll({
      where: { contentId },
      order: [
        ["roundNumber", "ASC"],
        ["bracketPosition", "ASC"],
      ],
    });

    const shouldUpdate = existingBrackets.length > 0;

    // Phân bổ bye matches đều vào 2 nhánh
    const byesPerHalf = Math.floor(numByes / 2);
    const extraBye = numByes % 2; // Nửa top lấy bye lẻ nếu có

    // Chia đội nhất vào 2 nhánh
    const topHalfFirst: (number | null)[] = [];
    const bottomHalfFirst: (number | null)[] = [];

    for (let i = 0; i < firstPlaceTeams.length; i++) {
      if (i % 2 === 0) {
        topHalfFirst.push(firstPlaceTeams[i]!.entryId);
      } else {
        bottomHalfFirst.push(firstPlaceTeams[i]!.entryId);
      }
    }

    // Thêm bye matches cho đội nhất (bye chỉ dành cho đội nhất)
    // Top half
    for (let i = 0; i < byesPerHalf + extraBye; i++) {
      topHalfFirst.push(null); // null = bye
    }
    // Bottom half
    for (let i = 0; i < byesPerHalf; i++) {
      bottomHalfFirst.push(null);
    }

    // Map groupName -> entryId của đội nhất để tránh đội nhì gặp đội nhất cùng bảng
    const firstPlaceByGroup = new Map<string, number>();
    for (const team of firstPlaceTeams) {
      firstPlaceByGroup.set(team.groupName, team.entryId);
    }

    // Phân bổ đội nhì vào các slot còn lại
    const topHalfSecond: number[] = [];
    const bottomHalfSecond: number[] = [];

    // Tính số slot còn lại mỗi nhánh
    const topRemaining = halfSize - topHalfFirst.length;
    const bottomRemaining = halfSize - bottomHalfFirst.length;

    // Shuffle đội nhì để random
    const shuffledSecond = this.shuffleArray([...secondPlaceTeams]);

    for (const team of shuffledSecond) {
      if (topHalfSecond.length < topRemaining) {
        topHalfSecond.push(team.entryId);
      } else if (bottomHalfSecond.length < bottomRemaining) {
        bottomHalfSecond.push(team.entryId);
      }
    }

    // Combine top half và bottom half
    const topHalf = [...topHalfFirst, ...topHalfSecond];
    const bottomHalf = [...bottomHalfFirst, ...bottomHalfSecond];

    // Shuffle mỗi nhánh để random vị trí
    const shuffledTop = this.shuffleArray(topHalf);
    const shuffledBottom = this.shuffleArray(bottomHalf);

    let brackets: KnockoutBracket[];

    if (shouldUpdate) {
      // Cập nhật vào brackets đã có
      brackets = await this.updateBracketTreeFromHalves(
        contentId,
        existingBrackets,
        shuffledTop,
        shuffledBottom
      );
    } else {
      // Tạo bracket tree mới
      brackets = await this.createBracketTreeFromHalves(
        contentId,
        bracketSize,
        shuffledTop,
        shuffledBottom
      );
    }

    return this.formatBracketTree(contentId, brackets);
  }

  /**
   * Tạo bracket tree từ 2 nửa đã có entries
   */
  private async createBracketTreeFromHalves(
    contentId: number,
    bracketSize: number,
    topHalf: (number | null)[],
    bottomHalf: (number | null)[]
  ): Promise<KnockoutBracket[]> {
    const allBrackets: KnockoutBracket[] = [];
    const totalRounds = Math.log2(bracketSize);

    // Tạo brackets cho vòng đầu tiên
    const round1Brackets = await this.createRound1BracketsFromHalves(
      contentId,
      bracketSize,
      topHalf,
      bottomHalf
    );
    allBrackets.push(...round1Brackets);

    // Tạo các vòng tiếp theo
    let previousRoundBrackets = round1Brackets;

    for (let round = 2; round <= totalRounds; round++) {
      const roundBrackets = await this.createNextRoundBrackets(
        contentId,
        bracketSize,
        round,
        previousRoundBrackets
      );
      allBrackets.push(...roundBrackets);
      previousRoundBrackets = roundBrackets;
    }

    return allBrackets;
  }

  /**
   * Tạo round 1 từ 2 nửa có sẵn entries
   */
  private async createRound1BracketsFromHalves(
    contentId: number,
    bracketSize: number,
    topHalf: (number | null)[],
    bottomHalf: (number | null)[]
  ): Promise<KnockoutBracket[]> {
    const brackets: KnockoutBracket[] = [];
    const allPositions = [...topHalf, ...bottomHalf];
    const totalBrackets = allPositions.length / 2;

    for (let i = 0; i < totalBrackets; i++) {
      const entryAIndex = i * 2;
      const entryBIndex = i * 2 + 1;

      const entryAId = allPositions[entryAIndex];
      const entryBId = allPositions[entryBIndex];

      const isByeMatch = !entryAId || !entryBId;
      const status = isByeMatch ? "completed" : entryAId && entryBId ? "ready" : "pending";

      // Nếu là bye match, winner là đội có mặt
      let winnerEntryId: number | undefined;
      if (isByeMatch) {
        winnerEntryId = entryAId || entryBId || undefined;
      }

      const bracket = await KnockoutBracket.create({
        contentId,
        roundNumber: 1,
        bracketPosition: i,
        entryAId: entryAId || undefined,
        entryBId: entryBId || undefined,
        winnerEntryId,
        status,
        roundName: this.getRoundName(1, bracketSize),
        isByeMatch,
      } as any);

      brackets.push(bracket);
    }

    return brackets;
  }

  /**
   * Cập nhật entries vào bracket tree đã tồn tại
   */
  private async updateBracketTreeFromHalves(
    contentId: number,
    existingBrackets: KnockoutBracket[],
    topHalf: (number | null)[],
    bottomHalf: (number | null)[]
  ): Promise<KnockoutBracket[]> {
    const allPositions = [...topHalf, ...bottomHalf];
    
    // Lấy các brackets vòng 1
    const round1Brackets = existingBrackets.filter(b => b.roundNumber === 1);
    
    if (round1Brackets.length !== allPositions.length / 2) {
      throw new Error(
        `Số lượng brackets không khớp. Expected ${allPositions.length / 2}, got ${round1Brackets.length}`
      );
    }

    // Cập nhật từng bracket vòng 1
    for (let i = 0; i < round1Brackets.length; i++) {
      const bracket = round1Brackets[i]!;
      const entryAIndex = i * 2;
      const entryBIndex = i * 2 + 1;

      const entryAId = allPositions[entryAIndex];
      const entryBId = allPositions[entryBIndex];

      const isByeMatch = !entryAId || !entryBId;
      const status = isByeMatch ? "completed" : entryAId && entryBId ? "ready" : "pending";

      // Nếu là bye match, winner là đội có mặt
      let winnerEntryId: number | undefined;
      if (isByeMatch) {
        winnerEntryId = entryAId || entryBId || undefined;
      }

      // Cập nhật bracket
      await bracket.update({
        entryAId: entryAId || undefined,
        entryBId: entryBId || undefined,
        winnerEntryId,
        status,
        isByeMatch,
      });

      // Nếu là bye match, cập nhật winner vào bracket tiếp theo
      if (isByeMatch && winnerEntryId && bracket.nextBracketId) {
        const nextBracket = await KnockoutBracket.findByPk(bracket.nextBracketId);
        if (nextBracket) {
          let updateData: any = {};
          
          if (nextBracket.previousBracketAId === bracket.id) {
            updateData.entryAId = winnerEntryId;
          } else if (nextBracket.previousBracketBId === bracket.id) {
            updateData.entryBId = winnerEntryId;
          }

          // Kiểm tra nếu cả 2 entries đã có
          await nextBracket.reload();
          const willHaveBothEntries = 
            (updateData.entryAId && nextBracket.entryBId) || 
            (nextBracket.entryAId && updateData.entryBId);
          
          if (willHaveBothEntries) {
            updateData.status = "ready";
          }

          await nextBracket.update(updateData);
        }
      }
    }

    // Trả về tất cả brackets sau khi cập nhật
    return await KnockoutBracket.findAll({
      where: { contentId },
      order: [
        ["roundNumber", "ASC"],
        ["bracketPosition", "ASC"],
      ],
    });
  }
}

export default new KnockoutBracketService();
