// Role DTOs
export interface CreateRoleDto {
  name: string;
  description?: string;
}

export interface UpdateRoleDto {
  name?: string;
  description?: string;
}

export interface RoleResponseDto {
  id: number;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}
