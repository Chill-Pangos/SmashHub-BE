import { Request, Response } from "express";
import tournamentRefereeService from "../services/tournamentReferee.service";

export class TournamentRefereeController {
  async create(req: Request, res: Response): Promise<void> {
    try {
      const tournamentReferee = await tournamentRefereeService.create(req.body);
      res.status(201).json(tournamentReferee);
    } catch (error) {
      res
        .status(400)
        .json({ message: "Error creating tournament referee", error });
    }
  }

  async findAll(req: Request, res: Response): Promise<void> {
    try {
      const skip = Number(req.query.skip) || 0;
      const limit = Number(req.query.limit) || 10;
      const tournamentId = req.query.tournamentId
        ? Number(req.query.tournamentId)
        : undefined;

      const tournamentReferees = await tournamentRefereeService.findAll(
        tournamentId,
        skip,
        limit
      );
      res.status(200).json(tournamentReferees);
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error fetching tournament referees", error });
    }
  }

  async findById(req: Request, res: Response): Promise<void> {
    try {
      const tournamentReferee = await tournamentRefereeService.findById(
        Number(req.params.id)
      );
      if (!tournamentReferee) {
        res.status(404).json({ message: "Tournament referee not found" });
        return;
      }
      res.status(200).json(tournamentReferee);
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error fetching tournament referee", error });
    }
  }

  async findByTournamentId(req: Request, res: Response): Promise<void> {
    try {
      const skip = Number(req.query.skip) || 0;
      const limit = Number(req.query.limit) || 10;
      const tournamentReferees =
        await tournamentRefereeService.findByTournamentId(
          Number(req.params.tournamentId),
          skip,
          limit
        );
      res.status(200).json(tournamentReferees);
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error fetching tournament referees", error });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const [affected, tournamentReferees] =
        await tournamentRefereeService.update(Number(req.params.id), req.body);
      if (affected === 0) {
        res.status(404).json({ message: "Tournament referee not found" });
        return;
      }
      res.status(200).json(tournamentReferees[0]);
    } catch (error) {
      res
        .status(400)
        .json({ message: "Error updating tournament referee", error });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const deleted = await tournamentRefereeService.delete(
        Number(req.params.id)
      );
      if (deleted === 0) {
        res.status(404).json({ message: "Tournament referee not found" });
        return;
      }
      res.status(204).send();
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error deleting tournament referee", error });
    }
  }

  async assignReferees(req: Request, res: Response): Promise<void> {
    try {
      const tournamentReferees = await tournamentRefereeService.assignReferees(
        req.body
      );
      res.status(201).json(tournamentReferees);
    } catch (error) {
      res.status(400).json({ message: "Error assigning referees", error });
    }
  }

  async getAvailableReferees(req: Request, res: Response): Promise<void> {
    try {
      const tournamentId = Number(req.params.tournamentId);
      const excludeIds = req.query.excludeIds
        ? (req.query.excludeIds as string).split(",").map(Number)
        : [];

      const availableReferees =
        await tournamentRefereeService.getAvailableReferees(
          tournamentId,
          excludeIds
        );
      res.status(200).json(availableReferees);
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error fetching available referees", error });
    }
  }

  async updateAvailability(req: Request, res: Response): Promise<void> {
    try {
      const { isAvailable } = req.body;
      if (typeof isAvailable !== "boolean") {
        res.status(400).json({ message: "isAvailable must be a boolean" });
        return;
      }

      const [affected, tournamentReferees] =
        await tournamentRefereeService.updateAvailability(
          Number(req.params.id),
          isAvailable
        );

      if (affected === 0) {
        res.status(404).json({ message: "Tournament referee not found" });
        return;
      }

      res.status(200).json(tournamentReferees[0]);
    } catch (error) {
      res
        .status(400)
        .json({ message: "Error updating availability", error });
    }
  }
}

export default new TournamentRefereeController();
