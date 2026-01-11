import Joi from "joi";

require("dotenv").config();

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
  DB_PORT: Joi.number().default(4000),
  DB_USERNAME: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),
  DB_DATABASE: Joi.string().required(),
  DB_SSL_CA_PATH: Joi.string().required(),

  //Email
  SMTP_HOST: Joi.string().required(),
  SMTP_PORT: Joi.number().default(587),
  SMTP_USER: Joi.string().required(),
  SMTP_PASSWORD: Joi.string().required(),
  SMTP_FROM_EMAIL: Joi.string().email().required(),
  SMTP_FROM_NAME: Joi.string().default("SmashHub"),
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
    ca: envVars.DB_SSL_CA_PATH,
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
