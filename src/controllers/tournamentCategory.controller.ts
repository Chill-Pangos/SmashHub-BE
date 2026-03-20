import { Request, Response } from "express";
import TournamentCategoryService from "../services/TournamentCategory.service";

export class TournamentCategoryController {
  async create(req: Request, res: Response): Promise<void> {
    try {
      const content = await TournamentCategoryService.create(req.body);
      res.status(201).json(content);
    } catch (error) {
      res
        .status(400)
        .json({ message: "Error creating tournament content", error });
    }
  }

  async findAll(req: Request, res: Response): Promise<void> {
    try {
      const skip = Number(req.query.skip) || 0;
      const limit = Number(req.query.limit) || 10;
      const contents = await TournamentCategoryService.findAll(skip, limit);
      res.status(200).json(contents);
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error fetching tournament contents", error });
    }
  }

  async findById(req: Request, res: Response): Promise<void> {
    try {
      const content = await TournamentCategoryService.findById(
        Number(req.params.id)
      );
      if (!content) {
        res.status(404).json({ message: "Tournament content not found" });
        return;
      }
      res.status(200).json(content);
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error fetching tournament content", error });
    }
  }

  async findByTournamentId(req: Request, res: Response): Promise<void> {
    try {
      const skip = Number(req.query.skip) || 0;
      const limit = Number(req.query.limit) || 10;
      const contents = await TournamentCategoryService.findByTournamentId(
        Number(req.params.tournamentId),
        skip,
        limit
      );
      res.status(200).json(contents);
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error fetching tournament contents", error });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const content = await TournamentCategoryService.update(
        Number(req.params.id),
        req.body
      );
      if (!content) {
        res.status(404).json({ message: "Tournament content not found" });
        return;
      }
      res.status(200).json(content);
    } catch (error) {
      res
        .status(400)
        .json({ message: "Error updating tournament content", error });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const deleted = await TournamentCategoryService.delete(
        Number(req.params.id)
      );
      if (!deleted) {
        res.status(404).json({ message: "Tournament content not found" });
        return;
      }
      res.status(204).send();
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error deleting tournament content", error });
    }
  }
}

export default new TournamentCategoryController();
