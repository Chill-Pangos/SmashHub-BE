import { Request, Response } from "express";
import permissionService from "../services/permission.service";

export class PermissionController {
  async create(req: Request, res: Response): Promise<void> {
    try {
      const permission = await permissionService.create(req.body);
      res.status(201).json(permission);
    } catch (error) {
      res.status(400).json({ message: "Error creating permission", error });
    }
  }

  async findAll(req: Request, res: Response): Promise<void> {
    try {
      const skip = Number(req.query.skip) || 0;
      const limit = Number(req.query.limit) || 10;
      const permissions = await permissionService.findAll(skip, limit);
      res.status(200).json(permissions);
    } catch (error) {
      res.status(500).json({ message: "Error fetching permissions", error });
    }
  }

  async findById(req: Request, res: Response): Promise<void> {
    try {
      const permission = await permissionService.findById(
        Number(req.params.id)
      );
      if (!permission) {
        res.status(404).json({ message: "Permission not found" });
        return;
      }
      res.status(200).json(permission);
    } catch (error) {
      res.status(500).json({ message: "Error fetching permission", error });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const permission = await permissionService.update(
        Number(req.params.id),
        req.body
      );
      if (!permission) {
        res.status(404).json({ message: "Permission not found" });
        return;
      }
      res.status(200).json(permission);
    } catch (error) {
      res.status(400).json({ message: "Error updating permission", error });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const deleted = await permissionService.delete(Number(req.params.id));
      if (!deleted) {
        res.status(404).json({ message: "Permission not found" });
        return;
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error deleting permission", error });
    }
  }
}

export default new PermissionController();
