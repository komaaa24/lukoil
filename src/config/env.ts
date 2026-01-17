import { config as loadEnv } from 'dotenv';
import { z } from 'zod';

loadEnv();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  BOT_TOKEN: z.string().min(1, 'BOT_TOKEN is required'),
  ADMIN_API_KEY: z.string().optional(),
  HMAC_SECRET: z.string().default('change-me-hmac'),
  DATABASE_URL: z.string().optional(),
  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.coerce.number().default(5432),
  DB_USERNAME: z.string().default('postgres'),
  DB_PASSWORD: z.string().default('postgres'),
  DB_NAME: z.string().default('engine_bot'),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  WEBHOOK_URL: z.string().optional(),
  WEBHOOK_SECRET_TOKEN: z.string().optional(),
  PORT: z.coerce.number().default(3000),
  SEED_SUPER_ADMIN_TELEGRAM_ID: z.string().optional(),
  LOG_LEVEL: z.string().default('info'),
});

export type AppEnv = z.infer<typeof envSchema>;

export const env: AppEnv = envSchema.parse(process.env);
