// controllers/permission.controller.ts

import { Request, Response, NextFunction } from "express";
import permissionService from "../services/permission.service";
import { CreatePermissionDto, UpdatePermissionDto } from "../dto/permission.dto";

export class PermissionController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await permissionService.create(req.body as CreatePermissionDto);
      res.status(201).json(data);
    } catch (error) {
      next(error);
    }
  }

  async findAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await permissionService.findAll(Number(req.query.page) || 1, Number(req.query.limit) || 10);
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  }

  async findById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await permissionService.findById(Number(req.params.id));
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  }

  async findByName(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await permissionService.findByName(req.params.name as string);
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await permissionService.update(Number(req.params.id), req.body as UpdatePermissionDto);
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await permissionService.delete(Number(req.params.id));
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

export default new PermissionController();