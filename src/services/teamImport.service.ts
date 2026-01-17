import * as XLSX from 'xlsx';
import User from '../models/user.model';
import {
  ParsedTeamDto,
  ParsedTeamMemberDto,
  ValidatedTeamMemberDto,
  ValidatedTeamImportDto,
  ImportValidationError,
  TeamImportPreviewDto,
} from '../dto/teamImport.dto';

export class TeamImportService {
  /**
   * Map Vietnamese role names to English
   */
  private mapRoleToEnglish(vietnameseRole: string): string {
    const roleMap: { [key: string]: string } = {
      'trưởng đoàn': 'team_manager',
      'truong doan': 'team_manager',
      'huấn luyện viên': 'coach',
      'huan luyen vien': 'coach',
      'vận động viên': 'athlete',
      'van dong vien': 'athlete',
    };

    const normalized = vietnameseRole.toLowerCase().trim();
    return roleMap[normalized] || vietnameseRole;
  }

  /**
   * Validate Excel file structure and format
   */
  private validateExcelStructure(workbook: XLSX.WorkBook): void {
    // Check if workbook has sheets
    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      throw new Error('Excel file has no sheets');
    }

    // Find teams sheet
    const teamsSheetName = workbook.SheetNames.find(name => 
      name.toLowerCase().includes('đội') || name.toLowerCase() === 'teams'
    );
    if (!teamsSheetName) {
      throw new Error('Missing required sheet: "Danh sách đội" or "Teams"');
    }

    // Find members sheet
    const membersSheetName = workbook.SheetNames.find(name => 
      name.toLowerCase().includes('thành viên') || 
      name.toLowerCase().includes('thanh vien') ||
      name.toLowerCase() === 'members'
    );
    if (!membersSheetName) {
      throw new Error('Missing required sheet: "Danh sách thành viên" or "Members"');
    }

    // Validate teams sheet structure
    const teamsSheet = workbook.Sheets[teamsSheetName];
    if (!teamsSheet) {
      throw new Error('Teams sheet has no data');
    }

    const teamsData: any[] = XLSX.utils.sheet_to_json(teamsSheet, { header: 1, defval: '' });
    if (teamsData.length === 0) {
      throw new Error('Teams sheet is empty');
    }

    // Check teams sheet header (row 0)
    const teamsHeader = teamsData[0];
    if (!teamsHeader || teamsHeader.length < 2) {
      throw new Error('Invalid Teams sheet format. Expected columns: STT, Tên đội, Ghi chú');
    }

    // Validate members sheet structure
    const membersSheet = workbook.Sheets[membersSheetName];
    if (!membersSheet) {
      throw new Error('Members sheet has no data');
    }

    const membersData: any[] = XLSX.utils.sheet_to_json(membersSheet, { header: 1, defval: '' });
    if (membersData.length === 0) {
      throw new Error('Members sheet is empty');
    }

    // Check members sheet header (row 0)
    const membersHeader = membersData[0];
    if (!membersHeader || membersHeader.length < 5) {
      throw new Error('Invalid Members sheet format. Expected columns: STT, Tên đội, Tên thành viên, Vai trò, Email');
    }
  }

  /**
   * Parse Excel file and validate data
   */
  async parseAndValidateExcel(
    fileBuffer: Buffer,
    importerUserId: number
  ): Promise<TeamImportPreviewDto> {
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });

    // Validate Excel file structure
    this.validateExcelStructure(workbook);

    // Parse both sheets
    const parsedTeams = this.parseTeamsSheet(workbook);
    const parsedMembers = this.parseMembersSheet(workbook);

    // Validate and resolve user IDs
    const { validatedMembers, memberErrors } = await this.validateMembers(parsedMembers);

    // Group members by team and validate teams
    const { validatedTeams, teamErrors } = this.groupAndValidateTeams(
      parsedTeams,
      validatedMembers,
      importerUserId
    );

    // Calculate summary
    const summary = {
      totalTeams: parsedTeams.length,
      totalMembers: parsedMembers.length,
      teamsWithErrors: teamErrors.filter(e => e.field === 'team').length,
      membersWithErrors: memberErrors.length,
    };

    const allErrors = [...teamErrors, ...memberErrors];

    return {
      valid: allErrors.length === 0,
      teams: validatedTeams,
      errors: allErrors,
      summary,
    };
  }

  /**
   * Parse "Danh sách đội" sheet
   */
  private parseTeamsSheet(workbook: XLSX.WorkBook): ParsedTeamDto[] {
    const sheetName = workbook.SheetNames.find(name => 
      name.toLowerCase().includes('đội') || name.toLowerCase() === 'teams'
    );

    if (!sheetName) {
      throw new Error('Sheet "Teams" not found');
    }

    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) {
      throw new Error('Sheet "Teams" has no data');
    }

    const data: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

    // Skip header row (row 0)
    const teams: ParsedTeamDto[] = [];
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      
      // Skip empty rows
      if (!row[1] || row[1].toString().trim() === '') continue;

      teams.push({
        stt: row[0] || i,
        name: row[1]?.toString().trim(),
        description: row[2]?.toString().trim() || undefined,
        rowNumber: i + 1, // Excel row number (1-indexed)
      });
    }

    return teams;
  }

  /**
   * Parse "Danh sách thành viên" sheet
   */
  private parseMembersSheet(workbook: XLSX.WorkBook): ParsedTeamMemberDto[] {
    const sheetName = workbook.SheetNames.find(name => 
      name.toLowerCase().includes('thành viên') || 
      name.toLowerCase().includes('thanh vien') ||
      name.toLowerCase() === 'members'
    );

    if (!sheetName) {
      throw new Error('Sheet "Members" not found');
    }

    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) {
      throw new Error('Sheet "Members" has no data');
    }

    const data: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

    const members: ParsedTeamMemberDto[] = [];

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      
      // Skip empty rows
      if (!row[1] || row[1].toString().trim() === '') continue;

      members.push({
        stt: row[0] || i,
        teamName: row[1]?.toString().trim(),
        memberName: row[2]?.toString().trim(),
        role: this.mapRoleToEnglish(row[3]?.toString().trim() || ''),
        email: row[4]?.toString().trim().toLowerCase(),
        rowNumber: i + 1,
      });
    }

    return members;
  }

  /**
   * Validate members and resolve user IDs from emails
   */
  private async validateMembers(
    parsedMembers: ParsedTeamMemberDto[]
  ): Promise<{
    validatedMembers: ValidatedTeamMemberDto[];
    memberErrors: ImportValidationError[];
  }> {
    const validatedMembers: ValidatedTeamMemberDto[] = [];
    const memberErrors: ImportValidationError[] = [];

    const validRoles = ['team_manager', 'coach', 'athlete'];

    for (const member of parsedMembers) {
      const errors: ImportValidationError[] = [];

      // Validate team name
      if (!member.teamName) {
        errors.push({
          rowNumber: member.rowNumber,
          field: 'teamName',
          message: 'Team name is required',
          value: member.teamName,
        });
      }

      // Validate member name
      if (!member.memberName) {
        errors.push({
          rowNumber: member.rowNumber,
          field: 'memberName',
          message: 'Member name is required',
          value: member.memberName,
        });
      }

      // Validate role
      if (!validRoles.includes(member.role)) {
        errors.push({
          rowNumber: member.rowNumber,
          field: 'role',
          message: `Invalid role. Only accept: 'team_manager', 'coach', 'athlete'`,
          value: member.role,
        });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!member.email || !emailRegex.test(member.email)) {
        errors.push({
          rowNumber: member.rowNumber,
          field: 'email',
          message: 'Invalid email format',
          value: member.email,
        });
      }

      // Try to resolve user ID from email
      let userId: number | null = null;
      if (member.email && emailRegex.test(member.email)) {
        const user = await User.findOne({ where: { email: member.email } });
        if (!user) {
          errors.push({
            rowNumber: member.rowNumber,
            field: 'email',
            message: 'User not found with this email',
            value: member.email,
          });
        } else {
          userId = user.id;
        }
      }

      if (errors.length > 0) {
        memberErrors.push(...errors);
      } else if (userId !== null) {
        validatedMembers.push({
          teamName: member.teamName,
          memberName: member.memberName,
          userId,
          role: member.role,
          email: member.email,
          rowNumber: member.rowNumber,
        });
      }
    }

    return { validatedMembers, memberErrors };
  }

  /**
   * Group members by team and validate team structure
   */
  private groupAndValidateTeams(
    parsedTeams: ParsedTeamDto[],
    validatedMembers: ValidatedTeamMemberDto[],
    importerUserId: number
  ): {
    validatedTeams: ValidatedTeamImportDto[];
    teamErrors: ImportValidationError[];
  } {
    const validatedTeams: ValidatedTeamImportDto[] = [];
    const teamErrors: ImportValidationError[] = [];

    // Create a map of normalized team name -> members (case-insensitive)
    const membersByTeam = new Map<string, ValidatedTeamMemberDto[]>();
    validatedMembers.forEach(member => {
      const normalizedName = member.teamName.toLowerCase().trim();
      const members = membersByTeam.get(normalizedName) || [];
      members.push(member);
      membersByTeam.set(normalizedName, members);
    });

    for (const team of parsedTeams) {
      const errors: ImportValidationError[] = [];

      // Validate team name
      if (!team.name || team.name.trim() === '') {
        errors.push({
          rowNumber: team.rowNumber,
          field: 'team',
          message: 'Team name is required',
          value: team.name,
        });
        continue;
      }

      // Get members for this team (case-insensitive lookup)
      const normalizedTeamName = team.name.toLowerCase().trim();
      const teamMembers = membersByTeam.get(normalizedTeamName) || [];

      // Validate team has at least one member
      if (teamMembers.length === 0) {
        errors.push({
          rowNumber: team.rowNumber,
          field: 'team',
          message: 'Team must have at least 1 member',
          value: team.name,
        });
      }

      // Validate team has at least one team_manager
      const hasManager = teamMembers.some(m => m.role === 'team_manager');
      if (!hasManager && teamMembers.length > 0) {
        errors.push({
          rowNumber: team.rowNumber,
          field: 'team',
          message: 'Team must have at least 1 team_manager',
          value: team.name,
        });
      }

      // Validate that importer is a team_manager in this team
      const isImporterManager = teamMembers.some(
        m => m.role === 'team_manager' && m.userId === importerUserId
      );
      if (!isImporterManager && teamMembers.length > 0) {
        errors.push({
          rowNumber: team.rowNumber,
          field: 'team',
          message: 'File importer must be a team_manager of this team',
          value: team.name,
        });
      }

      if (errors.length > 0) {
        teamErrors.push(...errors);
      } else {
        validatedTeams.push({
          name: team.name,
          description: team.description,
          members: teamMembers,
          rowNumber: team.rowNumber,
        });
      }
    }

    return { validatedTeams, teamErrors };
  }
}

export default new TeamImportService();
