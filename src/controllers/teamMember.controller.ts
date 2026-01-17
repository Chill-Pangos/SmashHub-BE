import { Request, Response } from "express";
import teamMemberService from "../services/teamMember.service";

export class TeamMemberController {
  async create(req: Request, res: Response): Promise<void> {
    try {
      const teamMember = await teamMemberService.create(req.body);
      res.status(201).json(teamMember);
    } catch (error) {
      res.status(400).json({ message: "Error creating team member", error });
    }
  }

  async findAll(req: Request, res: Response): Promise<void> {
    try {
      const skip = Number(req.query.skip) || 0;
      const limit = Number(req.query.limit) || 10;
      const teamMembers = await teamMemberService.findAll(skip, limit);
      res.status(200).json(teamMembers);
    } catch (error) {
      res.status(500).json({ message: "Error fetching team members", error });
    }
  }

  async findById(req: Request, res: Response): Promise<void> {
    try {
      const teamMember = await teamMemberService.findById(Number(req.params.id));
      if (!teamMember) {
        res.status(404).json({ message: "Team member not found" });
        return;
      }
      res.status(200).json(teamMember);
    } catch (error) {
      res.status(500).json({ message: "Error fetching team member", error });
    }
  }

  async findByTeamId(req: Request, res: Response): Promise<void> {
    try {
      const skip = Number(req.query.skip) || 0;
      const limit = Number(req.query.limit) || 10;
      const teamMembers = await teamMemberService.findByTeamId(
        Number(req.params.teamId),
        skip,
        limit
      );
      res.status(200).json(teamMembers);
    } catch (error) {
      res.status(500).json({ message: "Error fetching team members", error });
    }
  }

  async findByUserId(req: Request, res: Response): Promise<void> {
    try {
      const skip = Number(req.query.skip) || 0;
      const limit = Number(req.query.limit) || 10;
      const teamMembers = await teamMemberService.findByUserId(
        Number(req.params.userId),
        skip,
        limit
      );
      res.status(200).json(teamMembers);
    } catch (error) {
      res.status(500).json({ message: "Error fetching team members", error });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const teamMember = await teamMemberService.update(Number(req.params.id), req.body);
      if (!teamMember) {
        res.status(404).json({ message: "Team member not found" });
        return;
      }
      res.status(200).json(teamMember);
    } catch (error) {
      res.status(400).json({ message: "Error updating team member", error });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const deleted = await teamMemberService.delete(Number(req.params.id));
      if (!deleted) {
        res.status(404).json({ message: "Team member not found" });
        return;
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error deleting team member", error });
    }
  }
}

export default new TeamMemberController();
