// scripts/enable-postgis.ts
import { query } from '../db/pool.js';

async function enablePostGIS() {
  try {
    console.log('🔄 Enabling PostGIS extension...');
    await query('CREATE EXTENSION IF NOT EXISTS postgis;');
    await query('CREATE EXTENSION IF NOT EXISTS postgis_topology;');
    console.log('✅ PostGIS enabled successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error enabling PostGIS:', error);
    process.exit(1);
  }
}

enablePostGIS();