import { config as dotenvConfig } from '@dotenvx/dotenvx';
dotenvConfig({ path: `.env.${process.env.NODE_ENV || 'development'}` });

import Joi from "joi";
import path from "path";

const envSchema = Joi.object({
  NODE_ENV: Joi.string().valid("development", "production", "test").required(),
  PORT: Joi.number().default(3000),
  HOST: Joi.string().required(),
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_EXPIRES_IN: Joi.string().default("7d"),
  JWT_REFRESH_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default("30d"),

  //Database
  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().default(3306),
  DB_USERNAME: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),
  DB_DATABASE: Joi.string().required(),

  //Email
  SMTP_HOST: Joi.string().required(),
  SMTP_PORT: Joi.number().default(587),
  SMTP_USER: Joi.string().required(),
  SMTP_PASSWORD: Joi.string().required(),
  SMTP_FROM_EMAIL: Joi.string().email().required(),
  SMTP_FROM_NAME: Joi.string().default("SmashHub"),
  AVATAR_UPLOAD_DIR: Joi.string().required(),
  AVATAR_URL_PATH: Joi.string().default("/uploads/avatars"),
  PAYMENT_UPLOAD_DIR: Joi.string().required(),
  PAYMENT_URL_PATH: Joi.string().required(),
  REDIS_URL: Joi.string().uri().required(),
  REDIS_MATCH_SET_SCORE_TTL_SECONDS: Joi.number().integer().min(0).required(),
  REDIS_LINEUP_REQUEST_TTL_SECONDS: Joi.number().integer().min(60).default(24 * 60 * 60),
  PERMISSION_CACHE_TTL_SECONDS: Joi.number().integer().min(0).default(120),
  API_REQUEST_LOG_ENABLED: Joi.boolean().truthy("true").falsy("false").default(true),
  API_REQUEST_LOG_CAPTURE_REQUEST_BODY: Joi.boolean().truthy("true").falsy("false").default(true),
  API_REQUEST_LOG_CAPTURE_SUCCESS_RESPONSE: Joi.boolean().truthy("true").falsy("false").default(false),
  API_REQUEST_LOG_CAPTURE_ERROR_RESPONSE: Joi.boolean().truthy("true").falsy("false").default(true),
  API_REQUEST_LOG_RETENTION_DAYS: Joi.number().integer().min(1).default(14),
  CRON_LOG_RETENTION_DAYS: Joi.number().integer().min(1).default(30),
  APP_TIME_ZONE: Joi.string().valid("UTC").default("UTC"),
}).unknown(true);

const { error, value: envVars } = envSchema
  .prefs({ errors: { label: "key" } })
  .validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

const config = {
  env: envVars.NODE_ENV,
  port: envVars.PORT,
  host: envVars.HOST,
  upload: {
    avatarDir: path.resolve(envVars.AVATAR_UPLOAD_DIR),
    avatarUrlPath: envVars.AVATAR_URL_PATH,
    paymentDir: path.resolve(envVars.PAYMENT_UPLOAD_DIR),
    paymentUrlPath: envVars.PAYMENT_URL_PATH,
  },
  jwt: {
    secret: envVars.JWT_SECRET,
    expiresIn: envVars.JWT_EXPIRES_IN,
    refreshSecret: envVars.JWT_REFRESH_SECRET,
    refreshExpiresIn: envVars.JWT_REFRESH_EXPIRES_IN,
  },
  mysql: {
    host: envVars.DB_HOST,
    port: envVars.DB_PORT,
    database: envVars.DB_DATABASE,
    username: envVars.DB_USERNAME,
    password: envVars.DB_PASSWORD,
  },
  redis: {
    url: envVars.REDIS_URL,
    matchSetScoreTtlSeconds: envVars.REDIS_MATCH_SET_SCORE_TTL_SECONDS,
    lineupRequestTtlSeconds: envVars.REDIS_LINEUP_REQUEST_TTL_SECONDS,
  },
  permissionCache: {
    ttlSeconds: envVars.PERMISSION_CACHE_TTL_SECONDS,
  },
  logging: {
    apiRequest: {
      enabled: envVars.API_REQUEST_LOG_ENABLED,
      captureRequestBody: envVars.API_REQUEST_LOG_CAPTURE_REQUEST_BODY,
      captureSuccessResponse: envVars.API_REQUEST_LOG_CAPTURE_SUCCESS_RESPONSE,
      captureErrorResponse: envVars.API_REQUEST_LOG_CAPTURE_ERROR_RESPONSE,
      retentionDays: envVars.API_REQUEST_LOG_RETENTION_DAYS,
    },
    cronLogRetentionDays: envVars.CRON_LOG_RETENTION_DAYS,
  },
  app: {
    timeZone: envVars.APP_TIME_ZONE,
  },
  email: {
    smtp: {
      host: envVars.SMTP_HOST,
      port: envVars.SMTP_PORT,
      auth: {
        user: envVars.SMTP_USER,
        pass: envVars.SMTP_PASSWORD,
      },
    },
    from: {
      email: envVars.SMTP_FROM_EMAIL,
      name: envVars.SMTP_FROM_NAME,
    },
  },
};

export default config;
