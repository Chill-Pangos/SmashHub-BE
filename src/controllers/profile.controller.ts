import { Request, Response } from "express";
import profileService from "../services/profile.service";

export class ProfileController {
  async create(req: Request, res: Response): Promise<void> {
    try {
      const profile = await profileService.create(req.body);
      res.status(201).json(profile);
    } catch (error) {
      res.status(400).json({ message: "Error creating profile", error });
    }
  }

  async findAll(req: Request, res: Response): Promise<void> {
    try {
      const skip = Number(req.query.skip) || 0;
      const limit = Number(req.query.limit) || 10;
      const profiles = await profileService.findAll(skip, limit);
      res.status(200).json(profiles);
    } catch (error) {
      res.status(500).json({ message: "Error fetching profiles", error });
    }
  }

  async findById(req: Request, res: Response): Promise<void> {
    try {
      const profile = await profileService.findById(Number(req.params.id));
      if (!profile) {
        res.status(404).json({ message: "Profile not found" });
        return;
      }
      res.status(200).json(profile);
    } catch (error) {
      res.status(500).json({ message: "Error fetching profile", error });
    }
  }

  async findByUserId(req: Request, res: Response): Promise<void> {
    try {
      const profile = await profileService.findByUserId(
        Number(req.params.userId)
      );
      if (!profile) {
        res.status(404).json({ message: "Profile not found" });
        return;
      }
      res.status(200).json(profile);
    } catch (error) {
      res.status(500).json({ message: "Error fetching profile", error });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const profile = await profileService.update(
        Number(req.params.id),
        req.body
      );
      if (!profile) {
        res.status(404).json({ message: "Profile not found" });
        return;
      }
      res.status(200).json(profile);
    } catch (error) {
      res.status(400).json({ message: "Error updating profile", error });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const deleted = await profileService.delete(Number(req.params.id));
      if (!deleted) {
        res.status(404).json({ message: "Profile not found" });
        return;
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error deleting profile", error });
    }
  }
}

export default new ProfileController();
