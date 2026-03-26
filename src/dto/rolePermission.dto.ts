// RolePermission DTOs
export interface CreateRolePermissionDto {
  roleId: number;
  permissionId: number;
}

export interface UpdateRolePermissionDto {
  permissionId?: number;
}

export interface RolePermissionResponseDto {
  id: number;
  roleId: number;
  permissionId: number;
  createdAt: Date;
  updatedAt: Date;
}
