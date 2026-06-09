import { Request, Response, NextFunction } from "express";
import matchService from "../services/match.service";
import {
  ApprovePendingMatchResultDto,
  RejectPendingMatchResultDto,
} from "../dto/pendingMatchResult.dto";
import { BadRequestError, NotFoundError } from "../utils/errors.helper";
import { AuthRequest } from "../middlewares/auth.middleware";
import { MatchStatus } from "../models/match.model";

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

  async bulkStartMatches(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.userId) {
        throw new BadRequestError("User not authenticated");
      }

      const { matchIds } = req.body as { matchIds?: unknown };
      if (!Array.isArray(matchIds) || matchIds.length === 0) {
        throw new BadRequestError("matchIds must be a non-empty array");
      }

      const parsedMatchIds = matchIds.map(Number);
      if (parsedMatchIds.some((matchId) => !Number.isInteger(matchId) || matchId <= 0)) {
        throw new BadRequestError("matchIds must contain positive integers only");
      }

      const uniqueMatchIds = [...new Set(parsedMatchIds)];
      const result = await matchService.bulkStartMatches(req.userId, uniqueMatchIds);

      res.status(200).json({
        message: "Bulk start matches completed",
        totalRequested: uniqueMatchIds.length,
        totalSucceeded: result.succeeded.length,
        totalFailed: result.failed.length,
        ...result,
      });
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

  async getFinalizeSummary(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const matchId = Number(req.params.id);
      if (isNaN(matchId)) {
        throw new BadRequestError("Invalid match ID");
      }
      if (!req.userId) {
        throw new BadRequestError("User not authenticated");
      }

      const summary = await matchService.getFinalizeSummary(matchId, req.userId);
      res.status(200).json(summary);
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

  async findPendingMatches(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const chiefRefereeId = (req as AuthRequest).userId;
      if (!chiefRefereeId) {
        throw new BadRequestError("User not authenticated");
      }
      const tournamentId = Number(req.query.tournamentId);
      if (isNaN(tournamentId)) {
        throw new BadRequestError("Invalid tournament ID");
      }
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;
      const offset = Math.max(page - 1, 0) * limit;
      const result = await matchService.findPendingMatches(chiefRefereeId, tournamentId, offset, limit);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async findCategorySchedulesAndMatchesForChiefReferee(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const chiefRefereeId = (req as AuthRequest).userId;
      if (!chiefRefereeId) {
        throw new BadRequestError("User not authenticated");
      }

      const categoryId = Number(req.params.categoryId);
      if (isNaN(categoryId)) {
        throw new BadRequestError("Invalid category ID");
      }

      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;
      const offset = Math.max(page - 1, 0) * limit;

      const result = await matchService.findCategorySchedulesAndMatchesForChiefReferee(
        chiefRefereeId,
        categoryId,
        {
          stage: req.query.stage as any,
          status: req.query.status as any,
          resultStatus: req.query.resultStatus as any,
          offset,
          limit,
        },
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

  async findAssignedMatchesForReferee(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const refereeId = (req as AuthRequest).userId;
      if (!refereeId) {
        throw new BadRequestError("User not authenticated");
      }

      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;
      const offset = Math.max(page - 1, 0) * limit;
      if (!req.query.categoryId) {
        throw new BadRequestError("categoryId is required");
      }
      const categoryId = Number(req.query.categoryId);
      if (!Number.isInteger(categoryId) || categoryId <= 0) {
        throw new BadRequestError("Invalid category ID");
      }

      const rawStatus = req.query.status;
      const statuses = Array.isArray(rawStatus)
        ? rawStatus.flatMap((status) => String(status).split(","))
        : rawStatus
          ? String(rawStatus).split(",")
          : undefined;
      const parsedStatuses = statuses
        ?.map((status) => status.trim())
        .filter(Boolean) as MatchStatus[] | undefined;
      const statusFilters = parsedStatuses?.length ? parsedStatuses : undefined;

      const result = await matchService.findAssignedMatchesForReferee(refereeId, {
        categoryId,
        ...(statusFilters && { statuses: statusFilters }),
        offset,
        limit,
      });

      res.status(200).json({
        message: "Assigned matches retrieved successfully",
        categoryId,
        statuses: statusFilters ?? null,
        matches: result.matches,
        count: result.count,
        offset,
        limit,
      });
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
