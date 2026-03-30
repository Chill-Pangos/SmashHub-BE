// groupStanding.service.ts
import { Op, Transaction } from "sequelize";
import { sequelize } from "../config/database";
import GroupStanding from "../models/groupStanding.model";
import TournamentCategory from "../models/tournamentCategory.model";
import Tournament from "../models/tournament.model";
import TournamentReferee from "../models/tournamentReferee.model";
import Entry from "../models/entry.model";
import Match from "../models/match.model";
import MatchSet from "../models/matchSet.model";
import SubMatch from "../models/subMatch.model";
import Schedule from "../models/schedule.model";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GroupAssignment {
  groupName: string;
  entryIds: number[];
}

export interface GroupPreview {
  groupName: string;
  slots: number;
  entryIds: number[];
}

export interface GroupConfig {
  numGroups: number;
  teamsPerGroup: number[];
  totalSlots: number;
}

interface SetCount {
  entryASets: number;
  entryBSets: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const GROUP_LABELS = "ABCDEFGHIJKLMNOP".split("");
const MIN_ENTRIES_FOR_GROUPS = 12;
const MIN_TEAMS_PER_GROUP = 3;
const MAX_TEAMS_PER_GROUP = 5;
const POSSIBLE_GROUP_COUNTS = [4, 8, 16, 32, 64];
const DEFAULT_QUALIFIERS_PER_GROUP = 2;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildGroupName(index: number): string {
  return `Group ${GROUP_LABELS[index] ?? index + 1}`;
}

function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j]!, result[i]!];
  }
  return result;
}

function countSetsFromMatch(match: Match): SetCount {
  let entryASets = 0;
  let entryBSets = 0;

  for (const subMatch of match.subMatches ?? []) {
    for (const set of subMatch.matchSets ?? []) {
      if (set.entryAScore > set.entryBScore) entryASets++;
      else if (set.entryBScore > set.entryAScore) entryBSets++;
    }
  }

  return { entryASets, entryBSets };
}

async function getCategoryWithTournament(
  categoryId: number
): Promise<TournamentCategory> {
  const category = await TournamentCategory.findByPk(categoryId, {
    include: [{ model: Tournament }],
  });
  if (!category) throw new Error("Category not found");
  return category;
}

async function assertChiefReferee(
  userId: number,
  tournamentId: number
): Promise<void> {
  const ref = await TournamentReferee.findOne({
    where: { refereeId: userId, tournamentId, role: "chief" },
  });
  if (!ref) {
    throw new Error("Only the chief referee can perform this action");
  }
}

async function assertRegistrationClosed(tournament: Tournament): Promise<void> {
  if (new Date() <= tournament.registrationEndDate) {
    throw new Error("Registration must be closed before managing groups");
  }
}

async function getGroupScheduleIds(
  categoryId: number,
  groupName: string
): Promise<number[]> {
  const schedules = await Schedule.findAll({
    where: { categoryId, groupName, stage: "group" },
    attributes: ["id"],
  });
  return schedules.map((s) => s.id);
}

// ─── Service ──────────────────────────────────────────────────────────────────

export class GroupStandingService {
  // ── 1. Tính toán & preview ────────────────────────────────────────────────

  /**
   * Tính toán số bảng và số đội/bảng tối ưu.
   * Số bảng là lũy thừa của 2, tối thiểu 4. Mỗi bảng có 3–5 đội.
   */
  calculateOptimalGroups(totalEntries: number): GroupConfig {
    if (totalEntries < MIN_ENTRIES_FOR_GROUPS) {
      throw new Error(
        `At least ${MIN_ENTRIES_FOR_GROUPS} entries are required to generate groups`
      );
    }

    let best: { numGroups: number; teamsPerGroup: number[]; variance: number } | null =
      null;

    for (const numGroups of POSSIBLE_GROUP_COUNTS) {
      const avg = totalEntries / numGroups;
      if (avg < MIN_TEAMS_PER_GROUP) break;
      if (avg > MAX_TEAMS_PER_GROUP) continue;

      const base = Math.floor(totalEntries / numGroups);
      const remainder = totalEntries % numGroups;
      const distribution = Array.from({ length: numGroups }, (_, i) =>
        i < remainder ? base + 1 : base
      );

      if (distribution.some((n) => n < MIN_TEAMS_PER_GROUP || n > MAX_TEAMS_PER_GROUP))
        continue;

      const variance = Math.max(...distribution) - Math.min(...distribution);
      if (!best || variance < best.variance) {
        best = { numGroups, teamsPerGroup: distribution, variance };
      }
      if (variance === 0) break;
    }

    if (!best) {
      throw new Error(
        `Cannot generate valid groups for ${totalEntries} entries. Supported range: ${MIN_ENTRIES_FOR_GROUPS}–320.`
      );
    }

    return {
      numGroups: best.numGroups,
      teamsPerGroup: best.teamsPerGroup,
      totalSlots: best.teamsPerGroup.reduce((a, b) => a + b, 0),
    };
  }

  /**
   * Generate bảng ngẫu nhiên và trả về preview (chưa lưu DB).
   * Tổng trọng tài xem, chỉnh sửa hoặc yêu cầu generate lại.
   */
  async generateGroupPreview(
    chiefRefereeId: number,
    categoryId: number
  ): Promise<GroupPreview[]> {
    const category = await getCategoryWithTournament(categoryId);
    await assertChiefReferee(chiefRefereeId, category.tournamentId);
    await assertRegistrationClosed(category.tournament!);

    const entries = await this.getEligibleEntries(category);

    if (entries.length < MIN_ENTRIES_FOR_GROUPS) {
      throw new Error(
        `Not enough eligible entries (${entries.length}). Minimum required: ${MIN_ENTRIES_FOR_GROUPS}.`
      );
    }

    const config = this.calculateOptimalGroups(entries.length);
    const shuffledIds = shuffleArray(entries.map((e) => e.id));

    const preview: GroupPreview[] = [];
    let cursor = 0;

    for (let i = 0; i < config.numGroups; i++) {
      const slots = config.teamsPerGroup[i]!;
      preview.push({
        groupName: buildGroupName(i),
        slots,
        entryIds: shuffledIds.slice(cursor, cursor + slots),
      });
      cursor += slots;
    }

    return preview;
  }

  // ── 2. Lưu bảng đấu ──────────────────────────────────────────────────────

  /**
   * Lưu phân bảng đã được tổng trọng tài chấp nhận vào DB.
   * Xóa bảng cũ (nếu có) trước khi lưu mới.
   */
  async saveGroupAssignments(
    chiefRefereeId: number,
    categoryId: number,
    assignments: GroupAssignment[]
  ): Promise<GroupStanding[]> {
    const category = await getCategoryWithTournament(categoryId);
    await assertChiefReferee(chiefRefereeId, category.tournamentId);
    await assertRegistrationClosed(category.tournament!);
    await this.validateAssignments(categoryId, assignments);

    return await sequelize.transaction(async (t: Transaction) => {
      await GroupStanding.destroy({ where: { categoryId }, transaction: t });

      const rows = assignments.flatMap((group) =>
        group.entryIds.map((entryId) => ({
          categoryId,
          entryId,
          groupName: group.groupName,
          matchesPlayed: 0,
          matchesWon: 0,
          matchesLost: 0,
          setsWon: 0,
          setsLost: 0,
          setsDiff: 0,
        }))
      );

      return await GroupStanding.bulkCreate(rows, { transaction: t });
    });
  }

  // ── 3. Cập nhật kết quả sau mỗi trận ─────────────────────────────────────

  /**
   * Cập nhật thống kê và thứ hạng sau khi 1 trận group stage hoàn thành.
   * Có thể gọi từ API hoặc từ match.service.
   */
  async updateStandingsAfterMatch(
  chiefRefereeId: number,
  matchId: number
): Promise<void> {
  await this.assertChiefRefereeByMatch(chiefRefereeId, matchId);

  const match = await Match.findByPk(matchId, {
    include: [
      {
        model: Schedule,
        as: "schedule",
        where: { stage: "group" },
        required: true,
      },
      {
        model: SubMatch,
        as: "subMatches",
        include: [{ model: MatchSet, as: "matchSets" }],
      },
    ],
  });

  if (!match) throw new Error("Match not found or not a group stage match");
  if (match.status !== "completed") throw new Error("Match is not completed yet");
  if (!match.winnerEntryId) throw new Error("Match has no winner");

  const schedule = match.schedule;
  if (!schedule) throw new Error("Match has no schedule");

  const categoryId = schedule.categoryId;
  const groupName = schedule.groupName;
  if (!groupName) throw new Error("Match schedule has no group name");

  const { entryAId, entryBId, winnerEntryId } = match;
  const loserEntryId = winnerEntryId === entryAId ? entryBId : entryAId;
  const { entryASets, entryBSets } = countSetsFromMatch(match);

  const winnerSets = winnerEntryId === entryAId ? entryASets : entryBSets;
  const loserSets = winnerEntryId === entryAId ? entryBSets : entryASets;

  await sequelize.transaction(async (t: Transaction) => {
    await this.incrementStanding(
      categoryId, groupName, winnerEntryId,
      { won: true, setsWon: winnerSets, setsLost: loserSets },
      t
    );
    await this.incrementStanding(
      categoryId, groupName, loserEntryId,
      { won: false, setsWon: loserSets, setsLost: winnerSets },
      t
    );
  });

  await this.recalculatePositions(categoryId, groupName);
}

  // ── 4. Lấy danh sách đội vào vòng sau ────────────────────────────────────

  /**
   * Trả về danh sách đội vào vòng sau cho từng bảng.
   * @param qualifiersPerGroup - Số đội/bảng vào vòng sau (default = 2)
   */
  async getQualifiers(
    categoryId: number,
    qualifiersPerGroup = DEFAULT_QUALIFIERS_PER_GROUP
  ): Promise<{ groupName: string; qualifiers: GroupStanding[] }[]> {
    if (qualifiersPerGroup < 1) {
      throw new Error("qualifiersPerGroup must be at least 1");
    }

    const standings = await GroupStanding.findAll({
      where: { categoryId },
      order: [
        ["groupName", "ASC"],
        ["position", "ASC"],
      ],
    });

    if (standings.length === 0) throw new Error("No standings found for this category");

    if (standings.some((s) => s.position == null)) {
      throw new Error("Some standings have not been ranked yet");
    }

    // Group by groupName
    const groupMap = new Map<string, GroupStanding[]>();
    for (const standing of standings) {
      const group = groupMap.get(standing.groupName) ?? [];
      group.push(standing);
      groupMap.set(standing.groupName, group);
    }

    return Array.from(groupMap.entries()).map(([groupName, groupStandings]) => {
      const qualifiers = groupStandings.filter(
        (s) => s.position != null && s.position <= qualifiersPerGroup
      );

      if (qualifiers.length < qualifiersPerGroup) {
        throw new Error(
          `Group ${groupName} does not have enough ranked entries for ${qualifiersPerGroup} qualifiers`
        );
      }

      return { groupName, qualifiers };
    });
  }

  // ── Helpers nội bộ ────────────────────────────────────────────────────────

  private async getEligibleEntries(category: TournamentCategory): Promise<Entry[]> {
    return await Entry.findAll({
      where: {
        categoryId: category.id,
        ...(category.type !== "single"
          ? { currentMemberCount: { [Op.gte]: sequelize.col("requiredMemberCount") } }
          : {}),
      },
      attributes: ["id"],
    });
  }

  private async validateAssignments(
    categoryId: number,
    assignments: GroupAssignment[]
  ): Promise<void> {
    const allEntryIds = assignments.flatMap((g) => g.entryIds);

    // Không có entry nào
    if (allEntryIds.length === 0) {
      throw new Error("Assignments must contain at least one entry");
    }

    // Trùng lặp entry giữa các bảng
    if (new Set(allEntryIds).size !== allEntryIds.length) {
      throw new Error("Duplicate entries found across groups");
    }

    // Entry không thuộc category này
    const validCount = await Entry.count({
      where: { categoryId, id: { [Op.in]: allEntryIds } },
    });
    if (validCount !== allEntryIds.length) {
      throw new Error("Some entries do not belong to this category");
    }
  }

  private async incrementStanding(
    categoryId: number,
    groupName: string,
    entryId: number,
    stats: { won: boolean; setsWon: number; setsLost: number },
    t: Transaction
  ): Promise<void> {
    const standing = await GroupStanding.findOne({
      where: { categoryId, groupName, entryId },
      transaction: t,
      lock: t.LOCK.UPDATE, // tránh race condition nếu 2 match cùng group finish đồng thời
    });
    if (!standing) return;

    const newSetsWon = standing.setsWon + stats.setsWon;
    const newSetsLost = standing.setsLost + stats.setsLost;

    await standing.update(
      {
        matchesPlayed: standing.matchesPlayed + 1,
        matchesWon: standing.matchesWon + (stats.won ? 1 : 0),
        matchesLost: standing.matchesLost + (stats.won ? 0 : 1),
        setsWon: newSetsWon,
        setsLost: newSetsLost,
        setsDiff: newSetsWon - newSetsLost,
      },
      { transaction: t }
    );
  }

  /**
   * Tính lại thứ hạng cho 1 bảng.
   * Resolve toàn bộ head-to-head trước, sau đó native sort 1 lần.
   */
  async recalculatePositions(categoryId: number, groupName: string): Promise<void> {
    const standings = await GroupStanding.findAll({
      where: { categoryId, groupName },
    });

    // Pre-fetch toàn bộ head-to-head results 1 lần để tránh N² queries trong sort
    const h2hMap = await this.buildH2HMap(categoryId, groupName, standings);

    const sorted = standings.slice().sort((a, b) => {
      // 1. Số trận thắng
      if (a.matchesWon !== b.matchesWon) return b.matchesWon - a.matchesWon;

      // 2. SetDiff
      if (a.setsDiff !== b.setsDiff) return b.setsDiff - a.setsDiff;

      // 3. Head-to-head (từ pre-fetched map, không cần async)
      const h2hWinner = h2hMap.get(`${a.entryId}-${b.entryId}`) ?? null;
      if (h2hWinner !== null) return h2hWinner === a.entryId ? -1 : 1;

      return 0;
    });

    await sequelize.transaction(async (t: Transaction) => {
      await Promise.all(
        sorted.map((s, i) => s.update({ position: i + 1 }, { transaction: t }))
      );
    });
  }

  /**
   * Pre-fetch toàn bộ kết quả head-to-head trong 1 query duy nhất.
   * Key: "entryAId-entryBId" và "entryBId-entryAId" đều trỏ đến winnerEntryId.
   */
  private async buildH2HMap(
    categoryId: number,
    groupName: string,
    standings: GroupStanding[]
  ): Promise<Map<string, number>> {
    const scheduleIds = await getGroupScheduleIds(categoryId, groupName);
    if (scheduleIds.length === 0) return new Map();

    const entryIds = standings.map((s) => s.entryId);

    const matches = await Match.findAll({
      where: {
        scheduleId: { [Op.in]: scheduleIds },
        status: "completed",
        entryAId: { [Op.in]: entryIds },
        entryBId: { [Op.in]: entryIds },
      },
      attributes: ["entryAId", "entryBId", "winnerEntryId"],
    });

    const map = new Map<string, number>();
    for (const m of matches) {
      if (!m.winnerEntryId) continue;
      // Lưu cả 2 chiều để lookup O(1)
      map.set(`${m.entryAId}-${m.entryBId}`, m.winnerEntryId);
      map.set(`${m.entryBId}-${m.entryAId}`, m.winnerEntryId);
    }

    return map;
  }

  private async assertChiefRefereeByMatch(
    chiefRefereeId: number,
    matchId: number
  ): Promise<void> {
    const match = await Match.findByPk(matchId, {
      include: [{ model: Schedule, as: "schedule", attributes: ["categoryId"] }],
    });
    if (!match) throw new Error("Match not found");

    const category = await getCategoryWithTournament(match.schedule!.categoryId);
    await assertChiefReferee(chiefRefereeId, category.tournamentId);
  }
}

export default new GroupStandingService();