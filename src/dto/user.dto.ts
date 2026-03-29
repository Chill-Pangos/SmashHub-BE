export interface CreateUserDto {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  avatarUrl?: string;
  dob?: Date;
  phoneNumber?: string;
  gender?: "male" | "female";
}

export interface UpdateUserDto {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  avatarUrl?: string;
  dob?: Date;
  phoneNumber?: string;
  gender?: "male" | "female";
  isEmailVerified?: boolean;
}

export interface UserResponseDto {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl?: string;
  dob?: Date;
  phoneNumber?: string;
  gender?: "male" | "female";
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
