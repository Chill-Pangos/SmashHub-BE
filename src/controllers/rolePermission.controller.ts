// controllers/rolePermission.controller.ts

import { Request, Response, NextFunction } from "express";
import rolePermissionService from "../services/rolePermission.service";
import { CreateRolePermissionDto } from "../dto/rolePermission.dto";
import { parsePagination, parsePositiveInt } from "../utils/request.helper";

export class RolePermissionController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await rolePermissionService.create({
        roleId: parsePositiveInt((req.body as CreateRolePermissionDto).roleId, "roleId"),
        permissionId: parsePositiveInt((req.body as CreateRolePermissionDto).permissionId, "permissionId"),
      });
      res.status(201).json(data);
    } catch (error) {
      next(error);
    }
  }

  async findAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { offset, limit } = parsePagination(req.query);
      const data = await rolePermissionService.findAll(offset, limit);
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  }

  async findByRoleId(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { offset, limit } = parsePagination(req.query);
      const data = await rolePermissionService.findByRoleId(parsePositiveInt(req.params.roleId, "roleId"), offset, limit);
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  }

  async findByPermissionId(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { offset, limit } = parsePagination(req.query);
      const data = await rolePermissionService.findByPermissionId(parsePositiveInt(req.params.permissionId, "permissionId"), offset, limit);
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  }

  async hasPermission(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const hasPermission = await rolePermissionService.hasPermission(
        parsePositiveInt(req.query.roleId, "roleId"),
        parsePositiveInt(req.query.permissionId, "permissionId"),
      );
      res.status(200).json({ hasPermission });
    } catch (error) {
      next(error);
    }
  }

  async deleteByRoleIdAndPermissionId(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await rolePermissionService.deleteByRoleIdAndPermissionId(
        parsePositiveInt(req.params.roleId, "roleId"),
        parsePositiveInt(req.params.permissionId, "permissionId"),
      );
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

export default new RolePermissionController();
