// src/database/index.ts
import { Pool } from 'pg';

console.log('🔌 Initializing database connection...');

// Use individual connection parameters
const pool = new Pool({
  host: process.env.PGHOST || 'aws-1-eu-west-2.pooler.supabase.com',
  port: parseInt(process.env.PGPORT || '5432', 10),
  user: process.env.PGUSER || 'postgres.pndihochpbghcphpwvbyx',
  password: process.env.PGPASSWORD || 'Mesanges1234',
  database: process.env.PGDATABASE || 'postgres',
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