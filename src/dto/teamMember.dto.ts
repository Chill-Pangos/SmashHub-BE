// TeamMember DTOs
export interface CreateTeamMemberDto {
  teamId: number;
  userId: number;
  role?: "member" | "captain";
}

export interface UpdateTeamMemberDto {
  role?: "member" | "captain";
}

export interface TeamMemberResponseDto {
  id: number;
  teamId: number;
  userId: number;
  role: "member" | "captain";
  createdAt: Date;
  updatedAt: Date;
}
