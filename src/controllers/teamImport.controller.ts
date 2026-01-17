import { Request, Response } from "express";
import teamImportService from "../services/teamImport.service";
import teamService from "../services/team.service";
import teamMemberService from "../services/teamMember.service";
import Tournament from "../models/tournament.model";
import { ConfirmTeamImportDto } from "../dto/teamImport.dto";
import { withTransaction } from "../utils/transaction.helper";

export class TeamImportController {
  /**
   * Preview Excel import data
   * POST /teams/import/preview
   */
  async previewImport(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No file uploaded",
        });
      }

      // Parse and validate Excel file
      const previewData = await teamImportService.parseAndValidateExcel(
        req.file.buffer,
        userId
      );

      res.status(200).json({
        success: true,
        data: previewData,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || "Failed to parse Excel file",
        error: error.toString(),
      });
    }
  }

  /**
   * Confirm and save import data
   * POST /teams/import/confirm
   */
  async confirmImport(req: Request, res: Response) {
    try {
      const data: ConfirmTeamImportDto = req.body;
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      if (!data.tournamentId) {
        return res.status(400).json({
          success: false,
          message: "Tournament ID is required",
        });
      }

      // Validate tournament exists
      const tournament = await Tournament.findByPk(data.tournamentId);
      if (!tournament) {
        return res.status(404).json({
          success: false,
          message: "Tournament not found",
        });
      }

      if (!data.teams || data.teams.length === 0) {
        return res.status(400).json({
          success: false,
          message: "No teams to import",
        });
      }

      // Save all teams and members in a transaction
      const result = await withTransaction(async (transaction) => {
        const teamIds: number[] = [];
        let createdMembers = 0;

        for (const teamData of data.teams) {
          // Create team
          const team = await teamService.create({
            tournamentId: data.tournamentId,
            name: teamData.name,
            description: teamData.description || undefined,
          });

          teamIds.push(team.id);

          // Create team members
          for (const memberData of teamData.members) {
            await teamMemberService.create({
              teamId: team.id,
              userId: memberData.userId,
              role: memberData.role,
            });
            createdMembers++;
          }
        }

        return {
          success: true,
          createdTeams: data.teams.length,
          createdMembers,
          teamIds,
        };
      });

      res.status(201).json({
        success: true,
        message: "Teams imported successfully",
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || "Failed to import teams",
        error: error.toString(),
      });
    }
  }
}

export default new TeamImportController();
