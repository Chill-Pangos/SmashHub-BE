// OTP DTOs
export interface CreateOtpDto {
  userId: number;
  code: string;
  type: "password_reset" | "email_verification";
  expiresAt: Date;
}

export interface UpdateOtpDto {
  isUsed?: boolean;
  usedAt?: Date;
}

export interface OtpResponseDto {
  id: number;
  userId: number;
  code: string;
  type: "password_reset" | "email_verification";
  expiresAt: Date;
  isUsed: boolean;
  usedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
