import { Request, Response } from "express";
import TournamentCategoryService from "../services/tournamentCategory.service";

export class TournamentCategoryController {
  async create(req: Request, res: Response): Promise<void> {
    try {
      const category = await TournamentCategoryService.create(req.body);
      res.status(201).json(category);
    } catch (error) {
      res
        .status(400)
        .json({ message: "Error creating tournament category", error });
    }
  }

  async findAll(req: Request, res: Response): Promise<void> {
    try {
      const skip = Number(req.query.skip) || 0;
      const limit = Number(req.query.limit) || 10;
      const categories = await TournamentCategoryService.findAll(skip, limit);
      res.status(200).json(categories);
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error fetching tournament categories", error });
    }
  }

  async findById(req: Request, res: Response): Promise<void> {
    try {
      const category = await TournamentCategoryService.findById(
        Number(req.params.id)
      );
      if (!category) {
        res.status(404).json({ message: "Tournament category not found" });
        return;
      }
      res.status(200).json(category);
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error fetching tournament category", error });
    }
  }

  async findByTournamentId(req: Request, res: Response): Promise<void> {
    try {
      const skip = Number(req.query.skip) || 0;
      const limit = Number(req.query.limit) || 10;
      const categories = await TournamentCategoryService.findByTournamentId(
        Number(req.params.tournamentId),
        skip,
        limit
      );
      res.status(200).json(categories);
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error fetching tournament categorys", error });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const category = await TournamentCategoryService.update(
        Number(req.params.id),
        req.body
      );
      if (!category) {
        res.status(404).json({ message: "Tournament category not found" });
        return;
      }
      res.status(200).json(category);
    } catch (error) {
      res
        .status(400)
        .json({ message: "Error updating tournament category", error });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const deleted = await TournamentCategoryService.delete(
        Number(req.params.id)
      );
      if (!deleted) {
        res.status(404).json({ message: "Tournament category not found" });
        return;
      }
      res.status(204).send();
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error deleting tournament category", error });
    }
  }
}

export default new TournamentCategoryController();
