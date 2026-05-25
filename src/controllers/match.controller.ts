import { Request, Response, NextFunction } from "express";
import matchService from "../services/match.service";
import eloCalculationService from "../services/eloCalculation.service";
import {
  ApprovePendingMatchResultDto,
  RejectPendingMatchResultDto,
} from "../dto/pendingMatchResult.dto";
import { BadRequestError, NotFoundError } from "../utils/errors.helper";
import { AuthRequest } from "../middlewares/auth.middleware";

export class MatchController {
  async startMatch(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        throw new BadRequestError("Invalid match ID");
      }
      if (!req.userId) {
        throw new BadRequestError("User not authenticated");
      }
      const match = await matchService.startMatch(id, req.userId);
      res.status(200).json(match);
    } catch (error) {
      next(error);
    }
  }

  async finalizeMatch(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        throw new BadRequestError("Invalid match ID");
      }
      if (!req.userId) {
        throw new BadRequestError("User not authenticated");
      }
      const match = await matchService.finalizeMatch(id, req.userId);
      res.status(200).json({
        message: "Match result submitted successfully. Waiting for chief referee approval.",
        match,
      });
    } catch (error) {
      next(error);
    }
  }

  async approveMatchResult(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const matchId = Number(req.params.id);
      if (isNaN(matchId)) {
        throw new BadRequestError("Invalid match ID");
      }
      if (!req.userId) {
        throw new BadRequestError("User not authenticated");
      }
      const { reviewNotes } = req.body as ApprovePendingMatchResultDto;

      const match = await matchService.approveMatchResult(matchId, req.userId, reviewNotes);
      res.status(200).json({
        message: "Match result approved successfully. Standings and Elo scores updated.",
        match,
      });
    } catch (error) {
      next(error);
    }
  }

  async rejectMatchResult(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const matchId = Number(req.params.id);
      if (isNaN(matchId)) {
        throw new BadRequestError("Invalid match ID");
      }
      if (!req.userId) {
        throw new BadRequestError("User not authenticated");
      }
      const { reviewNotes } = req.body as RejectPendingMatchResultDto;

      if (!reviewNotes) {
        throw new BadRequestError("Review notes are required when rejecting");
      }

      const match = await matchService.rejectMatchResult(matchId, req.userId, reviewNotes);
      res.status(200).json({
        message: "Match result rejected. Referee needs to resubmit the result.",
        match,
      });
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
      const preview = await eloCalculationService.previewMatchEloChanges(id);
      res.status(200).json(preview);
    } catch (error) {
      next(error);
    }
  }

  async findPendingMatches(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;
      const offset = Math.max(page - 1, 0) * limit;
      const result = await matchService.findPendingMatches(offset, limit);
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

      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;
      const offset = Math.max(page - 1, 0) * limit;

      const result = await matchService.findUpcomingMatchesByAthlete(
        userId,
        offset,
        limit
      );

      res.status(200).json({
        matches: result.matches,
        count: result.count,
        offset,
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

      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;
      const offset = Math.max(page - 1, 0) * limit;

      const result = await matchService.findMatchHistoryByAthlete(
        userId,
        offset,
        limit
      );

      res.status(200).json({
        matches: result.matches,
        count: result.count,
        offset,
        limit,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new MatchController();
