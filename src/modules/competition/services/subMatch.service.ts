// subMatch.service.ts
import { sequelize } from "../../../config/database";
import SubMatch, { SubMatchStatus, Team } from "../models/subMatch.model";
import SubMatchPlayer from "../models/subMatchPlayer.model";
import MatchSet from "../models/matchSet.model";
import Match from "../models/match.model";
import MatchReferee from "../models/matchReferee.model";
import Schedule from "../models/schedule.model";
import { notificationWriteService } from "../../notification/public.write";
import {
  tournamentReadService,
  type CompetitionCategoryContext,
} from "../../tournament/public.read";
import competitionViewService from "./competitionView.service";

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function assertMatchReferee(
  userId: number,
  matchId: number
): Promise<void> {
  const ref = await MatchReferee.findOne({ where: { matchId, refereeId: userId } });
  if (!ref) throw new Error("Only an assigned referee can perform this action");
}

async function getSubMatchWithMatch(subMatchId: number): Promise<SubMatch> {
  const subMatch = await SubMatch.findByPk(subMatchId, {
    include: [{ model: Match, as: "match" }],
  });
  if (!subMatch) throw new Error("SubMatch not found");
  return subMatch;
}

async function getSubMatchWithCategory(subMatchId: number): Promise<{
  subMatch: SubMatch;
  match: Match;
  category: CompetitionCategoryContext;
}> {
  const subMatch = await SubMatch.findByPk(subMatchId, {
    include: [
      {
        model: Match,
        as: "match",
        include: [{ model: Schedule, as: "schedule" }],
      },
    ],
  });
  if (!subMatch) throw new Error("SubMatch not found");
  if (!subMatch.match) throw new Error("Match not found");

  const categoryId = subMatch.match.schedule?.categoryId;
  if (!categoryId) throw new Error("Match category not found");
  const category = await tournamentReadService.getCategoryCompetitionContext(categoryId);
  if (!category) throw new Error("Match category not found");

  subMatch.match.schedule?.setDataValue("tournamentCategory", category);
  return { subMatch, match: subMatch.match, category };
}

async function assertSubMatchHasBothLineups(subMatchId: number): Promise<void> {
  const players = await SubMatchPlayer.findAll({
    where: { subMatchId },
    attributes: ["team"],
  });

  const hasTeamA = players.some((player) => player.team === "A");
  const hasTeamB = players.some((player) => player.team === "B");

  if (!hasTeamA || !hasTeamB) {
    throw new Error("Both teams must have approved lineup before sub-match starts");
  }
}

function assertAssignedUmpire(subMatch: SubMatch, userId: number): void {
  if (subMatch.umpireId !== userId && subMatch.assistantUmpireId !== userId) {
    throw new Error("Only assigned umpire can perform this action");
  }
}

function toSubMatchRealtimePayload(subMatch: SubMatch): Record<string, unknown> {
  return {
    id: subMatch.id,
    matchId: subMatch.matchId,
    subMatchNumber: subMatch.subMatchNumber,
    status: subMatch.status,
    winnerTeam: subMatch.winnerTeam,
    umpireId: subMatch.umpireId,
    assistantUmpireId: subMatch.assistantUmpireId,
  };
}

function toSubMatchPlayerRealtimePayload(player: SubMatchPlayer): Record<string, unknown> {
  return {
    id: player.id,
    subMatchId: player.subMatchId,
    entryMemberId: player.entryMemberId,
    team: player.team,
  };
}

function getWinningTeamFromSets(
  sets: MatchSet[],
  category: CompetitionCategoryContext,
): Team | null {
  const setsToWin = Math.floor(category.maxSets / 2) + 1;
  let teamASets = 0;
  let teamBSets = 0;

  for (const set of sets) {
    if (set.entryAScore > set.entryBScore) teamASets++;
    else if (set.entryBScore > set.entryAScore) teamBSets++;
  }

  if (teamASets >= setsToWin) return "A";
  if (teamBSets >= setsToWin) return "B";
  return null;
}

async function isMatchReadyToFinalize(matchId: number): Promise<boolean> {
  const subMatches = await SubMatch.findAll({
    where: { matchId },
    order: [["subMatchNumber", "ASC"]],
  });

  const winsToWinMatch = Math.floor(subMatches.length / 2) + 1;
  const entryAWins = subMatches.filter((item) => item.winnerTeam === "A").length;
  const entryBWins = subMatches.filter((item) => item.winnerTeam === "B").length;
  return entryAWins >= winsToWinMatch || entryBWins >= winsToWinMatch;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export class SubMatchService {
  // ── 1. Tạo sub-match (team format) ───────────────────────────────────────

  /**
   * Tạo các sub-match từ teamFormat của category.
   * VD: "S-D-S" → 3 sub-matches
   */
  async createSubMatchesFromFormat(
    refereeId: number,
    matchId: number,
    teamFormat: string
  ): Promise<SubMatch[]> {
    const match = await Match.findByPk(matchId);
    if (!match) throw new Error("Match not found");
    await assertMatchReferee(refereeId, matchId);

    if (match.status !== "in_progress") {
      throw new Error("Match must be in_progress to create sub-matches");
    }

    const existing = await SubMatch.findAll({ where: { matchId } });
    if (existing.length > 0) {
      throw new Error("Sub-matches already created for this match");
    }

    const formats = teamFormat.split("-");

    return await sequelize.transaction(async (t) => {
      const subMatches: SubMatch[] = [];
      for (let i = 0; i < formats.length; i++) {
        const subMatch = await SubMatch.create(
          {
            matchId,
            subMatchNumber: i + 1,
            status: "scheduled" satisfies SubMatchStatus,
          },
          { transaction: t }
        );
        subMatches.push(subMatch);
      }
      return subMatches;
    });
  }

  // ── 2. Bắt đầu sub-match + assign umpire ─────────────────────────────────

  async startSubMatch(
    refereeId: number,
    subMatchId: number
  ): Promise<{
    message: string;
    subMatch: SubMatch;
    lineupReady: boolean;
  }> {
    const subMatch = await getSubMatchWithMatch(subMatchId);
    await assertMatchReferee(refereeId, subMatch.matchId);
    assertAssignedUmpire(subMatch, refereeId);

    if (subMatch.match?.status !== "in_progress") {
      throw new Error("Match must be in_progress before sub-match starts");
    }

    if (subMatch.status !== "scheduled") {
      throw new Error(
        `Cannot start sub-match. Status is "${subMatch.status}", must be "scheduled"`
      );
    }

    if (!subMatch.umpireId) {
      throw new Error("Umpire must be assigned before sub-match starts");
    }

    await assertSubMatchHasBothLineups(subMatchId);

    await subMatch.update({
      status: "in_progress" satisfies SubMatchStatus,
    });

    const updatedSubMatch = await this.getSubMatchById(subMatchId);

    notificationWriteService.publishMatchRealtime(subMatch.matchId, "sub_match_started", {
      subMatch: toSubMatchRealtimePayload(updatedSubMatch),
    });

    return {
      message: "Sub-match started successfully",
      subMatch: updatedSubMatch,
      lineupReady: true,
    };
  }

  // ── 3. Kết thúc sub-match ─────────────────────────────────────────────────

  async finalizeSubMatch(
    refereeId: number,
    subMatchId: number
  ): Promise<{
    message: string;
    subMatch: SubMatch;
    matchReadyToFinalize: boolean;
  }> {
    const { subMatch, match, category } = await getSubMatchWithCategory(subMatchId);
    await assertMatchReferee(refereeId, subMatch.matchId);
    assertAssignedUmpire(subMatch, refereeId);

    if (subMatch.status !== "in_progress") {
      throw new Error(
        `Cannot finalize sub-match. Status is "${subMatch.status}", must be "in_progress"`
      );
    }

    const sets = await MatchSet.findAll({ where: { subMatchId } });
    if (sets.length === 0) throw new Error("No sets found for this sub-match");

    const winnerTeam = getWinningTeamFromSets(sets, category);
    if (!winnerTeam) throw new Error("Sub-match is not ready to finalize");

    const updatedSubMatch = await subMatch.update({
      status: "completed" satisfies SubMatchStatus,
      winnerTeam,
    });
    const matchReadyToFinalize = await isMatchReadyToFinalize(match.id);

    notificationWriteService.publishMatchRealtime(match.id, "sub_match_finalized", {
      subMatch: toSubMatchRealtimePayload(updatedSubMatch),
      matchReadyToFinalize,
    });

    return {
      message: matchReadyToFinalize
        ? "Sub-match finalized. Match is ready to finalize."
        : "Sub-match finalized. Move to next sub-match.",
      subMatch: updatedSubMatch,
      matchReadyToFinalize,
    };
  }

  // ── 4. Assign players vào sub-match ──────────────────────────────────────

  async assignPlayers(
    refereeId: number,
    subMatchId: number,
    players: { entryMemberId: number; team: Team }[]
  ): Promise<SubMatchPlayer[]> {
    const subMatch = await getSubMatchWithMatch(subMatchId);
    await assertMatchReferee(refereeId, subMatch.matchId);

    if (subMatch.status !== "scheduled") {
      throw new Error("Can only assign players before sub-match starts");
    }

    // Validate team A và B đều có player
    const teamA = players.filter((p) => p.team === "A");
    const teamB = players.filter((p) => p.team === "B");
    if (teamA.length === 0 || teamB.length === 0) {
      throw new Error("Both teams must have at least 1 player");
    }

    const assignedPlayers = await sequelize.transaction(async (t) => {
      // Xóa assignments cũ
      await SubMatchPlayer.destroy({ where: { subMatchId }, transaction: t });

      return await SubMatchPlayer.bulkCreate(
        players.map((p) => ({ subMatchId, ...p })),
        { transaction: t }
      );
    });

    notificationWriteService.publishMatchRealtime(subMatch.matchId, "sub_match_players_assigned", {
      subMatchId,
      players: assignedPlayers.map(toSubMatchPlayerRealtimePayload),
    });

    return assignedPlayers;
  }

  // ── 5. Queries ────────────────────────────────────────────────────────────

  async getSubMatchesByMatch(matchId: number): Promise<SubMatch[]> {
    const match = await Match.findByPk(matchId, { attributes: ["id"] });
    if (!match) throw new Error("Match not found");

    const subMatches = await SubMatch.findAll({
      where: { matchId },
      include: [
        { model: MatchSet, as: "matchSets" },
        {
          model: SubMatchPlayer,
          as: "subMatchPlayers",
        },
      ],
      order: [
        ["subMatchNumber", "ASC"],
        [{ model: MatchSet, as: "matchSets" }, "setNumber", "ASC"],
        [{ model: SubMatchPlayer, as: "subMatchPlayers" }, "team", "ASC"],
      ],
    });
    await competitionViewService.attachSubMatchOfficials(subMatches);
    await competitionViewService.attachEntryMembersToSubMatchPlayers(
      subMatches.flatMap((subMatch) => (subMatch.subMatchPlayers ?? []) as SubMatchPlayer[]),
    );

    return subMatches;
  }

  async getSubMatchById(subMatchId: number): Promise<SubMatch> {
    const subMatch = await SubMatch.findByPk(subMatchId, {
      include: [
        { model: MatchSet, as: "matchSets" },
        {
          model: SubMatchPlayer,
          as: "subMatchPlayers",
        },
      ],
    });
    if (!subMatch) throw new Error("SubMatch not found");
    await competitionViewService.attachSubMatchOfficials([subMatch]);
    await competitionViewService.attachEntryMembersToSubMatchPlayers(
      (subMatch.subMatchPlayers ?? []) as SubMatchPlayer[],
    );
    return subMatch;
  }
}

export default new SubMatchService();
