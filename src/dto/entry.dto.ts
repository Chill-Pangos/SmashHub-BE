// Entries DTOs
export interface CreateEntryDto {
  categoryId: number;
  name: string;
  captainId?: number;
  isAcceptingMembers?: boolean;
  requiredMemberCount?: number;
}

export interface UpdateEntryDto {
  name?: string;
  captainId?: number;
  isAcceptingMembers?: boolean;
  requiredMemberCount?: number;
}

export interface EntryResponseDto {
  id: number;
  categoryId: number;
  captainId?: number;
  name: string;
  isAcceptingMembers: boolean;
  requiredMemberCount?: number;
  currentMemberCount: number;
  createdAt: Date;
  updatedAt: Date;
}
