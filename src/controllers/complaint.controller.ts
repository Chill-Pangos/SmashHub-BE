import { Request, Response } from "express";
import complaintService from "../services/complaint.service";

export class ComplaintController {
  async create(req: Request, res: Response): Promise<void> {
    try {
      const complaint = await complaintService.create(req.body);
      res.status(201).json(complaint);
    } catch (error) {
      res.status(400).json({ message: "Error creating complaint", error });
    }
  }

  async findAll(req: Request, res: Response): Promise<void> {
    try {
      const skip = Number(req.query.skip) || 0;
      const limit = Number(req.query.limit) || 10;
      const complaints = await complaintService.findAll(skip, limit);
      res.status(200).json(complaints);
    } catch (error) {
      res.status(500).json({ message: "Error fetching complaints", error });
    }
  }

  async findById(req: Request, res: Response): Promise<void> {
    try {
      const complaint = await complaintService.findById(Number(req.params.id));
      if (!complaint) {
        res.status(404).json({ message: "Complaint not found" });
        return;
      }
      res.status(200).json(complaint);
    } catch (error) {
      res.status(500).json({ message: "Error fetching complaint", error });
    }
  }

  async findByUserId(req: Request, res: Response): Promise<void> {
    try {
      const skip = Number(req.query.skip) || 0;
      const limit = Number(req.query.limit) || 10;
      const complaints = await complaintService.findByUserId(
        Number(req.params.userId),
        skip,
        limit
      );
      res.status(200).json(complaints);
    } catch (error) {
      res.status(500).json({ message: "Error fetching complaints", error });
    }
  }

  async findByTournamentId(req: Request, res: Response): Promise<void> {
    try {
      const skip = Number(req.query.skip) || 0;
      const limit = Number(req.query.limit) || 10;
      const complaints = await complaintService.findByTournamentId(
        Number(req.params.tournamentId),
        skip,
        limit
      );
      res.status(200).json(complaints);
    } catch (error) {
      res.status(500).json({ message: "Error fetching complaints", error });
    }
  }

  async findByStatus(req: Request, res: Response): Promise<void> {
    try {
      const status = req.params.status;
      if (!status || typeof status !== 'string') {
        res.status(400).json({ message: "Status is required" });
        return;
      }
      
      // Validate status value
      const validStatuses = ['submitted', 'under_review', 'escalated', 'resolved', 'rejected'];
      if (!validStatuses.includes(status)) {
        res.status(400).json({ 
          message: "Invalid status. Must be one of: submitted, under_review, escalated, resolved, rejected" 
        });
        return;
      }
      
      const skip = Number(req.query.skip) || 0;
      const limit = Number(req.query.limit) || 10;
      const complaints = await complaintService.findByStatus(
        status,
        skip,
        limit
      );
      res.status(200).json(complaints);
    } catch (error) {
      res.status(500).json({ message: "Error fetching complaints", error });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const complaint = await complaintService.update(
        Number(req.params.id),
        req.body
      );
      if (!complaint) {
        res.status(404).json({ message: "Complaint not found" });
        return;
      }
      res.status(200).json(complaint);
    } catch (error) {
      res.status(400).json({ message: "Error updating complaint", error });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const deleted = await complaintService.delete(Number(req.params.id));
      if (!deleted) {
        res.status(404).json({ message: "Complaint not found" });
        return;
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error deleting complaint", error });
    }
  }
}

export default new ComplaintController();
