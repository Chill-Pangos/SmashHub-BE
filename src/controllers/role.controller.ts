import { Request, Response, NextFunction } from "express";
import roleService from "../services/role.service";
import { BadRequestError, NotFoundError } from "../utils/errors";

export class RoleController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const role = await roleService.create(req.body);
      res.status(201).json(role);
    } catch (error) {
      next(error);
    }
  }

  async findAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const skip = Number(req.query.skip) || 0;
      const limit = Number(req.query.limit) || 10;
      const roles = await roleService.findAll(skip, limit);
      res.status(200).json(roles);
    } catch (error) {
      next(error);
    }
  }

  async findById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const role = await roleService.findById(Number(req.params.id));
      if (!role) {
        throw new NotFoundError("Role not found");
      }
      res.status(200).json(role);
    } catch (error) {
      next(error);
    }
  }

  async findByName(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const name = req.params.name;
      if (!name || typeof name !== 'string') {
        throw new BadRequestError("Role name is required");
      }
      const role = await roleService.findByName(name);
      if (!role) {
        throw new NotFoundError("Role not found");
      }
      res.status(200).json(role);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const role = await roleService.update(Number(req.params.id), req.body);
      if (!role) {
        throw new NotFoundError("Role not found");
      }
      res.status(200).json(role);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const deleted = await roleService.delete(Number(req.params.id));
      if (!deleted) {
        throw new NotFoundError("Role not found");
      }
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

export default new RoleController();
