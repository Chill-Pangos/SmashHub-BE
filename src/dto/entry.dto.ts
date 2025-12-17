// Entries DTOs
export interface CreateEntryDto {
  contentId: number;
  name: string;
}

export interface UpdateEntryDto {
  name?: string;
}

export interface EntryResponseDto {
  id: number;
  contentId: number;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}
