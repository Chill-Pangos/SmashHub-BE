// controllers/role.controller.ts

import { Request, Response, NextFunction } from "express";
import roleService from "../services/role.service";
import { CreateRoleDto, UpdateRoleDto } from "../dto/role.dto";
import { parsePagination, parsePositiveInt } from "../../../utils/request.helper";

export class RoleController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await roleService.create(req.body as CreateRoleDto);
      res.status(201).json(data);
    } catch (error) {
      next(error);
    }
  }

  async findAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { offset, limit } = parsePagination(req.query);
      const data = await roleService.findAll(offset, limit);
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  }

  async findById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await roleService.findById(parsePositiveInt(req.params.id, "id"));
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  }

  async findByName(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await roleService.findByName(req.params.name as string);
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await roleService.update(
        parsePositiveInt(req.params.id, "id"),
        req.body as UpdateRoleDto,
      );
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await roleService.delete(parsePositiveInt(req.params.id, "id"));
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

export default new RoleController();
