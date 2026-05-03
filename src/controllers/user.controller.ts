import { Request, Response, NextFunction } from "express";
import userService from "../services/user.service";
import { NotFoundError } from "../utils/errors";

export class UserController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await userService.create(req.body);
      res.status(201).json(user);
    } catch (error) {
      next(error);
    }
  }

  async findAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const skip = Number(req.query.skip) || 0;
      const limit = Number(req.query.limit) || 10;
      const result = await userService.findAll(skip, limit);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async findById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await userService.findById(Number(req.params.id));
      if (!user) {
        throw new NotFoundError("User not found");
      }
      res.status(200).json(user);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await userService.update(Number(req.params.id), req.body);
      if (!user) {
        throw new NotFoundError("User not found");
      }
      res.status(200).json(user);
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await userService.updateProfile(
        Number(req.params.id),
        req.body
      );
      if (!user) {
        throw new NotFoundError("User not found");
      }
      res.status(200).json(user);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const deleted = await userService.delete(Number(req.params.id));
      if (!deleted) {
        throw new NotFoundError("User not found");
      }
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  async getAvailableChiefReferees(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const skip = Number(req.query.skip) || 0;
      const limit = Number(req.query.limit) || 10;
      const result = await userService.findAvailableChiefReferees(skip, limit);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}

export default new UserController();
