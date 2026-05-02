// Set environment variables FIRST
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

// Hoist jest.mock calls (WITHOUT factory functions - let Jest find __mocks__ automatically)
jest.mock('jsonwebtoken');
jest.mock('bcryptjs');
jest.mock('../../models/user.model');
jest.mock('../../models/token.model');
jest.mock('../../models/otp.model');
jest.mock('../../models/role.model');
jest.mock('../../models/userRole.model');
jest.mock('../../services/email.service');

import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcryptjs';
import User from '../../models/user.model';
import Token from '../../models/token.model';
import Otp from '../../models/otp.model';
import Role from '../../models/role.model';
import UserRole from '../../models/userRole.model';
import emailService from '../../services/email.service';
import { AuthService } from '../../services/auth.service';

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    authService = new AuthService();
  });

  // ─────────────────────────────────────────────
  // REGISTER
  // ─────────────────────────────────────────────
  describe('Register', () => {
    const baseRegisterDto = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      password: 'Password123!',
    };

    const mockUser = {
      id: 1,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      password: 'hashed_password',
      isEmailVerified: false,
    };

    const mockRole = { id: 8, name: 'spectator' };

    function setupRegisterMocks() {
      (User.findOne as jest.Mock).mockResolvedValue(null);
      (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');
      (User.create as jest.Mock).mockResolvedValue(mockUser);
      (Role.findOne as jest.Mock).mockResolvedValue(mockRole);
      (UserRole.create as jest.Mock).mockResolvedValue({ userId: 1, roleId: 8 });
      (jwt.sign as jest.Mock)
        .mockReturnValueOnce('access_token')
        .mockReturnValueOnce('refresh_token');
      (Token.create as jest.Mock).mockResolvedValue({ id: 1 });
    }

    it('should register user successfully', async () => {
      setupRegisterMocks();
      const result = await authService.register(baseRegisterDto);
      expect(result.user.email).toBe(baseRegisterDto.email);
      expect(result.accessToken).toBe('access_token');
      expect(result.refreshToken).toBe('refresh_token');
    });

    it('should hash password before saving', async () => {
      setupRegisterMocks();
      await authService.register(baseRegisterDto);
      expect(bcrypt.genSalt).toHaveBeenCalled();
      expect(bcrypt.hash).toHaveBeenCalledWith(baseRegisterDto.password, 'salt');
    });

    it('should create UserRole with default spectator role', async () => {
      setupRegisterMocks();
      await authService.register(baseRegisterDto);
      expect(UserRole.create).toHaveBeenCalledWith(
        expect.objectContaining({ userId: mockUser.id, roleId: mockRole.id })
      );
    });

    it('should persist refresh token after registration', async () => {
      setupRegisterMocks();
      await authService.register(baseRegisterDto);
      expect(Token.create).toHaveBeenCalled();
    });

    it('should throw error if email already exists', async () => {
      (User.findOne as jest.Mock).mockResolvedValue({ id: 1, email: baseRegisterDto.email });
      await expect(authService.register(baseRegisterDto)).rejects.toThrow();
    });

    it('should throw error if password is weak (too short)', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);
      await expect(authService.register({ ...baseRegisterDto, password: 'weak' })).rejects.toThrow();
    });

    it('should throw error if password has no uppercase letter', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);
      await expect(authService.register({ ...baseRegisterDto, password: 'password123!' })).rejects.toThrow();
    });

    it('should throw error if password has no number', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);
      await expect(authService.register({ ...baseRegisterDto, password: 'Password!' })).rejects.toThrow();
    });

    it('should throw error if password has no special character', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);
      await expect(authService.register({ ...baseRegisterDto, password: 'Password123' })).rejects.toThrow();
    });

    it('should throw error if email is invalid format', async () => {
      await expect(authService.register({ ...baseRegisterDto, email: 'invalid-email' })).rejects.toThrow();
    });

    it('should throw error if email is missing', async () => {
      await expect(authService.register({ ...baseRegisterDto, email: '' })).rejects.toThrow();
    });

    it('should throw error if firstName is missing', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);
      await expect(authService.register({ ...baseRegisterDto, firstName: '' })).rejects.toThrow();
    });

    it('should throw error if lastName is missing', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);
      await expect(authService.register({ ...baseRegisterDto, lastName: '' })).rejects.toThrow();
    });

    it('should throw error if default role is not found', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);
      (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');
      (User.create as jest.Mock).mockResolvedValue(mockUser);
      (Role.findOne as jest.Mock).mockResolvedValue(null);
      await expect(authService.register(baseRegisterDto)).rejects.toThrow();
    });
  });

  // ─────────────────────────────────────────────
  // LOGIN
  // ─────────────────────────────────────────────
  describe('Login', () => {
    const loginDto = { email: 'john@example.com', password: 'Password123!' };

    const mockUser = {
      id: 1,
      firstName: 'John',
      lastName: 'Doe',
      email: loginDto.email,
      password: 'hashed_password',
      isEmailVerified: true,
    };

    function setupLoginMocks() {
      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (Token.update as jest.Mock).mockResolvedValue([1]);
      (jwt.sign as jest.Mock)
        .mockReturnValueOnce('access_token')
        .mockReturnValueOnce('refresh_token');
      (Token.create as jest.Mock).mockResolvedValue({ id: 1 });
      (UserRole.findAll as jest.Mock).mockResolvedValue([{ roleId: 8 }]);
    }

    it('should login successfully', async () => {
      setupLoginMocks();
      const result = await authService.login(loginDto);
      expect(result.user.email).toBe(loginDto.email);
      expect(result.accessToken).toBe('access_token');
      expect(result.refreshToken).toBe('refresh_token');
    });

    it('should invalidate previous tokens on login', async () => {
      setupLoginMocks();
      await authService.login(loginDto);
      expect(Token.update).toHaveBeenCalled();
    });

    it('should persist new refresh token on login', async () => {
      setupLoginMocks();
      await authService.login(loginDto);
      expect(Token.create).toHaveBeenCalled();
    });

    it('should include user roles in login result', async () => {
      setupLoginMocks();
      const result = await authService.login(loginDto);
      expect(result.user).toBeDefined();
    });

    it('should throw error if user not found', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);
      await expect(authService.login(loginDto)).rejects.toThrow();
    });

    it('should throw error if password is incorrect', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      await expect(authService.login({ ...loginDto, password: 'WrongPassword123!' })).rejects.toThrow();
    });

    it('should throw error if email is not verified', async () => {
      (User.findOne as jest.Mock).mockResolvedValue({ ...mockUser, isEmailVerified: false });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      await expect(authService.login(loginDto)).rejects.toThrow();
    });

    it('should throw error if email is missing', async () => {
      await expect(authService.login({ ...loginDto, email: '' })).rejects.toThrow();
    });

    it('should throw error if password is missing', async () => {
      await expect(authService.login({ ...loginDto, password: '' })).rejects.toThrow();
    });
  });

  // ─────────────────────────────────────────────
  // REFRESH TOKEN
  // ─────────────────────────────────────────────
  describe('Refresh Token', () => {
    const mockUser = { id: 1, email: 'john@example.com' };

    function setupRefreshMocks() {
      (jwt.verify as jest.Mock).mockReturnValue({ userId: 1 });
      (Token.findOne as jest.Mock).mockResolvedValue(null);
      (User.findByPk as jest.Mock).mockResolvedValue(mockUser);
      (Token.update as jest.Mock).mockResolvedValue([1]);
      (jwt.sign as jest.Mock)
        .mockReturnValueOnce('new_access_token')
        .mockReturnValueOnce('new_refresh_token');
      (Token.create as jest.Mock).mockResolvedValue({ id: 1 });
    }

    it('should refresh token successfully', async () => {
      setupRefreshMocks();
      const result = await authService.refreshToken({ refreshToken: 'old_refresh_token' });
      expect(result.accessToken).toBe('new_access_token');
      expect(result.refreshToken).toBe('new_refresh_token');
    });

    it('should blacklist old refresh token after refresh', async () => {
      setupRefreshMocks();
      await authService.refreshToken({ refreshToken: 'old_refresh_token' });
      expect(Token.update).toHaveBeenCalled();
    });

    it('should persist new refresh token after refresh', async () => {
      setupRefreshMocks();
      await authService.refreshToken({ refreshToken: 'old_refresh_token' });
      expect(Token.create).toHaveBeenCalled();
    });

    it('should throw error if refresh token is invalid', async () => {
      (jwt.verify as jest.Mock).mockImplementation(() => { throw new Error('Invalid token'); });
      await expect(authService.refreshToken({ refreshToken: 'invalid_token' })).rejects.toThrow();
    });

    it('should throw error if token is blacklisted', async () => {
      (jwt.verify as jest.Mock).mockReturnValue({ userId: 1 });
      (Token.findOne as jest.Mock).mockResolvedValue({ isBlacklisted: true });
      await expect(authService.refreshToken({ refreshToken: 'revoked_token' })).rejects.toThrow();
    });

    it('should throw error if token is expired (jwt.verify throws)', async () => {
      (jwt.verify as jest.Mock).mockImplementation(() => { throw new Error('TokenExpiredError'); });
      await expect(authService.refreshToken({ refreshToken: 'expired_token' })).rejects.toThrow();
    });

    it('should throw error if user no longer exists', async () => {
      (jwt.verify as jest.Mock).mockReturnValue({ userId: 999 });
      (Token.findOne as jest.Mock).mockResolvedValue(null);
      (User.findByPk as jest.Mock).mockResolvedValue(null);
      await expect(authService.refreshToken({ refreshToken: 'orphan_token' })).rejects.toThrow();
    });

    it('should throw error if refreshToken is missing', async () => {
      await expect(authService.refreshToken({ refreshToken: '' })).rejects.toThrow();
    });
  });

  // ─────────────────────────────────────────────
  // CHANGE PASSWORD
  // ─────────────────────────────────────────────
  describe('Change Password', () => {
    const userId = 1;
    const mockUser = {
      id: userId,
      password: 'hashed_old_password',
      update: jest.fn().mockResolvedValue(undefined),
    };

    it('should change password successfully', async () => {
      (User.findByPk as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock)
        .mockResolvedValueOnce(true)   // old password check
        .mockResolvedValueOnce(false); // new password != old password
      (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_new_password');

      await authService.changePassword(userId, { oldPassword: 'OldPassword123!', newPassword: 'NewPassword123!' });

      expect(mockUser.update).toHaveBeenCalledWith({ password: 'hashed_new_password' });
    });

    it('should hash new password before saving', async () => {
      (User.findByPk as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock)
        .mockResolvedValueOnce(true)   // old password check
        .mockResolvedValueOnce(false); // new password != old password
      (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_new_password');

      await authService.changePassword(userId, { oldPassword: 'OldPassword123!', newPassword: 'NewPassword123!' });

      expect(bcrypt.hash).toHaveBeenCalledWith('NewPassword123!', 'salt');
    });

    it('should throw error if old password is incorrect', async () => {
      (User.findByPk as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      await expect(authService.changePassword(userId, { oldPassword: 'WrongPassword123!', newPassword: 'NewPassword123!' })).rejects.toThrow();
    });

    it('should throw error if user not found', async () => {
      (User.findByPk as jest.Mock).mockResolvedValue(null);
      await expect(authService.changePassword(999, { oldPassword: 'OldPassword123!', newPassword: 'NewPassword123!' })).rejects.toThrow();
    });

    it('should throw error if new password is weak', async () => {
      (User.findByPk as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock)
        .mockResolvedValueOnce(true)   // old password check
        .mockResolvedValueOnce(false); // new password != old password (won't reach here due to weak password validation)
      await expect(authService.changePassword(userId, { oldPassword: 'OldPassword123!', newPassword: 'weak' })).rejects.toThrow();
    });

    it('should throw error if new password is same as old password', async () => {
      (User.findByPk as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true); // old password check
      await expect(authService.changePassword(userId, { oldPassword: 'OldPassword123!', newPassword: 'OldPassword123!' })).rejects.toThrow();
    });
  });

  // ─────────────────────────────────────────────
  // LOGOUT
  // ─────────────────────────────────────────────
  describe('Logout', () => {
    it('should logout successfully', async () => {
      (Token.update as jest.Mock).mockResolvedValue([1]);
      await authService.logout({ userId: 1 });
      expect(Token.update).toHaveBeenCalled();
    });

    it('should blacklist all tokens for the user on logout', async () => {
      (Token.update as jest.Mock).mockResolvedValue([3]);
      await authService.logout({ userId: 1 });
      expect(Token.update).toHaveBeenCalledWith(
        expect.objectContaining({ isBlacklisted: true }),
        expect.objectContaining({ where: expect.objectContaining({ userId: 1 }) })
      );
    });

    it('should not throw if user has no active tokens', async () => {
      (Token.update as jest.Mock).mockResolvedValue([0]);
      await expect(authService.logout({ userId: 1 })).resolves.not.toThrow();
    });
  });

  // ─────────────────────────────────────────────
  // FORGOT PASSWORD
  // ─────────────────────────────────────────────
  describe('Forgot Password', () => {
    const mockUser = { id: 1, firstName: 'John', lastName: 'Doe', email: 'john@example.com' };

    it('should send OTP successfully', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      (Otp.update as jest.Mock).mockResolvedValue([0]);
      (Otp.create as jest.Mock).mockResolvedValue({ id: 1, code: '123456' });

      await authService.forgotPassword({ email: mockUser.email });

      expect(Otp.create).toHaveBeenCalled();
    });

    it('should invalidate previous OTPs before creating a new one', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      (Otp.update as jest.Mock).mockResolvedValue([1]);
      (Otp.create as jest.Mock).mockResolvedValue({ id: 1, code: '654321' });

      await authService.forgotPassword({ email: mockUser.email });

      expect(Otp.update).toHaveBeenCalled();
    });

    it('should send email after creating OTP', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      (Otp.update as jest.Mock).mockResolvedValue([0]);
      (Otp.create as jest.Mock).mockResolvedValue({ id: 1, code: '123456' });
      (emailService.sendPasswordResetOTP as jest.Mock).mockResolvedValue(undefined);

      await authService.forgotPassword({ email: mockUser.email });

      expect(emailService.sendPasswordResetOTP).toHaveBeenCalled();
    });

    it('should throw error if user not found', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);
      await expect(authService.forgotPassword({ email: 'nonexistent@example.com' })).rejects.toThrow();
    });

    it('should throw error if email format is invalid', async () => {
      await expect(authService.forgotPassword({ email: 'not-an-email' })).rejects.toThrow();
    });
  });

  // ─────────────────────────────────────────────
  // VERIFY OTP (forgot password)
  // ─────────────────────────────────────────────
  describe('Verify OTP', () => {
    const mockUser = { id: 1, email: 'john@example.com' };

    it('should verify OTP successfully', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      (Otp.findOne as jest.Mock).mockResolvedValue({ id: 1, code: '123456', expiresAt: new Date(Date.now() + 60000) });

      await authService.verifyOtp({ email: mockUser.email, otp: '123456' });

      expect(User.findOne).toHaveBeenCalledWith({ where: { email: mockUser.email } });
    });

    it('should throw error if OTP is not found', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      (Otp.findOne as jest.Mock).mockResolvedValue(null);
      await expect(authService.verifyOtp({ email: mockUser.email, otp: '999999' })).rejects.toThrow();
    });

    it('should throw error if OTP is expired', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      (Otp.findOne as jest.Mock).mockResolvedValue({ id: 1, code: '123456', expiresAt: new Date(Date.now() - 60000) });
      await expect(authService.verifyOtp({ email: mockUser.email, otp: '123456' })).rejects.toThrow();
    });

    it('should throw error if user not found', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);
      await expect(authService.verifyOtp({ email: 'ghost@example.com', otp: '123456' })).rejects.toThrow();
    });
  });

  // ─────────────────────────────────────────────
  // RESET PASSWORD
  // ─────────────────────────────────────────────
  describe('Reset Password', () => {
    const mockUser = {
      id: 1,
      email: 'john@example.com',
      password: 'old_hashed_password',
      update: jest.fn().mockResolvedValue(undefined),
    };
    const mockOtp = {
      id: 1,
      code: '123456',
      expiresAt: new Date(Date.now() + 60000),
      update: jest.fn().mockResolvedValue(undefined),
    };

    function setupResetMocks() {
      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      (Otp.findOne as jest.Mock).mockResolvedValue(mockOtp);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_new_password');
      (Token.update as jest.Mock).mockResolvedValue([1]);
    }

    it('should reset password successfully', async () => {
      setupResetMocks();
      await authService.resetPassword({ email: mockUser.email, otp: '123456', newPassword: 'NewPassword123!' });
      expect(mockUser.update).toHaveBeenCalledWith({ password: 'hashed_new_password' });
      expect(mockOtp.update).toHaveBeenCalled();
    });

    it('should invalidate all tokens after password reset', async () => {
      setupResetMocks();
      await authService.resetPassword({ email: mockUser.email, otp: '123456', newPassword: 'NewPassword123!' });
      expect(Token.update).toHaveBeenCalled();
    });

    it('should mark OTP as used after password reset', async () => {
      setupResetMocks();
      await authService.resetPassword({ email: mockUser.email, otp: '123456', newPassword: 'NewPassword123!' });
      expect(mockOtp.update).toHaveBeenCalled();
    });

    it('should throw error if user not found', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);
      await expect(authService.resetPassword({ email: 'nonexistent@example.com', otp: '123456', newPassword: 'NewPassword123!' })).rejects.toThrow();
    });

    it('should throw error if OTP is invalid', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      (Otp.findOne as jest.Mock).mockResolvedValue(null);
      await expect(authService.resetPassword({ email: mockUser.email, otp: '999999', newPassword: 'NewPassword123!' })).rejects.toThrow();
    });

    it('should throw error if OTP is expired', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      (Otp.findOne as jest.Mock).mockResolvedValue({ ...mockOtp, expiresAt: new Date(Date.now() - 60000) });
      await expect(authService.resetPassword({ email: mockUser.email, otp: '123456', newPassword: 'NewPassword123!' })).rejects.toThrow();
    });

    it('should throw error if new password is same as old password', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      (Otp.findOne as jest.Mock).mockResolvedValue(mockOtp);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true); // new == old
      await expect(authService.resetPassword({ email: mockUser.email, otp: '123456', newPassword: 'OldPassword123!' })).rejects.toThrow();
    });

    it('should throw error if new password is weak', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      (Otp.findOne as jest.Mock).mockResolvedValue(mockOtp);
      await expect(authService.resetPassword({ email: mockUser.email, otp: '123456', newPassword: 'weak' })).rejects.toThrow();
    });
  });

  // ─────────────────────────────────────────────
  // EMAIL VERIFICATION
  // ─────────────────────────────────────────────
  describe('Email Verification', () => {
    const mockUser = {
      id: 1,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      isEmailVerified: false,
      update: jest.fn().mockResolvedValue(undefined),
    };
    const mockOtp = {
      id: 1,
      code: '123456',
      expiresAt: new Date(Date.now() + 60000),
      update: jest.fn().mockResolvedValue(undefined),
    };

    // sendEmailVerificationOtp
    describe('sendEmailVerificationOtp', () => {
      it('should send email verification OTP successfully', async () => {
        (User.findOne as jest.Mock).mockResolvedValue(mockUser);
        (Otp.update as jest.Mock).mockResolvedValue([0]);
        (Otp.create as jest.Mock).mockResolvedValue({ id: 1, code: '123456' });

        await authService.sendEmailVerificationOtp(mockUser.email);

        expect(Otp.create).toHaveBeenCalled();
      });

      it('should invalidate previous OTPs before sending new one', async () => {
        (User.findOne as jest.Mock).mockResolvedValue(mockUser);
        (Otp.update as jest.Mock).mockResolvedValue([1]);
        (Otp.create as jest.Mock).mockResolvedValue({ id: 1, code: '123456' });

        await authService.sendEmailVerificationOtp(mockUser.email);

        expect(Otp.update).toHaveBeenCalled();
      });

      it('should throw error if user not found', async () => {
        (User.findOne as jest.Mock).mockResolvedValue(null);
        await expect(authService.sendEmailVerificationOtp('nonexistent@example.com')).rejects.toThrow();
      });
    });

    // verifyEmailOtp
    describe('verifyEmailOtp', () => {
      it('should verify email OTP and mark user as verified', async () => {
        (User.findOne as jest.Mock).mockResolvedValue(mockUser);
        (Otp.findOne as jest.Mock).mockResolvedValue(mockOtp);

        await authService.verifyEmailOtp({ email: mockUser.email, otp: '123456' });

        expect(mockUser.update).toHaveBeenCalledWith({ isEmailVerified: true });
      });

      it('should mark OTP as used after email verification', async () => {
        (User.findOne as jest.Mock).mockResolvedValue(mockUser);
        (Otp.findOne as jest.Mock).mockResolvedValue(mockOtp);

        await authService.verifyEmailOtp({ email: mockUser.email, otp: '123456' });

        expect(mockOtp.update).toHaveBeenCalled();
      });

      it('should throw error if OTP is invalid', async () => {
        (User.findOne as jest.Mock).mockResolvedValue(mockUser);
        (Otp.findOne as jest.Mock).mockResolvedValue(null);
        await expect(authService.verifyEmailOtp({ email: mockUser.email, otp: '999999' })).rejects.toThrow();
      });

      it('should throw error if OTP is expired', async () => {
        (User.findOne as jest.Mock).mockResolvedValue(mockUser);
        (Otp.findOne as jest.Mock).mockResolvedValue({ ...mockOtp, expiresAt: new Date(Date.now() - 60000) });
        await expect(authService.verifyEmailOtp({ email: mockUser.email, otp: '123456' })).rejects.toThrow();
      });

      it('should throw error if user not found during email verification', async () => {
        (User.findOne as jest.Mock).mockResolvedValue(null);
        await expect(authService.verifyEmailOtp({ email: 'ghost@example.com', otp: '123456' })).rejects.toThrow();
      });
    });

    // resendEmailVerificationOtp
    describe('resendEmailVerificationOtp', () => {
      it('should resend email verification OTP successfully', async () => {
        (User.findOne as jest.Mock).mockResolvedValue(mockUser);
        (Otp.update as jest.Mock).mockResolvedValue([0]);
        (Otp.create as jest.Mock).mockResolvedValue({ id: 1, code: '654321' });

        await authService.resendEmailVerificationOtp(mockUser.email);

        expect(Otp.create).toHaveBeenCalled();
      });

      it('should throw error if user not found', async () => {
        (User.findOne as jest.Mock).mockResolvedValue(null);
        await expect(authService.resendEmailVerificationOtp('ghost@example.com')).rejects.toThrow();
      });

      it('should throw error if email is already verified', async () => {
        (User.findOne as jest.Mock).mockResolvedValue({ ...mockUser, isEmailVerified: true });
        await expect(authService.resendEmailVerificationOtp(mockUser.email)).rejects.toThrow();
      });
    });
  });
});