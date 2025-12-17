export interface CreateUserDto {
  username: string;
  email: string;
  password: string;
}

export interface UpdateUserDto {
  username?: string;
  email?: string;
  password?: string;
}

export interface UserResponseDto {
  id: number;
  username: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserWithProfileDto extends UserResponseDto {
  profile?: {
    id: number;
    avatarUrl?: string;
    dob?: Date;
    phoneNumber?: string;
  };
}

export interface UserWithRolesDto extends UserResponseDto {
  roles?: {
    id: number;
    name: string;
  }[];
}

export interface CreateProfileDto {
  avatarUrl?: string;
  dob?: Date;
  phoneNumber?: string;
}

export interface UpdateProfileDto {
  avatarUrl?: string;
  dob?: Date;
  phoneNumber?: string;
}
