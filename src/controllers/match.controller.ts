import { Request, Response, NextFunction } from "express";
import matchService from "../services/match.service";
import {
  ApprovePendingMatchResultDto,
} from "../dto/pendingMatchResult.dto";
import { BadRequestError, NotFoundError } from "../utils/errors.helper";
import { AuthRequest } from "../middlewares/auth.middleware";
import { MatchStatus } from "../models/match.model";
import { parseEnumQuery, parsePagination, parsePositiveInt } from "../utils/request.helper";

const MATCH_FILTER_STATUSES: readonly MatchStatus[] = ["scheduled", "in_progress", "completed", "cancelled"];
const MATCH_RESULT_STATUSES = ["pending", "approved"] as const;

export class MatchController {
  async findById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parsePositiveInt(req.params.id, "match ID");

      const match = await matchService.findById(id);
      if (!match) throw new NotFoundError("Match not found");

      res.status(200).json(match);
    } catch (error) {
      next(error);
    }
  }

  async findByEntryNames(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const entryAName = typeof req.query.entryAName === "string" ? req.query.entryAName.trim() : "";
      const entryBName = typeof req.query.entryBName === "string" ? req.query.entryBName.trim() : "";

      if (!entryAName || !entryBName) {
        throw new BadRequestError("entryAName and entryBName are required");
      }

      const { offset, limit } = parsePagination(req.query);
      const tournamentId =
        req.query.tournamentId !== undefined
          ? parsePositiveInt(req.query.tournamentId, "tournament ID")
          : undefined;
      const categoryId =
        req.query.categoryId !== undefined
          ? parsePositiveInt(req.query.categoryId, "category ID")
          : undefined;

      const filters: { tournamentId?: number; categoryId?: number } = {};
      if (tournamentId !== undefined) filters.tournamentId = tournamentId;
      if (categoryId !== undefined) filters.categoryId = categoryId;

      const result = await matchService.findByEntryNames(
        entryAName,
        entryBName,
        filters,
        offset,
        limit,
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async startMatch(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parsePositiveInt(req.params.id, "match ID");
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
      const id = parsePositiveInt(req.params.id, "match ID");
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
      const matchId = parsePositiveInt(req.params.id, "match ID");
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
      const matchId = parsePositiveInt(req.params.id, "match ID");
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

  async findPendingMatches(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const chiefRefereeId = (req as AuthRequest).userId;
      if (!chiefRefereeId) {
        throw new BadRequestError("User not authenticated");
      }
      const tournamentId = parsePositiveInt(req.query.tournamentId, "tournament ID");
      const { offset, limit } = parsePagination(req.query);
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

      const categoryId = parsePositiveInt(req.params.categoryId, "category ID");

      const { offset, limit } = parsePagination(req.query);
      const stage = parseEnumQuery(req.query.stage, "stage", ["group", "knockout"]);
      const status = parseEnumQuery(req.query.status, "status", MATCH_FILTER_STATUSES);
      const resultStatus = parseEnumQuery(req.query.resultStatus, "resultStatus", MATCH_RESULT_STATUSES);
      const filters: {
        stage?: "group" | "knockout";
        status?: MatchStatus;
        resultStatus?: (typeof MATCH_RESULT_STATUSES)[number];
        offset: number;
        limit: number;
      } = { offset, limit };
      if (stage) filters.stage = stage;
      if (status) filters.status = status;
      if (resultStatus) filters.resultStatus = resultStatus;

      const result = await matchService.findCategorySchedulesAndMatchesForChiefReferee(
        chiefRefereeId,
        categoryId,
        filters,
      );

      res.status(200).json({
        matches: result.matches,
        pagination: result.pagination,
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

      const { offset, limit } = parsePagination(req.query);
      if (!req.query.categoryId) {
        throw new BadRequestError("categoryId is required");
      }
      const categoryId = parsePositiveInt(req.query.categoryId, "category ID");

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
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  async getUpcomingMatchesByAthlete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = parsePositiveInt(req.params.userId, "user ID");

      const { offset, limit } = parsePagination(req.query);

      const result = await matchService.findUpcomingMatchesByAthlete(
        userId,
        offset,
        limit
      );

      res.status(200).json({
        matches: result.matches,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  async getMatchHistoryByAthlete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = parsePositiveInt(req.params.userId, "user ID");

      const { offset, limit } = parsePagination(req.query);

      const result = await matchService.findMatchHistoryByAthlete(
        userId,
        offset,
        limit
      );

      res.status(200).json({
        matches: result.matches,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new MatchController();
