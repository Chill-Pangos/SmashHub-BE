import { Request, Response, NextFunction } from "express";
import entryImportService from "../services/entryImport.service";
import Entry from "../models/entry.model";
import EntryMember from "../models/entryMember.model";
import EloScore from "../models/eloScore.model";
import User from "../models/user.model";
import TournamentCategory from "../models/tournamentCategory.model";
import { ConfirmEntryImportDto, ValidatedSingleEntryDto, ValidatedDoubleEntryDto } from "../dto/entryImport.dto";
import { withTransaction } from "../utils/transaction.helper";
import { BadRequestError, UnauthorizedError } from "../utils/errors";

export class EntryImportController {
  /**
   * Preview Excel import data for single entries
   * POST /entries/import/preview
   */
  async previewSingleEntries(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        throw new UnauthorizedError("Unauthorized");
      }

      if (!req.file) {
        throw new BadRequestError("No file uploaded");
      }

      const categoryId = Number(req.body.categoryId);
      if (!categoryId) {
        throw new BadRequestError("Category ID is required");
      }

      // Parse and validate Excel file
      const previewData = await entryImportService.parseAndValidateSingleEntries(
        req.file.buffer,
        categoryId
      );

      res.status(200).json({
        success: true,
        data: previewData,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Confirm and save import data for single entries
   * POST /entries/import/confirm
   */
  async confirmSingleEntries(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data: ConfirmEntryImportDto = req.body;
      const userId = (req as any).user?.id;

      if (!userId) {
        throw new UnauthorizedError("Unauthorized");
      }

      if (!data.categoryId) {
        throw new BadRequestError("Category ID is required");
      }

      if (!data.entries || data.entries.length === 0) {
        throw new BadRequestError("No entries to import");
      }

      // Type guard to check if entries are single entries
      const isSingleEntry = (entry: any): entry is ValidatedSingleEntryDto => {
        return 'userId' in entry && !('player1UserId' in entry);
      };

      const singleEntries = data.entries as ValidatedSingleEntryDto[];

      // Validate all entries are single type
      if (!singleEntries.every(isSingleEntry)) {
        throw new BadRequestError("Invalid entry format for single entries");
      }

      // Validate category exists before creating entries
      const category = await TournamentCategory.findByPk(data.categoryId);
      if (!category) {
        throw new BadRequestError("Tournament category not found");
      }

      // Re-validate users and check for duplicates
      const existingEntries = await Entry.findAll({
        where: { categoryId: data.categoryId },
        include: [
          {
            model: EntryMember,
            as: 'members',
          },
        ],
      });

      const existingUserIds = new Set(
        existingEntries.flatMap(entry => {
          const members = (entry as any).members as EntryMember[] | undefined;
          return members?.map((em: EntryMember) => em.userId) || [];
        })
      );

      for (const entryData of singleEntries) {
        // Get user to validate
        const user = await User.findByPk(entryData.userId);
        if (!user) {
          throw new BadRequestError(`User with ID ${entryData.userId} not found`);
        }

        // Check if user already registered for this category
        if (existingUserIds.has(entryData.userId)) {
          throw new BadRequestError(`User ${user.email} is already registered for this category`);
        }

        // Validate gender for single entries
        if (category.gender) {
          if (!user.gender) {
            throw new BadRequestError(`User ${user.email}'s gender is not set. Category requires "${category.gender}"`);
          }

          if (user.gender !== category.gender) {
            throw new BadRequestError(`User ${user.email}'s gender (${user.gender}) does not match category requirement (${category.gender})`);
          }
        }
      }

      // Save all entries in a transaction
      const result = await withTransaction(async (transaction) => {
        const entryIds: number[] = [];

        for (const entryData of singleEntries) {
          // Create entry
          const entry = await Entry.create(
            {
              categoryId: data.categoryId,
            } as any,
            { transaction }
          );

          entryIds.push(entry.id);

          // Get ELO score for the user
          const eloScore = await EloScore.findOne({
            where: { userId: entryData.userId },
            transaction,
          });

          // Create entry member
          await EntryMember.create(
            {
              entryId: entry.id,
              userId: entryData.userId,
              eloAtEntry: eloScore?.score || 1000,
            } as any,
            { transaction }
          );
        }

        return {
          success: true,
          createdEntries: singleEntries.length,
          entryIds,
        };
      });

      res.status(201).json({
        success: true,
        message: "Entries imported successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Preview Excel import data for double entries
   * POST /entries/import/double/preview
   */
  async previewDoubleEntries(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        throw new UnauthorizedError("Unauthorized");
      }

      if (!req.file) {
        throw new BadRequestError("No file uploaded");
      }

      const categoryId = Number(req.body.categoryId);
      if (!categoryId) {
        throw new BadRequestError("Category ID is required");
      }

      // Parse and validate Excel file
      const previewData = await entryImportService.parseAndValidateDoubleEntries(
        req.file.buffer,
        categoryId
      );

      res.status(200).json({
        success: true,
        data: previewData,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Confirm and save import data for double entries
   * POST /entries/import/double/confirm
   */
  async confirmDoubleEntries(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data: ConfirmEntryImportDto = req.body;
      const userId = (req as any).user?.id;

      if (!userId) {
        throw new UnauthorizedError("Unauthorized");
      }

      if (!data.categoryId) {
        throw new BadRequestError("Category ID is required");
      }

      if (!data.entries || data.entries.length === 0) {
        throw new BadRequestError("No entries to import");
      }

      // Type guard to check if entries are double entries
      const isDoubleEntry = (entry: any): entry is ValidatedDoubleEntryDto => {
        return 'player1UserId' in entry && 'player2UserId' in entry;
      };

      const doubleEntries = data.entries as ValidatedDoubleEntryDto[];

      // Validate all entries are double type
      if (!doubleEntries.every(isDoubleEntry)) {
        throw new BadRequestError("Invalid entry format for double entries");
      }

      // Validate category exists before creating entries
      const category = await TournamentCategory.findByPk(data.categoryId);
      if (!category) {
        throw new BadRequestError("Tournament category not found");
      }

      // Re-validate mixed gender requirement for double entries
      if (category.type === 'double' && category.gender === 'mixed') {
        for (const entryData of doubleEntries) {
          // Get both users to check gender
          const user1 = await User.findByPk(entryData.player1UserId);
          const user2 = await User.findByPk(entryData.player2UserId);

          if (!user1 || !user2) {
            throw new BadRequestError("One or more users not found");
          }

          if (!user1.gender || !user2.gender) {
            throw new BadRequestError("Mixed gender category requires both players to have gender set");
          }

          if (user1.gender === user2.gender) {
            throw new BadRequestError(`Mixed gender category requires 1 male and 1 female. Both players are ${user1.gender}`);
          }
        }
      }

      // Check for duplicate pairs in database
      const existingEntries = await Entry.findAll({
        where: { categoryId: data.categoryId },
        include: [
          {
            model: EntryMember,
            as: 'members',
          },
        ],
      });

      // Track existing users (each user can only register once)
      const existingUserIds = new Set<number>();
      existingEntries.forEach(entry => {
        const members = (entry as any).members as EntryMember[] | undefined;
        if (members) {
          members.forEach(member => {
            existingUserIds.add(member.userId);
          });
        }
      });

      const existingPairs = new Set<string>();
      existingEntries.forEach(entry => {
        const members = (entry as any).members as EntryMember[] | undefined;
        if (members && members.length === 2) {
          const sorted = members.sort((a, b) => a.userId - b.userId);
          const m1 = sorted[0];
          const m2 = sorted[1];
          if (m1 && m2) {
            existingPairs.add(`${m1.userId}-${m2.userId}`);
          }
        }
      });

      // Validate each pair is not duplicate
      for (const entryData of doubleEntries) {
        // Check if player 1 already registered (each user can only register once)
        if (existingUserIds.has(entryData.player1UserId)) {
          throw new BadRequestError(`Player ${entryData.player1Email} is already registered in this category (each user can only register once)`);
        }

        // Check if player 2 already registered (each user can only register once)
        if (existingUserIds.has(entryData.player2UserId)) {
          throw new BadRequestError(`Player ${entryData.player2Email} is already registered in this category (each user can only register once)`);
        }

        const sortedIds = [entryData.player1UserId, entryData.player2UserId].sort((a, b) => a - b);
        const pairKey = `${sortedIds[0]}-${sortedIds[1]}`;

        if (existingPairs.has(pairKey)) {
          throw new BadRequestError(`Pair ${entryData.player1Email} & ${entryData.player2Email} is already registered for this category`);
        }
      }

      // Save all entries in a transaction
      const result = await withTransaction(async (transaction) => {
        const entryIds: number[] = [];

        for (const entryData of doubleEntries) {
          // Create entry
          const entry = await Entry.create(
            {
              categoryId: data.categoryId,
            } as any,
            { transaction }
          );

          entryIds.push(entry.id);

          // Get ELO scores for both players
          const eloScore1 = await EloScore.findOne({
            where: { userId: entryData.player1UserId },
            transaction,
          });

          const eloScore2 = await EloScore.findOne({
            where: { userId: entryData.player2UserId },
            transaction,
          });

          // Create entry members for both players
          await EntryMember.create(
            {
              entryId: entry.id,
              userId: entryData.player1UserId,
              eloAtEntry: eloScore1?.score || 1000,
            } as any,
            { transaction }
          );

          await EntryMember.create(
            {
              entryId: entry.id,
              userId: entryData.player2UserId,
              eloAtEntry: eloScore2?.score || 1000,
            } as any,
            { transaction }
          );
        }

        return {
          success: true,
          createdEntries: doubleEntries.length,
          entryIds,
        };
      });

      res.status(201).json({
        success: true,
        message: "Double entries imported successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new EntryImportController();
