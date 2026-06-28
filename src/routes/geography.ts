import { Router } from 'express';
import { query } from '../db/pool.js';
import { authenticateOrSession as authenticate } from '../middleware/either.js'; // ✅ Added .js
import { cacheGet, cacheSet, CACHE_TTL } from '../db/redis.js';
import { BadRequest, NotFound } from '../utils/errors.js';

const router = Router();
router.use(authenticate);

async function withCache<T>(key: string, ttl: number, fn: () => Promise<T>): Promise<T> {
  const hit = await cacheGet<T>(key);
  if (hit) return hit;
  const data = await fn();
  await cacheSet(key, data, ttl);
  return data;
}

router.get('/regions', async (_req, res, next) => {
  try {
    const data = await withCache('geo:regions', CACHE_TTL, async () => {
      const { rows } = await query(
        `SELECT id, code, name, population, area_km2, latitude, longitude
         FROM spatial_geo WHERE level = 'region' ORDER BY name`
      );
      return rows;
    });
    res.json({ data });
  } catch (e) {
    next(e);
  }
});

router.get('/regions/:regionCode/departments', async (req, res, next) => {
  try {
    const code = req.params.regionCode;
    const data = await withCache(`geo:dept:${code}`, CACHE_TTL, async () => {
      const parent = await query(`SELECT id FROM spatial_geo WHERE code = $1 AND level = 'region'`, [code]);
      if (parent.rowCount === 0) throw NotFound('Region not found');
      const { rows } = await query(
        `SELECT id, code, name, population, area_km2, latitude, longitude
         FROM spatial_geo WHERE level = 'department' AND parent_id = $1 ORDER BY name`,
        [parent.rows[0].id]
      );
      return rows;
    });
    res.json({ data });
  } catch (e) {
    next(e);
  }
});

router.get('/departments/:departmentCode/districts', async (req, res, next) => {
  try {
    const code = req.params.departmentCode;
    const data = await withCache(`geo:dist:${code}`, CACHE_TTL, async () => {
      const parent = await query(`SELECT id FROM spatial_geo WHERE code = $1 AND level = 'department'`, [code]);
      if (parent.rowCount === 0) throw NotFound('Department not found');
      const { rows } = await query(
        `SELECT id, code, name, population, area_km2, latitude, longitude
         FROM spatial_geo WHERE level = 'district' AND parent_id = $1 ORDER BY name`,
        [parent.rows[0].id]
      );
      return rows;
    });
    res.json({ data });
  } catch (e) {
    next(e);
  }
});

router.get('/districts/:districtCode/villages', async (req, res, next) => {
  try {
    const code = req.params.districtCode;
    const data = await withCache(`geo:vill:${code}`, CACHE_TTL, async () => {
      const parent = await query(`SELECT id FROM spatial_geo WHERE code = $1 AND level = 'district'`, [code]);
      if (parent.rowCount === 0) throw NotFound('District not found');
      const { rows } = await query(
        `SELECT id, code, name, population, area_km2, latitude, longitude
         FROM spatial_geo WHERE level = 'village' AND parent_id = $1 ORDER BY name`,
        [parent.rows[0].id]
      );
      return rows;
    });
    res.json({ data });
  } catch (e) {
    next(e);
  }
});

router.get('/search', async (req, res, next) => {
  try {
    const q = String(req.query.q || '').trim();
    if (q.length < 2) throw BadRequest('Query must be at least 2 characters');
    const { rows } = await query(
      `SELECT id, code, name, level, population
       FROM spatial_geo WHERE name ILIKE $1 ORDER BY level, name LIMIT 50`,
      [`%${q}%`]
    );
    res.json({ data: rows });
  } catch (e) {
    next(e);
  }
});

export default router;