import { Request, Response } from "express";
import userService from "../services/user.service";

export class UserController {
  async create(req: Request, res: Response): Promise<void> {
    try {
      const user = await userService.create(req.body);
      res.status(201).json(user);
    } catch (error) {
      res.status(400).json({ message: "Error creating user", error });
    }
  }

  async findAll(req: Request, res: Response): Promise<void> {
    try {
      const users = await userService.findAll();
      res.status(200).json(users);
    } catch (error) {
      res.status(500).json({ message: "Error fetching users", error });
    }
  }

  async findById(req: Request, res: Response): Promise<void> {
    try {
      const user = await userService.findById(Number(req.params.id));
      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }
      res.status(200).json(user);
    } catch (error) {
      res.status(500).json({ message: "Error fetching user", error });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const user = await userService.update(Number(req.params.id), req.body);
      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }
      res.status(200).json(user);
    } catch (error) {
      res.status(400).json({ message: "Error updating user", error });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const deleted = await userService.delete(Number(req.params.id));
      if (!deleted) {
        res.status(404).json({ message: "User not found" });
        return;
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error deleting user", error });
    }
  }
}

export default new UserController();
