import * as XLSX from 'xlsx';
import User from '../models/user.model';
import TournamentContent from '../models/tournamentContent.model';
import Entries from '../models/entries.model';
import EntryMember from '../models/entryMember.model';
import Team from '../models/team.model';
import TeamMember from '../models/teamMember.model';
import {
  ParsedSingleEntryDto,
  ParsedDoubleEntryDto,
  ValidatedSingleEntryDto,
  ValidatedDoubleEntryDto,
  EntryImportValidationError,
  EntryImportPreviewDto,
} from '../dto/entryImport.dto';

export class EntryImportService {
  /**
   * Parse Excel file and validate single entries
   */
  async parseAndValidateSingleEntries(
    fileBuffer: Buffer,
    contentId: number
  ): Promise<EntryImportPreviewDto> {
    // Validate content exists and is single type
    const content = await TournamentContent.findByPk(contentId);
    if (!content) {
      throw new Error('Content not found');
    }

    if (content.type !== 'single') {
      throw new Error('This endpoint is only for single type content');
    }

    // Get current entries count
    const currentEntries = await Entries.count({ where: { contentId } });
    const availableSlots = content.maxEntries - currentEntries;

    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });

    // Validate file structure
    this.validateExcelStructure(workbook);

    // Parse entries sheet
    const parsedEntries = this.parseEntriesSheet(workbook);

    // Check if exceeds available slots
    if (parsedEntries.length > availableSlots) {
      throw new Error(
        `Cannot import ${parsedEntries.length} entries. Only ${availableSlots} slots available (${currentEntries}/${content.maxEntries} filled)`
      );
    }

    // Validate entries and resolve user IDs
    const { validatedEntries, errors } = await this.validateEntries(
      parsedEntries,
      contentId
    );

    // Calculate summary
    const summary = {
      totalEntries: parsedEntries.length,
      entriesWithErrors: errors.length,
      contentType: content.type,
      maxEntries: content.maxEntries,
      currentEntries,
      availableSlots,
    };

    return {
      valid: errors.length === 0,
      entries: validatedEntries,
      errors,
      summary,
    };
  }

  /**
   * Validate Excel file structure and format
   */
  private validateExcelStructure(workbook: XLSX.WorkBook): void {
    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      throw new Error('Excel file has no sheets');
    }

    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      throw new Error('No sheet found');
    }

    const sheet = workbook.Sheets[sheetName];
    if (!sheet) {
      throw new Error('Sheet has no data');
    }

    const data: any[] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
    if (data.length === 0) {
      throw new Error('Sheet is empty');
    }

    // Check header (row 0)
    const header = data[0];
    if (!header || header.length < 3) {
      throw new Error('Invalid sheet format. Expected columns: STT, Họ tên, Email');
    }
  }

  /**
   * Parse entries sheet
   */
  private parseEntriesSheet(workbook: XLSX.WorkBook): ParsedSingleEntryDto[] {
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      throw new Error('No sheet found');
    }

    const worksheet = workbook.Sheets[sheetName];

    if (!worksheet) {
      throw new Error('Sheet has no data');
    }

    const data: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
    const entries: ParsedSingleEntryDto[] = [];

    // Skip header row (row 0)
    for (let i = 1; i < data.length; i++) {
      const row = data[i];

      // Skip empty rows
      if (!row[1] || row[1].toString().trim() === '') continue;

      entries.push({
        stt: row[0] || i,
        name: row[1]?.toString().trim(),
        email: row[2]?.toString().trim().toLowerCase(),
        rowNumber: i + 1,
      });
    }

    return entries;
  }

  /**
   * Validate entries and resolve user IDs
   */
  private async validateEntries(
    parsedEntries: ParsedSingleEntryDto[],
    contentId: number
  ): Promise<{
    validatedEntries: ValidatedSingleEntryDto[];
    errors: EntryImportValidationError[];
  }> {
    const validatedEntries: ValidatedSingleEntryDto[] = [];
    const errors: EntryImportValidationError[] = [];

    // Get all existing entries for this content
    const existingEntries = await Entries.findAll({
      where: { contentId },
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

    const processedEmails = new Set<string>();

    for (const entry of parsedEntries) {
      const entryErrors: EntryImportValidationError[] = [];

      // Validate name
      if (!entry.name) {
        entryErrors.push({
          rowNumber: entry.rowNumber,
          field: 'name',
          message: 'Name is required',
          value: entry.name,
        });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!entry.email || !emailRegex.test(entry.email)) {
        entryErrors.push({
          rowNumber: entry.rowNumber,
          field: 'email',
          message: 'Invalid email format',
          value: entry.email,
        });
      }

      // Check duplicate in current import
      if (processedEmails.has(entry.email)) {
        entryErrors.push({
          rowNumber: entry.rowNumber,
          field: 'email',
          message: 'Duplicate email in this import',
          value: entry.email,
        });
      }

      // Try to resolve user ID from email
      let userId: number | null = null;
      let teamId: number | null = null;
      
      if (entry.email && emailRegex.test(entry.email)) {
        const user = await User.findOne({ where: { email: entry.email } });
        if (!user) {
          entryErrors.push({
            rowNumber: entry.rowNumber,
            field: 'email',
            message: 'User not found with this email',
            value: entry.email,
          });
        } else {
          userId = user.id;

          // Check if user already registered for this content
          if (existingUserIds.has(userId)) {
            entryErrors.push({
              rowNumber: entry.rowNumber,
              field: 'email',
              message: 'User already registered for this content',
              value: entry.email,
            });
          }

          // Get tournament ID from content
          const content = await TournamentContent.findByPk(contentId);
          if (!content) {
            entryErrors.push({
              rowNumber: entry.rowNumber,
              field: 'content',
              message: 'Content not found',
              value: contentId,
            });
          } else {
            // Validate user's gender against content requirements
            if (content.gender) {
              if (!user.gender) {
                entryErrors.push({
                  rowNumber: entry.rowNumber,
                  field: 'gender',
                  message: `User's gender is not set. Content requires "${content.gender}"`,
                  value: user.email,
                });
              } else if (user.gender !== content.gender) {
                entryErrors.push({
                  rowNumber: entry.rowNumber,
                  field: 'gender',
                  message: `User's gender (${user.gender}) does not match content requirement (${content.gender})`,
                  value: user.email,
                });
              }
            }

            // Check if user belongs to a team in this tournament
            const userTeam = await Team.findOne({
              where: { tournamentId: content.tournamentId },
              include: [
                {
                  model: TeamMember,
                  as: 'members',
                  where: { userId: user.id },
                  required: true,
                },
              ],
            });

            if (userTeam && userTeam.id) {
              teamId = userTeam.id;
            }
          }
        }
      }

      if (entryErrors.length > 0) {
        errors.push(...entryErrors);
      } else if (userId !== null) {
        validatedEntries.push({
          name: entry.name,
          userId,
          email: entry.email,
          teamId,
          rowNumber: entry.rowNumber,
        });
        processedEmails.add(entry.email);
      }
    }

    return { validatedEntries, errors };
  }

  /**
   * Parse Excel file and validate double entries
   */
  async parseAndValidateDoubleEntries(
    fileBuffer: Buffer,
    contentId: number
  ): Promise<EntryImportPreviewDto> {
    // Validate content exists and is double type
    const content = await TournamentContent.findByPk(contentId);
    if (!content) {
      throw new Error('Content not found');
    }

    if (content.type !== 'double') {
      throw new Error('This endpoint is only for double type content');
    }

    // Get current entries count
    const currentEntries = await Entries.count({ where: { contentId } });
    const availableSlots = content.maxEntries - currentEntries;

    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });

    // Validate file structure for doubles
    this.validateDoubleExcelStructure(workbook);

    // Parse doubles entries sheet
    const parsedEntries = this.parseDoubleEntriesSheet(workbook);

    // Check if exceeds available slots
    if (parsedEntries.length > availableSlots) {
      throw new Error(
        `Cannot import ${parsedEntries.length} entries. Only ${availableSlots} slots available (${currentEntries}/${content.maxEntries} filled)`
      );
    }

    // Validate double entries and resolve user IDs
    const { validatedEntries, errors } = await this.validateDoubleEntries(
      parsedEntries,
      contentId
    );

    // Calculate summary
    const summary = {
      totalEntries: parsedEntries.length,
      entriesWithErrors: errors.length,
      contentType: content.type,
      maxEntries: content.maxEntries,
      currentEntries,
      availableSlots,
    };

    return {
      valid: errors.length === 0,
      entries: validatedEntries,
      errors,
      summary,
    };
  }

  /**
   * Validate Excel file structure for doubles
   */
  private validateDoubleExcelStructure(workbook: XLSX.WorkBook): void {
    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      throw new Error('Excel file has no sheets');
    }

    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      throw new Error('No sheet found');
    }

    const sheet = workbook.Sheets[sheetName];
    if (!sheet) {
      throw new Error('Sheet has no data');
    }

    const data: any[] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
    if (data.length === 0) {
      throw new Error('Sheet is empty');
    }

    // Check header (row 0) - expect 5 columns
    const header = data[0];
    if (!header || header.length < 5) {
      throw new Error('Invalid sheet format. Expected columns: STT, Họ tên VĐV 1, Email, Họ tên VĐV 2, Email');
    }
  }

  /**
   * Parse doubles entries sheet
   */
  private parseDoubleEntriesSheet(workbook: XLSX.WorkBook): ParsedDoubleEntryDto[] {
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      throw new Error('No sheet found');
    }

    const worksheet = workbook.Sheets[sheetName];

    if (!worksheet) {
      throw new Error('Sheet has no data');
    }

    const data: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
    const entries: ParsedDoubleEntryDto[] = [];

    // Skip header row (row 0)
    for (let i = 1; i < data.length; i++) {
      const row = data[i];

      // Skip empty rows (check both player names)
      if ((!row[1] || row[1].toString().trim() === '') && 
          (!row[3] || row[3].toString().trim() === '')) continue;

      entries.push({
        stt: row[0] || i,
        player1Name: row[1]?.toString().trim(),
        player1Email: row[2]?.toString().trim().toLowerCase(),
        player2Name: row[3]?.toString().trim(),
        player2Email: row[4]?.toString().trim().toLowerCase(),
        rowNumber: i + 1,
      });
    }

    return entries;
  }

  /**
   * Validate double entries and resolve user IDs
   */
  private async validateDoubleEntries(
    parsedEntries: ParsedDoubleEntryDto[],
    contentId: number
  ): Promise<{
    validatedEntries: ValidatedDoubleEntryDto[];
    errors: EntryImportValidationError[];
  }> {
    const validatedEntries: ValidatedDoubleEntryDto[] = [];
    const errors: EntryImportValidationError[] = [];

    // Get all existing entries for this content
    const existingEntries = await Entries.findAll({
      where: { contentId },
      include: [
        {
          model: EntryMember,
          as: 'members',
        },
      ],
    });

    // Track existing users who already registered (each user can only register once)
    const existingUserIds = new Set<number>();
    existingEntries.forEach(entry => {
      const members = (entry as any).members as EntryMember[] | undefined;
      if (members) {
        members.forEach(member => {
          existingUserIds.add(member.userId);
        });
      }
    });

    // Track existing pairs (both directions)
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

    const processedPairs = new Set<string>();
    const processedUserIds = new Set<number>();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    for (const entry of parsedEntries) {
      const entryErrors: EntryImportValidationError[] = [];

      // Validate player 1 name
      if (!entry.player1Name) {
        entryErrors.push({
          rowNumber: entry.rowNumber,
          field: 'player1Name',
          message: 'Player 1 name is required',
          value: entry.player1Name,
        });
      }

      // Validate player 1 email format
      if (!entry.player1Email || !emailRegex.test(entry.player1Email)) {
        entryErrors.push({
          rowNumber: entry.rowNumber,
          field: 'player1Email',
          message: 'Invalid player 1 email format',
          value: entry.player1Email,
        });
      }

      // Validate player 2 name
      if (!entry.player2Name) {
        entryErrors.push({
          rowNumber: entry.rowNumber,
          field: 'player2Name',
          message: 'Player 2 name is required',
          value: entry.player2Name,
        });
      }

      // Validate player 2 email format
      if (!entry.player2Email || !emailRegex.test(entry.player2Email)) {
        entryErrors.push({
          rowNumber: entry.rowNumber,
          field: 'player2Email',
          message: 'Invalid player 2 email format',
          value: entry.player2Email,
        });
      }

      // Check if same player
      if (entry.player1Email === entry.player2Email) {
        entryErrors.push({
          rowNumber: entry.rowNumber,
          field: 'players',
          message: 'Cannot register the same player twice',
          value: entry.player1Email,
        });
      }

      // Try to resolve user IDs from emails
      let player1UserId: number | null = null;
      let player1TeamId: number | null = null;
      let player2UserId: number | null = null;
      let player2TeamId: number | null = null;
      let user1: User | null = null;
      let user2: User | null = null;

      const content = await TournamentContent.findByPk(contentId);
      if (!content) {
        entryErrors.push({
          rowNumber: entry.rowNumber,
          field: 'content',
          message: 'Content not found',
          value: contentId,
        });
      } else {
        // Resolve player 1
        if (entry.player1Email && emailRegex.test(entry.player1Email)) {
          user1 = await User.findOne({ where: { email: entry.player1Email } });
          if (!user1) {
            entryErrors.push({
              rowNumber: entry.rowNumber,
              field: 'player1Email',
              message: 'Player 1 not found with this email',
              value: entry.player1Email,
            });
          } else {
            player1UserId = user1.id;

            // Validate player 1 gender
            if (content.gender && content.gender !== 'mixed') {
              if (!user1.gender) {
                entryErrors.push({
                  rowNumber: entry.rowNumber,
                  field: 'player1Gender',
                  message: `Player 1's gender is not set. Content requires "${content.gender}"`,
                  value: user1.email,
                });
              } else if (user1.gender !== content.gender) {
                entryErrors.push({
                  rowNumber: entry.rowNumber,
                  field: 'player1Gender',
                  message: `Player 1's gender (${user1.gender}) does not match content requirement (${content.gender})`,
                  value: user1.email,
                });
              }
            } else if (content.gender === 'mixed' && !user1.gender) {
              entryErrors.push({
                rowNumber: entry.rowNumber,
                field: 'player1Gender',
                message: `Player 1's gender is not set. Content requires mixed (1 male + 1 female)`,
                value: user1.email,
              });
            }

            // Check player 1 team - find team first, then check if user is member
            const team1 = await Team.findOne({
              where: { tournamentId: content.tournamentId },
              include: [
                {
                  model: TeamMember,
                  as: 'members',
                  where: { userId: user1.id },
                  required: true,
                },
              ],
            });

            if (team1 && team1.id) {
              player1TeamId = team1.id;
            }
          }
        }

        // Resolve player 2
        if (entry.player2Email && emailRegex.test(entry.player2Email)) {
          user2 = await User.findOne({ where: { email: entry.player2Email } });
          if (!user2) {
            entryErrors.push({
              rowNumber: entry.rowNumber,
              field: 'player2Email',
              message: 'Player 2 not found with this email',
              value: entry.player2Email,
            });
          } else {
            player2UserId = user2.id;

            // Validate player 2 gender
            if (content.gender && content.gender !== 'mixed') {
              if (!user2.gender) {
                entryErrors.push({
                  rowNumber: entry.rowNumber,
                  field: 'player2Gender',
                  message: `Player 2's gender is not set. Content requires "${content.gender}"`,
                  value: user2.email,
                });
              } else if (user2.gender !== content.gender) {
                entryErrors.push({
                  rowNumber: entry.rowNumber,
                  field: 'player2Gender',
                  message: `Player 2's gender (${user2.gender}) does not match content requirement (${content.gender})`,
                  value: user2.email,
                });
              }
            } else if (content.gender === 'mixed' && !user2.gender) {
              entryErrors.push({
                rowNumber: entry.rowNumber,
                field: 'player2Gender',
                message: `Player 2's gender is not set. Content requires mixed (1 male + 1 female)`,
                value: user2.email,
              });
            }

            // Check player 2 team - find team first, then check if user is member
            const team2 = await Team.findOne({
              where: { tournamentId: content.tournamentId },
              include: [
                {
                  model: TeamMember,
                  as: 'members',
                  where: { userId: user2.id },
                  required: true,
                },
              ],
            });

            if (team2 && team2.id) {
              player2TeamId = team2.id;
            }
          }
        }

        // Check both players must be in the same team
        if (player1UserId && player2UserId && user1 && user2) {
          // Check if player 1 already registered in this content
          if (existingUserIds.has(player1UserId)) {
            entryErrors.push({
              rowNumber: entry.rowNumber,
              field: 'player1',
              message: 'Player 1 is already registered in this content (each user can only register once)',
              value: entry.player1Email,
            });
          }

          // Check if player 2 already registered in this content
          if (existingUserIds.has(player2UserId)) {
            entryErrors.push({
              rowNumber: entry.rowNumber,
              field: 'player2',
              message: 'Player 2 is already registered in this content (each user can only register once)',
              value: entry.player2Email,
            });
          }

          // Check if player 1 already in current import batch
          if (processedUserIds.has(player1UserId)) {
            entryErrors.push({
              rowNumber: entry.rowNumber,
              field: 'player1',
              message: 'Player 1 is already registered in this import batch (each user can only register once)',
              value: entry.player1Email,
            });
          }

          // Check if player 2 already in current import batch
          if (processedUserIds.has(player2UserId)) {
            entryErrors.push({
              rowNumber: entry.rowNumber,
              field: 'player2',
              message: 'Player 2 is already registered in this import batch (each user can only register once)',
              value: entry.player2Email,
            });
          }

          // Validate mixed gender requirement (1 male + 1 female) - check this FIRST before team checks
          if (content.gender === 'mixed') {
            if (!user1.gender || !user2.gender) {
              // Already handled in individual validation above
            } else if (user1.gender === user2.gender) {
              // Both players have same gender - not allowed for mixed
              entryErrors.push({
                rowNumber: entry.rowNumber,
                field: 'mixedGender',
                message: `Mixed gender content requires 1 male and 1 female. Both players are ${user1.gender}`,
                value: `${entry.player1Email} & ${entry.player2Email}`,
              });
            }
          }

          // Check if player 1 has team
          if (!player1TeamId) {
            entryErrors.push({
              rowNumber: entry.rowNumber,
              field: 'player1Team',
              message: 'Player 1 does not belong to any team in this tournament',
              value: entry.player1Email,
            });
          }

          // Check if player 2 has team
          if (!player2TeamId) {
            entryErrors.push({
              rowNumber: entry.rowNumber,
              field: 'player2Team',
              message: 'Player 2 does not belong to any team in this tournament',
              value: entry.player2Email,
            });
          }

          // Check if both players are in the same team
          if (player1TeamId && player2TeamId && player1TeamId !== player2TeamId) {
            entryErrors.push({
              rowNumber: entry.rowNumber,
              field: 'team',
              message: 'Both players must be in the same team',
              value: `${entry.player1Email} (team ${player1TeamId}) & ${entry.player2Email} (team ${player2TeamId})`,
            });
          }

          // Check duplicate pairs only if validation passes
          if (player1TeamId && player2TeamId && player1TeamId === player2TeamId) {
            const sortedIds = [player1UserId, player2UserId].sort((a, b) => a - b);
            const pairKey = `${sortedIds[0]}-${sortedIds[1]}`;

            // Check if pair already exists in database
            if (existingPairs.has(pairKey)) {
              entryErrors.push({
                rowNumber: entry.rowNumber,
                field: 'pair',
                message: 'This pair is already registered for this content',
                value: `${entry.player1Email} & ${entry.player2Email}`,
              });
            }

            // Check if pair already in current import
            if (processedPairs.has(pairKey)) {
              entryErrors.push({
                rowNumber: entry.rowNumber,
                field: 'pair',
                message: 'Duplicate pair in this import',
                value: `${entry.player1Email} & ${entry.player2Email}`,
              });
            } else {
              processedPairs.add(pairKey);
              // Add both users to processed set
              processedUserIds.add(player1UserId);
              processedUserIds.add(player2UserId);
            }
          }
        }
      }

      if (entryErrors.length > 0) {
        errors.push(...entryErrors);
      } else if (player1UserId !== null && player2UserId !== null) {
        validatedEntries.push({
          player1Name: entry.player1Name,
          player1UserId,
          player1Email: entry.player1Email,
          player1TeamId,
          player2Name: entry.player2Name,
          player2UserId,
          player2Email: entry.player2Email,
          player2TeamId,
          rowNumber: entry.rowNumber,
        });
      }
    }

    return { validatedEntries, errors };
  }
}

export default new EntryImportService();
