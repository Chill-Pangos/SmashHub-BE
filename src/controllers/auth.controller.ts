import { Request, Response } from "express";
import authService from "../services/auth.service";
import {
  LoginDto,
  RegisterDto,
  RefreshTokenDto,
  ChangePasswordDto,
  ForgotPasswordDto,
  VerifyOtpDto,
  ResetPasswordDto,
} from "../dto/auth.dto";
import { AuthRequest } from "../middlewares/auth.middleware";

export class AuthController {
  /**
   * Register new user
   */
  async register(req: Request, res: Response): Promise<void> {
    try {
      const registerDto: RegisterDto = req.body;
      const result = await authService.register(registerDto);

      res.status(201).json({
        success: true,
        message: "User registered successfully",
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || "Registration failed",
      });
    }
  }

  /**
   * Login user
   */
  async login(req: Request, res: Response): Promise<void> {
    try {
      const loginDto: LoginDto = req.body;
      const result = await authService.login(loginDto);

      res.status(200).json({
        success: true,
        message: "Login successful",
        data: result,
      });
    } catch (error: any) {
      res.status(401).json({
        success: false,
        message: error.message || "Login failed",
      });
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const refreshTokenDto: RefreshTokenDto = req.body;
      const result = await authService.refreshToken(refreshTokenDto);

      res.status(200).json({
        success: true,
        message: "Token refreshed successfully",
        data: result,
      });
    } catch (error: any) {
      res.status(401).json({
        success: false,
        message: error.message || "Token refresh failed",
      });
    }
  }

  /**
   * Get current user profile
   */
  async getProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
      const user = req.user;

      if (!user) {
        res.status(404).json({
          success: false,
          message: "User not found",
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: "Profile retrieved successfully",
        data: {
          id: user.id,
          username: user.username,
          email: user.email,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to retrieve profile",
      });
    }
  }

  /**
   * Change password
   */
  async changePassword(req: AuthRequest, res: Response): Promise<void> {
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
      res.status(400).json({
        success: false,
        message: error.message || "Failed to change password",
      });
    }
  }

  /**
   * Logout user - blacklist all tokens for the user
   */
  async logout(req: AuthRequest, res: Response): Promise<void> {
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
      res.status(500).json({
        success: false,
        message: error.message || "Logout failed",
      });
    }
  }

  /**
   * Request password reset - Send OTP to email
   */
  async forgotPassword(req: Request, res: Response): Promise<void> {
    try {
      const forgotPasswordDto: ForgotPasswordDto = req.body;
      await authService.forgotPassword(forgotPasswordDto);

      res.status(200).json({
        success: true,
        message: "OTP has been sent to your email",
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || "Failed to send OTP",
      });
    }
  }

  /**
   * Verify OTP
   */
  async verifyOtp(req: Request, res: Response): Promise<void> {
    try {
      const verifyOtpDto: VerifyOtpDto = req.body;
      await authService.verifyOtp(verifyOtpDto);

      res.status(200).json({
        success: true,
        message: "OTP verified successfully",
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || "OTP verification failed",
      });
    }
  }

  /**
   * Reset password with OTP
   */
  async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const resetPasswordDto: ResetPasswordDto = req.body;
      await authService.resetPassword(resetPasswordDto);

      res.status(200).json({
        success: true,
        message: "Password has been reset successfully",
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || "Failed to reset password",
      });
    }
  }
}

export default new AuthController();
