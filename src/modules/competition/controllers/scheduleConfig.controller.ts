// schedule-config.controller.ts
import { Request, Response, NextFunction } from "express";
import { AuthRequest } from "../../../middlewares/auth.middleware";
import ScheduleConfigService from "../services/scheduleConfig.service";
import {
  CreateScheduleConfigDto,
  UpdateScheduleConfigDto,
  ValidateScheduleConfigDto,
} from "../dto/scheduleConfig.dto";
import { BadRequestError, NotFoundError, UnauthorizedError } from "../../../utils/errors.helper";

export class ScheduleConfigController {
  private getAuthenticatedUserId(req: AuthRequest): number {
    if (req.userId == null) {
      throw new UnauthorizedError("Unauthorized");
    }
    return req.userId;
  }

  /**
   * Create a new schedule config
   * POST /schedule-configs
   */
  async create(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tournamentId, ...configData }: CreateScheduleConfigDto =
        req.body;
      const organizerId = this.getAuthenticatedUserId(req);

      if (!tournamentId || isNaN(tournamentId) || tournamentId <= 0) {
        throw new BadRequestError("Invalid tournament ID");
      }

      const config = await ScheduleConfigService.createConfig(
        tournamentId,
        configData,
        organizerId
      );

      res.status(201).json(config);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get schedule config for a tournament
   * GET /tournaments/:tournamentId/schedule-config
   */
  async getByTournament(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const tournamentId = Number(req.params.tournamentId);

      if (isNaN(tournamentId) || tournamentId <= 0) {
        throw new BadRequestError("Invalid tournament ID");
      }

      const config = await ScheduleConfigService.getConfig(tournamentId);

      if (!config) {
        throw new NotFoundError("Schedule config not found");
      }

      res.status(200).json(config);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update schedule config
   * PATCH /tournaments/:tournamentId/schedule-config
   */
  async update(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tournamentId = Number(req.params.tournamentId);
      const organizerId = this.getAuthenticatedUserId(req);

      if (isNaN(tournamentId) || tournamentId <= 0) {
        throw new BadRequestError("Invalid tournament ID");
      }

      const updateData: UpdateScheduleConfigDto = req.body;

      const config = await ScheduleConfigService.updateConfig(
        tournamentId,
        updateData,
        organizerId
      );

      if (!config) {
        throw new NotFoundError("Schedule config not found");
      }

      res.status(200).json(config);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Validate unsaved schedule config against category input
   * POST /schedule-configs/validate
   */
  async validate(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      this.getAuthenticatedUserId(req);

      const { category, scheduleConfig }: ValidateScheduleConfigDto = req.body;

      if (!category || typeof category !== "object") {
        throw new BadRequestError("category is required");
      }
      if (!scheduleConfig || typeof scheduleConfig !== "object") {
        throw new BadRequestError("scheduleConfig is required");
      }

      const result = await ScheduleConfigService.validateScheduleConfigInput(
        category,
        scheduleConfig
      );

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Preview new schedule config (without saving)
   * POST /tournaments/:tournamentId/schedule-config/preview-create
   */
  async previewCreate(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tournamentId = Number(req.params.tournamentId);
      const organizerId = this.getAuthenticatedUserId(req);

      if (isNaN(tournamentId) || tournamentId <= 0) {
        throw new BadRequestError("Invalid tournament ID");
      }

      const { totalMatches, ...configData }: any = req.body;

      if (!Number.isInteger(totalMatches) || totalMatches <= 0) {
        throw new BadRequestError(
          "totalMatches must be a positive integer"
        );
      }

      const preview = await ScheduleConfigService.previewCreate(
        tournamentId,
        configData,
        totalMatches,
        organizerId
      );

      res.status(200).json(preview);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Preview updating schedule config (without saving)
   * POST /tournaments/:tournamentId/schedule-config/preview-update
   */
  async previewUpdate(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tournamentId = Number(req.params.tournamentId);
      const organizerId = this.getAuthenticatedUserId(req);

      if (isNaN(tournamentId) || tournamentId <= 0) {
        throw new BadRequestError("Invalid tournament ID");
      }

      const { totalMatches, ...configData }: any = req.body;

      if (
        totalMatches !== undefined &&
        (!Number.isInteger(totalMatches) || totalMatches <= 0)
      ) {
        throw new BadRequestError(
          "totalMatches must be a positive integer"
        );
      }

      const preview = await ScheduleConfigService.previewUpdate(
        tournamentId,
        configData,
        totalMatches,
        organizerId
      );

      res.status(200).json(preview);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get default schedule config
   * GET /schedule-configs/defaults
   */
  async getDefaults(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const defaults = await ScheduleConfigService.getDefaultConfig();
      res.status(200).json(defaults);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete schedule config
   * DELETE /tournaments/:tournamentId/schedule-config
   */
  async delete(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tournamentId = Number(req.params.tournamentId);
      const organizerId = this.getAuthenticatedUserId(req);

      if (isNaN(tournamentId) || tournamentId <= 0) {
        throw new BadRequestError("Invalid tournament ID");
      }

      const deleted = await ScheduleConfigService.deleteConfig(tournamentId, organizerId);

      if (!deleted) {
        throw new NotFoundError("Schedule config not found");
      }

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

export default new ScheduleConfigController();
