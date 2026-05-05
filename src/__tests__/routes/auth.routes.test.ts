// ─── Env Setup ───────────────────────────────────────────────────────────────
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_secret_very_long_string_for_jwt_secret_minimum_32_chars';

// ─── Mock middleware TRƯỚC import routes ──────────────────────────────────────
jest.mock('../../middlewares/auth.middleware', () => ({
  authenticate: jest.fn((_req: any, res: any, next: any) => next()),
}));

jest.mock('../../controllers/auth.controller');

import request from 'supertest';
import express, { Express } from 'express';
import authRoutes from '../../routes/auth.routes';
import authController from '../../controllers/auth.controller';

// ─── Setup ────────────────────────────────────────────────────────────────────
const createApp = (): Express => {
  const app = express();
  app.use(express.json());
  app.use('/auth', authRoutes);
  return app;
};

// ─── Factories ───────────────────────────────────────────────────────────────
const makeUser = (overrides: Record<string, any> = {}) => ({
  id: 1,
  firstName: 'Nguyen',
  lastName: 'Van A',
  email: 'user@test.com',
  isEmailVerified: false,
  ...overrides,
});

const makeRegisterResponse = (overrides: Record<string, any> = {}) => ({
  success: true,
  message: 'User registered successfully',
  data: {
    user: makeUser(),
    accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  },
  ...overrides,
});

const makeLoginResponse = (overrides: Record<string, any> = {}) => ({
  success: true,
  message: 'Login successful',
  data: {
    accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    user: makeUser(),
  },
  ...overrides,
});

// ─── Suite ────────────────────────────────────────────────────────────────────
describe('Auth Routes', () => {
  let app: Express;

  beforeEach(() => {
    // Clear only controller mocks, not middleware mocks
    (authController.register as jest.Mock).mockClear();
    (authController.login as jest.Mock).mockClear();
    (authController.refreshToken as jest.Mock).mockClear();
    (authController.changePassword as jest.Mock).mockClear();
    (authController.logout as jest.Mock).mockClear();
    (authController.forgotPassword as jest.Mock).mockClear();
    (authController.verifyOtp as jest.Mock).mockClear();
    (authController.resetPassword as jest.Mock).mockClear();
    (authController.sendEmailVerificationOtp as jest.Mock).mockClear();
    (authController.verifyEmailOtp as jest.Mock).mockClear();
    (authController.resendEmailVerificationOtp as jest.Mock).mockClear();

    // Setup controller mocks
    (authController.register as jest.Mock).mockImplementation((req, res) => {
      res.status(201).json(makeRegisterResponse());
    });
    (authController.login as jest.Mock).mockImplementation((req, res) => {
      res.status(200).json(makeLoginResponse());
    });
    (authController.refreshToken as jest.Mock).mockImplementation((req, res) => {
      res.status(200).json({
        success: true,
        message: 'Token refreshed successfully',
        data: { accessToken: 'new_token', refreshToken: 'new_refresh_token' },
      });
    });
    (authController.changePassword as jest.Mock).mockImplementation((req, res) => {
      res.status(200).json({ success: true, message: 'Password changed successfully' });
    });
    (authController.logout as jest.Mock).mockImplementation((req, res) => {
      res.status(200).json({ success: true, message: 'Logout successful' });
    });
    (authController.forgotPassword as jest.Mock).mockImplementation((req, res) => {
      res.status(200).json({ success: true, message: 'OTP has been sent to your email' });
    });
    (authController.verifyOtp as jest.Mock).mockImplementation((req, res) => {
      res.status(200).json({ success: true, message: 'OTP verified successfully' });
    });
    (authController.resetPassword as jest.Mock).mockImplementation((req, res) => {
      res.status(200).json({ success: true, message: 'Password has been reset successfully' });
    });
    (authController.sendEmailVerificationOtp as jest.Mock).mockImplementation((req, res) => {
      res.status(200).json({ success: true, message: 'OTP sent to email' });
    });
    (authController.verifyEmailOtp as jest.Mock).mockImplementation((req, res) => {
      res.status(200).json({ success: true, message: 'Email verified successfully' });
    });
    (authController.resendEmailVerificationOtp as jest.Mock).mockImplementation((req, res) => {
      res.status(200).json({ success: true, message: 'OTP resent to email' });
    });

    app = createApp();
  });

  // ─── POST /auth/register ───────────────────────────────────────────────────
  describe('POST /auth/register', () => {
    it('should register user and return 201', async () => {
      const userData = {
        firstName: 'Nguyen',
        lastName: 'Van A',
        email: 'user@test.com',
        password: 'Password123!',
      };

      const res = await request(app)
        .post('/auth/register')
        .send(userData);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
    });

    it('should pass registration data to controller', async () => {
      const userData = {
        firstName: 'Nguyen',
        lastName: 'Van A',
        email: 'user@test.com',
        password: 'Password123!',
      };

      await request(app)
        .post('/auth/register')
        .send(userData);

      expect(authController.register).toHaveBeenCalled();
    });

    it('should handle validation errors', async () => {
      (authController.register as jest.Mock).mockImplementation((req, res) => {
        res.status(400).json({ success: false, message: 'Email already exists' });
      });

      const res = await request(app)
        .post('/auth/register')
        .send({ email: 'existing@test.com' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  // ─── POST /auth/login ───────────────────────────────────────────────────────
  describe('POST /auth/login', () => {
    it('should login and return 200 with tokens', async () => {
      const credentials = {
        email: 'user@test.com',
        password: 'Password123!',
      };

      const res = await request(app)
        .post('/auth/login')
        .send(credentials);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
      expect(res.body.data.user).toBeDefined();
    });

    it('should handle invalid credentials', async () => {
      (authController.login as jest.Mock).mockImplementation((req, res) => {
        res.status(401).json({ success: false, message: 'Invalid credentials' });
      });

      const res = await request(app)
        .post('/auth/login')
        .send({ email: 'user@test.com', password: 'wrong' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should handle user not found', async () => {
      (authController.login as jest.Mock).mockImplementation((req, res) => {
        res.status(401).json({ success: false, message: 'User not found' });
      });

      const res = await request(app)
        .post('/auth/login')
        .send({ email: 'notexist@test.com', password: 'Password123!' });

      expect(res.status).toBe(401);
    });
  });

  // ─── POST /auth/refresh ────────────────────────────────────────────────────
  describe('POST /auth/refresh', () => {
    it('should refresh token and return new tokens', async () => {
      const res = await request(app)
        .post('/auth/refresh')
        .send({ refreshToken: 'valid_refresh_token' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
    });

    it('should handle invalid token', async () => {
      (authController.refreshToken as jest.Mock).mockImplementation((req, res) => {
        res.status(401).json({ success: false, message: 'Invalid token' });
      });

      const res = await request(app)
        .post('/auth/refresh')
        .send({ refreshToken: 'invalid_token' });

      expect(res.status).toBe(401);
    });

    it('should handle expired token', async () => {
      (authController.refreshToken as jest.Mock).mockImplementation((req, res) => {
        res.status(401).json({ success: false, message: 'Token expired' });
      });

      const res = await request(app)
        .post('/auth/refresh')
        .send({ refreshToken: 'expired_token' });

      expect(res.status).toBe(401);
    });
  });

  // ─── POST /auth/change-password ────────────────────────────────────────────
  describe('POST /auth/change-password', () => {
    it('should change password and return 200', async () => {
      const res = await request(app)
        .post('/auth/change-password')
        .send({ oldPassword: 'Password123!', newPassword: 'NewPass456!' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should handle invalid old password', async () => {
      (authController.changePassword as jest.Mock).mockImplementation((req, res) => {
        res.status(400).json({ success: false, message: 'Invalid old password' });
      });

      const res = await request(app)
        .post('/auth/change-password')
        .send({ oldPassword: 'wrong', newPassword: 'NewPass456!' });

      expect(res.status).toBe(400);
    });

    it('should handle weak new password', async () => {
      (authController.changePassword as jest.Mock).mockImplementation((req, res) => {
        res.status(400).json({ success: false, message: 'Weak password' });
      });

      const res = await request(app)
        .post('/auth/change-password')
        .send({ oldPassword: 'Password123!', newPassword: '123' });

      expect(res.status).toBe(400);
    });
  });

  // ─── POST /auth/logout ─────────────────────────────────────────────────────
  describe('POST /auth/logout', () => {
    it('should logout and return 200', async () => {
      const res = await request(app).post('/auth/logout');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('Logout');
    });
  });

  // ─── POST /auth/forgot-password ────────────────────────────────────────────
  describe('POST /auth/forgot-password', () => {
    it('should send OTP and return 200', async () => {
      const res = await request(app)
        .post('/auth/forgot-password')
        .send({ email: 'user@test.com' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('OTP');
    });

    it('should handle user not found', async () => {
      (authController.forgotPassword as jest.Mock).mockImplementation((req, res) => {
        res.status(400).json({ success: false, message: 'User not found' });
      });

      const res = await request(app)
        .post('/auth/forgot-password')
        .send({ email: 'notexist@test.com' });

      expect(res.status).toBe(400);
    });
  });

  // ─── POST /auth/verify-otp ─────────────────────────────────────────────────
  describe('POST /auth/verify-otp', () => {
    it('should verify OTP and return 200', async () => {
      const res = await request(app)
        .post('/auth/verify-otp')
        .send({ email: 'user@test.com', otp: '123456' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should handle invalid OTP', async () => {
      (authController.verifyOtp as jest.Mock).mockImplementation((req, res) => {
        res.status(400).json({ success: false, message: 'Invalid OTP' });
      });

      const res = await request(app)
        .post('/auth/verify-otp')
        .send({ email: 'user@test.com', otp: 'wrong' });

      expect(res.status).toBe(400);
    });
  });

  // ─── POST /auth/reset-password ─────────────────────────────────────────────
  describe('POST /auth/reset-password', () => {
    it('should reset password and return 200', async () => {
      const res = await request(app)
        .post('/auth/reset-password')
        .send({ email: 'user@test.com', otp: '123456', newPassword: 'NewPass456!' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should handle invalid OTP', async () => {
      (authController.resetPassword as jest.Mock).mockImplementation((req, res) => {
        res.status(400).json({ success: false, message: 'Invalid OTP' });
      });

      const res = await request(app)
        .post('/auth/reset-password')
        .send({ email: 'user@test.com', otp: 'wrong', newPassword: 'NewPass456!' });

      expect(res.status).toBe(400);
    });
  });

  // ─── POST /auth/send-email-verification-otp ────────────────────────────────
  describe('POST /auth/send-email-verification-otp', () => {
    it('should send email verification OTP and return 200', async () => {
      const res = await request(app)
        .post('/auth/send-email-verification-otp')
        .send({ email: 'user@test.com' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // ─── POST /auth/verify-email-otp ───────────────────────────────────────────
  describe('POST /auth/verify-email-otp', () => {
    it('should verify email with OTP and return 200', async () => {
      const res = await request(app)
        .post('/auth/verify-email-otp')
        .send({ email: 'user@test.com', otp: '123456' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should handle invalid OTP', async () => {
      (authController.verifyEmailOtp as jest.Mock).mockImplementation((req, res) => {
        res.status(400).json({ success: false, message: 'Invalid OTP' });
      });

      const res = await request(app)
        .post('/auth/verify-email-otp')
        .send({ email: 'user@test.com', otp: 'wrong' });

      expect(res.status).toBe(400);
    });
  });

  // ─── POST /auth/resend-email-verification-otp ──────────────────────────────
  describe('POST /auth/resend-email-verification-otp', () => {
    it('should resend email verification OTP and return 200', async () => {
      const res = await request(app)
        .post('/auth/resend-email-verification-otp')
        .send({ email: 'user@test.com' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // ─── JSON Content-Type Tests ──────────────────────────────────────────────
  describe('Content Type Handling', () => {
    it('should handle JSON request body', async () => {
      const res = await request(app)
        .post('/auth/register')
        .set('Content-Type', 'application/json')
        .send({
          firstName: 'Nguyen',
          lastName: 'Van A',
          email: 'user@test.com',
          password: 'Password123!',
        });

      expect(res.status).toBe(201);
    });

    it('should return JSON response', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({ email: 'user@test.com', password: 'Password123!' });

      expect(res.type).toMatch(/json/);
    });
  });

  // ─── HTTP Methods Tests ────────────────────────────────────────────────────
  describe('HTTP Methods', () => {
    it('should accept POST to register', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({ firstName: 'Test', lastName: 'User', email: 'test@test.com', password: 'Pass123!' });

      expect(res.status).toBe(201);
    });

    it('should accept POST to login', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({ email: 'user@test.com', password: 'Password123!' });

      expect(res.status).toBe(200);
    });

    it('should accept POST to refresh token', async () => {
      const res = await request(app)
        .post('/auth/refresh')
        .send({ refreshToken: 'token' });

      expect(res.status).toBe(200);
    });
  });
});
