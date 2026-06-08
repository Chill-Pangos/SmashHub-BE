import { Request, Response, NextFunction } from "express";
import userService from "../services/user.service";
import { AuthRequest } from "../middlewares/auth.middleware";
import { NotFoundError } from "../utils/errors.helper";
import { avatarUpload } from "../config/multer";

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
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;
      const offset = Math.max(page - 1, 0) * limit;
      const result = await userService.findAll(offset, limit);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async me(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.userId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }
      const user = await userService.findMe(req.userId);
      if (!user) throw new NotFoundError("User not found");
      res.status(200).json(user);
    } catch (error) {
      next(error);
    }
  }

  async findById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await userService.findById(Number(req.params.id));
      if (!user) throw new NotFoundError("User not found");
      res.status(200).json(user);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await userService.update(Number(req.params.id), req.body);
      if (!user) throw new NotFoundError("User not found");
      res.status(200).json(user);
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await userService.updateProfile(Number(req.params.id), req.body);
      if (!user) throw new NotFoundError("User not found");
      res.status(200).json(user);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const deleted = await userService.delete(Number(req.params.id));
      if (!deleted) throw new NotFoundError("User not found");
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  async getAvailableChiefReferees(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;
      const offset = Math.max(page - 1, 0) * limit;
      const result = await userService.findAvailableChiefReferees(offset, limit);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  uploadAvatar = [
    avatarUpload.single("avatar"),
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      try {
        if (!req.file) {
          res.status(400).json({ message: "No file uploaded" });
          return;
        }
        if (!req.userId) {
          res.status(401).json({ message: "Unauthorized" });
          return;
        }
        const updated = await userService.uploadAvatar(req.userId, req.file);
        if (!updated) throw new NotFoundError("User not found");
        res.status(200).json({ avatarUrl: updated.avatarUrl });
      } catch (error) {
        next(error);
      }
    },
  ];
}

export default new UserController();