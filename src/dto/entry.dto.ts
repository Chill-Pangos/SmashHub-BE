// Entries DTOs
export interface CreateEntryDto {
  categoryId: number;
}

export interface UpdateEntryDto {
  memberIds?: number[];
}

export interface EntryResponseDto {
  id: number;
  categoryId: number;
  createdAt: Date;
  updatedAt: Date;
}
