import { Request, Response } from "express";
import matchFormatService from "../services/matchFormat.service";

export class MatchFormatController {
  async create(req: Request, res: Response): Promise<void> {
    try {
      const matchFormat = await matchFormatService.create(req.body);
      res.status(201).json(matchFormat);
    } catch (error) {
      res.status(400).json({ message: "Error creating match format", error });
    }
  }

  async findAll(req: Request, res: Response): Promise<void> {
    try {
      const skip = Number(req.query.skip) || 0;
      const limit = Number(req.query.limit) || 10;
      const matchFormats = await matchFormatService.findAll(skip, limit);
      res.status(200).json(matchFormats);
    } catch (error) {
      res.status(500).json({ message: "Error fetching match formats", error });
    }
  }

  async findById(req: Request, res: Response): Promise<void> {
    try {
      const matchFormat = await matchFormatService.findById(
        Number(req.params.id)
      );
      if (!matchFormat) {
        res.status(404).json({ message: "Match format not found" });
        return;
      }
      res.status(200).json(matchFormat);
    } catch (error) {
      res.status(500).json({ message: "Error fetching match format", error });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const matchFormat = await matchFormatService.update(
        Number(req.params.id),
        req.body
      );
      if (!matchFormat) {
        res.status(404).json({ message: "Match format not found" });
        return;
      }
      res.status(200).json(matchFormat);
    } catch (error) {
      res.status(400).json({ message: "Error updating match format", error });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const deleted = await matchFormatService.delete(Number(req.params.id));
      if (!deleted) {
        res.status(404).json({ message: "Match format not found" });
        return;
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error deleting match format", error });
    }
  }
}

export default new MatchFormatController();
