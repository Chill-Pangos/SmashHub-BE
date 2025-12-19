import { Request, Response } from "express";
import scheduleService from "../services/schedule.service";

export class ScheduleController {
  async create(req: Request, res: Response): Promise<void> {
    try {
      const schedule = await scheduleService.create(req.body);
      res.status(201).json(schedule);
    } catch (error) {
      res.status(400).json({ message: "Error creating schedule", error });
    }
  }

  async findAll(req: Request, res: Response): Promise<void> {
    try {
      const skip = Number(req.query.skip) || 0;
      const limit = Number(req.query.limit) || 10;
      const schedules = await scheduleService.findAll(skip, limit);
      res.status(200).json(schedules);
    } catch (error) {
      res.status(500).json({ message: "Error fetching schedules", error });
    }
  }

  async findById(req: Request, res: Response): Promise<void> {
    try {
      const schedule = await scheduleService.findById(Number(req.params.id));
      if (!schedule) {
        res.status(404).json({ message: "Schedule not found" });
        return;
      }
      res.status(200).json(schedule);
    } catch (error) {
      res.status(500).json({ message: "Error fetching schedule", error });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const schedule = await scheduleService.update(
        Number(req.params.id),
        req.body
      );
      if (!schedule) {
        res.status(404).json({ message: "Schedule not found" });
        return;
      }
      res.status(200).json(schedule);
    } catch (error) {
      res.status(400).json({ message: "Error updating schedule", error });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const deleted = await scheduleService.delete(Number(req.params.id));
      if (!deleted) {
        res.status(404).json({ message: "Schedule not found" });
        return;
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error deleting schedule", error });
    }
  }
}

export default new ScheduleController();
