import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3000'),
  ADMIN_PASSWORD: z.string().min(6),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('8h'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  DEFAULT_AUCTION_WINDOW_SECONDS: z.string().default('30'),
  BID_INCREMENTS: z.string().default('100,500,1000'),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('❌ Invalid environment variables:', parsedEnv.error.format());
  process.exit(1);
}

export const env = {
  ...parsedEnv.data,
  PORT: parseInt(parsedEnv.data.PORT, 10),
  DEFAULT_AUCTION_WINDOW_SECONDS: parseInt(parsedEnv.data.DEFAULT_AUCTION_WINDOW_SECONDS, 10),
  BID_INCREMENTS: parsedEnv.data.BID_INCREMENTS.split(',').map(Number),
};
