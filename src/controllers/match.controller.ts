import { Request, Response, NextFunction } from "express";
import matchService from "../services/match.service";
import eloCalculationService from "../services/eloCalculation.service";
import {
  ApprovePendingMatchResultDto,
  RejectPendingMatchResultDto,
} from "../dto/pendingMatchResult.dto";
import { BadRequestError, NotFoundError } from "../utils/errors";

export class MatchController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const match = await matchService.create(req.body);
      res.status(201).json(match);
    } catch (error) {
      next(error);
    }
  }

  async findAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const skip = Number(req.query.skip) || 0;
      const limit = Number(req.query.limit) || 10;
      const matches = await matchService.findAll(skip, limit);
      res.status(200).json(matches);
    } catch (error) {
      next(error);
    }
  }

  async findById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        throw new BadRequestError("Invalid match ID");
      }
      const match = await matchService.findById(id);
      if (!match) {
        throw new NotFoundError("Match not found");
      }
      res.status(200).json(match);
    } catch (error) {
      next(error);
    }
  }

  async findByScheduleId(req: Request, res: Response, next: NextFunction): Promise<void> {
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
      next(error);
    }
  }

  async findByStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const status = req.params.status;
      if (!status || typeof status !== 'string') {
        throw new BadRequestError("Status is required");
      }

      // Validate status value
      const validStatuses = ['scheduled', 'in_progress', 'completed', 'cancelled'];
      if (!validStatuses.includes(status)) {
        throw new BadRequestError("Invalid status. Must be one of: scheduled, in_progress, completed, cancelled");
      }

      const skip = Number(req.query.skip) || 0;
      const limit = Number(req.query.limit) || 10;
      const matches = await matchService.findByStatus(status, skip, limit);
      res.status(200).json(matches);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        throw new BadRequestError("Invalid match ID");
      }
      const match = await matchService.update(id, req.body);
      if (!match) {
        throw new NotFoundError("Match not found");
      }
      res.status(200).json(match);
    } catch (error) {
      next(error);
    }
  }

  async startMatch(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        throw new BadRequestError("Invalid match ID");
      }
      const match = await matchService.startMatch(id);
      res.status(200).json(match);
    } catch (error) {
      next(error);
    }
  }

  async finalizeMatch(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        throw new BadRequestError("Invalid match ID");
      }
      const match = await matchService.finalizeMatch(id);
      res.status(200).json({
        message: "Match result submitted successfully. Waiting for chief referee approval.",
        match,
      });
    } catch (error) {
      next(error);
    }
  }

  async approveMatchResult(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const matchId = Number(req.params.id);
      if (isNaN(matchId)) {
        throw new BadRequestError("Invalid match ID");
      }
      const { reviewNotes } = req.body as ApprovePendingMatchResultDto;

      const match = await matchService.approveMatchResult(matchId, reviewNotes);
      res.status(200).json({
        message: "Match result approved successfully. Standings and Elo scores updated.",
        match,
      });
    } catch (error) {
      next(error);
    }
  }

  async rejectMatchResult(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const matchId = Number(req.params.id);
      if (isNaN(matchId)) {
        throw new BadRequestError("Invalid match ID");
      }
      const { reviewNotes } = req.body as RejectPendingMatchResultDto;

      if (!reviewNotes) {
        throw new BadRequestError("Review notes are required when rejecting");
      }

      const match = await matchService.rejectMatchResult(matchId, reviewNotes);
      res.status(200).json({
        message: "Match result rejected. Referee needs to resubmit the result.",
        match,
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        throw new BadRequestError("Invalid match ID");
      }
      const deleted = await matchService.delete(id);
      if (!deleted) {
        throw new NotFoundError("Match not found");
      }
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  async previewEloChanges(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        throw new BadRequestError("Invalid match ID");
      }
      const preview = await eloCalculationService.previewEloChanges(id);
      res.status(200).json(preview);
    } catch (error) {
      next(error);
    }
  }

  async findPendingMatches(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const skip = Number(req.query.skip) || 0;
      const limit = Number(req.query.limit) || 10;
      const result = await matchService.findPendingMatches(skip, limit);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getPendingMatchWithEloPreview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        throw new BadRequestError("Invalid match ID");
      }
      const result = await matchService.getPendingMatchWithEloPreview(id);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getUpcomingMatchesByAthlete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = Number(req.params.userId);
      if (isNaN(userId)) {
        throw new BadRequestError("Invalid user ID");
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
    } catch (error) {
      next(error);
    }
  }

  async getMatchHistoryByAthlete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = Number(req.params.userId);
      if (isNaN(userId)) {
        throw new BadRequestError("Invalid user ID");
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
    } catch (error) {
      next(error);
    }
  }
}

export default new MatchController();
