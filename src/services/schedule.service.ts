import Schedule from "../models/schedule.model";
import Match from "../models/match.model";
import GroupStanding from "../models/groupStanding.model";
import TournamentContent from "../models/tournamentContent.model";
import Tournament from "../models/tournament.model";
import KnockoutBracket from "../models/knockoutBracket.model";
import Entries from "../models/entries.model";
import { Op } from "sequelize";
import { GroupStandingService } from "./groupStanding.service";
import { KnockoutBracketService } from "./knockoutBracket.service";

interface TimeSlot {
  start: Date;
  end: Date;
}

interface PendingMatch {
  groupName: string;
  entryAId: number;
  entryBId: number;
  scheduledAt: Date; // Thời gian sẽ được gán vào Schedule (không phải Match)
  tableNumber?: number; // Số bàn thi đấu
}

export class ScheduleService {
  private groupStandingService: GroupStandingService;
  private knockoutBracketService: KnockoutBracketService;

  constructor() {
    this.groupStandingService = new GroupStandingService();
    this.knockoutBracketService = new KnockoutBracketService();
  }

  async findAll(): Promise<Schedule[]> {
    return Schedule.findAll({
      order: [["scheduledAt", "ASC"]],
      include: [Match],
    });
  }

  /**
   * Tạo lịch thi đấu hoàn chỉnh cho tournament content
   * Bao gồm: chia bảng, tạo knockout brackets, và tạo schedules cho cả 2 vòng
   * @param contentId - ID của tournament content
   */
  async generateCompleteSchedule(
    contentId: number
  ): Promise<{
    groupStandings: GroupStanding[];
    groupSchedules: Schedule[];
    groupMatches: Match[];
    knockoutBrackets: KnockoutBracket[];
    knockoutSchedules: Schedule[];
    knockoutMatches: Match[];
  }> {
    // 1. Lấy thông tin content và tournament
    const content = await TournamentContent.findByPk(contentId);
    if (!content) {
      throw new Error("Tournament content not found");
    }

    const tournament = await Tournament.findByPk(content.tournamentId);
    if (!tournament) {
      throw new Error("Tournament not found");
    }
    
    if (!tournament.startDate || !tournament.endDate) {
      throw new Error("Tournament startDate and endDate must be set");
    }

    const startDate = new Date(tournament.startDate);
    const endDate = new Date(tournament.endDate);
    const numberOfTables = tournament.numberOfTables || 1;

    // 2. Kiểm tra hoặc tạo group standings
    let groupStandings = await GroupStanding.findAll({ where: { contentId } });
    
    if (groupStandings.length === 0) {
      // Tạo group standings từ entries
      const entries = await Entries.findAll({ where: { contentId } });
      if (entries.length === 0) {
        throw new Error("No entries found for this content");
      }

      // Random draw và save
      const drawResult = await this.groupStandingService.randomDrawEntries(contentId);
      await this.groupStandingService.saveGroupAssignments(contentId, drawResult);
      groupStandings = await GroupStanding.findAll({ where: { contentId } });
    }

    // 3. Tạo knockout brackets từ group results
    let knockoutBrackets: KnockoutBracket[] = [];
    const existingBrackets = await KnockoutBracket.findAll({ where: { contentId } });
    
    if (existingBrackets.length === 0 && content.isGroupStage) {
      // Tạo brackets từ group stage
      await this.knockoutBracketService.generateKnockoutBracketFromGroups(contentId);
      knockoutBrackets = await KnockoutBracket.findAll({ 
        where: { contentId },
        order: [["roundNumber", "ASC"], ["bracketPosition", "ASC"]]
      });
    } else {
      knockoutBrackets = existingBrackets;
    }

    // 4. Tính toán thời gian cho mỗi phase
    const matchDuration = content.type === "team" ? 90 : 30;
    
    // Ước tính số ngày cần cho vòng bảng
    const groupMatchCount = this.calculateTotalGroupMatches(groupStandings);
    const daysNeededForGroups = this.estimateDaysNeeded(
      groupMatchCount,
      numberOfTables,
      2 // max 2 trận/ngày cho group stage
    );

    // Tính ngày bắt đầu knockout
    const knockoutStartDate = new Date(startDate);
    knockoutStartDate.setDate(startDate.getDate() + daysNeededForGroups);

    // Kiểm tra có đủ thời gian không
    const totalDaysAvailable = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const knockoutMatchCount = knockoutBrackets.filter(b => !b.isByeMatch).length;
    const daysNeededForKnockout = this.estimateDaysNeeded(
      knockoutMatchCount,
      numberOfTables,
      3 // max 3 trận/ngày cho knockout
    );

    if (daysNeededForGroups + daysNeededForKnockout > totalDaysAvailable) {
      throw new Error(
        `Not enough time to complete tournament. Need ${daysNeededForGroups + daysNeededForKnockout} days but only have ${totalDaysAvailable} days available.`
      );
    }

    // 5. Tạo schedules cho group stage
    const { schedules: groupSchedules, matches: groupMatches } = 
      await this.generateGroupStageSchedule(contentId, startDate);

    // 6. Tạo schedules cho knockout stage với max 3 trận/ngày
    const { schedules: knockoutSchedules, matches: knockoutMatches } = 
      await this.generateKnockoutStageScheduleWithLimit(contentId, knockoutStartDate, 3);

    return {
      groupStandings,
      groupSchedules,
      groupMatches,
      knockoutBrackets,
      knockoutSchedules,
      knockoutMatches,
    };
  }

  /**
   * Tạo lịch thi đấu cho nội dung chỉ có knockout stage (không có group stage)
   * Tự động lấy startDate và endDate từ tournament
   */
  async generateKnockoutOnlySchedule(contentId: number): Promise<{
    knockoutBrackets: KnockoutBracket[];
    knockoutSchedules: Schedule[];
    knockoutMatches: Match[];
  }> {
    // 1. Lấy thông tin content và tournament
    const content = await TournamentContent.findByPk(contentId);
    if (!content) {
      throw new Error("Tournament content not found");
    }

    if (content.isGroupStage) {
      throw new Error("This content has group stage. Use generateCompleteSchedule instead.");
    }

    const tournament = await Tournament.findByPk(content.tournamentId);
    if (!tournament) {
      throw new Error("Tournament not found");
    }
    
    if (!tournament.startDate || !tournament.endDate) {
      throw new Error("Tournament startDate and endDate must be set");
    }

    const startDate = new Date(tournament.startDate);
    const endDate = new Date(tournament.endDate);
    const numberOfTables = tournament.numberOfTables || 1;

    // 2. Kiểm tra hoặc tạo knockout brackets từ entries
    let knockoutBrackets = await KnockoutBracket.findAll({ where: { contentId } });
    
    if (knockoutBrackets.length === 0) {
      // Lấy tất cả entries và tạo brackets trực tiếp
      const entries = await Entries.findAll({ where: { contentId } });
      if (entries.length === 0) {
        throw new Error("No entries found for this content");
      }

      // Tạo knockout brackets từ entries (không qua group stage)
      await this.knockoutBracketService.generateKnockoutBracket(contentId);
      knockoutBrackets = await KnockoutBracket.findAll({ 
        where: { contentId },
        order: [["roundNumber", "ASC"], ["bracketPosition", "ASC"]]
      });
    }

    // 3. Tính toán thời gian
    const knockoutMatchCount = knockoutBrackets.filter(b => !b.isByeMatch).length;
    const totalDaysAvailable = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysNeededForKnockout = this.estimateDaysNeeded(
      knockoutMatchCount,
      numberOfTables,
      3 // max 3 trận/ngày cho knockout
    );

    if (daysNeededForKnockout > totalDaysAvailable) {
      throw new Error(
        `Not enough time to complete tournament. Need ${daysNeededForKnockout} days but only have ${totalDaysAvailable} days available.`
      );
    }

    // 4. Tạo schedules cho knockout stage với max 3 trận/ngày
    const { schedules: knockoutSchedules, matches: knockoutMatches } = 
      await this.generateKnockoutStageScheduleWithLimit(contentId, startDate, 3);

    return {
      knockoutBrackets,
      knockoutSchedules,
      knockoutMatches,
    };
  }

  /**
   * Tính tổng số trận đấu trong vòng bảng
   */
  private calculateTotalGroupMatches(groupStandings: GroupStanding[]): number {
    const groupsMap = new Map<string, number>();
    for (const standing of groupStandings) {
      groupsMap.set(standing.groupName, (groupsMap.get(standing.groupName) || 0) + 1);
    }

    let totalMatches = 0;
    for (const teamsInGroup of groupsMap.values()) {
      // Round-robin: n*(n-1)/2
      totalMatches += (teamsInGroup * (teamsInGroup - 1)) / 2;
    }

    return totalMatches;
  }

  /**
   * Ước tính số ngày cần để hoàn thành số trận đấu
   */
  private estimateDaysNeeded(
    totalMatches: number,
    numberOfTables: number,
    maxMatchesPerDayPerEntry: number
  ): number {
    // Số slots mỗi ngày: 3 buổi (sáng, chiều, tối)
    const slotsPerDay = 3;
    
    // Số trận tối đa mỗi ngày = số bàn × slots × (nhưng bị giới hạn bởi maxMatchesPerDayPerEntry)
    // Ước tính conservative
    const matchesPerDay = Math.min(numberOfTables * slotsPerDay, totalMatches / 2);
    
    return Math.ceil(totalMatches / matchesPerDay);
  }
  /**
   * Tạo schedule cho vòng bảng
   * @param contentId - ID của tournament content
   * @param startDate - Ngày bắt đầu thi đấu
   * @returns Danh sách schedules và matches đã tạo
   */
  async generateGroupStageSchedule(
    contentId: number,
    startDate: Date
  ): Promise<{ schedules: Schedule[]; matches: Match[] }> {
    // Lấy thông tin tournament content và tournament
    const content = await TournamentContent.findByPk(contentId, {
      include: [{
        model: Tournament,
        as: 'tournament',
      }],
    });
    
    if (!content) {
      throw new Error("Tournament content not found");
    }

    // Lấy tournament để có numberOfTables
    const tournament = await Tournament.findByPk(content.tournamentId);
    const numberOfTables = tournament?.numberOfTables || 1;
    

    // Lấy tất cả group standings
    const standings = await GroupStanding.findAll({
      where: { contentId },
      order: [["groupName", "ASC"]],
    });

    if (standings.length === 0) {
      throw new Error("Group standings not found for the content");
    }

    // Group by groupName
    const groupsMap = new Map<string, number[]>();
    for (const standing of standings) {
      if (!groupsMap.has(standing.groupName)) {
        groupsMap.set(standing.groupName, []);
      }
      groupsMap.get(standing.groupName)!.push(standing.entryId);
    }

    // Tạo round-robin matches cho mỗi group
    const allMatches: PendingMatch[] = [];
    for (const [groupName, entryIds] of groupsMap) {
      const groupMatches = this.generateRoundRobinMatches(groupName, entryIds);
      allMatches.push(...groupMatches);
    }

    // Xác định thời gian mỗi trận (30 phút cho single/double, 90 phút cho team)
    const matchDuration = content.type === "team" ? 90 : 30;

    // Phân bổ thời gian cho các trận đấu với hỗ trợ nhiều bàn
    const scheduledMatches = this.scheduleMatchesWithMultipleTables(
      allMatches,
      startDate,
      matchDuration,
      numberOfTables
    );

    // Tạo Schedule và Match records
    const schedules: Schedule[] = [];
    const matches: Match[] = [];

    for (const matchSchedule of scheduledMatches) {
      // Tạo Schedule
      const schedule = await Schedule.create({
        contentId: contentId,
        groupName: matchSchedule.groupName,
        stage: "group" as const,
        scheduledAt: matchSchedule.scheduledAt,
        roundNumber: 1,
        tableNumber: matchSchedule.tableNumber,
      });

      schedules.push(schedule);

      // Tạo Match
      const match = await Match.create({
        scheduleId: schedule.id,
        entryAId: matchSchedule.entryAId,
        entryBId: matchSchedule.entryBId,
        status: "scheduled" as const,
      });

      matches.push(match);
    }

    return { schedules, matches };
  }

  /**
   * Tạo schedule cho vòng knockout
   * @param contentId - ID của tournament content
   * @param startDate - Ngày bắt đầu thi đấu vòng knockout
   * @returns Danh sách schedules và matches đã tạo
   */
  async generateKnockoutStageSchedule(
    contentId: number,
    startDate: Date
  ): Promise<{ schedules: Schedule[]; matches: Match[] }> {
    // Lấy thông tin tournament content và tournament
    const content = await TournamentContent.findByPk(contentId);
    if (!content) {
      throw new Error("Tournament content not found");
    }

    // Lấy tournament để có numberOfTables
    const tournament = await Tournament.findByPk(content.tournamentId);
    const numberOfTables = tournament?.numberOfTables || 1;

    // Lấy tất cả knockout brackets, sắp xếp theo round và position
    const brackets = await KnockoutBracket.findAll({
      where: {
        contentId,
        status: { [Op.in]: ["ready", "pending"] }, // Chỉ lấy brackets chưa schedule
        isByeMatch: false, // Không schedule bye matches
      },
      order: [
        ["roundNumber", "ASC"],
        ["bracketPosition", "ASC"],
      ],
    });

    if (brackets.length === 0) {
      throw new Error("No knockout brackets found or all brackets already scheduled");
    }

    // Group brackets by round
    const bracketsByRound = new Map<number, KnockoutBracket[]>();
    for (const bracket of brackets) {
      if (!bracketsByRound.has(bracket.roundNumber)) {
        bracketsByRound.set(bracket.roundNumber, []);
      }
      bracketsByRound.get(bracket.roundNumber)!.push(bracket);
    }

    // Tạo pending matches cho knockout
    // Bao gồm cả những brackets chưa có entries (placeholders)
    const allMatches: (PendingMatch & { bracketId: number; roundName: string; hasEntries: boolean })[] = [];
    for (const [roundNumber, roundBrackets] of bracketsByRound) {
      for (const bracket of roundBrackets) {
        // Tạo schedule cho tất cả brackets, kể cả placeholders
        const hasEntries = !!(bracket.entryAId && bracket.entryBId);
        
        allMatches.push({
          groupName: "", // Knockout không có group
          entryAId: bracket.entryAId || 0, // Dùng 0 cho placeholder
          entryBId: bracket.entryBId || 0, // Dùng 0 cho placeholder
          scheduledAt: new Date(), // Sẽ được gán sau
          bracketId: bracket.id,
          roundName: bracket.roundName || `Round ${roundNumber}`,
          hasEntries: hasEntries,
        });
      }
    }

    if (allMatches.length === 0) {
      throw new Error("No brackets found to schedule.");
    }

    // Xác định thời gian mỗi trận (30 phút cho single/double, 90 phút cho team)
    const matchDuration = content.type === "team" ? 90 : 30;

    // Phân bổ thời gian cho các trận đấu với hỗ trợ nhiều bàn
    const scheduledMatches = this.scheduleMatchesWithMultipleTables(
      allMatches,
      startDate,
      matchDuration,
      numberOfTables
    );

    // Tạo Schedule và Match records, update KnockoutBracket
    const schedules: Schedule[] = [];
    const matches: Match[] = [];

    for (const matchSchedule of scheduledMatches) {
      const matchData = matchSchedule as PendingMatch & { bracketId: number; roundName: string; hasEntries: boolean };
      
      // Lấy bracket để có thông tin round
      const bracket = brackets.find(b => b.id === matchData.bracketId);
      if (!bracket) continue;

      // Tạo Schedule (luôn tạo cho tất cả rounds)
      const schedule = await Schedule.create({
        contentId: contentId,
        stage: "knockout" as const,
        knockoutRound: matchData.roundName,
        scheduledAt: matchSchedule.scheduledAt,
        roundNumber: bracket.roundNumber,
        tableNumber: matchSchedule.tableNumber,
      });

      schedules.push(schedule);

      // Chỉ tạo Match nếu có đủ entries (không phải placeholder)
      let matchId: number | undefined;
      if (matchData.hasEntries && matchSchedule.entryAId !== 0 && matchSchedule.entryBId !== 0) {
        const match = await Match.create({
          scheduleId: schedule.id,
          entryAId: matchSchedule.entryAId,
          entryBId: matchSchedule.entryBId,
          status: "scheduled" as const,
        });
        matches.push(match);
        matchId = match.id;
      }

      // Update knockout bracket với scheduleId và matchId (nếu có)
      await KnockoutBracket.update(
        {
          scheduleId: schedule.id,
          matchId: matchId || null,
          status: matchData.hasEntries ? "ready" : "pending",
        },
        {
          where: { id: matchData.bracketId },
        }
      );
    }

    return { schedules, matches };
  }

  /**
   * Tạo schedule cho vòng knockout với giới hạn số trận/ngày
   * @param contentId - ID của tournament content
   * @param startDate - Ngày bắt đầu thi đấu vòng knockout
   * @param maxMatchesPerDay - Số trận tối đa mỗi ngày mỗi entry (3 cho knockout)
   * @returns Danh sách schedules và matches đã tạo
   */
  async generateKnockoutStageScheduleWithLimit(
    contentId: number,
    startDate: Date,
    maxMatchesPerDay: number = 3
  ): Promise<{ schedules: Schedule[]; matches: Match[] }> {
    // Lấy thông tin tournament content và tournament
    const content = await TournamentContent.findByPk(contentId);
    if (!content) {
      throw new Error("Tournament content not found");
    }

    // Lấy tournament để có numberOfTables
    const tournament = await Tournament.findByPk(content.tournamentId);
    const numberOfTables = tournament?.numberOfTables || 1;

    // Lấy tất cả knockout brackets
    const brackets = await KnockoutBracket.findAll({
      where: {
        contentId,
        status: { [Op.in]: ["ready", "pending"] },
        isByeMatch: false,
      },
      order: [
        ["roundNumber", "ASC"],
        ["bracketPosition", "ASC"],
      ],
    });

    if (brackets.length === 0) {
      throw new Error("No knockout brackets found or all brackets already scheduled");
    }

    // Tạo pending matches cho knockout
    const allMatches: (PendingMatch & { bracketId: number; roundName: string; hasEntries: boolean })[] = [];
    for (const bracket of brackets) {
      const hasEntries = !!(bracket.entryAId && bracket.entryBId);
      
      allMatches.push({
        groupName: "",
        entryAId: bracket.entryAId || 0,
        entryBId: bracket.entryBId || 0,
        scheduledAt: new Date(),
        bracketId: bracket.id,
        roundName: bracket.roundName || `Round ${bracket.roundNumber}`,
        hasEntries: hasEntries,
      });
    }

    if (allMatches.length === 0) {
      throw new Error("No brackets found to schedule.");
    }

    // Xác định thời gian mỗi trận
    const matchDuration = content.type === "team" ? 90 : 30;

    // Phân bổ thời gian với giới hạn matches/ngày
    const scheduledMatches = this.scheduleMatchesWithMultipleTablesAndLimit(
      allMatches,
      startDate,
      matchDuration,
      numberOfTables,
      maxMatchesPerDay
    );

    // Tạo Schedule và Match records
    const schedules: Schedule[] = [];
    const matches: Match[] = [];

    for (const matchSchedule of scheduledMatches) {
      const matchData = matchSchedule as PendingMatch & { bracketId: number; roundName: string; hasEntries: boolean };
      
      const bracket = brackets.find(b => b.id === matchData.bracketId);
      if (!bracket) continue;

      // Tạo Schedule
      const schedule = await Schedule.create({
        contentId: contentId,
        stage: "knockout" as const,
        knockoutRound: matchData.roundName,
        scheduledAt: matchSchedule.scheduledAt,
        roundNumber: bracket.roundNumber,
        tableNumber: matchSchedule.tableNumber,
      });

      schedules.push(schedule);

      // Chỉ tạo Match nếu có đủ entries
      let matchId: number | undefined;
      if (matchData.hasEntries && matchSchedule.entryAId !== 0 && matchSchedule.entryBId !== 0) {
        const match = await Match.create({
          scheduleId: schedule.id,
          entryAId: matchSchedule.entryAId,
          entryBId: matchSchedule.entryBId,
          status: "scheduled" as const,
        });
        matches.push(match);
        matchId = match.id;
      }

      // Update knockout bracket
      await KnockoutBracket.update(
        {
          scheduleId: schedule.id,
          matchId: matchId || null,
          status: matchData.hasEntries ? "ready" : "pending",
        },
        {
          where: { id: matchData.bracketId },
        }
      );
    }

    return { schedules, matches };
  }

  /**
   * Tạo round-robin matches (tất cả đội đấu với nhau)
   */
  private generateRoundRobinMatches(
    groupName: string,
    entryIds: number[]
  ): PendingMatch[] {
    const matches: PendingMatch[] = [];

    for (let i = 0; i < entryIds.length; i++) {
      for (let j = i + 1; j < entryIds.length; j++) {
        matches.push({
          groupName,
          entryAId: entryIds[i]!,
          entryBId: entryIds[j]!,
          scheduledAt: new Date(), // Sẽ được gán sau
        });
      }
    }

    return matches;
  }

  /**
   * Phân bổ thời gian cho các trận đấu với hỗ trợ nhiều bàn thi đấu và giới hạn matches/ngày
   * @param matches - Danh sách các trận đấu cần xếp lịch
   * @param startDate - Ngày bắt đầu
   * @param matchDuration - Thời gian mỗi trận (phút)
   * @param numberOfTables - Số bàn thi đấu có sẵn
   * @param maxMatchesPerDay - Số trận tối đa mỗi ngày mỗi entry
   */
  private scheduleMatchesWithMultipleTablesAndLimit(
    matches: PendingMatch[],
    startDate: Date,
    matchDuration: number,
    numberOfTables: number,
    maxMatchesPerDay: number = 2
  ): PendingMatch[] {
    const timeSlots = this.generateTimeSlots(startDate);
    const scheduledMatches: PendingMatch[] = [];
    
    // Track last match time for each entry
    const entryLastMatchTime = new Map<number, Date>();
    
    // Track number of matches per entry per day
    const entryMatchesPerDay = new Map<string, number>();
    
    // Track which matches have been scheduled
    const scheduledIndices = new Set<number>();

    for (const slot of timeSlots) {
      let tablesUsed = 0;

      // Scan through all unscheduled matches
      for (let i = 0; i < matches.length && tablesUsed < numberOfTables; i++) {
        if (scheduledIndices.has(i)) {
          continue;
        }

        const match = matches[i]!;
        
        // Nếu là placeholder match (entryId = 0), bỏ qua constraint checking
        const isPlaceholder = match.entryAId === 0 || match.entryBId === 0;
        
        let canSchedule = true;
        
        if (!isPlaceholder) {
          // Kiểm tra session constraint
          const entryALastMatch = entryLastMatchTime.get(match.entryAId);
          const entryBLastMatch = entryLastMatchTime.get(match.entryBId);

          const canScheduleSession = this.canScheduleInSlot(
            slot.start,
            entryALastMatch,
            entryBLastMatch
          );

          // Kiểm tra daily limit
          const dateKey = slot.start.toISOString().split('T')[0];
          const entryAKey = `${match.entryAId}-${dateKey}`;
          const entryBKey = `${match.entryBId}-${dateKey}`;
          const entryAMatchesToday = entryMatchesPerDay.get(entryAKey) || 0;
          const entryBMatchesToday = entryMatchesPerDay.get(entryBKey) || 0;

          const canScheduleDaily = entryAMatchesToday < maxMatchesPerDay && entryBMatchesToday < maxMatchesPerDay;
          
          canSchedule = canScheduleSession && canScheduleDaily;
        }

        if (canSchedule) {
          scheduledMatches.push({
            ...match,
            scheduledAt: slot.start,
            tableNumber: tablesUsed + 1,
          });

          // Chỉ update tracking cho non-placeholder matches
          if (!isPlaceholder) {
            entryLastMatchTime.set(match.entryAId, slot.start);
            entryLastMatchTime.set(match.entryBId, slot.start);

            const dateKey = slot.start.toISOString().split('T')[0];
            const entryAKey = `${match.entryAId}-${dateKey}`;
            const entryBKey = `${match.entryBId}-${dateKey}`;
            const entryAMatchesToday = entryMatchesPerDay.get(entryAKey) || 0;
            const entryBMatchesToday = entryMatchesPerDay.get(entryBKey) || 0;
            
            entryMatchesPerDay.set(entryAKey, entryAMatchesToday + 1);
            entryMatchesPerDay.set(entryBKey, entryBMatchesToday + 1);
          }

          scheduledIndices.add(i);
          tablesUsed++;
        }
      }

      if (scheduledIndices.size === matches.length) {
        break;
      }
    }

    if (scheduledIndices.size < matches.length) {
      throw new Error(
        `Not enough time slots to schedule all matches. Scheduled ${scheduledIndices.size}/${matches.length} matches. Additional match days are required.`
      );
    }

    return scheduledMatches;
  }

  /**
   * Phân bổ thời gian cho các trận đấu với hỗ trợ nhiều bàn thi đấu
   * Điều kiện: Các đội không đấu liên tiếp 2 trận trong một buổi
   * @param matches - Danh sách các trận đấu cần xếp lịch
   * @param startDate - Ngày bắt đầu
   * @param matchDuration - Thời gian mỗi trận (phút)
   * @param numberOfTables - Số bàn thi đấu có sẵn
   */
  private scheduleMatchesWithMultipleTables(
    matches: PendingMatch[],
    startDate: Date,
    matchDuration: number,
    numberOfTables: number
  ): PendingMatch[] {
    // Gọi method mới với maxMatchesPerDay = 2 (default cho group stage)
    return this.scheduleMatchesWithMultipleTablesAndLimit(
      matches,
      startDate,
      matchDuration,
      numberOfTables,
      2
    );
  }

  /**
   * Phân bổ thời gian cho các trận đấu (logic cũ - 1 bàn)
   * @deprecated Use scheduleMatchesWithMultipleTables instead
   */
  private scheduleMatches(
    matches: PendingMatch[],
    startDate: Date,
    matchDuration: number
  ): PendingMatch[] {
    return this.scheduleMatchesWithMultipleTables(matches, startDate, matchDuration, 1);
  }

  /**
   * Kiểm tra xem có thể schedule trận đấu trong slot này không
   * Điều kiện: Không có entry nào đấu trong cùng buổi (session)
   */
  private canScheduleInSlot(
    slotTime: Date,
    entryALastMatch?: Date,
    entryBLastMatch?: Date
  ): boolean {
    if (!entryALastMatch && !entryBLastMatch) {
      return true; // Cả 2 đều chưa đấu
    }

    // Kiểm tra xem có cùng session không
    const isSameSessionA = entryALastMatch
      ? this.isSameSession(slotTime, entryALastMatch)
      : false;
    const isSameSessionB = entryBLastMatch
      ? this.isSameSession(slotTime, entryBLastMatch)
      : false;

    return !isSameSessionA && !isSameSessionB;
  }

  /**
   * Kiểm tra 2 thời điểm có cùng session không
   * Session: Morning (8h-11h30), Afternoon (13h30-17h), Evening (18h30-22h)
   */
  private isSameSession(time1: Date, time2: Date): boolean {
    if (time1.toDateString() !== time2.toDateString()) {
      return false; // Khác ngày
    }

    const session1 = this.getSession(time1);
    const session2 = this.getSession(time2);

    return session1 === session2;
  }

  /**
   * Xác định session của thời điểm
   */
  private getSession(time: Date): "morning" | "afternoon" | "evening" {
    const hours = time.getHours();
    const minutes = time.getMinutes();
    const totalMinutes = hours * 60 + minutes;

    // Morning: 8h-11h30 (480-690)
    if (totalMinutes >= 480 && totalMinutes < 690) {
      return "morning";
    }
    // Afternoon: 13h30-17h (810-1020)
    else if (totalMinutes >= 810 && totalMinutes < 1020) {
      return "afternoon";
    }
    // Evening: 18h30-22h (1110-1320)
    else {
      return "evening";
    }
  }

  /**
   * Tạo time slots cho nhiều ngày
   * Khung giờ: 8h-11h30, 13h30-17h, 18h30-22h
   * Điều kiện: Trận đấu chỉ cần bắt đầu trước giờ nghỉ, có thể kết thúc sau giờ nghỉ
   */
  private generateTimeSlots(startDate: Date, numDays: number = 30): TimeSlot[] {
    const slots: TimeSlot[] = [];

    for (let day = 0; day < numDays; day++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + day);

      // Morning session: 8h-11h30 (mỗi 30 phút)
      // Cho phép bắt đầu đến 11h30, có thể kết thúc sau 11h30
      for (let hour = 8; hour <= 11; hour++) {
        const startMinutes = hour === 11 ? [0, 30] : [0, 30];
        for (const minute of startMinutes) {
          // Chỉ check start time <= 11h30
          if (hour < 11 || (hour === 11 && minute <= 30)) {
            const start = new Date(currentDate);
            start.setHours(hour, minute, 0, 0);

            const end = new Date(start);
            end.setMinutes(start.getMinutes() + 30);

            slots.push({ start, end });
          }
        }
      }

      // Afternoon session: 13h30-17h
      // Cho phép bắt đầu đến 17h, có thể kết thúc sau 17h
      for (let hour = 13; hour <= 17; hour++) {
        const startMinutes = hour === 13 ? [30] : [0, 30];
        for (const minute of startMinutes) {
          // 13h30-17h: start time phải từ 13h30 đến 17h
          const totalMinutes = hour * 60 + minute;
          if (totalMinutes >= 13 * 60 + 30 && totalMinutes <= 17 * 60) {
            const start = new Date(currentDate);
            start.setHours(hour, minute, 0, 0);

            const end = new Date(start);
            end.setMinutes(start.getMinutes() + 30);

            slots.push({ start, end });
          }
        }
      }

      // Evening session: 18h30-22h
      // Cho phép bắt đầu đến 22h, có thể kết thúc sau 22h
      for (let hour = 18; hour <= 22; hour++) {
        const startMinutes = hour === 18 ? [30] : [0, 30];
        for (const minute of startMinutes) {
          // 18h30-22h: start time phải từ 18h30 đến 22h
          const totalMinutes = hour * 60 + minute;
          if (totalMinutes >= 18 * 60 + 30 && totalMinutes <= 22 * 60) {
            const start = new Date(currentDate);
            start.setHours(hour, minute, 0, 0);

            const end = new Date(start);
            end.setMinutes(start.getMinutes() + 30);

            slots.push({ start, end });
          }
        }
      }
    }

    return slots;
  }

  /**
   * Xóa tất cả schedules và matches của content
   */
  async deleteSchedulesByContentId(contentId: number): Promise<void> {
    const schedules = await Schedule.findAll({ where: { contentId } });
    const scheduleIds = schedules.map((s) => s.id);

    if (scheduleIds.length > 0) {
      await Match.destroy({ where: { scheduleId: { [Op.in]: scheduleIds } } });
    }

    await Schedule.destroy({ where: { contentId } });
  }

  /**
   * Lấy danh sách schedules theo tournamentContentId
   * @param contentId - ID của tournament content
   * @param skip - Số lượng bản ghi bỏ qua
   * @param limit - Số lượng bản ghi trả về
   * @param stage - Lọc theo stage (optional): 'group' hoặc 'knockout'
   * @returns Danh sách schedules và số lượng
   */
  async findSchedulesByContentId(
    contentId: number,
    skip = 0,
    limit = 10,
    stage?: 'group' | 'knockout'
  ): Promise<{ schedules: Schedule[]; count: number }> {
    const whereCondition: any = { contentId };

    if (stage) {
      whereCondition.stage = stage;
    }

    const { rows: schedules, count } = await Schedule.findAndCountAll({
      where: whereCondition,
      include: [
        {
          model: TournamentContent,
          as: "tournamentContent",
          include: [
            {
              model: Tournament,
              as: "tournament",
            },
          ],
        },
        {
          model: Match,
          as: "matches",
          include: [
            {
              model: Entries,
              as: "entryA",
            },
            {
              model: Entries,
              as: "entryB",
            },
            {
              model: Entries,
              as: "winnerEntry",
            },
          ],
        },
      ],
      order: [
        ["scheduledAt", "ASC"],
        ["roundNumber", "ASC"],
        ["tableNumber", "ASC"],
      ],
      offset: skip,
      limit,
    });

    return { schedules, count };
  }
}

export default new ScheduleService();
