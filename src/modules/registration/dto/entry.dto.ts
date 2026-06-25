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

export interface ConfirmEntryDto {
  isConfirmed: boolean;
}

export interface EntryResponseDto {
  id: number;
  categoryId: number;
  captainId?: number;
  name: string;
  isAcceptingMembers: boolean;
  requiredMemberCount?: number;
  currentMemberCount: number;
  isConfirmed: boolean;
  confirmedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserEntryWithRoleDto {
  id: number;
  name: string;
  categoryId: number;
  role: "captain" | "member";
  currentMemberCount: number;
  requiredMemberCount?: number;
  isConfirmed: boolean;
  confirmedAt?: Date;
  category?: {
    id: number;
    name: string;
    tournamentId: number;
  };
  tournament?: {
    id: number;
    name: string;
  };
  createdAt: Date;
  updatedAt: Date;
}
