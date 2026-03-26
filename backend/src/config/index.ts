// Application Configuration
// Environment-based configuration with validation

import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  // Server
  PORT: z.string().default('3001'),
  HOST: z.string().default('0.0.0.0'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Database
  DATABASE_URL: z.string().url(),

  // Redis
  REDIS_URL: z.string().optional(),

  // JWT
  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  // CORS
  CORS_ORIGIN: z.string().default('http://localhost:3000'),

  // Google OAuth (Optional)
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_CALLBACK_URL: z.string().url().optional(),

  // AWS S3 (Optional)
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_REGION: z.string().default('us-east-1'),
  AWS_BUCKET_NAME: z.string().optional(),

  // Cloudinary (Optional)
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),

  // Logging
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

  // Rate Limiting
  RATE_LIMIT_MAX: z.coerce.number().default(100),
  RATE_LIMIT_TIME_WINDOW: z.coerce.number().default(1000),
});

export type EnvConfig = z.infer<typeof envSchema>;

let cachedConfig: EnvConfig | null = null;

export function getConfig(): EnvConfig {
  if (cachedConfig) {
    return cachedConfig;
  }

  const rawConfig = {
    PORT: process.env.PORT,
    HOST: process.env.HOST,
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL: process.env.DATABASE_URL,
    REDIS_URL: process.env.REDIS_URL,
    JWT_SECRET: process.env.JWT_SECRET,
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,
    JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN,
    CORS_ORIGIN: process.env.CORS_ORIGIN,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL,
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
    AWS_REGION: process.env.AWS_REGION,
    AWS_BUCKET_NAME: process.env.AWS_BUCKET_NAME,
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
    LOG_LEVEL: process.env.LOG_LEVEL,
    RATE_LIMIT_MAX: process.env.RATE_LIMIT_MAX,
    RATE_LIMIT_TIME_WINDOW: process.env.RATE_LIMIT_TIME_WINDOW,
  };

  const result = envSchema.safeParse(rawConfig);

  if (!result.success) {
    const errors = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
    throw new Error(`Invalid configuration:\n${errors.join('\n')}`);
  }

  cachedConfig = result.data;
  return cachedConfig;
}

// Convenience getters
export const config = {
  get server() {
    const c = getConfig();
    return {
      port: parseInt(c.PORT, 10),
      host: c.HOST,
      env: c.NODE_ENV,
      isDev: c.NODE_ENV === 'development',
      isProd: c.NODE_ENV === 'production',
      isTest: c.NODE_ENV === 'test',
    };
  },
  get database() {
    return { url: getConfig().DATABASE_URL };
  },
  get redis() {
    return { url: getConfig().REDIS_URL };
  },
  get jwt() {
    const c = getConfig();
    return {
      secret: c.JWT_SECRET,
      refreshSecret: c.JWT_REFRESH_SECRET,
      expiresIn: c.JWT_EXPIRES_IN,
      refreshExpiresIn: c.JWT_REFRESH_EXPIRES_IN,
    };
  },
  get cors() {
    return { origin: getConfig().CORS_ORIGIN };
  },
  get google() {
    const c = getConfig();
    return {
      clientId: c.GOOGLE_CLIENT_ID,
      clientSecret: c.GOOGLE_CLIENT_SECRET,
      callbackUrl: c.GOOGLE_CALLBACK_URL,
    };
  },
  get logging() {
    return { level: getConfig().LOG_LEVEL };
  },
};
