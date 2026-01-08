import { Request, Response } from "express";
import roleService from "../services/role.service";

export class RoleController {
  async create(req: Request, res: Response): Promise<void> {
    try {
      const role = await roleService.create(req.body);
      res.status(201).json(role);
    } catch (error) {
      res.status(400).json({ message: "Error creating role", error });
    }
  }

  async findAll(req: Request, res: Response): Promise<void> {
    try {
      const skip = Number(req.query.skip) || 0;
      const limit = Number(req.query.limit) || 10;
      const roles = await roleService.findAll(skip, limit);
      res.status(200).json(roles);
    } catch (error) {
      res.status(500).json({ message: "Error fetching roles", error });
    }
  }

  async findById(req: Request, res: Response): Promise<void> {
    try {
      const role = await roleService.findById(Number(req.params.id));
      if (!role) {
        res.status(404).json({ message: "Role not found" });
        return;
      }
      res.status(200).json(role);
    } catch (error) {
      res.status(500).json({ message: "Error fetching role", error });
    }
  }

  async findByName(req: Request, res: Response): Promise<void> {
    try {
      const name = req.params.name;
      if (!name) {
        res.status(400).json({ message: "Role name is required" });
        return;
      }
      const role = await roleService.findByName(name);
      if (!role) {
        res.status(404).json({ message: "Role not found" });
        return;
      }
      res.status(200).json(role);
    } catch (error) {
      res.status(500).json({ message: "Error fetching role", error });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const role = await roleService.update(Number(req.params.id), req.body);
      if (!role) {
        res.status(404).json({ message: "Role not found" });
        return;
      }
      res.status(200).json(role);
    } catch (error) {
      res.status(400).json({ message: "Error updating role", error });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const deleted = await roleService.delete(Number(req.params.id));
      if (!deleted) {
        res.status(404).json({ message: "Role not found" });
        return;
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error deleting role", error });
    }
  }
}

export default new RoleController();
