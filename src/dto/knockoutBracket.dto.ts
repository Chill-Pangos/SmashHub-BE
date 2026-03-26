// Knockout Bracket DTOs

// Create/Update DTOs
export interface CreateKnockoutBracketDto {
  categoryId: number;
  roundNumber: number;
  bracketPosition: number;
  entryAId?: number;
  entryBId?: number;
  nextBracketId?: number;
  previousBracketAId?: number;
  previousBracketBId?: number;
  roundName?: string;
  isByeMatch?: boolean;
}

export interface UpdateKnockoutBracketDto {
  scheduleId?: number;
  matchId?: number;
  entryAId?: number;
  entryBId?: number;
  winnerEntryId?: number;
  nextBracketId?: number;
  previousBracketAId?: number;
  previousBracketBId?: number;
  status?: "pending" | "ready" | "in_progress" | "completed";
  roundName?: string;
  isByeMatch?: boolean;
}

// Response DTOs
export interface KnockoutBracketDto {
  id: number;
  categoryId: number;
  roundNumber: number;
  bracketPosition: number;
  scheduleId?: number;
  matchId?: number;
  entryAId?: number;
  entryBId?: number;
  winnerEntryId?: number;
  nextBracketId?: number;
  previousBracketAId?: number;
  previousBracketBId?: number;
  status: "pending" | "ready" | "in_progress" | "completed";
  roundName?: string;
  isByeMatch: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// Generate bracket DTOs
export interface GenerateKnockoutBracketDto {
  categoryId: number;
  entries: number[]; // Array of entry IDs in seeded order
}

export interface BracketTreeDto {
  categoryId: number;
  totalRounds: number;
  totalBrackets: number;
  rounds: RoundDto[];
}

export interface RoundDto {
  roundNumber: number;
  roundName: string;
  brackets: KnockoutBracketDto[];
}

// Query DTOs
export interface GetBracketsByCategoryDto {
  categoryId: number;
  roundNumber?: number;
}

export interface AdvanceWinnerDto {
  bracketId: number;
  winnerEntryId: number;
}
