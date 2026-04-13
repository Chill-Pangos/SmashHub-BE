import { Request, Response, NextFunction } from "express";
import permissionService from "../services/permission.service";
import { NotFoundError } from "../utils/errors";

export class PermissionController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const permission = await permissionService.create(req.body);
      res.status(201).json(permission);
    } catch (error) {
      next(error);
    }
  }

  async findAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const skip = Number(req.query.skip) || 0;
      const limit = Number(req.query.limit) || 10;
      const permissions = await permissionService.findAll(skip, limit);
      res.status(200).json(permissions);
    } catch (error) {
      next(error);
    }
  }

  async findById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const permission = await permissionService.findById(
        Number(req.params.id)
      );
      if (!permission) {
        throw new NotFoundError("Permission not found");
      }
      res.status(200).json(permission);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const permission = await permissionService.update(
        Number(req.params.id),
        req.body
      );
      if (!permission) {
        throw new NotFoundError("Permission not found");
      }
      res.status(200).json(permission);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const deleted = await permissionService.delete(Number(req.params.id));
      if (!deleted) {
        throw new NotFoundError("Permission not found");
      }
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

export default new PermissionController();
