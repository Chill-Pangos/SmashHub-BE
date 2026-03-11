import { Request, Response } from "express";
import matchService from "../services/match.service";
import eloCalculationService from "../services/eloCalculation.service";

export class MatchController {
  async create(req: Request, res: Response): Promise<void> {
    try {
      const match = await matchService.create(req.body);
      res.status(201).json(match);
    } catch (error) {
      res.status(400).json({ message: "Error creating match", error });
    }
  }

  async findAll(req: Request, res: Response): Promise<void> {
    try {
      const skip = Number(req.query.skip) || 0;
      const limit = Number(req.query.limit) || 10;
      const matches = await matchService.findAll(skip, limit);
      res.status(200).json(matches);
    } catch (error) {
      res.status(500).json({ message: "Error fetching matches", error });
    }
  }

  async findById(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ message: "Invalid match ID" });
        return;
      }
      const match = await matchService.findById(id);
      if (!match) {
        res.status(404).json({ message: "Match not found" });
        return;
      }
      res.status(200).json(match);
    } catch (error) {
      res.status(500).json({ message: "Error fetching match", error });
    }
  }

  async findByScheduleId(req: Request, res: Response): Promise<void> {
    try {
      const skip = Number(req.query.skip) || 0;
      const limit = Number(req.query.limit) || 10;
      const matches = await matchService.findByScheduleId(
        Number(req.params.scheduleId),
        skip,
        limit
      );
      res.status(200).json(matches);
    } catch (error) {
      res.status(500).json({ message: "Error fetching matches", error });
    }
  }

  async findByStatus(req: Request, res: Response): Promise<void> {
    try {
      const status = req.params.status;
      if (!status || typeof status !== 'string') {
        res.status(400).json({ message: "Status is required" });
        return;
      }
      
      // Validate status value
      const validStatuses = ['scheduled', 'in_progress', 'completed', 'cancelled'];
      if (!validStatuses.includes(status)) {
        res.status(400).json({ 
          message: "Invalid status. Must be one of: scheduled, in_progress, completed, cancelled" 
        });
        return;
      }
      
      const skip = Number(req.query.skip) || 0;
      const limit = Number(req.query.limit) || 10;
      const matches = await matchService.findByStatus(status, skip, limit);
      res.status(200).json(matches);
    } catch (error) {
      res.status(500).json({ message: "Error fetching matches", error });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ message: "Invalid match ID" });
        return;
      }
      const match = await matchService.update(id, req.body);
      if (!match) {
        res.status(404).json({ message: "Match not found" });
        return;
      }
      res.status(200).json(match);
    } catch (error) {
      res.status(400).json({ message: "Error updating match", error });
    }
  }

  async startMatch(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ message: "Invalid match ID" });
        return;
      }
      const match = await matchService.startMatch(id);
      res.status(200).json(match);
    } catch (error: any) {
      if (error.message === "Match not found") {
        res.status(404).json({ message: error.message });
        return;
      }
      res.status(400).json({ message: error.message || "Error starting match", error });
    }
  }

  async finalizeMatch(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ message: "Invalid match ID" });
        return;
      }
      const match = await matchService.finalizeMatch(id);
      res.status(200).json({
        message: "Match result submitted successfully. Waiting for chief referee approval.",
        match,
      });
    } catch (error: any) {
      if (error.message === "Match not found") {
        res.status(404).json({ message: error.message });
        return;
      }
      res.status(400).json({ message: error.message || "Error finalizing match", error });
    }
  }

  async approveMatchResult(req: Request, res: Response): Promise<void> {
    try {
      const matchId = Number(req.params.id);
      if (isNaN(matchId)) {
        res.status(400).json({ message: "Invalid match ID" });
        return;
      }
      const { reviewNotes } = req.body;

      const match = await matchService.approveMatchResult(matchId, reviewNotes);
      res.status(200).json({
        message: "Match result approved successfully. Standings and Elo scores updated.",
        match,
      });
    } catch (error: any) {
      if (error.message === "Match not found") {
        res.status(404).json({ message: error.message });
        return;
      }
      res.status(400).json({ 
        message: error.message || "Error approving match result", 
        error 
      });
    }
  }

  async rejectMatchResult(req: Request, res: Response): Promise<void> {
    try {
      const matchId = Number(req.params.id);
      if (isNaN(matchId)) {
        res.status(400).json({ message: "Invalid match ID" });
        return;
      }
      const { reviewNotes } = req.body;

      if (!reviewNotes) {
        res.status(400).json({ message: "Review notes are required when rejecting" });
        return;
      }

      const match = await matchService.rejectMatchResult(matchId, reviewNotes);
      res.status(200).json({
        message: "Match result rejected. Referee needs to resubmit the result.",
        match,
      });
    } catch (error: any) {
      if (error.message === "Match not found") {
        res.status(404).json({ message: error.message });
        return;
      }
      res.status(400).json({ 
        message: error.message || "Error rejecting match result", 
        error 
      });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ message: "Invalid match ID" });
        return;
      }
      const deleted = await matchService.delete(id);
      if (!deleted) {
        res.status(404).json({ message: "Match not found" });
        return;
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error deleting match", error });
    }
  }

  async previewEloChanges(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ message: "Invalid match ID" });
        return;
      }
      const preview = await eloCalculationService.previewEloChanges(id);
      res.status(200).json(preview);
    } catch (error: any) {
      if (error.message === "Match not found") {
        res.status(404).json({ message: error.message });
        return;
      }
      res.status(400).json({ message: error.message || "Error previewing Elo changes", error });
    }
  }

  async findPendingMatches(req: Request, res: Response): Promise<void> {
    try {
      const skip = Number(req.query.skip) || 0;
      const limit = Number(req.query.limit) || 10;
      const result = await matchService.findPendingMatches(skip, limit);
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ message: "Error fetching pending matches", error });
    }
  }

  async getPendingMatchWithEloPreview(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ message: "Invalid match ID" });
        return;
      }
      const result = await matchService.getPendingMatchWithEloPreview(id);
      res.status(200).json(result);
    } catch (error: any) {
      if (error.message === "Match not found") {
        res.status(404).json({ message: error.message });
        return;
      }
      res.status(400).json({ 
        message: error.message || "Error fetching pending match", 
        error 
      });
    }
  }

  async getAvailableCoachesForEntry(req: Request, res: Response): Promise<void> {
    try {
      const entryId = Number(req.params.entryId);
      if (isNaN(entryId)) {
        res.status(400).json({ message: "Invalid entry ID" });
        return;
      }
      const coaches = await matchService.getAvailableCoachesForEntry(entryId);
      res.status(200).json(coaches);
    } catch (error: any) {
      if (error.message === "Entry not found") {
        res.status(404).json({ message: error.message });
        return;
      }
      res.status(500).json({ 
        message: error.message || "Error fetching available coaches", 
        error 
      });
    }
  }

  async getUpcomingMatchesByAthlete(req: Request, res: Response): Promise<void> {
    try {
      const userId = Number(req.params.userId);
      if (isNaN(userId)) {
        res.status(400).json({ message: "Invalid user ID" });
        return;
      }

      const skip = Number(req.query.skip) || 0;
      const limit = Number(req.query.limit) || 10;

      const result = await matchService.findUpcomingMatchesByAthlete(
        userId,
        skip,
        limit
      );

      res.status(200).json({
        matches: result.matches,
        count: result.count,
        skip,
        limit,
      });
    } catch (error: any) {
      res.status(500).json({
        message: error.message || "Error fetching upcoming matches",
        error,
      });
    }
  }

  async getMatchHistoryByAthlete(req: Request, res: Response): Promise<void> {
    try {
      const userId = Number(req.params.userId);
      if (isNaN(userId)) {
        res.status(400).json({ message: "Invalid user ID" });
        return;
      }

      const skip = Number(req.query.skip) || 0;
      const limit = Number(req.query.limit) || 10;

      const result = await matchService.findMatchHistoryByAthlete(
        userId,
        skip,
        limit
      );

      res.status(200).json({
        matches: result.matches,
        count: result.count,
        skip,
        limit,
      });
    } catch (error: any) {
      res.status(500).json({
        message: error.message || "Error fetching match history",
        error,
      });
    }
  }

  async getMatchesByTeam(req: Request, res: Response): Promise<void> {
    try {
      const userId = Number(req.params.userId);
      if (isNaN(userId)) {
        res.status(400).json({ message: "Invalid user ID" });
        return;
      }

      const skip = Number(req.query.skip) || 0;
      const limit = Number(req.query.limit) || 10;
      const status = req.query.status as string | undefined;

      // Validate status if provided
      if (status) {
        const validStatuses = ['scheduled', 'in_progress', 'completed', 'cancelled'];
        if (!validStatuses.includes(status)) {
          res.status(400).json({ 
            message: "Invalid status. Must be one of: scheduled, in_progress, completed, cancelled" 
          });
          return;
        }
      }

      const result = await matchService.findMatchesByTeam(
        userId,
        skip,
        limit,
        status
      );

      res.status(200).json({
        matches: result.matches,
        count: result.count,
        skip,
        limit,
      });
    } catch (error: any) {
      res.status(500).json({
        message: error.message || "Error fetching team matches",
        error,
      });
    }
  }
}

export default new MatchController();
