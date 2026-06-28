// src/database/index.ts
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

console.log('🔌 Initializing database connection...');

// Get connection string from environment
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ DATABASE_URL is not set in environment variables');
  process.exit(1);
}

// Create pool with connection string
const pool = new Pool({
  connectionString: databaseUrl,
  ssl: {
    rejectUnauthorized: false, // Required for Supabase
  },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Test connection on startup
pool.on('connect', () => {
  console.log('✅ Database connected successfully');
});

pool.on('error', (err) => {
  console.error('❌ Database error:', err.message);
});

// Export pool
export { pool };

// Test function
export async function testDatabaseConnection() {
  try {
    const result = await pool.query('SELECT NOW() as now');
    console.log('✅ Database test successful:', result.rows[0].now);
    return true;
  } catch (error) {
    console.error('❌ Database test failed:', error);
    return false;
  }
}

// Close pool gracefully
export async function closeDatabaseConnection() {
  await pool.end();
  console.log('✅ Database connection closed');
}