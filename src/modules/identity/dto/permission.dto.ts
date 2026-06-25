// Permission DTOs
export interface CreatePermissionDto {
  name: string;
}

export interface UpdatePermissionDto {
  name?: string;
}

export interface PermissionResponseDto {
  id: number;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}
