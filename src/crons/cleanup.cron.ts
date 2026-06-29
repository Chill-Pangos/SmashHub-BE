import cron from "node-cron";
import { Op } from "sequelize";
import Otp from "../models/otp.model";
import Token from "../models/token.model";
import ApiRequestLog from "../models/apiRequestLog.model";
import CronLog from "../models/cronLog.model";
import { formatDateGMT7 } from "../utils/date.helper";
import cronLogService from "../services/cronLog.service";
import config from "../config/config";

type CleanupResult = {
  deleted: number;
  meta?: Record<string, unknown>;
};

async function runCleanupJob(
  jobName: string,
  label: string,
  handler: () => Promise<CleanupResult>,
): Promise<void> {
  const startedAt = new Date();
  try {
    const result = await handler();
    const finishedAt = new Date();

    await cronLogService.create({
      jobName,
      level: "info",
      status: "success",
      message: `${label} cleanup completed`,
      meta: {
        deleted: result.deleted,
        ...result.meta,
      },
      startedAt,
      finishedAt,
      durationMs: finishedAt.getTime() - startedAt.getTime(),
    });

    console.log(
      `[CRON] ${label} cleanup completed: deleted ${result.deleted} item(s) at ${formatDateGMT7(finishedAt)}`
    );
  } catch (error) {
    const finishedAt = new Date();
    await cronLogService.create({
      jobName,
      level: "error",
      status: "failed",
      message: `${label} cleanup failed`,
      meta: {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      startedAt,
      finishedAt,
      durationMs: finishedAt.getTime() - startedAt.getTime(),
    });
    console.error(`[CRON] ${label} cleanup failed:`, error);
  }
}

/**
 * Cron job: Cleanup expired OTPs every 5 minutes
 * Pattern: every 5 minutes
 */
export const cleanupExpiredOtps = cron.schedule("*/5 * * * *", async () => {
  await runCleanupJob("cleanup-expired-otps", "Expired OTP", async () => {
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
          },
        ],
      },
    });
    return {
      deleted,
      meta: {
        criteria: ["expiresAt < now", "isUsed = true"],
      },
    };
  });
});

/**
 * Cron job: Cleanup expired access tokens every 30 minutes
 * Pattern: every 30 minutes
 */
export const cleanupExpiredAccessTokens = cron.schedule(
  "*/30 * * * *",
  async () => {
    await runCleanupJob(
      "cleanup-expired-access-tokens",
      "Expired/blacklisted access token",
      async () => {
        const deleted = await Token.destroy({
          where: {
            type: "access",
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
        return {
          deleted,
          meta: {
            tokenType: "access",
            criteria: ["expiresAt < now", "isBlacklisted = true"],
          },
        };
      },
    );
  }
);

/**
 * Cron job: Cleanup expired refresh tokens daily at midnight
 * Pattern: every day at midnight
 */
export const cleanupExpiredRefreshTokens = cron.schedule(
  "0 0 * * *",
  async () => {
    await runCleanupJob(
      "cleanup-expired-refresh-tokens",
      "Expired/blacklisted refresh token",
      async () => {
        const deleted = await Token.destroy({
          where: {
            type: "refresh",
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
        return {
          deleted,
          meta: {
            tokenType: "refresh",
            criteria: ["expiresAt < now", "isBlacklisted = true"],
          },
        };
      },
    );
  }
);

export const cleanupApiRequestLogs = cron.schedule("15 0 * * *", async () => {
  await runCleanupJob("cleanup-api-request-logs", "API request log", async () => {
    const cutoff = new Date(Date.now() - config.logging.apiRequest.retentionDays * 24 * 60 * 60 * 1000);
    const deleted = await ApiRequestLog.destroy({
      where: { createdAt: { [Op.lt]: cutoff } },
    });
    return {
      deleted,
      meta: {
        retentionDays: config.logging.apiRequest.retentionDays,
        cutoff: cutoff.toISOString(),
      },
    };
  });
});

export const cleanupCronLogs = cron.schedule("30 0 * * *", async () => {
  await runCleanupJob("cleanup-cron-logs", "Cron log", async () => {
    const cutoff = new Date(Date.now() - config.logging.cronLogRetentionDays * 24 * 60 * 60 * 1000);
    const deleted = await CronLog.destroy({
      where: { createdAt: { [Op.lt]: cutoff } },
    });
    return {
      deleted,
      meta: {
        retentionDays: config.logging.cronLogRetentionDays,
        cutoff: cutoff.toISOString(),
      },
    };
  });
});

/**
 * Start all cron jobs
 */
export const startCleanupCrons = () => {
  cleanupExpiredOtps.start();
  cleanupExpiredAccessTokens.start();
  cleanupExpiredRefreshTokens.start();
  cleanupApiRequestLogs.start();
  cleanupCronLogs.start();
  console.log("[CRON] All cleanup cron jobs started");
};

/**
 * Stop all cron jobs
 */
export const stopCleanupCrons = () => {
  cleanupExpiredOtps.stop();
  cleanupExpiredAccessTokens.stop();
  cleanupExpiredRefreshTokens.stop();
  cleanupApiRequestLogs.stop();
  cleanupCronLogs.stop();
  console.log("[CRON] All cleanup cron jobs stopped");
};
