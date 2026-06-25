// Team Import DTOs

/**
 * DTO for parsed team data from Excel
 */
export interface ParsedTeamDto {
  stt: number;
  name: string;
  description?: string;
  rowNumber: number; // Excel row number for error tracking
}

/**
 * DTO for parsed team member data from Excel
 */
export interface ParsedTeamMemberDto {
  stt: number;
  teamName: string;
  memberName: string;
  role: string;
  email: string;
  rowNumber: number; // Excel row number for error tracking
}

/**
 * Validated team member with resolved userId
 */
export interface ValidatedTeamMemberDto {
  teamName: string;
  memberName: string;
  userId: number;
  role: string;
  email: string;
  rowNumber: number;
}

/**
 * Validation error for a specific row
 */
export interface ImportValidationError {
  rowNumber: number;
  field: string;
  message: string;
  value?: any;
}

/**
 * Complete team data ready for import
 */
export interface ValidatedTeamImportDto {
  name: string;
  description?: string | undefined;
  members: ValidatedTeamMemberDto[];
  rowNumber: number;
}

/**
 * Response for import preview
 */
export interface TeamImportPreviewDto {
  valid: boolean;
  teams: ValidatedTeamImportDto[];
  errors: ImportValidationError[];
  summary: {
    totalTeams: number;
    totalMembers: number;
    teamsWithErrors: number;
    membersWithErrors: number;
  };
}

/**
 * Request to confirm and save import
 */
export interface ConfirmTeamImportDto {
  tournamentId: number;
  teams: ValidatedTeamImportDto[];
}

/**
 * Response after saving import
 */
export interface TeamImportResultDto {
  success: boolean;
  createdTeams: number;
  createdMembers: number;
  teamIds: number[];
  errors?: string[];
}
