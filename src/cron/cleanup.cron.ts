import cron from "node-cron";
import { Op } from "sequelize";
import Otp from "../models/otp.model";
import AccessToken from "../models/accessToken.model";
import RefreshToken from "../models/refreshToken.model";

/**
 * Cron job: Cleanup expired OTPs every 5 minutes
 * Pattern: every 5 minutes
 */
export const cleanupExpiredOtps = cron.schedule("*/5 * * * *", async () => {
  try {
    const deleted = await Otp.destroy({
      where: {
        [Op.or]: [
          {
            expiresAt: {
              [Op.lt]: new Date(),
            },
          },
          {
            isUsed: true,
          }
        ],
      },
    });

    if (deleted > 0) {
      console.log(
        `[CRON] Cleaned up ${deleted} expired OTP(s) at ${new Date().toISOString()}`
      );
    }
  } catch (error) {
    console.error("[CRON] Error cleaning up expired OTPs:", error);
  }
});

/**
 * Cron job: Cleanup expired access tokens every 30 minutes
 * Pattern: every 30 minutes
 */
export const cleanupExpiredAccessTokens = cron.schedule(
  "*/30 * * * *",
  async () => {
    try {
      const deleted = await AccessToken.destroy({
        where: {
          [Op.or]: [
            {
              expiresAt: {
                [Op.lt]: new Date(),
              },
            },
            {
              isBlacklisted: true,
            },
          ],
        },
      });

      if (deleted > 0) {
        console.log(
          `[CRON] Cleaned up ${deleted} expired/blacklisted access token(s) at ${new Date().toISOString()}`
        );
      }
    } catch (error) {
      console.error("[CRON] Error cleaning up expired access tokens:", error);
    }
  }
);

/**
 * Cron job: Cleanup expired refresh tokens daily at midnight
 * Pattern: every day at midnight
 */
export const cleanupExpiredRefreshTokens = cron.schedule(
  "0 0 * * *",
  async () => {
    try {
      const deleted = await RefreshToken.destroy({
        where: {
          [Op.or]: [
            {
              expiresAt: {
                [Op.lt]: new Date(),
              },
            },
            {
              isBlacklisted: true,
            },
          ],
        },
      });

      if (deleted > 0) {
        console.log(
          `[CRON] Cleaned up ${deleted} expired/blacklisted refresh token(s) at ${new Date().toISOString()}`
        );
      }
    } catch (error) {
      console.error("[CRON] Error cleaning up expired refresh tokens:", error);
    }
  }
);

/**
 * Start all cron jobs
 */
export const startCleanupCrons = () => {
  cleanupExpiredOtps.start();
  cleanupExpiredAccessTokens.start();
  cleanupExpiredRefreshTokens.start();
  console.log("[CRON] All cleanup cron jobs started");
};

/**
 * Stop all cron jobs
 */
export const stopCleanupCrons = () => {
  cleanupExpiredOtps.stop();
  cleanupExpiredAccessTokens.stop();
  cleanupExpiredRefreshTokens.stop();
  console.log("[CRON] All cleanup cron jobs stopped");
};
