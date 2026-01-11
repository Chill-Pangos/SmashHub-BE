export interface LoginDto {
  email: string;
  password: string;
}

export interface LogoutDto {
  userId: number;
}

export interface RegisterDto {
  username: string;
  email: string;
  password: string;
  role: string;
}

export interface AuthResponseDto {
  user: {
    id: number;
    username: string;
    email: string;
    roles: number[];
    isEmailVerified: boolean;
  };
  accessToken: string;
  refreshToken: string;
}

export interface RefreshTokenDto {
  refreshToken: string;
}

export interface ChangePasswordDto {
  oldPassword: string;
  newPassword: string;
}

export interface ForgotPasswordDto {
  email: string;
}

export interface VerifyOtpDto {
  email: string;
  otp: string;
}

export interface ResetPasswordDto {
  email: string;
  otp: string;
  newPassword: string;
}

export interface SendEmailVerificationDto {
  email: string;
}

export interface VerifyEmailOtpDto {
  email: string;
  otp: string;
}
