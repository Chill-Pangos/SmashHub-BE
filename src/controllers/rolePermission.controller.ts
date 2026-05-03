// controllers/rolePermission.controller.ts

import { Request, Response, NextFunction } from "express";
import rolePermissionService from "../services/rolePermission.service";
import { CreateRolePermissionDto } from "../dto/rolePermission.dto";

export class RolePermissionController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await rolePermissionService.create(req.body as CreateRolePermissionDto);
      res.status(201).json(data);
    } catch (error) {
      next(error);
    }
  }

  async findAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await rolePermissionService.findAll(Number(req.query.page) || 1, Number(req.query.limit) || 10);
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  }

  async findByRoleId(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await rolePermissionService.findByRoleId(Number(req.params.roleId), Number(req.query.page) || 1, Number(req.query.limit) || 10);
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  }

  async findByPermissionId(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await rolePermissionService.findByPermissionId(Number(req.params.permissionId), Number(req.query.page) || 1, Number(req.query.limit) || 10);
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  }

  async hasPermission(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const hasPermission = await rolePermissionService.hasPermission(Number(req.query.roleId), Number(req.query.permissionId));
      res.status(200).json({ hasPermission });
    } catch (error) {
      next(error);
    }
  }

  async deleteByRoleIdAndPermissionId(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await rolePermissionService.deleteByRoleIdAndPermissionId(Number(req.params.roleId), Number(req.params.permissionId));
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

export default new RolePermissionController();