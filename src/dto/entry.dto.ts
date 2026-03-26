// Entries DTOs
export interface CreateEntryDto {
  categoryId: number;
  teamId: number;
}

export interface RegisterEntryDto {
  categoryId: number;
  teamId: number;
  memberIds: number[]; // Array of userId to register for this entry
}

export interface UpdateEntryDto {
  memberIds?: number[];
}

export interface EntryResponseDto {
  id: number;
  categoryId: number;
  teamId: number;
  createdAt: Date;
  updatedAt: Date;
}
