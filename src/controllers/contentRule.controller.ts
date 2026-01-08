import { Request, Response } from "express";
import contentRuleService from "../services/contentRule.service";

export class ContentRuleController {
  async create(req: Request, res: Response): Promise<void> {
    try {
      const contentRule = await contentRuleService.create(req.body);
      res.status(201).json(contentRule);
    } catch (error) {
      res.status(400).json({ message: "Error creating content rule", error });
    }
  }

  async findAll(req: Request, res: Response): Promise<void> {
    try {
      const skip = Number(req.query.skip) || 0;
      const limit = Number(req.query.limit) || 10;
      const contentRules = await contentRuleService.findAll(skip, limit);
      res.status(200).json(contentRules);
    } catch (error) {
      res.status(500).json({ message: "Error fetching content rules", error });
    }
  }

  async findById(req: Request, res: Response): Promise<void> {
    try {
      const contentRule = await contentRuleService.findById(
        Number(req.params.id)
      );
      if (!contentRule) {
        res.status(404).json({ message: "Content rule not found" });
        return;
      }
      res.status(200).json(contentRule);
    } catch (error) {
      res.status(500).json({ message: "Error fetching content rule", error });
    }
  }

  async findByContentId(req: Request, res: Response): Promise<void> {
    try {
      const contentRule = await contentRuleService.findByContentId(
        Number(req.params.contentId)
      );
      if (!contentRule) {
        res.status(404).json({ message: "Content rule not found" });
        return;
      }
      res.status(200).json(contentRule);
    } catch (error) {
      res.status(500).json({ message: "Error fetching content rules", error });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const contentRule = await contentRuleService.update(
        Number(req.params.id),
        req.body
      );
      if (!contentRule) {
        res.status(404).json({ message: "Content rule not found" });
        return;
      }
      res.status(200).json(contentRule);
    } catch (error) {
      res.status(400).json({ message: "Error updating content rule", error });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const deleted = await contentRuleService.delete(Number(req.params.id));
      if (!deleted) {
        res.status(404).json({ message: "Content rule not found" });
        return;
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error deleting content rule", error });
    }
  }
}

export default new ContentRuleController();
