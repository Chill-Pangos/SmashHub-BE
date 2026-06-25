// controllers/userRole.controller.ts

import { Request, Response, NextFunction } from "express";
import userRoleService from "../services/userRole.service";
import { CreateUserRoleDto } from "../dto/userRole.dto";
import { parsePagination } from "../../../utils/request.helper";

export class UserRoleController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await userRoleService.create(req.body as CreateUserRoleDto);
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
      const data = await userRoleService.findByUserId(Number(req.params.userId), offset, limit);
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  }

  async findByRoleId(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { offset, limit } = parsePagination(req.query);
      const data = await userRoleService.findByRoleId(Number(req.params.roleId), offset, limit);
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  }

  async hasRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const hasRole = await userRoleService.hasRole(Number(req.query.userId), Number(req.query.roleId));
      res.status(200).json({ hasRole });
    } catch (error) {
      next(error);
    }
  }

  async deleteByUserIdAndRoleId(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await userRoleService.deleteByUserIdAndRoleId(Number(req.params.userId), Number(req.params.roleId));
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

export default new UserRoleController();
