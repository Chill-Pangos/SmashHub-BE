// controllers/userRole.controller.ts

import { Request, Response, NextFunction } from "express";
import userRoleService from "../services/userRole.service";
import { CreateUserRoleDto } from "../dto/userRole.dto";
import { parsePagination, parsePositiveInt } from "../utils/request.helper";

export class UserRoleController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await userRoleService.create({
        userId: parsePositiveInt((req.body as CreateUserRoleDto).userId, "userId"),
        roleId: parsePositiveInt((req.body as CreateUserRoleDto).roleId, "roleId"),
      });
      res.status(201).json(data);
    } catch (error) {
      next(error);
    }
  }

  async findAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { offset, limit } = parsePagination(req.query);
      const data = await userRoleService.findAll(offset, limit);
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  }

  async findByUserId(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { offset, limit } = parsePagination(req.query);
      const data = await userRoleService.findByUserId(parsePositiveInt(req.params.userId, "userId"), offset, limit);
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  }

  async findByRoleId(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { offset, limit } = parsePagination(req.query);
      const data = await userRoleService.findByRoleId(parsePositiveInt(req.params.roleId, "roleId"), offset, limit);
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  }

  async hasRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const hasRole = await userRoleService.hasRole(
        parsePositiveInt(req.query.userId, "userId"),
        parsePositiveInt(req.query.roleId, "roleId"),
      );
      res.status(200).json({ hasRole });
    } catch (error) {
      next(error);
    }
  }

  async deleteByUserIdAndRoleId(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await userRoleService.deleteByUserIdAndRoleId(
        parsePositiveInt(req.params.userId, "userId"),
        parsePositiveInt(req.params.roleId, "roleId"),
      );
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

export default new UserRoleController();
