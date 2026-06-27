import { query } from '../db/pool';
import { pool } from '../db/pool';
async function refreshAnalyticsViews() {
    console.log('🔄 Refreshing analytics materialized views...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    try {
        // Refresh region summary
        console.log('  ▶️ Refreshing region_summary...');
        await query('REFRESH MATERIALIZED VIEW region_summary');
        console.log('  ✅ region_summary refreshed');

        // Refresh department rankings
        console.log('  ▶️ Refreshing department_rankings...');
        await query('REFRESH MATERIALIZED VIEW department_rankings');
        console.log('  ✅ department_rankings refreshed');

        console.log('\n✅ All analytics views refreshed successfully!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    } catch (error) {
        console.error('❌ Error refreshing analytics views:', error);
        throw error;
    } finally {
        await pool.end();
    }
}

refreshAnalyticsViews();