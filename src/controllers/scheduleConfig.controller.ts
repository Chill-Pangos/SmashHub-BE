// schedule-config.controller.ts
import { Request, Response, NextFunction } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import ScheduleConfigService from "../services/scheduleConfig.service";
import {
  CreateScheduleConfigDto,
  UpdateScheduleConfigDto,
  ValidateScheduleConfigDto,
} from "../dto/scheduleConfig.dto";
import { BadRequestError, NotFoundError } from "../utils/errors";

export class ScheduleConfigController {
  /**
   * Create a new schedule config
   * POST /schedule-configs
   */
  async create(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tournamentId, ...configData }: CreateScheduleConfigDto =
        req.body;

      if (!tournamentId || isNaN(tournamentId) || tournamentId <= 0) {
        throw new BadRequestError("Invalid tournament ID");
      }

      const config = await ScheduleConfigService.createConfig(
        tournamentId,
        configData
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

      if (isNaN(tournamentId) || tournamentId <= 0) {
        throw new BadRequestError("Invalid tournament ID");
      }

      const updateData: UpdateScheduleConfigDto = req.body;

      const config = await ScheduleConfigService.updateConfig(
        tournamentId,
        updateData
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
   * Validate schedule config against tournament and total matches
   * POST /tournaments/:tournamentId/schedule-config/validate
   */
  async validate(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tournamentId = Number(req.params.tournamentId);

      if (isNaN(tournamentId) || tournamentId <= 0) {
        throw new BadRequestError("Invalid tournament ID");
      }

      const { totalMatches }: ValidateScheduleConfigDto = req.body;

      if (!Number.isInteger(totalMatches) || totalMatches <= 0) {
        throw new BadRequestError(
          "totalMatches must be a positive integer"
        );
      }

      const result = await ScheduleConfigService.validateScheduleConfig(
        tournamentId,
        totalMatches
      );

      res.status(200).json(result);
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

      if (isNaN(tournamentId) || tournamentId <= 0) {
        throw new BadRequestError("Invalid tournament ID");
      }

      const deleted = await ScheduleConfigService.deleteConfig(tournamentId);

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
