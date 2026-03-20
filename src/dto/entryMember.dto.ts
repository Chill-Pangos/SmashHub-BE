// EntryMember DTOs
export interface CreateEntryMemberDto {
  entryId: number;
  userId: number;
  eloAtEntry: number;
}

export interface UpdateEntryMemberDto {
  eloAtEntry?: number;
}

export interface EntryMemberResponseDto {
  id: number;
  entryId: number;
  userId: number;
  eloAtEntry: number;
  createdAt: Date;
  updatedAt: Date;
}
