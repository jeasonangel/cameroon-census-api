import { Pool } from 'pg';
import { config } from '../config';

export const pool = new Pool(
  config.databaseUrl
    ? { connectionString: config.databaseUrl }
    : {} // falls back to PGHOST/PGUSER/... env vars
);

pool.on('error', (err) => {
  console.error('Unexpected PG pool error', err);
});

export async function query<T = any>(text: string, params?: any[]): Promise<{ rows: T[]; rowCount: number }> {
  const res = await pool.query(text, params);
  return { rows: res.rows as T[], rowCount: res.rowCount ?? 0 };
}
