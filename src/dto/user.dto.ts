export interface CreateUserDto {
  username: string;
  email: string;
  password: string;
  avatarUrl?: string;
  dob?: Date;
  phoneNumber?: string;
  gender?: "male" | "female" | "other";
}

export interface UpdateUserDto {
  username?: string;
  email?: string;
  password?: string;
  avatarUrl?: string;
  dob?: Date;
  phoneNumber?: string;
  gender?: "male" | "female" | "other";
  isEmailVerified?: boolean;
}

export interface UserResponseDto {
  id: number;
  username: string;
  email: string;
  avatarUrl?: string;
  dob?: Date;
  phoneNumber?: string;
  gender?: "male" | "female" | "other";
  isEmailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserWithProfileDto extends UserResponseDto {
  roles?: {
    id: number;
    name: string;
  }[];
}

// Deprecated - profile fields are now part of User
export interface CreateProfileDto {
  avatarUrl?: string;
  dob?: Date;
  phoneNumber?: string;
}

// Deprecated - profile fields are now part of User
export interface UpdateProfileDto {
  avatarUrl?: string;
  dob?: Date;
  phoneNumber?: string;
}
