// Profile DTOs
export interface CreateProfileDto {
  userId: number;
  avatarUrl?: string;
  dob?: Date;
  phoneNumber?: string;
}

export interface UpdateProfileDto {
  avatarUrl?: string;
  dob?: Date;
  phoneNumber?: string;
}

export interface ProfileResponseDto {
  id: number;
  userId: number;
  avatarUrl?: string;
  dob?: Date;
  phoneNumber?: string;
  createdAt: Date;
  updatedAt: Date;
}
