import { query } from '../db/pool.js';
import * as fs from 'fs';
import * as path from 'path';
import { pool } from '../db/pool.js';
async function createAnalyticsViews() {
    console.log('🗃️ Creating analytics materialized views...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    try {
        // Read the SQL file
        const sqlPath = path.join(__dirname, '../db/analytics_views.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        
        // Split into individual statements (by semicolon)
        const statements = sql.split(';').filter(s => s.trim().length > 0);
        
        for (const statement of statements) {
            if (statement.trim().startsWith('--')) continue;
            console.log(`  ▶️ Executing: ${statement.substring(0, 60)}...`);
            await query(statement);
        }
        
        console.log('\n✅ All analytics views created successfully!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
    } catch (error) {
        console.error('❌ Error creating analytics views:', error);
        throw error;
    } finally {
        await pool.end();
    }
}

createAnalyticsViews();