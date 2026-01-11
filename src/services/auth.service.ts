import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../models/user.model";
import RefreshToken from "../models/refreshToken.model";
import AccessToken from "../models/accessToken.model";
import Otp from "../models/otp.model";
import config from "../config/config";
import emailService from "./email.service";
import { AuthErrors } from "../utils/errors";
import {
  LoginDto,
  RegisterDto,
  AuthResponseDto,
  RefreshTokenDto,
  ChangePasswordDto,
  LogoutDto,
  ForgotPasswordDto,
  VerifyOtpDto,
  ResetPasswordDto,
} from "../dto/auth.dto";
import UserRole from "../models/userRole.model";
import Role from "../models/role.model";

export class AuthService {
  private readonly JWT_SECRET = config.jwt.secret;
  private readonly JWT_EXPIRES_IN = config.jwt.expiresIn;
  private readonly JWT_REFRESH_SECRET = config.jwt.refreshSecret;
  private readonly JWT_REFRESH_EXPIRES_IN = config.jwt.refreshExpiresIn;

  /**
   * Generate access token
   */
  private generateAccessToken(userId: number): string {
    return jwt.sign({ userId }, this.JWT_SECRET, {
      expiresIn: this.JWT_EXPIRES_IN,
    });
  }

  /**
   * Generate refresh token
   */
  private generateRefreshToken(userId: number): string {
    return jwt.sign({ userId }, this.JWT_REFRESH_SECRET, {
      expiresIn: this.JWT_REFRESH_EXPIRES_IN,
    });
  }

  /**
   * Calculate token expiration date
   */
  private calculateExpirationDate(expiresIn: string): Date {
    const matches = expiresIn.match(/^(\d+)([smhd])$/);
    if (!matches || !matches[1] || !matches[2]) {
      throw new Error("Invalid expiration format");
    }

    const value = parseInt(matches[1], 10);
    const unit = matches[2];
    const now = new Date();

    switch (unit) {
      case "s":
        now.setSeconds(now.getSeconds() + value);
        break;
      case "m":
        now.setMinutes(now.getMinutes() + value);
        break;
      case "h":
        now.setHours(now.getHours() + value);
        break;
      case "d":
        now.setDate(now.getDate() + value);
        break;
    }

    return now;
  }

  /**
   * Save access token to database
   */
  private async saveAccessToken(
    userId: number,
    token: string
  ): Promise<AccessToken> {
    const expiresAt = this.calculateExpirationDate(this.JWT_EXPIRES_IN);

    return await AccessToken.create({
      userId,
      token,
      expiresAt,
      isBlacklisted: false,
    } as any);
  }

  /**
   * Save refresh token to database
   */
  private async saveRefreshToken(
    userId: number,
    token: string
  ): Promise<RefreshToken> {
    const expiresAt = this.calculateExpirationDate(this.JWT_REFRESH_EXPIRES_IN);

    return await RefreshToken.create({
      userId,
      token,
      expiresAt,
      isBlacklisted: false,
    } as any);
  }

  /**
   * Check if token is blacklisted
   */
  async isTokenBlacklisted(token: string): Promise<boolean> {
    const accessToken = await AccessToken.findOne({
      where: { token },
    });

    if (accessToken && accessToken.isBlacklisted) {
      return true;
    }

    const refreshToken = await RefreshToken.findOne({
      where: { token },
    });

    if (refreshToken && refreshToken.isBlacklisted) {
      return true;
    }

    return false;
  }

  /**
   * Hash password
   */
  private async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  /**
   * Compare password with hash
   */
  private async comparePassword(
    password: string,
    hashedPassword: string
  ): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  /**
   * Register new user
   */
  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const { username, email, password, role } = registerDto;

    // Check if user already exists
    const existingUser = await User.findOne({
      where: {
        email,
      },
    });

    if (existingUser) {
      throw AuthErrors.EmailAlreadyExists();
    }

    // Check if username already exists
    const existingUsername = await User.findOne({
      where: {
        username,
      },
    });

    if (existingUsername) {
      throw AuthErrors.UsernameAlreadyExists();
    }

    // Hash password
    const hashedPassword = await this.hashPassword(password);

    // Create user
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      isEmailVerified: false,
    } as any);

    const assignedRoleName = role || "spectator"; // Default to 'spectator' role if none provided

    const foundRole = await Role.findOne({ where: { name: assignedRoleName } });
    if (!foundRole) {
      throw AuthErrors.RoleNotFound();
    }

    await UserRole.create({
      userId: user.id,
      roleId: foundRole.id,
    } as any);

    // Generate tokens
    const accessToken = this.generateAccessToken(user.id);
    const refreshToken = this.generateRefreshToken(user.id);

    // Save tokens to database
    await this.saveAccessToken(user.id, accessToken);
    await this.saveRefreshToken(user.id, refreshToken);

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        roles: [foundRole.id],
        isEmailVerified: user.isEmailVerified,
      },
      accessToken,
      refreshToken,
    };
  }

  /**
   * Login user
   */
  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const { email, password } = loginDto;

    // Find user by email
    const user = await User.findOne({
      where: {
        email,
      },
    });

    if (!user) {
      throw AuthErrors.InvalidCredentials();
    }

    // Compare password
    const isPasswordValid = await this.comparePassword(password, user.password);

    if (!isPasswordValid) {
      throw AuthErrors.InvalidCredentials();
    }

    // Generate tokens
    const accessToken = this.generateAccessToken(user.id);
    const refreshToken = this.generateRefreshToken(user.id);

    // Save tokens to database
    await this.saveAccessToken(user.id, accessToken);
    await this.saveRefreshToken(user.id, refreshToken);

    // Get user roles
    const userRoles = await UserRole.findAll({
      where: { userId: user.id },
    });

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        roles: userRoles.map((ur) => ur.roleId),
        isEmailVerified: user.isEmailVerified,
      },
      accessToken,
      refreshToken,
    };
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshTokenDto: RefreshTokenDto): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    const { refreshToken } = refreshTokenDto;

    try {
      // Check if token is blacklisted
      const isBlacklisted = await this.isTokenBlacklisted(refreshToken);
      if (isBlacklisted) {
        throw AuthErrors.TokenRevoked();
      }

      // Verify refresh token
      const decoded = jwt.verify(refreshToken, this.JWT_REFRESH_SECRET) as {
        userId: number;
      };

      // Check if user exists
      const user = await User.findByPk(decoded.userId);

      if (!user) {
        throw AuthErrors.UserNotFound();
      }

      // Blacklist old refresh token
      await RefreshToken.update(
        {
          isBlacklisted: true,
          blacklistedAt: new Date(),
        },
        {
          where: { token: refreshToken },
        }
      );

      // Generate new tokens
      const newAccessToken = this.generateAccessToken(user.id);
      const newRefreshToken = this.generateRefreshToken(user.id);

      // Save new tokens to database
      await this.saveAccessToken(user.id, newAccessToken);
      await this.saveRefreshToken(user.id, newRefreshToken);

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      if (error instanceof Error && 'statusCode' in error) {
        throw error;
      }
      throw AuthErrors.InvalidToken();
    }
  }

  /**
   * Verify access token
   */
  async verifyToken(token: string): Promise<{ userId: number }> {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET) as { userId: number };
      return decoded;
    } catch (error) {
      throw AuthErrors.InvalidToken();
    }
  }

  /**
   * Get user by token
   */
  async getUserByToken(token: string): Promise<User | null> {
    try {
      const decoded = await this.verifyToken(token);
      const user = await User.findByPk(decoded.userId);
      return user;
    } catch (error) {
      return null;
    }
  }

  /**
   * Change password
   */
  async changePassword(
    userId: number,
    changePasswordDto: ChangePasswordDto
  ): Promise<void> {
    const { oldPassword, newPassword } = changePasswordDto;

    // Find user
    const user = await User.findByPk(userId);

    if (!user) {
      throw AuthErrors.UserNotFound();
    }

    // Verify old password
    const isPasswordValid = await this.comparePassword(
      oldPassword,
      user.password
    );

    if (!isPasswordValid) {
      throw AuthErrors.InvalidOldPassword();
    }

    // Hash new password
    const hashedPassword = await this.hashPassword(newPassword);

    // Update password
    await user.update({ password: hashedPassword });
  }

  /**
   * Logout user and blacklist all active tokens
   */
  async logout(logoutDto: LogoutDto): Promise<void> {
    const { userId } = logoutDto;
    // Blacklist all active tokens for this user
    await AccessToken.update(
      {
        isBlacklisted: true,
        blacklistedAt: new Date(),
      },
      {
        where: {
          userId,
          isBlacklisted: false,
        },
      }
    );

    await RefreshToken.update(
      {
        isBlacklisted: true,
        blacklistedAt: new Date(),
      },
      {
        where: {
          userId,
          isBlacklisted: false,
        },
      }
    );
  }

  /**
   * Generate 6-digit OTP
   */
  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Send OTP via email
   */
  private async sendOtpEmail(
    email: string,
    otp: string,
    type: "password_reset" | "email_verification",
    userName: string
  ): Promise<void> {
    try {
      if (type === "password_reset") {
        await emailService.sendPasswordResetOTP(email, otp, userName);
      } else if (type === "email_verification") {
        await emailService.sendEmailVerificationOTP(email, otp, userName);
      }
    } catch (error) {
      console.error("Error sending OTP email:", error);
      throw AuthErrors.EmailSendError();
    }
  }

  /**
   * Request password reset - Send OTP to user email
   */
  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<void> {
    const { email } = forgotPasswordDto;

    // Find user by email
    const user = await User.findOne({ where: { email } });
    if (!user) {
      throw AuthErrors.UserNotFound();
    }

    // Generate OTP
    const otpCode = this.generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Invalidate any existing unused OTPs for this user
    await Otp.update(
      { isUsed: true },
      {
        where: {
          userId: user.id,
          type: "password_reset",
          isUsed: false,
        },
      }
    );

    // Create new OTP
    await Otp.create({
      userId: user.id,
      code: otpCode,
      type: "password_reset",
      expiresAt,
      isUsed: false,
    });

    // Send OTP via email
    await this.sendOtpEmail(email, otpCode, "password_reset", user.username);
  }

  /**
   * Verify OTP
   */
  async verifyOtp(verifyOtpDto: VerifyOtpDto): Promise<void> {
    const { email, otp } = verifyOtpDto;

    // Find user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      throw AuthErrors.UserNotFound();
    }

    // Find valid OTP
    const otpRecord = await Otp.findOne({
      where: {
        userId: user.id,
        code: otp,
        type: "password_reset",
        isUsed: false,
      },
    });

    if (!otpRecord) {
      throw AuthErrors.InvalidOTP();
    }

    // Check if expired
    if (new Date() > otpRecord.expiresAt) {
      throw AuthErrors.ExpiredOTP();
    }
  }

  /**
   * Reset password with OTP
   */
  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<void> {
    const { email, otp, newPassword } = resetPasswordDto;

    // Find user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      throw AuthErrors.UserNotFound();
    }

    // Find valid OTP
    const otpRecord = await Otp.findOne({
      where: {
        userId: user.id,
        code: otp,
        type: "password_reset",
        isUsed: false,
      },
    });

    if (!otpRecord) {
      throw AuthErrors.InvalidOTP();
    }

    // Check if expired
    if (new Date() > otpRecord.expiresAt) {
      throw AuthErrors.ExpiredOTP();
    }
    
    await this.comparePassword(newPassword, user.password).then(isSame => {
      if (isSame) {
        throw AuthErrors.SamePasswordError();
      }
    });
    
    // Hash new password
    const hashedPassword = await this.hashPassword(newPassword);

    // Update password
    await user.update({ password: hashedPassword });

    // Mark OTP as used
    await otpRecord.update({
      isUsed: true,
      usedAt: new Date(),
    });

    // Blacklist all existing tokens for security
    await AccessToken.update(
      { isBlacklisted: true, blacklistedAt: new Date() },
      { where: { userId: user.id, isBlacklisted: false } }
    );
    await RefreshToken.update(
      { isBlacklisted: true, blacklistedAt: new Date() },
      { where: { userId: user.id, isBlacklisted: false } }
    );

    // Send password changed notification
    await emailService.sendPasswordChangedNotification(email, user.username);
  }

  /**
   * Send email verification OTP
   */
  async sendEmailVerificationOtp(email: string): Promise<void> {
    // Find user by email
    const user = await User.findOne({ where: { email } });
    
    if (!user) {
      throw AuthErrors.UserNotFound();
    }
    console.log(user.id);

    // Generate OTP
    const otpCode = this.generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Invalidate any existing unused OTPs for this user
    await Otp.update(
      { isUsed: true },
      {
        where: {
          userId: user.id,
          type: "email_verification",
          isUsed: false,
        },
      }
    );

    // Create new OTP
    await Otp.create({
      userId: user.id,
      code: otpCode,
      type: "email_verification",
      expiresAt,
      isUsed: false,
    });

    // Send OTP via email
    await this.sendOtpEmail(email, otpCode, "email_verification", user.username);
  }

  /**
   * Verify email with OTP
   */
  async verifyEmailOtp(verifyOtpDto: VerifyOtpDto): Promise<void> {
    const { email, otp } = verifyOtpDto;

    // Find user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      throw AuthErrors.UserNotFound();
    }

    // Find valid OTP
    const otpRecord = await Otp.findOne({
      where: {
        userId: user.id,
        code: otp,
        type: "email_verification",
        isUsed: false,
      },
    });

    if (!otpRecord) {
      throw AuthErrors.InvalidOTP();
    }

    // Check if expired
    if (new Date() > otpRecord.expiresAt) {
      throw AuthErrors.ExpiredOTP();
    }

    // Mark OTP as used
    await otpRecord.update({
      isUsed: true,
      usedAt: new Date(),
    });

    // Update user email verification status
    await user.update({ isEmailVerified: true });
  }

  /**
   * Resend email verification OTP
   */
  async resendEmailVerificationOtp(email: string): Promise<void> {
    // Same as sendEmailVerificationOtp, but you might want different message
    await this.sendEmailVerificationOtp(email);
  }
}

export default new AuthService();
