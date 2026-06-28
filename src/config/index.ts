import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10), // ✅ Changed to 5000
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL,
  
  // Redis config - only use if provided
  redisUrl: process.env.REDIS_URL || '',
  
  bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10),
  jwtSecret: process.env.JWT_SECRET || 'change-me-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  
  adminEmail: process.env.ADMIN_EMAIL || 'admin@census.cm',
  adminPassword: process.env.ADMIN_PASSWORD || 'ChangeMe!2024',
  
  // ✅ Updated CORS for Railway
  corsOrigin: process.env.CORS_ORIGIN || 
    'https://census-frontend.up.railway.app,http://localhost:3000,http://localhost:5173',
};

// Rate limits per user type
export const RATE_LIMITS: Record<string, number> = {
  ADMIN: -1, // unlimited
  NGO_DEVELOPER: 2000,
  NGO_DATA_ANALYST: 1000,
  NGO_PROJECT_MANAGER: 500,
  RESEARCHER: 200,
  JOURNALIST: 200,
  PUBLIC: 50,
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