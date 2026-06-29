import { Router } from 'express';
import { stringify } from 'csv-stringify/sync';
import { query } from '../db/pool.js';
import { authenticateOrSession as authenticate } from '../middleware/either.js';
import { cacheGet, cacheSet, CACHE_TTL } from '../db/redis.js';
import { BadRequest } from '../utils/errors.js';

const router = Router();

// No router.use(authenticate) — applied per-route below

async function fetchData(geo?: string, ind?: string, year?: number) {
  const where: string[] = [];
  const params: any[] = [];
  if (geo) { params.push(geo); where.push(`g.code = $${params.length}`); }
  if (ind) { params.push(ind); where.push(`i.code = $${params.length}`); }
  if (year) { params.push(year); where.push(`dv.year = $${params.length}`); }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const { rows } = await query(`
    SELECT g.code AS geography_code, g.name AS geography_name, g.level AS geography_level,
           i.code AS indicator_code, i.name AS indicator_name, i.unit, i.category,
           dv.year, dv.value, dv.gender, dv.age_group, dv.source, dv.last_updated
    FROM data_values dv
    JOIN spatial_geo g ON g.id = dv.geography_id
    JOIN indicators i ON i.id = dv.indicator_id
    ${whereSql}
    ORDER BY g.name, i.code, dv.year DESC
    LIMIT 5000
  `, params);
  return rows;
}

router.get('/data', authenticate, async (req, res, next) => {
  try {
    const geo = req.query.geography ? String(req.query.geography) : undefined;
    const ind = req.query.indicator ? String(req.query.indicator) : undefined;
    const year = req.query.year ? parseInt(String(req.query.year), 10) : undefined;
    if (year !== undefined && (isNaN(year) || year < 1900 || year > 2100)) throw BadRequest('Invalid year');
    const key = `data:${geo ?? ''}:${ind ?? ''}:${year ?? ''}`;
    const hit = await cacheGet<any[]>(key);
    if (hit) return res.json({ data: hit });
    const rows = await fetchData(geo, ind, year);
    await cacheSet(key, rows, CACHE_TTL);
    res.json({ data: rows });
  } catch (e) { next(e); }
});

router.get('/indicators', authenticate, async (_req, res, next) => {
  try {
    const cacheKey = 'indicators:all';
    const hit = await cacheGet<any[]>(cacheKey);
    if (hit) return res.json({ data: hit });
    const { rows } = await query(
      `SELECT id, code, name, description, unit, category, source
       FROM indicators WHERE is_active = TRUE ORDER BY category, code`
    );
    await cacheSet(cacheKey, rows, CACHE_TTL);
    res.json({ data: rows });
  } catch (e) { next(e); }
});

router.get('/export', authenticate, async (req, res, next) => {
  try {
    const geo = req.query.geography ? String(req.query.geography) : undefined;
    const ind = req.query.indicator ? String(req.query.indicator) : undefined;
    const year = req.query.year ? parseInt(String(req.query.year), 10) : undefined;
    const format = String(req.query.format || 'csv').toLowerCase();
    if (format !== 'csv') throw BadRequest('Only csv format is supported');
    const rows = await fetchData(geo, ind, year);
    const csv = stringify(rows, { header: true });
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="census-export.csv"`);
    res.send(csv);
  } catch (e) { next(e); }
});

export default router;