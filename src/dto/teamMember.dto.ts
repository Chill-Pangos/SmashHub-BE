// TeamMember DTOs
export interface CreateTeamMemberDto {
  teamId: number;
  userId: number;
  role?: string;
}

export interface UpdateTeamMemberDto {
  role?: string;
}

export interface TeamMemberResponseDto {
  id: number;
  teamId: number;
  userId: number;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}
