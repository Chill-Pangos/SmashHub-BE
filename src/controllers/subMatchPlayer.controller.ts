import { Response, NextFunction } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import subMatchPlayerService from "../services/subMatchPlayer.service";
import { BadRequestError } from "../utils/errors.helper";

export class SubMatchPlayerController {
  /**
   * Lấy danh sách players của một sub-match
   * GET /sub-match-players/sub-match/:subMatchId
   */
  async getBySubMatchId(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const subMatchId = Number(req.params.subMatchId);
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;
      const offset = Math.max(page - 1, 0) * limit;
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
      const subMatchId = Number(req.params.subMatchId);
      const team = req.params.team as "A" | "B";
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;
      const offset = Math.max(page - 1, 0) * limit;

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
      const entryMemberId = Number(req.params.entryMemberId);
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;
      const offset = Math.max(page - 1, 0) * limit;

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
