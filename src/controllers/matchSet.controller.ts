import { Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import matchSetService from "../services/matchSet.service";

export class MatchSetController {
  /**
   * Tạo set với điểm số
   * POST /match-sets
   */
  async createSet(req: AuthRequest, res: Response): Promise<void> {
    try {
      const refereeId = req.userId!;
      const { subMatchId, entryAScore, entryBScore } = req.body;

      if (!subMatchId || entryAScore === undefined || entryBScore === undefined) {
        res.status(400).json({ 
          message: "subMatchId, entryAScore, and entryBScore are required" 
        });
        return;
      }

      const matchSet = await matchSetService.createSet(refereeId, {
        subMatchId,
        entryAScore,
        entryBScore,
      });
      res.status(201).json(matchSet);
    } catch (error: any) {
      res.status(400).json({ 
        message: error.message || "Error creating match set", 
        error 
      });
    }
  }

  /**
   * Cập nhật điểm set
   * PUT /match-sets/:id
   */
  async updateSetScore(req: AuthRequest, res: Response): Promise<void> {
    try {
      const refereeId = req.userId!;
      const setId = Number(req.params.id);
      const { entryAScore, entryBScore } = req.body;

      if (entryAScore === undefined || entryBScore === undefined) {
        res.status(400).json({ 
          message: "entryAScore and entryBScore are required" 
        });
        return;
      }

      const matchSet = await matchSetService.updateSetScore(
        refereeId,
        setId,
        entryAScore,
        entryBScore
      );
      res.status(200).json(matchSet);
    } catch (error: any) {
      res.status(400).json({ 
        message: error.message || "Error updating match set", 
        error 
      });
    }
  }

  /**
   * Lấy danh sách sets theo subMatchId
   * GET /match-sets/sub-match/:subMatchId
   */
  async getBySubMatchId(req: AuthRequest, res: Response): Promise<void> {
    try {
      const subMatchId = Number(req.params.subMatchId);
      const matchSets = await matchSetService.getSetsBySubMatch(subMatchId);
      res.status(200).json(matchSets);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching match sets", error });
    }
  }

  /**
   * Lấy chi tiết set theo ID
   * GET /match-sets/:id
   */
  async getById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const setId = Number(req.params.id);
      const matchSet = await matchSetService.getSetById(setId);
      res.status(200).json(matchSet);
    } catch (error: any) {
      res.status(404).json({ 
        message: error.message || "Match set not found", 
        error 
      });
    }
  }

  /**
   * Xóa set
   * DELETE /match-sets/:id
   */
  async deleteSet(req: AuthRequest, res: Response): Promise<void> {
    try {
      const refereeId = req.userId!;
      const setId = Number(req.params.id);

      await matchSetService.deleteSet(refereeId, setId);
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ 
        message: error.message || "Error deleting match set", 
        error 
      });
    }
  }
}

export default new MatchSetController();
