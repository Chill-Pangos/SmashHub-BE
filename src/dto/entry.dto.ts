// Entries DTOs
export interface CreateEntryDto {
  contentId: number;
  teamId: number;
}

export interface RegisterEntryDto {
  contentId: number;
  teamId: number;
  memberIds: number[]; // Array of userId to register for this entry
}

export interface UpdateEntryDto {
  memberIds?: number[];
}

export interface EntryResponseDto {
  id: number;
  contentId: number;
  teamId: number;
  createdAt: Date;
  updatedAt: Date;
}
