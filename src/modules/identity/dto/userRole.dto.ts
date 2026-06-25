// UserRole DTOs
export interface CreateUserRoleDto {
  userId: number;
  roleId: number;
}

export interface UpdateUserRoleDto {
  roleId?: number;
}

export interface UserRoleResponseDto {
  userId: number;
  roleId: number;
  createdAt: Date;
  updatedAt: Date;
}
