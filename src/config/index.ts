import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL,
  // Only use Redis if REDIS_URL is explicitly set and not localhost
  redisUrl: (process.env.REDIS_URL && process.env.REDIS_URL !== 'redis://localhost:6379') 
    ? process.env.REDIS_URL 
    : '',
  bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10),
  jwtSecret: process.env.JWT_SECRET || 'change-me-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  adminEmail: process.env.ADMIN_EMAIL || 'admin@census.cm',
  adminPassword: process.env.ADMIN_PASSWORD || 'ChangeMe!2024',
  corsOrigin: process.env.CORS_ORIGIN || '*',
};

// Small free-tier limits. Admin uses dashboard (no API key required).
export const RATE_LIMITS: Record<string, number> = {
  ADMIN: -1, // unlimited via dashboard, no API key
  NGO_DEVELOPER: 2000,
  NGO_DATA_ANALYST: 1000,
  NGO_PROJECT_MANAGER: 500,
  RESEARCHER: 200,
  JOURNALIST: 200,
  PUBLIC: 50, // default free tier before upgrade request
};

export const USER_TYPES = [
  'ADMIN',
  'NGO_DEVELOPER',
  'NGO_DATA_ANALYST',
  'NGO_PROJECT_MANAGER',
  'RESEARCHER',
  'JOURNALIST',
  'PUBLIC',
] as const;

export type UserType = (typeof USER_TYPES)[number];