import { Response, NextFunction } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import subMatchPlayerService from "../services/subMatchPlayer.service";
import { BadRequestError } from "../utils/errors";

export class SubMatchPlayerController {
  /**
   * Lấy danh sách players của một sub-match
   * GET /sub-match-players/sub-match/:subMatchId
   */
  async getBySubMatchId(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const subMatchId = Number(req.params.subMatchId);
      const skip = Number(req.query.skip) || 0;
      const limit = Number(req.query.limit) || 10;
      const result = await subMatchPlayerService.getPlayersBySubMatch(subMatchId, { skip, limit });
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
      const subMatchId = Number(req.params.subMatchId);
      const team = req.params.team as "A" | "B";
      const skip = Number(req.query.skip) || 0;
      const limit = Number(req.query.limit) || 10;

      if (team !== "A" && team !== "B") {
        throw new BadRequestError("Team must be 'A' or 'B'");
      }

      const result = await subMatchPlayerService.getPlayersByTeam(subMatchId, team, { skip, limit });
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
      const entryMemberId = Number(req.params.entryMemberId);
      const skip = Number(req.query.skip) || 0;
      const limit = Number(req.query.limit) || 10;

      const matches = await subMatchPlayerService.getMatchesByEntryMember(
        entryMemberId,
        skip,
        limit
      );
      res.status(200).json(matches);
    } catch (error) {
      next(error);
    }
  }
}

export default new SubMatchPlayerController();
