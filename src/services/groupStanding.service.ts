import GroupStanding from "../models/groupStanding.model";
import { CreateGroupStandingDto, GenerateGroupPlaceholdersDto, RandomDrawEntriesDto, SaveGroupAssignmentsDto, UpdateGroupStandingDto, RandomDrawAndSaveDto } from "../dto/groupStanding.dto";
import TournamentCategory from "../models/tournamentCategory.model";
import Entries from "../models/entry.model";
import Match from "../models/match.model";
import MatchSet from "../models/matchSet.model";
import SubMatch from "../models/subMatch.model";
import Schedule from "../models/schedule.model";
import { Op } from "sequelize";

export class GroupStandingService {
  async create(data: CreateGroupStandingDto): Promise<GroupStanding> {
    return await GroupStanding.create(data as any);
  }

  async findAll(skip = 0, limit = 10): Promise<GroupStanding[]> {
    return await GroupStanding.findAll({
      offset: skip,
      limit,
    });
  }

  async findById(id: number): Promise<GroupStanding | null> {
    return await GroupStanding.findByPk(id);
  }

  async findByCategoryId(
    categoryId: number,
    skip = 0,
    limit = 10
  ): Promise<GroupStanding[]> {
    return await GroupStanding.findAll({
      where: { categoryId },
      offset: skip,
      limit,
    });
  }

  async update(
    id: number,
    data: UpdateGroupStandingDto
  ): Promise<[number, GroupStanding[]]> {
    return await GroupStanding.update(data, {
      where: { id },
      returning: true,
    });
  }

  async delete(id: number): Promise<number> {
    return await GroupStanding.destroy({ where: { id } });
  }

  /**
   * Tính toán số lượng bảng và số đội mỗi bảng tối ưu
   * Mỗi bảng có 3-5 đội
   * Số lượng bảng phải là lũy thừa của 2 (4, 8, 16, ...) và tối thiểu là 4
   * @param totalEntries - Tổng số entries
   * @returns Object chứa thông tin về các bảng
   */
  calculateOptimalGroups(totalEntries: number): {
    numGroups: number;
    teamsPerGroup: number[];
    totalSlots: number;
  } {
    if (totalEntries < 12) {
      throw new Error('Cần ít nhất 12 đội để tạo 4 bảng với mỗi bảng có tối thiểu 3 đội');
    }

    // Tìm số lượng bảng là lũy thừa của 2, tối thiểu là 4
    const possibleGroups = [4, 8, 16, 32, 64]; // Các lũy thừa của 2
    
    let bestConfig = {
      numGroups: 0,
      teamsPerGroup: [] as number[],
      variance: Infinity, // Độ chênh lệch giữa các bảng
    };

    for (const numGroups of possibleGroups) {
      const avgTeams = totalEntries / numGroups;
      
      // Kiểm tra xem có thể phân chia hợp lý không (3-5 đội/bảng)
      if (avgTeams < 3 || avgTeams > 5) {
        // Nếu trung bình < 3 thì đã quá nhiều bảng, dừng lại
        if (avgTeams < 3) break;
        // Nếu > 5 thì chưa đủ bảng, thử tiếp
        continue;
      }

      // Phân bổ đội vào các bảng
      const baseTeams = Math.floor(totalEntries / numGroups);
      const remainder = totalEntries % numGroups;
      
      // Tạo phân bổ: một số bảng có (baseTeams + 1), số còn lại có baseTeams
      const distribution: number[] = new Array(numGroups).fill(baseTeams);
      for (let i = 0; i < remainder; i++) {
        distribution[i]!++;
      }

      // Kiểm tra xem tất cả bảng có 3-5 đội không
      const allValid = distribution.every(count => count >= 3 && count <= 5);
      if (!allValid) continue;

      // Tính độ chênh lệch (variance) giữa các bảng
      const maxTeams = Math.max(...distribution);
      const minTeams = Math.min(...distribution);
      const variance = maxTeams - minTeams;

      // Chọn cấu hình có độ chênh lệch thấp nhất
      if (variance < bestConfig.variance) {
        bestConfig = {
          numGroups,
          teamsPerGroup: distribution,
          variance,
        };
      }

      // Nếu đã tìm được cấu hình hoàn hảo (chia đều), dừng lại
      if (variance === 0) break;
    }

    if (bestConfig.numGroups === 0) {
      throw new Error(`Không thể tạo bảng đấu hợp lệ với ${totalEntries} đội. Cần từ 12-320 đội.`);
    }

    return {
      numGroups: bestConfig.numGroups,
      teamsPerGroup: bestConfig.teamsPerGroup,
      totalSlots: bestConfig.teamsPerGroup.reduce((a, b) => a + b, 0),
    };
  }

  /**
   * Tạo các bảng đấu placeholder cho category
   * @param categoryId - ID của tournament category
   * @returns Danh sách các bảng với placeholder
   */
  async generateGroupPlaceholders(data: GenerateGroupPlaceholdersDto): Promise<any[]> {
    const { categoryId } = data;

    // Lấy thông tin category
    const category = await TournamentCategory.findByPk(categoryId);
    if (!category) {
      throw new Error('Tournament category not found');
    }

    // Đếm số entries
    const entriesCount = await Entries.count({ where: { categoryId } });
    
    if (entriesCount < 12) {
      throw new Error(`Không đủ entries để tạo bảng đấu. Hiện có ${entriesCount}, cần tối thiểu 12 đội`);
    }

    // Tính toán bảng tối ưu
    const groupConfig = this.calculateOptimalGroups(entriesCount);

    const groups: any[] = [];
    const groupNames = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P'];

    // Tạo placeholder cho mỗi bảng
    for (let i = 0; i < groupConfig.numGroups; i++) {
      const groupName = `Group ${groupNames[i] || (i + 1)}`;
      const slots = groupConfig.teamsPerGroup[i]!;

      groups.push({
        groupName,
        slots, // Số slot trong bảng
        entries: [], // Placeholder - user sẽ điền sau
        description: `${groupName} - ${slots} đội`,
      });
    }

    return groups;
  }

  /**
   * Lưu kết quả bốc thăm vào database
   * @param categoryId - ID của tournament category
   * @param groupAssignments - Danh sách phân bổ entries vào các bảng
   */
  async saveGroupAssignments(
    data : SaveGroupAssignmentsDto
  ): Promise<GroupStanding[]> {
    const standings: GroupStanding[] = [];

    for (const group of data.groupAssignments) {
      for (const entryId of group.entryIds) {
        const standing = await GroupStanding.create({
          categoryId: data.categoryId,
          entryId,
          groupName: group.groupName,
          matchesPlayed: 0,
          matchesWon: 0,
          matchesLost: 0,
          setsWon: 0,
          setsLost: 0,
          setsDiff: 0,
        } as any);
        standings.push(standing);
      }
    }

    return standings;
  }

  /**
   * Bốc thăm ngẫu nhiên các entries vào các bảng
   * @param data - Dữ liệu bốc thăm
   * @returns Danh sách phân bổ entries vào các bảng
   */
  async randomDrawEntries(data: RandomDrawEntriesDto): Promise<Array<{ groupName: string; entryIds: number[] }>> {
    // Lấy tất cả entries
    const entries = await Entries.findAll({ where: { categoryId: data.categoryId } });

    if (entries.length < 12) {
      throw new Error(`Không đủ entries để bốc thăm. Cần tối thiểu 12, hiện có ${entries.length}`);
    }

    // Tính toán bảng tối ưu
    const groupConfig = this.calculateOptimalGroups(entries.length);

    // Khởi tạo các bảng
    const groupNames = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P'];
    const groups: Array<{ groupName: string; entryIds: number[]; capacity: number }> = [];

    for (let i = 0; i < groupConfig.numGroups; i++) {
      groups.push({
        groupName: `Group ${groupNames[i]}`,
        entryIds: [],
        capacity: groupConfig.teamsPerGroup[i]!,
      });
    }

    // Shuffle tất cả entries (Fisher-Yates shuffle)
    const shuffledEntries = [...entries];
    for (let i = shuffledEntries.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledEntries[i], shuffledEntries[j]] = [shuffledEntries[j]!, shuffledEntries[i]!];
    }

    // Phân bổ các entries vào các bảng theo thứ tự
    let entryIndex = 0;
    for (const group of groups) {
      while (group.entryIds.length < group.capacity && entryIndex < shuffledEntries.length) {
        group.entryIds.push(shuffledEntries[entryIndex]!.id);
        entryIndex++;
      }
    }

    // Trả về kết quả
    return groups.map(g => ({
      groupName: g.groupName,
      entryIds: g.entryIds,
    }));
  }

  /**
   * Bốc thăm ngẫu nhiên và lưu kết quả vào database
   * @param data - Dữ liệu bốc thăm
   * @returns Danh sách GroupStanding đã được lưu
   */
  async randomDrawAndSave(data: RandomDrawAndSaveDto): Promise<GroupStanding[]> {
    // Thực hiện bốc thăm
    const drawResult = await this.randomDrawEntries({
      categoryId: data.categoryId,
      entries: data.entries,
      numberOfGroups: data.numberOfGroups,
    });

    // Chuyển đổi kết quả để lưu vào database
    const saveData: SaveGroupAssignmentsDto = {
      categoryId: data.categoryId,
      groupAssignments: drawResult,
    };

    // Lưu vào database
    return await this.saveGroupAssignments(saveData);
  }


  /**
   * Tính toán và cập nhật position cho các đội trong bảng
   * Priority: 1. Win/Loss 2. SetDiff 3. Head-to-head
   * @param categoryId - ID của tournament category
   * @param groupName - Tên bảng cần tính (optional, tính tất cả nếu không có)
   */
  async calculateGroupStandings(categoryId: number, groupName?: string): Promise<void> {
    // Lấy tất cả group standings
    const whereClause: any = { categoryId };
    if (groupName) {
      whereClause.groupName = groupName;
    }

    const standings = await GroupStanding.findAll({
      where: whereClause,
      include: [{ model: Entries, as: 'entry' }],
    });

    if (standings.length === 0) {
      throw new Error('Không tìm thấy group standings');
    }

    // Group by groupName
    const groupMap = new Map<string, GroupStanding[]>();
    for (const standing of standings) {
      if (!groupMap.has(standing.groupName)) {
        groupMap.set(standing.groupName, []);
      }
      groupMap.get(standing.groupName)!.push(standing);
    }

    // Tính toán position cho từng bảng
    for (const [currentGroupName, groupStandings] of groupMap) {
      await this.calculateSingleGroupStandings(categoryId, currentGroupName, groupStandings);
    }
  }

  /**
   * Tính toán position cho một bảng cụ thể
   * Chỉ sắp xếp và cập nhật thứ hạng, không cập nhật thống kê (thống kê được cập nhật từ match.service khi finalize)
   */
  private async calculateSingleGroupStandings(
    categoryId: number,
    groupName: string,
    standings: GroupStanding[]
  ): Promise<void> {
    // Sắp xếp theo thứ tự ưu tiên
    const sorted = await this.sortStandingsByRules(standings);

    // Cập nhật position
    for (let i = 0; i < sorted.length; i++) {
      await GroupStanding.update(
        { position: i + 1 },
        { where: { id: sorted[i]!.id } }
      );
    }
  }

  /**
   * Cập nhật thống kê từ matches đã hoàn thành
   */
  private async updateStandingsFromMatches(
    categoryId: number,
    groupName: string,
    standings: GroupStanding[]
  ): Promise<void> {
    // Lấy tất cả matches trong bảng này
    const schedules = await Schedule.findAll({
      where: { categoryId, groupName, stage: 'group' },
    });

    const scheduleIds = schedules.map(s => s.id);
    if (scheduleIds.length === 0) return;

    // Lấy matches đã hoàn thành
    const matches = await Match.findAll({
      where: {
        scheduleId: { [Op.in]: scheduleIds },
        status: 'completed',
      },
      include: [
        {
          model: SubMatch,
          as: 'subMatches',
          include: [{ model: MatchSet, as: 'matchSets' }]
        }
      ],
    });

    // Reset statistics
    for (const standing of standings) {
      await GroupStanding.update(
        {
          matchesPlayed: 0,
          matchesWon: 0,
          matchesLost: 0,
          setsWon: 0,
          setsLost: 0,
          setsDiff: 0,
        },
        { where: { id: standing.id } }
      );
    }

    // Tính toán từ matches
    for (const match of matches) {
      if (!match.winnerEntryId) continue;

      const entryAId = match.entryAId;
      const entryBId = match.entryBId;
      const winnerId = match.winnerEntryId;
      const loserId = winnerId === entryAId ? entryBId : entryAId;

      // Đếm sets won/lost từ subMatches
      let entryASets = 0;
      let entryBSets = 0;

      if (match && match.subMatches) {
        for (const subMatch of match.subMatches) {
          if (subMatch.matchSets) {
            for (const set of subMatch.matchSets) {
              if (set.entryAScore > set.entryBScore) {
                entryASets++;
              } else if (set.entryBScore > set.entryAScore) {
                entryBSets++;
              }
            }
          }
        }
      }

      // Cập nhật winner
      const winnerStanding = standings.find(s => s.entryId === winnerId);
      if (winnerStanding) {
        const winnerSets = winnerId === entryAId ? entryASets : entryBSets;
        const loserSets = winnerId === entryAId ? entryBSets : entryASets;
        
        await GroupStanding.update(
          {
            matchesPlayed: winnerStanding.matchesPlayed + 1,
            matchesWon: winnerStanding.matchesWon + 1,
            setsWon: winnerStanding.setsWon + winnerSets,
            setsLost: winnerStanding.setsLost + loserSets,
            setsDiff: (winnerStanding.setsWon + winnerSets) - (winnerStanding.setsLost + loserSets),
          },
          { where: { id: winnerStanding.id } }
        );
      }

      // Cập nhật loser
      const loserStanding = standings.find(s => s.entryId === loserId);
      if (loserStanding) {
        const loserSets = loserId === entryAId ? entryASets : entryBSets;
        const winnerSets = loserId === entryAId ? entryBSets : entryASets;
        
        await GroupStanding.update(
          {
            matchesPlayed: loserStanding.matchesPlayed + 1,
            matchesLost: loserStanding.matchesLost + 1,
            setsWon: loserStanding.setsWon + loserSets,
            setsLost: loserStanding.setsLost + winnerSets,
            setsDiff: (loserStanding.setsWon + loserSets) - (loserStanding.setsLost + winnerSets),
          },
          { where: { id: loserStanding.id } }
        );
      }
    }
  }

  /**
   * Sắp xếp standings theo quy tắc:
   * 1. Số trận thắng (nhiều hơn = cao hơn)
   * 2. SetDiff (cao hơn = cao hơn)
   * 3. Head-to-head
   */
  private async sortStandingsByRules(standings: GroupStanding[]): Promise<GroupStanding[]> {
    const sorted = [...standings];

    // Sort với custom comparator
    for (let i = 0; i < sorted.length - 1; i++) {
      for (let j = i + 1; j < sorted.length; j++) {
        const comparison = await this.compareStandings(sorted[i]!, sorted[j]!);
        if (comparison > 0) {
          // Swap if sorted[i] should be ranked lower than sorted[j]
          [sorted[i], sorted[j]] = [sorted[j]!, sorted[i]!];
        }
      }
    }

    return sorted;
  }

  /**
   * So sánh 2 standings
   * Return: -1 nếu a > b (a xếp cao hơn), 1 nếu b > a, 0 nếu bằng
   */
  private async compareStandings(a: GroupStanding, b: GroupStanding): Promise<number> {
    // 1. So sánh số trận thắng
    if (a.matchesWon !== b.matchesWon) {
      return b.matchesWon - a.matchesWon; // Nhiều hơn = cao hơn
    }

    // 2. So sánh setDiff
    if (a.setsDiff !== b.setsDiff) {
      return b.setsDiff - a.setsDiff; // Cao hơn = cao hơn
    }

    // 3. So sánh head-to-head
    const headToHead = await this.getHeadToHeadResult(a.categoryId, a.entryId, b.entryId);
    if (headToHead !== null) {
      return headToHead === a.entryId ? -1 : 1;
    }

    // Nếu vẫn bằng nhau, giữ nguyên thứ tự
    return 0;
  }

  /**
   * Lấy kết quả đối đầu giữa 2 entries
   * @returns entryId của đội thắng, hoặc null nếu chưa đấu hoặc hòa
   */
  private async getHeadToHeadResult(
    categoryId: number,
    entryAId: number,
    entryBId: number
  ): Promise<number | null> {
    // Tìm match giữa 2 entries này
    const schedules = await Schedule.findAll({
      where: { categoryId, stage: 'group' },
    });

    const scheduleIds = schedules.map(s => s.id);
    if (scheduleIds.length === 0) return null;

    const match = await Match.findOne({
      where: {
        scheduleId: { [Op.in]: scheduleIds },
        status: 'completed',
        [Op.or]: [
          { entryAId, entryBId },
          { entryAId: entryBId, entryBId: entryAId },
        ],
      },
    });

    if (!match || !match.winnerEntryId) return null;

    return match.winnerEntryId;
  }
}

export default new GroupStandingService();