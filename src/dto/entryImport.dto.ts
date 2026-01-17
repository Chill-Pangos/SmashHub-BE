// Entry Import DTOs

/**
 * DTO for parsed single entry data from Excel
 */
export interface ParsedSingleEntryDto {
  stt: number;
  name: string;
  email: string;
  rowNumber: number;
}

/**
 * DTO for parsed double entry data from Excel
 */
export interface ParsedDoubleEntryDto {
  stt: number;
  player1Name: string;
  player1Email: string;
  player2Name: string;
  player2Email: string;
  rowNumber: number;
}

/**
 * DTO for parsed team entry data from Excel (3-5 players)
 */
export interface ParsedTeamEntryDto {
  stt: number;
  player1Name?: string;
  player1Email?: string;
  player2Name?: string;
  player2Email?: string;
  player3Name?: string;
  player3Email?: string;
  player4Name?: string;
  player4Email?: string;
  player5Name?: string;
  player5Email?: string;
  rowNumber: number;
}

/**
 * Validated single entry with resolved userId
 */
export interface ValidatedSingleEntryDto {
  name: string;
  userId: number;
  email: string;
  teamId: number | null;
  rowNumber: number;
}

/**
 * Validated double entry with resolved userIds
 */
export interface ValidatedDoubleEntryDto {
  player1Name: string;
  player1UserId: number;
  player1Email: string;
  player1TeamId: number | null;
  player2Name: string;
  player2UserId: number;
  player2Email: string;
  player2TeamId: number | null;
  rowNumber: number;
}

/**
 * Validated team entry with resolved userIds (3-5 players)
 */
export interface ValidatedTeamEntryDto {
  players: Array<{
    name: string;
    userId: number;
    email: string;
  }>;
  teamId: number;
  rowNumber: number;
}

/**
 * Validation error for a specific row
 */
export interface EntryImportValidationError {
  rowNumber: number;
  field: string;
  message: string;
  value?: any;
}

/**
 * Response for import preview
 */
export interface EntryImportPreviewDto {
  valid: boolean;
  entries: ValidatedSingleEntryDto[] | ValidatedDoubleEntryDto[] | ValidatedTeamEntryDto[];
  errors: EntryImportValidationError[];
  summary: {
    totalEntries: number;
    entriesWithErrors: number;
    contentType: string;
    maxEntries: number;
    currentEntries: number;
    availableSlots: number;
  };
}

/**
 * Request to confirm and save import
 */
export interface ConfirmEntryImportDto {
  contentId: number;
  entries: ValidatedSingleEntryDto[] | ValidatedDoubleEntryDto[] | ValidatedTeamEntryDto[];
}

/**
 * Response after saving import
 */
export interface EntryImportResultDto {
  success: boolean;
  createdEntries: number;
  entryIds: number[];
  errors?: string[];
}
