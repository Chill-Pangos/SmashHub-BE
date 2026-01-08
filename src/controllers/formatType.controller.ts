import { Request, Response } from "express";
import formatTypeService from "../services/formatType.service";

export class FormatTypeController {
  async create(req: Request, res: Response): Promise<void> {
    try {
      const formatType = await formatTypeService.create(req.body);
      res.status(201).json(formatType);
    } catch (error) {
      res.status(400).json({ message: "Error creating format type", error });
    }
  }

  async findAll(req: Request, res: Response): Promise<void> {
    try {
      const skip = Number(req.query.skip) || 0;
      const limit = Number(req.query.limit) || 10;
      const formatTypes = await formatTypeService.findAll(skip, limit);
      res.status(200).json(formatTypes);
    } catch (error) {
      res.status(500).json({ message: "Error fetching format types", error });
    }
  }

  async findById(req: Request, res: Response): Promise<void> {
    try {
      const formatType = await formatTypeService.findById(
        Number(req.params.id)
      );
      if (!formatType) {
        res.status(404).json({ message: "Format type not found" });
        return;
      }
      res.status(200).json(formatType);
    } catch (error) {
      res.status(500).json({ message: "Error fetching format type", error });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const formatType = await formatTypeService.update(
        Number(req.params.id),
        req.body
      );
      if (!formatType) {
        res.status(404).json({ message: "Format type not found" });
        return;
      }
      res.status(200).json(formatType);
    } catch (error) {
      res.status(400).json({ message: "Error updating format type", error });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const deleted = await formatTypeService.delete(Number(req.params.id));
      if (!deleted) {
        res.status(404).json({ message: "Format type not found" });
        return;
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error deleting format type", error });
    }
  }
}

export default new FormatTypeController();
