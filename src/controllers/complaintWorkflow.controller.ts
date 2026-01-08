import { Request, Response } from "express";
import complaintWorkflowService from "../services/complaintWorkflow.service";

export class ComplaintWorkflowController {
  async create(req: Request, res: Response): Promise<void> {
    try {
      const workflow = await complaintWorkflowService.create(req.body);
      res.status(201).json(workflow);
    } catch (error) {
      res
        .status(400)
        .json({ message: "Error creating complaint workflow", error });
    }
  }

  async findAll(req: Request, res: Response): Promise<void> {
    try {
      const skip = Number(req.query.skip) || 0;
      const limit = Number(req.query.limit) || 10;
      const workflows = await complaintWorkflowService.findAll(skip, limit);
      res.status(200).json(workflows);
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error fetching complaint workflows", error });
    }
  }

  async findById(req: Request, res: Response): Promise<void> {
    try {
      const workflow = await complaintWorkflowService.findById(
        Number(req.params.id)
      );
      if (!workflow) {
        res.status(404).json({ message: "Complaint workflow not found" });
        return;
      }
      res.status(200).json(workflow);
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error fetching complaint workflow", error });
    }
  }

  async findByComplaintId(req: Request, res: Response): Promise<void> {
    try {
      const skip = Number(req.query.skip) || 0;
      const limit = Number(req.query.limit) || 10;
      const workflows = await complaintWorkflowService.findByComplaintId(
        Number(req.params.complaintId),
        skip,
        limit
      );
      res.status(200).json(workflows);
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error fetching complaint workflows", error });
    }
  }

  async findByUserId(req: Request, res: Response): Promise<void> {
    try {
      const skip = Number(req.query.skip) || 0;
      const limit = Number(req.query.limit) || 10;
      const workflows = await complaintWorkflowService.findByUserId(
        Number(req.params.userId),
        skip,
        limit
      );
      res.status(200).json(workflows);
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error fetching complaint workflows", error });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const deleted = await complaintWorkflowService.delete(
        Number(req.params.id)
      );
      if (!deleted) {
        res.status(404).json({ message: "Complaint workflow not found" });
        return;
      }
      res.status(204).send();
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error deleting complaint workflow", error });
    }
  }
}

export default new ComplaintWorkflowController();
