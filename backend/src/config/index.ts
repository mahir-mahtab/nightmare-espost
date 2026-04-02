import 'dotenv/config';

export const config = {
  // Server
  PORT: Number(process.env.PORT ?? 4000),
  FRONTEND_ORIGIN: process.env.FRONTEND_ORIGIN ?? 'http://localhost:5173',

  // PostgreSQL
  POSTGRES_HOST: process.env.POSTGRES_HOST ?? 'localhost',
  POSTGRES_PORT: Number(process.env.POSTGRES_PORT ?? 5432),
  POSTGRES_DB: process.env.POSTGRES_DB ?? 'esports',
  POSTGRES_USER: process.env.POSTGRES_USER ?? 'postgres',
  POSTGRES_PASSWORD: process.env.POSTGRES_PASSWORD ?? 'postgres',

  // Redis
  REDIS_URL: process.env.REDIS_URL ?? 'redis://localhost:6379',

  // Environment
  NODE_ENV: process.env.NODE_ENV ?? 'development',
};
