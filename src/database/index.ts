// src/database/index.ts
import { Pool } from 'pg';
import { config } from '../config/index.js';

console.log('🔌 Initializing database connection...');

// Use config from config/index.ts
const pool = new Pool({
  connectionString: config.databaseUrl,
  ssl: {
    rejectUnauthorized: false,
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