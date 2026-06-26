import { Response, NextFunction } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import subMatchPlayerService from "../services/subMatchPlayer.service";
import { BadRequestError } from "../utils/errors.helper";
import { parsePagination, parsePositiveInt } from "../utils/request.helper";

export class SubMatchPlayerController {
  async submitTeamLineup(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.userId) throw new BadRequestError("User not authenticated");

      const matchId = parsePositiveInt(req.params.matchId, "match ID");
      const { lineups } = req.body as {
        lineups?: { subMatchId: number; entryMemberIds: number[] }[];
      };

      if (!Array.isArray(lineups)) {
        throw new BadRequestError("lineups array is required");
      }

      const result = await subMatchPlayerService.submitTeamLineups(
        req.userId,
        matchId,
        lineups.map((lineup) => ({
          subMatchId: parsePositiveInt(lineup.subMatchId, "subMatchId"),
          entryMemberIds: Array.isArray(lineup.entryMemberIds)
            ? lineup.entryMemberIds.map((id) => parsePositiveInt(id, "entryMemberId"))
            : [],
        })),
      );
      res.status(202).json({
        message: "Lineups submitted. Waiting for umpire approval.",
        lineups: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getPendingLineupsForUmpire(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.userId) throw new BadRequestError("User not authenticated");

      const lineups = await subMatchPlayerService.getPendingLineupsForUmpire(
        req.userId,
      );
      res.status(200).json({ lineups });
    } catch (error) {
      next(error);
    }
  }

  async approveTeamLineup(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.userId) throw new BadRequestError("User not authenticated");

      const matchId = parsePositiveInt(req.params.matchId, "match ID");

      const players = await subMatchPlayerService.approvePendingLineupsByMatch(
        req.userId,
        matchId,
      );
      res.status(200).json({
        message: "Lineup approved and saved.",
        players,
      });
    } catch (error) {
      next(error);
    }
  }

  async rejectTeamLineup(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.userId) throw new BadRequestError("User not authenticated");

      const matchId = parsePositiveInt(req.params.matchId, "match ID");
      const { reviewNotes } = req.body as { reviewNotes?: string };

      const rejected = await subMatchPlayerService.rejectPendingLineupsByMatch(
        req.userId,
        matchId,
        reviewNotes,
      );
      res.status(200).json({
        message: "Lineup rejected. Captain must submit updated lineup.",
        rejected,
      });
    } catch (error) {
      next(error);
    }
  }

  async getRejectedLineupsForCaptain(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.userId) throw new BadRequestError("User not authenticated");

      const rejected = await subMatchPlayerService.getRejectedLineupsForCaptain(
        req.userId,
      );
      res.status(200).json({ rejected });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Lấy danh sách players của một sub-match
   * GET /sub-match-players/sub-match/:subMatchId
   */
  async getBySubMatchId(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const subMatchId = parsePositiveInt(req.params.subMatchId, "subMatchId");
      const { offset, limit } = parsePagination(req.query);
      const result = await subMatchPlayerService.getPlayersBySubMatch(subMatchId, { offset, limit });
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Lấy danh sách players của một team trong sub-match
   * GET /sub-match-players/sub-match/:subMatchId/team/:team
   */
  async getByTeam(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const subMatchId = parsePositiveInt(req.params.subMatchId, "subMatchId");
      const team = req.params.team as "A" | "B";
      const { offset, limit } = parsePagination(req.query);

      if (team !== "A" && team !== "B") {
        throw new BadRequestError("Team must be 'A' or 'B'");
      }

      const result = await subMatchPlayerService.getPlayersByTeam(subMatchId, team, { offset, limit });
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Lấy lịch sử sub-matches của một entry member
   * GET /sub-match-players/entry-member/:entryMemberId
   */
  async getByEntryMemberId(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const entryMemberId = parsePositiveInt(req.params.entryMemberId, "entryMemberId");
      const { offset, limit } = parsePagination(req.query);

      const matches = await subMatchPlayerService.getMatchesByEntryMember(
        entryMemberId,
        offset,
        limit
      );
      res.status(200).json(matches);
    } catch (error) {
      next(error);
    }
  }
}

export default new SubMatchPlayerController();
