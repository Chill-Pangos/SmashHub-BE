import Match from "../models/match.model";
import { CreateMatchDto, UpdateMatchDto } from "../dto/match.dto";
import User from "../models/user.model";
import Role from "../models/role.model";
import { Op } from "sequelize";
import MatchSet from "../models/matchSet.model";
import TournamentContent from "../models/tournamentContent.model";
import Schedule from "../models/schedule.model";
import GroupStanding from "../models/groupStanding.model";
import KnockoutBracket from "../models/knockoutBracket.model";
import TournamentReferee from "../models/tournamentReferee.model";

export class MatchService {
  async create(data: CreateMatchDto): Promise<Match> {
    return await Match.create(data as any);
  }

  async findAll(skip = 0, limit = 10): Promise<Match[]> {
    return await Match.findAll({
      offset: skip,
      limit,
    });
  }

  async findById(id: number): Promise<Match | null> {
    return await Match.findByPk(id);
  }

  async findByScheduleId(
    scheduleId: number,
    skip = 0,
    limit = 10
  ): Promise<Match[]> {
    return await Match.findAll({
      where: { scheduleId },
      offset: skip,
      limit,
    });
  }

  async findByStatus(status: string, skip = 0, limit = 10): Promise<Match[]> {
    return await Match.findAll({
      where: { status },
      offset: skip,
      limit,
    });
  }

  async update(id: number, data: UpdateMatchDto): Promise<[number, Match[]]> {
    return await Match.update(data, {
      where: { id },
      returning: true,
    });
  }

  async delete(id: number): Promise<number> {
    return await Match.destroy({ where: { id } });
  }

  async startMatch(id: number): Promise<Match | null> {
    const match = await Match.findByPk(id, {
      include: [
        {
          model: Schedule,
          include: [{ model: TournamentContent }],
        },
      ],
    });
    
    if (!match) {
      throw new Error("Match not found");
    }

    if (match.status !== "scheduled") {
      throw new Error(`Cannot start match. Current status is ${match.status}, but it must be scheduled`);
    }

    // Lấy tournamentId từ schedule -> tournamentContent
    const schedule = match.schedule;
    if (!schedule || !schedule.tournamentContent) {
      throw new Error("Cannot find tournament information for this match");
    }

    const tournamentId = schedule.tournamentContent.tournamentId;

    // Lấy danh sách ID của các trọng tài đang điều hành trận đấu
    const busyMatches = await Match.findAll({
      where: {
        status: "in_progress",
      },
      attributes: ["umpire", "assistantUmpire"],
    });

    const busyRefereeIds = new Set<number>();
    busyMatches.forEach((m) => {
      if (m.umpire) busyRefereeIds.add(m.umpire);
      if (m.assistantUmpire) busyRefereeIds.add(m.assistantUmpire);
    });

    // Tìm trọng tài từ bảng tournament_referees của tournament này
    // và không đang bận điều hành trận khác
    const availableReferees = await TournamentReferee.findAll({
      where: {
        tournamentId,
        isAvailable: true,
        refereeId: {
          [Op.notIn]: Array.from(busyRefereeIds),
        },
      },
      include: [
        {
          model: User,
          as: "referee",
        },
      ],
      limit: 2,
    });

    if (availableReferees.length < 2) {
      throw new Error(`Not enough available referees for tournament ${tournamentId}. Found ${availableReferees.length}, need 2`);
    }

    await match.update({
      umpire: availableReferees[0]!.refereeId,
      assistantUmpire: availableReferees[1]!.refereeId,
      status: "in_progress",
    });

    return match;
  }

  /**
   * Tổng kết kết quả trận đấu:
   * 1. Kiểm tra tỉ số set để xác định winner
   * 2. Cập nhật groupStanding hoặc knockoutBracket
   * 3. Kiểm tra và tạo match cho vòng sau (knockout)
   */
  async finalizeMatch(id: number): Promise<Match> {
    const match = await Match.findByPk(id, {
      include: [
        { model: MatchSet },
        {
          model: Schedule,
          include: [{ model: TournamentContent }],
        },
      ],
    });

    if (!match) {
      throw new Error("Match not found");
    }

    if (match.status !== "in_progress") {
      throw new Error(`Cannot finalize match. Current status is ${match.status}, must be in_progress`);
    }

    if (!match.schedule || !match.schedule.tournamentContent) {
      throw new Error("Match schedule or content not found");
    }

    const content = match.schedule.tournamentContent;
    const matchSets = match.matchSets || [];

    if (matchSets.length === 0) {
      throw new Error("No sets found for this match");
    }

    // 1. Tính số set thắng của mỗi entry
    let entryASetsWon = 0;
    let entryBSetsWon = 0;

    matchSets.forEach((set) => {
      if (set.entryAScore > set.entryBScore) {
        entryASetsWon++;
      } else if (set.entryBScore > set.entryAScore) {
        entryBSetsWon++;
      }
    });

    // Tính số set cần thắng: maxSets / 2 + 1
    const setsToWin = Math.floor(content.maxSets / 2) + 1;

    // Kiểm tra đã có người thắng chưa
    if (entryASetsWon < setsToWin && entryBSetsWon < setsToWin) {
      throw new Error(
        `Match is not complete. Need ${setsToWin} sets to win. Current: Entry A ${entryASetsWon}, Entry B ${entryBSetsWon}`
      );
    }

    const winnerEntryId = entryASetsWon >= setsToWin ? match.entryAId : match.entryBId;
    const loserEntryId = winnerEntryId === match.entryAId ? match.entryBId : match.entryAId;

    // Cập nhật match status và winner
    await match.update({
      status: "completed",
      winnerEntryId,
    });

    // 2. Cập nhật groupStanding hoặc knockoutBracket
    if (match.schedule.stage === "group" && content.isGroupStage) {
      // Vòng bảng: cập nhật groupStanding
      await this.updateGroupStanding(
        content.id,
        match.schedule.groupName!,
        match.entryAId,
        match.entryBId,
        entryASetsWon,
        entryBSetsWon,
        winnerEntryId
      );
    } else if (match.schedule.stage === "knockout") {
      // Vòng knockout: cập nhật knockoutBracket
      await this.updateKnockoutBracket(match.id, winnerEntryId);

      // 3. Kiểm tra và tạo match cho vòng sau
      await this.checkAndCreateNextMatch(match.id, winnerEntryId);
    }

    return match;
  }

  /**
   * Cập nhật groupStanding cho vòng bảng
   */
  private async updateGroupStanding(
    contentId: number,
    groupName: string,
    entryAId: number,
    entryBId: number,
    entryASetsWon: number,
    entryBSetsWon: number,
    winnerEntryId: number
  ): Promise<void> {
    // Tìm hoặc tạo standing cho entry A
    const [standingA] = await GroupStanding.findOrCreate({
      where: { contentId, groupName, entryId: entryAId },
      defaults: {
        contentId,
        groupName,
        entryId: entryAId,
        matchesPlayed: 0,
        matchesWon: 0,
        matchesLost: 0,
        setsWon: 0,
        setsLost: 0,
        setsDiff: 0,
      } as any,
    });

    // Tìm hoặc tạo standing cho entry B
    const [standingB] = await GroupStanding.findOrCreate({
      where: { contentId, groupName, entryId: entryBId },
      defaults: {
        contentId,
        groupName,
        entryId: entryBId,
        matchesPlayed: 0,
        matchesWon: 0,
        matchesLost: 0,
        setsWon: 0,
        setsLost: 0,
        setsDiff: 0,
      } as any,
    });

    // Cập nhật standing cho entry A
    await standingA.update({
      matchesPlayed: standingA.matchesPlayed + 1,
      matchesWon: standingA.matchesWon + (winnerEntryId === entryAId ? 1 : 0),
      matchesLost: standingA.matchesLost + (winnerEntryId !== entryAId ? 1 : 0),
      setsWon: standingA.setsWon + entryASetsWon,
      setsLost: standingA.setsLost + entryBSetsWon,
      setsDiff: standingA.setsWon + entryASetsWon - (standingA.setsLost + entryBSetsWon),
    });

    // Cập nhật standing cho entry B
    await standingB.update({
      matchesPlayed: standingB.matchesPlayed + 1,
      matchesWon: standingB.matchesWon + (winnerEntryId === entryBId ? 1 : 0),
      matchesLost: standingB.matchesLost + (winnerEntryId !== entryBId ? 1 : 0),
      setsWon: standingB.setsWon + entryBSetsWon,
      setsLost: standingB.setsLost + entryASetsWon,
      setsDiff: standingB.setsWon + entryBSetsWon - (standingB.setsLost + entryASetsWon),
    });
  }

  /**
   * Cập nhật knockoutBracket
   */
  private async updateKnockoutBracket(
    matchId: number,
    winnerEntryId: number
  ): Promise<void> {
    const bracket = await KnockoutBracket.findOne({
      where: { matchId },
    });

    if (bracket) {
      await bracket.update({
        winnerEntryId,
        status: "completed",
      });
    }
  }

  /**
   * Kiểm tra và tạo match cho vòng sau (knockout)
   */
  private async checkAndCreateNextMatch(
    matchId: number,
    winnerEntryId: number
  ): Promise<void> {
    // Tìm bracket hiện tại
    const currentBracket = await KnockoutBracket.findOne({
      where: { matchId },
    });

    if (!currentBracket || !currentBracket.nextBracketId) {
      return; // Không có vòng tiếp theo (Final)
    }

    // Tìm bracket tiếp theo
    const nextBracket = await KnockoutBracket.findByPk(currentBracket.nextBracketId);

    if (!nextBracket) {
      return;
    }

    // Cập nhật winner vào bracket tiếp theo
    if (nextBracket.previousBracketAId === currentBracket.id) {
      await nextBracket.update({ entryAId: winnerEntryId });
    } else if (nextBracket.previousBracketBId === currentBracket.id) {
      await nextBracket.update({ entryBId: winnerEntryId });
    }

    // Kiểm tra đã đủ 2 entry chưa
    await nextBracket.reload();
    
    if (nextBracket.entryAId && nextBracket.entryBId && !nextBracket.matchId) {
      // Đủ entry, tạo match mới
      if (nextBracket.scheduleId) {
        const newMatch = await Match.create({
          scheduleId: nextBracket.scheduleId,
          entryAId: nextBracket.entryAId,
          entryBId: nextBracket.entryBId,
          status: "scheduled",
        } as any);

        await nextBracket.update({
          matchId: newMatch.id,
          status: "ready",
        });
      }
    }
  }
}

export default new MatchService();
