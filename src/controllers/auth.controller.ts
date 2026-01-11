import { Request, Response, NextFunction } from "express";
import authService from "../services/auth.service";
import {
  LoginDto,
  RegisterDto,
  RefreshTokenDto,
  ChangePasswordDto,
  ForgotPasswordDto,
  VerifyOtpDto,
  ResetPasswordDto,
  SendEmailVerificationDto,
  VerifyEmailOtpDto,
} from "../dto/auth.dto";
import { AuthRequest } from "../middlewares/auth.middleware";

export class AuthController {
  /**
   * Register new user
   */
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const registerDto: RegisterDto = req.body;
      const result = await authService.register(registerDto);

      res.status(201).json({
        success: true,
        message: "User registered successfully",
        data: result,
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * Login user
   */
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const loginDto: LoginDto = req.body;
      const result = await authService.login(loginDto);

      res.status(200).json({
        success: true,
        message: "Login successful",
        data: result,
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const refreshTokenDto: RefreshTokenDto = req.body;
      const result = await authService.refreshToken(refreshTokenDto);

      res.status(200).json({
        success: true,
        message: "Token refreshed successfully",
        data: result,
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * Change password
   */
  async changePassword(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId;
      const changePasswordDto: ChangePasswordDto = req.body;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
        return;
      }

      await authService.changePassword(userId, changePasswordDto);

      res.status(200).json({
        success: true,
        message: "Password changed successfully",
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * Logout user - blacklist all tokens for the user
   */
  async logout(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
        return;
      }

      await authService.logout({ userId });

      res.status(200).json({
        success: true,
        message: "Logout successful",
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * Request password reset - Send OTP to email
   */
  async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const forgotPasswordDto: ForgotPasswordDto = req.body;
      await authService.forgotPassword(forgotPasswordDto);

      res.status(200).json({
        success: true,
        message: "OTP has been sent to your email",
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * Verify OTP
   */
  async verifyOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const verifyOtpDto: VerifyOtpDto = req.body;
      await authService.verifyOtp(verifyOtpDto);

      res.status(200).json({
        success: true,
        message: "OTP verified successfully",
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * Reset password with OTP
   */
  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const resetPasswordDto: ResetPasswordDto = req.body;
      await authService.resetPassword(resetPasswordDto);

      res.status(200).json({
        success: true,
        message: "Password has been reset successfully",
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * Send email verification OTP
   */
  async sendEmailVerificationOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email }: SendEmailVerificationDto = req.body;
      await authService.sendEmailVerificationOtp(email);

      res.status(200).json({
        success: true,
        message: "Verification OTP has been sent to your email",
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * Verify email with OTP
   */
  async verifyEmailOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const verifyEmailOtpDto: VerifyEmailOtpDto = req.body;
      await authService.verifyEmailOtp(verifyEmailOtpDto);

      res.status(200).json({
        success: true,
        message: "Email has been verified successfully",
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * Resend email verification OTP
   */
  async resendEmailVerificationOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email }: SendEmailVerificationDto = req.body;
      await authService.resendEmailVerificationOtp(email);

      res.status(200).json({
        success: true,
        message: "A new OTP code has been sent to your email",
      });
    } catch (error: any) {
      next(error);
    }
  }
}

export default new AuthController();
