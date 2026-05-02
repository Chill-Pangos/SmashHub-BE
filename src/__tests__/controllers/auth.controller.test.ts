// Set environment variables before importing anything
process.env.NODE_ENV = 'test';
process.env.PORT = '3000';
process.env.HOST = 'localhost';
process.env.JWT_SECRET = 'test_secret_very_long_string_for_jwt_secret_minimum_32_chars';
process.env.JWT_EXPIRES_IN = '1h';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_very_long_string_for_jwt_refresh_secret_minimum_32_chars';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '3306';
process.env.DB_USERNAME = 'root';
process.env.DB_PASSWORD = 'password';
process.env.DB_DATABASE = 'test_db';
process.env.DB_SSL_CA_PATH = '/path/to/ca.pem';
process.env.SMTP_HOST = 'smtp.test.com';
process.env.SMTP_PORT = '587';
process.env.SMTP_USER = 'test@test.com';
process.env.SMTP_PASSWORD = 'password';
process.env.SMTP_FROM_EMAIL = 'noreply@test.com';
process.env.SMTP_FROM_NAME = 'Test';

jest.mock('../../models/user.model');
jest.mock('../../models/token.model');
jest.mock('../../models/otp.model');
jest.mock('../../models/role.model');
jest.mock('../../models/userRole.model');
jest.mock('../../services/email.service');
jest.mock('../../services/auth.service');

import { AuthController } from '../../controllers/auth.controller';
import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';
import authService from '../../services/auth.service';

describe('AuthController', () => {
  let authController: AuthController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    authController = new AuthController();
    mockNext = jest.fn();
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  // ─────────────────────────────────────────────
  // REGISTER
  // ─────────────────────────────────────────────
  describe('Register', () => {
    const registerDto = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      password: 'Password123!',
    };

    const mockResult = {
      user: { id: 1, ...registerDto, isEmailVerified: false, roles: [8] },
      accessToken: 'access_token',
      refreshToken: 'refresh_token',
    };

    it('should register user successfully and return 201', async () => {
      mockRequest = { body: registerDto };
      (authService.register as jest.Mock).mockResolvedValue(mockResult);

      await authController.register(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'User registered successfully',
        data: mockResult,
      });
    });

    it('should call next with error when email already exists', async () => {
      const error = new Error('Email already exists');
      mockRequest = { body: { email: 'existing@example.com', password: 'Password123!' } };
      (authService.register as jest.Mock).mockRejectedValue(error);

      await authController.register(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should call next with error when password is weak', async () => {
      const error = new Error('Password too weak');
      mockRequest = { body: { ...registerDto, password: 'weak' } };
      (authService.register as jest.Mock).mockRejectedValue(error);

      await authController.register(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should call next with error when email format is invalid', async () => {
      const error = new Error('Invalid email');
      mockRequest = { body: { ...registerDto, email: 'not-an-email' } };
      (authService.register as jest.Mock).mockRejectedValue(error);

      await authController.register(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should not call status/json when an error occurs', async () => {
      mockRequest = { body: registerDto };
      (authService.register as jest.Mock).mockRejectedValue(new Error('fail'));

      await authController.register(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });
  });

  // ─────────────────────────────────────────────
  // LOGIN
  // ─────────────────────────────────────────────
  describe('Login', () => {
    const loginDto = { email: 'john@example.com', password: 'Password123!' };
    const mockResult = {
      user: { id: 1, ...loginDto, isEmailVerified: true, roles: [8] },
      accessToken: 'access_token',
      refreshToken: 'refresh_token',
    };

    it('should login successfully and return 200', async () => {
      mockRequest = { body: loginDto };
      (authService.login as jest.Mock).mockResolvedValue(mockResult);

      await authController.login(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Login successful',
        data: mockResult,
      });
    });

    it('should call next with error on invalid credentials', async () => {
      const error = new Error('Invalid credentials');
      mockRequest = { body: { email: 'john@example.com', password: 'WrongPassword123!' } };
      (authService.login as jest.Mock).mockRejectedValue(error);

      await authController.login(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should call next with error if email not verified', async () => {
      const error = new Error('Email not verified');
      mockRequest = { body: loginDto };
      (authService.login as jest.Mock).mockRejectedValue(error);

      await authController.login(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should call next with error if user not found', async () => {
      const error = new Error('User not found');
      mockRequest = { body: { email: 'ghost@example.com', password: 'Password123!' } };
      (authService.login as jest.Mock).mockRejectedValue(error);

      await authController.login(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  // ─────────────────────────────────────────────
  // REFRESH TOKEN
  // ─────────────────────────────────────────────
  describe('Refresh Token', () => {
    const mockResult = { accessToken: 'new_access_token', refreshToken: 'new_refresh_token' };

    it('should refresh token successfully and return 200', async () => {
      mockRequest = { body: { refreshToken: 'old_refresh_token' } };
      (authService.refreshToken as jest.Mock).mockResolvedValue(mockResult);

      await authController.refreshToken(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Token refreshed successfully',
        data: mockResult,
      });
    });

    it('should call next with error on invalid token', async () => {
      const error = new Error('Invalid token');
      mockRequest = { body: { refreshToken: 'invalid_token' } };
      (authService.refreshToken as jest.Mock).mockRejectedValue(error);

      await authController.refreshToken(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should call next with error on expired token', async () => {
      const error = new Error('Token expired');
      mockRequest = { body: { refreshToken: 'expired_token' } };
      (authService.refreshToken as jest.Mock).mockRejectedValue(error);

      await authController.refreshToken(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should call next with error on revoked token', async () => {
      const error = new Error('Token revoked');
      mockRequest = { body: { refreshToken: 'revoked_token' } };
      (authService.refreshToken as jest.Mock).mockRejectedValue(error);

      await authController.refreshToken(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  // ─────────────────────────────────────────────
  // CHANGE PASSWORD
  // ─────────────────────────────────────────────
  describe('Change Password', () => {
    it('should change password successfully and return 200', async () => {
      const mockAuthRequest = {
        body: { oldPassword: 'OldPassword123!', newPassword: 'NewPassword123!' },
        userId: 1,
      } as unknown as AuthRequest;

      (authService.changePassword as jest.Mock).mockResolvedValue(undefined);

      await authController.changePassword(mockAuthRequest as any, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Password changed successfully',
      });
    });

    it('should return 401 if userId is missing', async () => {
      const mockAuthRequest = {
        body: {},
        userId: undefined,
      } as unknown as AuthRequest;

      await authController.changePassword(mockAuthRequest as any, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ success: false, message: 'Unauthorized' });
    });

    it('should call next with error on wrong old password', async () => {
      const error = new Error('Invalid old password');
      const mockAuthRequest = {
        body: { oldPassword: 'Wrong', newPassword: 'NewPassword123!' },
        userId: 1,
      } as unknown as AuthRequest;

      (authService.changePassword as jest.Mock).mockRejectedValue(error);

      await authController.changePassword(mockAuthRequest as any, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should call next with error when new password is same as old', async () => {
      const error = new Error('New password must differ from old password');
      const mockAuthRequest = {
        body: { oldPassword: 'OldPassword123!', newPassword: 'OldPassword123!' },
        userId: 1,
      } as unknown as AuthRequest;

      (authService.changePassword as jest.Mock).mockRejectedValue(error);

      await authController.changePassword(mockAuthRequest as any, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should call next with error when new password is weak', async () => {
      const error = new Error('Password too weak');
      const mockAuthRequest = {
        body: { oldPassword: 'OldPassword123!', newPassword: 'weak' },
        userId: 1,
      } as unknown as AuthRequest;

      (authService.changePassword as jest.Mock).mockRejectedValue(error);

      await authController.changePassword(mockAuthRequest as any, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  // ─────────────────────────────────────────────
  // LOGOUT
  // ─────────────────────────────────────────────
  describe('Logout', () => {
    it('should logout successfully and return 200', async () => {
      const mockAuthRequest = { userId: 1 } as unknown as AuthRequest;
      (authService.logout as jest.Mock).mockResolvedValue(undefined);

      await authController.logout(mockAuthRequest as any, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Logout successful',
      });
    });

    it('should return 401 if userId is missing', async () => {
      const mockAuthRequest = { userId: undefined } as unknown as AuthRequest;

      await authController.logout(mockAuthRequest as any, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ success: false, message: 'Unauthorized' });
    });

    it('should call next with error if logout service throws', async () => {
      const error = new Error('Logout failed');
      const mockAuthRequest = { userId: 1 } as unknown as AuthRequest;
      (authService.logout as jest.Mock).mockRejectedValue(error);

      await authController.logout(mockAuthRequest as any, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  // ─────────────────────────────────────────────
  // FORGOT PASSWORD
  // ─────────────────────────────────────────────
  describe('Forgot Password', () => {
    it('should send OTP successfully and return 200', async () => {
      mockRequest = { body: { email: 'john@example.com' } };
      (authService.forgotPassword as jest.Mock).mockResolvedValue(undefined);

      await authController.forgotPassword(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'OTP has been sent to your email',
      });
    });

    it('should call next with error if user not found', async () => {
      const error = new Error('User not found');
      mockRequest = { body: { email: 'nonexistent@example.com' } };
      (authService.forgotPassword as jest.Mock).mockRejectedValue(error);

      await authController.forgotPassword(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should call next with error if email format is invalid', async () => {
      const error = new Error('Invalid email');
      mockRequest = { body: { email: 'not-valid' } };
      (authService.forgotPassword as jest.Mock).mockRejectedValue(error);

      await authController.forgotPassword(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  // ─────────────────────────────────────────────
  // VERIFY OTP (forgot password)
  // ─────────────────────────────────────────────
  describe('Verify OTP', () => {
    it('should verify OTP successfully and return 200', async () => {
      mockRequest = { body: { email: 'john@example.com', otp: '123456' } };
      (authService.verifyOtp as jest.Mock).mockResolvedValue(undefined);

      await authController.verifyOtp(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'OTP verified successfully',
      });
    });

    it('should call next with error on invalid OTP', async () => {
      const error = new Error('Invalid OTP');
      mockRequest = { body: { email: 'john@example.com', otp: '999999' } };
      (authService.verifyOtp as jest.Mock).mockRejectedValue(error);

      await authController.verifyOtp(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should call next with error on expired OTP', async () => {
      const error = new Error('OTP expired');
      mockRequest = { body: { email: 'john@example.com', otp: '123456' } };
      (authService.verifyOtp as jest.Mock).mockRejectedValue(error);

      await authController.verifyOtp(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  // ─────────────────────────────────────────────
  // RESET PASSWORD
  // ─────────────────────────────────────────────
  describe('Reset Password', () => {
    const resetDto = { email: 'john@example.com', otp: '123456', newPassword: 'NewPassword123!' };

    it('should reset password successfully and return 200', async () => {
      mockRequest = { body: resetDto };
      (authService.resetPassword as jest.Mock).mockResolvedValue(undefined);

      await authController.resetPassword(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Password has been reset successfully',
      });
    });

    it('should call next with error on expired OTP', async () => {
      const error = new Error('OTP expired');
      mockRequest = { body: resetDto };
      (authService.resetPassword as jest.Mock).mockRejectedValue(error);

      await authController.resetPassword(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should call next with error on invalid OTP', async () => {
      const error = new Error('Invalid OTP');
      mockRequest = { body: { ...resetDto, otp: '000000' } };
      (authService.resetPassword as jest.Mock).mockRejectedValue(error);

      await authController.resetPassword(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should call next with error if new password is weak', async () => {
      const error = new Error('Password too weak');
      mockRequest = { body: { ...resetDto, newPassword: 'weak' } };
      (authService.resetPassword as jest.Mock).mockRejectedValue(error);

      await authController.resetPassword(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should call next with error if user not found', async () => {
      const error = new Error('User not found');
      mockRequest = { body: { ...resetDto, email: 'ghost@example.com' } };
      (authService.resetPassword as jest.Mock).mockRejectedValue(error);

      await authController.resetPassword(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  // ─────────────────────────────────────────────
  // SEND EMAIL VERIFICATION OTP
  // ─────────────────────────────────────────────
  describe('Send Email Verification OTP', () => {
    it('should send email verification OTP and return 200', async () => {
      mockRequest = { body: { email: 'john@example.com' } };
      (authService.sendEmailVerificationOtp as jest.Mock).mockResolvedValue(undefined);

      await authController.sendEmailVerificationOtp(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Verification OTP has been sent to your email',
      });
    });

    it('should call next with error if user not found', async () => {
      const error = new Error('User not found');
      mockRequest = { body: { email: 'nonexistent@example.com' } };
      (authService.sendEmailVerificationOtp as jest.Mock).mockRejectedValue(error);

      await authController.sendEmailVerificationOtp(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should call next with error if email already verified', async () => {
      const error = new Error('Email already verified');
      mockRequest = { body: { email: 'john@example.com' } };
      (authService.sendEmailVerificationOtp as jest.Mock).mockRejectedValue(error);

      await authController.sendEmailVerificationOtp(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  // ─────────────────────────────────────────────
  // VERIFY EMAIL OTP
  // ─────────────────────────────────────────────
  describe('Verify Email OTP', () => {
    it('should verify email OTP successfully and return 200', async () => {
      mockRequest = { body: { email: 'john@example.com', otp: '123456' } };
      (authService.verifyEmailOtp as jest.Mock).mockResolvedValue(undefined);

      await authController.verifyEmailOtp(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Email has been verified successfully',
      });
    });

    it('should call next with error on invalid OTP', async () => {
      const error = new Error('Invalid OTP');
      mockRequest = { body: { email: 'john@example.com', otp: '999999' } };
      (authService.verifyEmailOtp as jest.Mock).mockRejectedValue(error);

      await authController.verifyEmailOtp(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should call next with error on expired OTP', async () => {
      const error = new Error('OTP expired');
      mockRequest = { body: { email: 'john@example.com', otp: '123456' } };
      (authService.verifyEmailOtp as jest.Mock).mockRejectedValue(error);

      await authController.verifyEmailOtp(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should call next with error if user not found', async () => {
      const error = new Error('User not found');
      mockRequest = { body: { email: 'ghost@example.com', otp: '123456' } };
      (authService.verifyEmailOtp as jest.Mock).mockRejectedValue(error);

      await authController.verifyEmailOtp(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  // ─────────────────────────────────────────────
  // RESEND EMAIL VERIFICATION OTP
  // ─────────────────────────────────────────────
  describe('Resend Email Verification OTP', () => {
    it('should resend email verification OTP and return 200', async () => {
      mockRequest = { body: { email: 'john@example.com' } };
      (authService.resendEmailVerificationOtp as jest.Mock).mockResolvedValue(undefined);

      await authController.resendEmailVerificationOtp(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'A new OTP code has been sent to your email',
      });
    });

    it('should call next with error if service throws', async () => {
      const error = new Error('Failed to send OTP');
      mockRequest = { body: { email: 'john@example.com' } };
      (authService.resendEmailVerificationOtp as jest.Mock).mockRejectedValue(error);

      await authController.resendEmailVerificationOtp(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should call next with error if email already verified', async () => {
      const error = new Error('Email already verified');
      mockRequest = { body: { email: 'john@example.com' } };
      (authService.resendEmailVerificationOtp as jest.Mock).mockRejectedValue(error);

      await authController.resendEmailVerificationOtp(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should call next with error if user not found', async () => {
      const error = new Error('User not found');
      mockRequest = { body: { email: 'ghost@example.com' } };
      (authService.resendEmailVerificationOtp as jest.Mock).mockRejectedValue(error);

      await authController.resendEmailVerificationOtp(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
});