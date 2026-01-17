// Team DTOs
export interface CreateTeamDto {
  tournamentId: number;
  name: string;
  description?: string | undefined;
}

export interface CreateTeamWithMembersDto {
  tournamentId: number;
  name: string;
  description?: string;
  members?: CreateTeamMemberInTeamDto[];
}

export interface CreateTeamMemberInTeamDto {
  userId: number;
  role?: string;
}

export interface UpdateTeamDto {
  name?: string;
  description?: string;
}

export interface TeamResponseDto {
  id: number;
  tournamentId: number;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}
