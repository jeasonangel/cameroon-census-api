import dotenv from 'dotenv';
dotenv.config();

// Helper function to encode password
function encodePassword(password: string) {
  return encodeURIComponent(password);
}

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Build database URL with encoded password
  databaseUrl: process.env.DATABASE_URL || (() => {
    const user = process.env.PGUSER || 'postgres.pndihochpbghcphpwvbyx';
    const password = process.env.PGPASSWORD || 'Mesanges1234';
    const host = process.env.PGHOST || 'aws-1-eu-west-2.pooler.supabase.com';
    const port = process.env.PGPORT || '5432';
    const database = process.env.PGDATABASE || 'postgres';
    
    // Encode password for URL
    const encodedPassword = encodePassword(password);
    return `postgresql://${user}:${encodedPassword}@${host}:${port}/${database}`;
  })(),
  
  // Individual database params (for Supabase)
  db: {
    host: process.env.PGHOST || 'aws-1-eu-west-2.pooler.supabase.com',
    port: parseInt(process.env.PGPORT || '5432', 10),
    user: process.env.PGUSER || 'postgres.pndihochpbghcphpwvbyx',
    password: process.env.PGPASSWORD || 'Mesanges1234',
    database: process.env.PGDATABASE || 'postgres',
  },
  
  redisUrl: process.env.REDIS_URL || '',
  bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10),
  jwtSecret: process.env.JWT_SECRET || '7f3a9e2b4d1f8a6c3e5b7d9a2c4f6e8a',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  adminEmail: process.env.ADMIN_EMAIL || 'admin@census.cm',
  adminPassword: process.env.ADMIN_PASSWORD || 'Admin123!',
  corsOrigin: process.env.CORS_ORIGIN || 
    'https://frontend-production-1a46.up.railway.app,http://localhost:3000,http://localhost:5173',
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