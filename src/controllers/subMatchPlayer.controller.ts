import { Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import subMatchPlayerService from "../services/subMatchPlayer.service";

export class SubMatchPlayerController {
  /**
   * Lấy danh sách players của một sub-match
   * GET /sub-match-players/sub-match/:subMatchId
   */
  async getBySubMatchId(req: AuthRequest, res: Response): Promise<void> {
    try {
      const subMatchId = Number(req.params.subMatchId);
      const players = await subMatchPlayerService.getPlayersBySubMatch(subMatchId);
      res.status(200).json(players);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching players", error });
    }
  }

  /**
   * Lấy danh sách players của một team trong sub-match
   * GET /sub-match-players/sub-match/:subMatchId/team/:team
   */
  async getByTeam(req: AuthRequest, res: Response): Promise<void> {
    try {
      const subMatchId = Number(req.params.subMatchId);
      const team = req.params.team as "A" | "B";

      if (team !== "A" && team !== "B") {
        res.status(400).json({ message: "Team must be 'A' or 'B'" });
        return;
      }

      const players = await subMatchPlayerService.getPlayersByTeam(subMatchId, team);
      res.status(200).json(players);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching players", error });
    }
  }

  /**
   * Lấy lịch sử sub-matches của một entry member
   * GET /sub-match-players/entry-member/:entryMemberId
   */
  async getByEntryMemberId(req: AuthRequest, res: Response): Promise<void> {
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
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching matches", error });
    }
  }
}

export default new SubMatchPlayerController();
