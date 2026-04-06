import { Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import subMatchService from "../services/subMatch.service";

export class SubMatchController {
  /**
   * Tạo các sub-matches từ teamFormat
   * POST /sub-matches/create-from-format
   */
  async createFromFormat(req: AuthRequest, res: Response): Promise<void> {
    try {
      const refereeId = req.userId!;
      const { matchId, teamFormat } = req.body;

      if (!matchId || !teamFormat) {
        res.status(400).json({ message: "matchId and teamFormat are required" });
        return;
      }

      const subMatches = await subMatchService.createSubMatchesFromFormat(
        refereeId,
        matchId,
        teamFormat
      );
      res.status(201).json(subMatches);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Error creating sub-matches", error });
    }
  }

  /**
   * Bắt đầu sub-match
   * POST /sub-matches/:id/start
   */
  async start(req: AuthRequest, res: Response): Promise<void> {
    try {
      const refereeId = req.userId!;
      const subMatchId = Number(req.params.id);

      const subMatch = await subMatchService.startSubMatch(refereeId, subMatchId);
      res.status(200).json(subMatch);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Error starting sub-match", error });
    }
  }

  /**
   * Kết thúc sub-match
   * POST /sub-matches/:id/finalize
   */
  async finalize(req: AuthRequest, res: Response): Promise<void> {
    try {
      const refereeId = req.userId!;
      const subMatchId = Number(req.params.id);

      const subMatch = await subMatchService.finalizeSubMatch(refereeId, subMatchId);
      res.status(200).json(subMatch);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Error finalizing sub-match", error });
    }
  }

  /**
   * Assign players vào sub-match
   * POST /sub-matches/:id/assign-players
   */
  async assignPlayers(req: AuthRequest, res: Response): Promise<void> {
    try {
      const refereeId = req.userId!;
      const subMatchId = Number(req.params.id);
      const { players } = req.body;

      if (!players || !Array.isArray(players)) {
        res.status(400).json({ message: "players array is required" });
        return;
      }

      const result = await subMatchService.assignPlayers(refereeId, subMatchId, players);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Error assigning players", error });
    }
  }

  /**
   * Lấy danh sách sub-matches theo matchId
   * GET /sub-matches/match/:matchId
   */
  async getByMatchId(req: AuthRequest, res: Response): Promise<void> {
    try {
      const matchId = Number(req.params.matchId);
      const subMatches = await subMatchService.getSubMatchesByMatch(matchId);
      res.status(200).json(subMatches);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching sub-matches", error });
    }
  }

  /**
   * Lấy chi tiết sub-match theo ID
   * GET /sub-matches/:id
   */
  async getById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const subMatchId = Number(req.params.id);
      const subMatch = await subMatchService.getSubMatchById(subMatchId);
      res.status(200).json(subMatch);
    } catch (error: any) {
      res.status(404).json({ message: error.message || "Sub-match not found", error });
    }
  }
}

export default new SubMatchController();
