// Role DTOs
export interface CreateRoleDto {
  name: string;
}

export interface UpdateRoleDto {
  name?: string;
}

export interface RoleResponseDto {
  id: number;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}
