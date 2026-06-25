import { Request, Response, NextFunction } from "express";
import fs from "fs/promises";
import userService from "../services/user.service";
import { AuthRequest } from "../../../middlewares/auth.middleware";
import { ForbiddenError, NotFoundError, UnauthorizedError } from "../../../utils/errors.helper";
import { avatarUpload } from "../../../config/multer";
import { parsePagination, parsePositiveInt } from "../../../utils/request.helper";
import { assertAdmin } from "../../../utils/access.helper";

export class UserController {
  private getAuthenticatedUserId(req: AuthRequest): number {
    if (req.userId == null) throw new UnauthorizedError("Unauthorized");
    return req.userId;
  }

  async create(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await assertAdmin(this.getAuthenticatedUserId(req));
      const user = await userService.create(req.body);
      res.status(201).json(user);
    } catch (error) {
      next(error);
    }
  }

  async findAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { offset, limit } = parsePagination(req.query);
      const result = await userService.findAll(offset, limit);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async searchByName(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const name = typeof req.query.name === "string" ? req.query.name.trim() : "";
      const { offset, limit } = parsePagination(req.query);
      const result = await userService.searchByName(name, offset, limit);
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
      const user = await userService.findById(parsePositiveInt(req.params.id, "id"));
      if (!user) throw new NotFoundError("User not found");
      res.status(200).json(user);
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await assertAdmin(this.getAuthenticatedUserId(req));
      const user = await userService.update(parsePositiveInt(req.params.id, "id"), req.body);
      if (!user) throw new NotFoundError("User not found");
      res.status(200).json(user);
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.userId) throw new UnauthorizedError("Unauthorized");
      const id = parsePositiveInt(req.params.id, "id");
      if (req.userId !== id) {
        throw new ForbiddenError("Cannot update another user's profile");
      }

      const user = await userService.updateProfile(id, req.body);
      if (!user) throw new NotFoundError("User not found");
      res.status(200).json(user);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await assertAdmin(this.getAuthenticatedUserId(req));
      const deleted = await userService.delete(parsePositiveInt(req.params.id, "id"));
      if (!deleted) throw new NotFoundError("User not found");
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  async getAvailableChiefReferees(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { offset, limit } = parsePagination(req.query);
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
          await fs.unlink(req.file.path).catch(() => {});
          res.status(401).json({ message: "Unauthorized" });
          return;
        }
        const id = parsePositiveInt(req.params.id, "id");
        if (req.userId !== id) {
          await fs.unlink(req.file.path).catch(() => {});
          throw new ForbiddenError("Cannot update another user's avatar");
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
