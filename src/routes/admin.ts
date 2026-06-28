// src/routes/admin.ts
import { Router, Request } from 'express';
import multer from 'multer';
import bcrypt from 'bcrypt';
import { parse } from 'csv-parse/sync';
import { z } from 'zod';
import { query, pool } from '../db/pool.js';
import { requireSession, requireSessionAdmin } from '../middleware/session.js';
import { config, RATE_LIMITS, USER_TYPES } from '../config/index.js';
import { generateApiKey, hashApiKey } from '../utils/apiKey.js';
import { BadRequest, Conflict, NotFound } from '../utils/errors.js';
import { cacheInvalidate } from '../db/redis.js';

const router = Router();

// ============================================================
// ✅ Helper: Get user ID safely
// ============================================================
function getUserId(req: Request): number {
  if (!req.user) {
    throw new Error('User not authenticated');
  }
  return req.user.id;
}

// ============================================================
// ✅ Helper: Audit logging
// ============================================================
async function audit(adminId: number, action: string, resource: string, details: string, ip: string | null) {
  await query(
    `INSERT INTO audit_logs (admin_id, action, resource, details, ip_address)
     VALUES ($1, $2, $3, $4, $5)`,
    [adminId, action, resource, details, ip]
  );
}

// ============================================================
// ✅ ADMIN MIDDLEWARE: JWT ONLY
// ============================================================
router.use(requireSession);
router.use(requireSessionAdmin);

// ============================================================
// ✅ GET /admin/users - List all users with API key count
// ============================================================
router.get('/users', async (_req, res, next) => {
    try {
        const { rows } = await query(`
            SELECT 
                u.id,
                u.email,
                u.full_name,
                u.organization,
                u.user_type,
                u.is_active,
                u.is_verified,
                u.monthly_limit,
                u.requests_used,
                u.is_unlimited,
                u.created_at,
                u.last_login,
                COUNT(ak.id) AS api_keys_count
            FROM users u
            LEFT JOIN api_keys ak ON ak.user_id = u.id AND ak.is_active = true
            GROUP BY u.id, u.email, u.full_name, u.organization, u.user_type, 
                     u.is_active, u.is_verified, u.monthly_limit, u.requests_used,
                     u.is_unlimited, u.created_at, u.last_login
            ORDER BY u.created_at DESC
            LIMIT 500
        `);
        res.json({ data: rows });
    } catch (e) {
        next(e);
    }
});

// ============================================================
// ✅ POST /admin/users - Create a new user
// ============================================================
const createUserSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    full_name: z.string().min(1).max(255),
    organization: z.string().max(255).optional(),
    user_type: z.enum(USER_TYPES),
    is_active: z.boolean().optional(),
});

router.post('/users', async (req, res, next) => {
    try {
        const body = createUserSchema.parse(req.body);
        const dup = await query(`SELECT id FROM users WHERE email = $1`, [body.email]);
        if (dup.rowCount > 0) throw Conflict('Email already exists');
        
        const hash = await bcrypt.hash(body.password, config.bcryptSaltRounds);
        const limit = RATE_LIMITS[body.user_type];
        
        const { rows } = await query(
            `INSERT INTO users (email, password_hash, full_name, organization, user_type, monthly_limit, is_active, is_verified)
             VALUES ($1,$2,$3,$4,$5,$6,$7,TRUE)
             RETURNING id, email, full_name, user_type, monthly_limit, is_active`,
            [body.email, hash, body.full_name, body.organization ?? null, body.user_type, limit, body.is_active ?? true]
        );
        
        const user = rows[0];
        const { raw, prefix } = generateApiKey();
        const keyHash = await hashApiKey(raw);
        
        await query(
            `INSERT INTO api_keys (user_id, name, key_hash, key_prefix) VALUES ($1,$2,$3,$4)`,
            [user.id, 'default', keyHash, prefix]
        );
        
        await audit(getUserId(req), 'CREATE_USER', `user:${user.id}`, body.email, req.ip ?? null);
        res.status(201).json({ data: { user, api_key: raw } });
    } catch (e) {
        next(e);
    }
});

// ============================================================
// ✅ DELETE /admin/users/:userId
// ============================================================
router.delete('/users/:userId', async (req, res, next) => {
    try {
        const id = parseInt(req.params.userId, 10);
        if (isNaN(id)) throw BadRequest('Invalid user id');
        
        const userId = getUserId(req);
        if (id === userId) throw BadRequest('You cannot delete yourself');
        
        const { rowCount } = await query(`DELETE FROM users WHERE id = $1`, [id]);
        if (rowCount === 0) throw NotFound('User not found');
        
        await audit(userId, 'DELETE_USER', `user:${id}`, '', req.ip ?? null);
        res.json({ data: { id, deleted: true } });
    } catch (e) {
        next(e);
    }
});

// ============================================================
// ✅ GET /admin/api-keys - List all API keys
// ============================================================
router.get('/api-keys', async (_req, res, next) => {
    try {
        const { rows } = await query(`
            SELECT 
                ak.id,
                ak.name,
                ak.key_prefix,
                ak.is_active,
                ak.created_at,
                ak.last_used,
                u.id AS user_id,
                u.email AS user_email,
                u.user_type
            FROM api_keys ak
            JOIN users u ON u.id = ak.user_id
            ORDER BY ak.created_at DESC
        `);
        res.json({ data: rows });
    } catch (e) {
        next(e);
    }
});

// ============================================================
// ✅ POST /admin/api-keys - Create admin API key
// ============================================================
router.post('/api-keys', async (req, res, next) => {
    try {
        const { name } = req.body;
        if (!name) throw BadRequest('Key name required');

        const userId = getUserId(req);

        const { raw, prefix } = generateApiKey();
        const keyHash = await hashApiKey(raw);

        await query(
            `INSERT INTO api_keys (user_id, name, key_hash, key_prefix, is_active)
             VALUES ($1, $2, $3, $4, true)`,
            [userId, name, keyHash, prefix]
        );

        await audit(userId, 'CREATE_API_KEY', `api_key:${name}`, '', req.ip ?? null);

        res.status(201).json({
            data: {
                name: name,
                api_key: raw,
                prefix: prefix,
                message: 'Store this API key securely. It will not be shown again.'
            }
        });
    } catch (e) {
        next(e);
    }
});

// ============================================================
// ✅ POST /admin/import - Import CSV data
// ============================================================
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 }
});

router.post('/import', upload.single('file'), async (req, res, next) => {
    const client = await pool.connect();
    try {
        if (!req.file) throw BadRequest('Missing "file" upload (multipart/form-data)');
        
        const records = parse(req.file.buffer, {
            columns: true,
            skip_empty_lines: true,
            trim: true,
        }) as Record<string, string>[];

        if (!records.length) throw BadRequest('Empty CSV');

        await client.query('BEGIN');
        let inserted = 0;
        let skipped = 0;
        
        for (const r of records) {
            const geoCode = r.geography_code;
            const indCode = r.indicator_code;
            const year = parseInt(r.year, 10);
            const value = parseFloat(r.value);
            
            if (!geoCode || !indCode || isNaN(year) || isNaN(value)) {
                skipped++;
                continue;
            }
            
            const geo = await client.query(`SELECT id FROM spatial_geo WHERE code = $1`, [geoCode]);
            const ind = await client.query(`SELECT id FROM indicators WHERE code = $1`, [indCode]);
            
            if (!geo.rowCount || !ind.rowCount) {
                skipped++;
                continue;
            }
            
            await client.query(
                `INSERT INTO data_values (geography_id, indicator_id, year, value, gender, age_group, source)
                 VALUES ($1,$2,$3,$4,$5,$6,$7)
                 ON CONFLICT (geography_id, indicator_id, year, gender, age_group)
                 DO UPDATE SET value = EXCLUDED.value, source = EXCLUDED.source, last_updated = now()`,
                [
                    geo.rows[0].id,
                    ind.rows[0].id,
                    year,
                    value,
                    r.gender || 'all',
                    r.age_group || 'all',
                    r.source || null,
                ]
            );
            inserted++;
        }
        
        await client.query('COMMIT');
        await cacheInvalidate('data:*');
        await cacheInvalidate('indicators:*');
        
        await audit(getUserId(req), 'IMPORT_DATA', 'data_values', `inserted=${inserted}, skipped=${skipped}`, req.ip ?? null);
        res.json({ data: { inserted, skipped, total: records.length } });
    } catch (e) {
        await client.query('ROLLBACK').catch(() => {});
        next(e);
    } finally {
        client.release();
    }
});

// ============================================================
// ✅ GET /admin/logs - System logs
// ============================================================
router.get('/logs', async (req, res, next) => {
    try {
        const limit = Math.min(parseInt(String(req.query.limit || '100'), 10), 1000);
        
        const { rows: usage } = await query(
            `SELECT ul.id, ul.user_id, u.email, ul.endpoint, ul.method, ul.status_code,
                    ul.response_time_ms, ul.ip_address, ul.timestamp
             FROM usage_logs ul LEFT JOIN users u ON u.id = ul.user_id
             ORDER BY ul.timestamp DESC LIMIT $1`,
            [limit]
        );
        
        const { rows: audits } = await query(
            `SELECT al.id, al.admin_id, u.email AS admin_email, al.action, al.resource,
                    al.details, al.ip_address, al.timestamp
             FROM audit_logs al LEFT JOIN users u ON u.id = al.admin_id
             ORDER BY al.timestamp DESC LIMIT $1`,
            [limit]
        );
        
        res.json({ data: { usage, audits } });
    } catch (e) {
        next(e);
    }
});


// ============================================================
// ✅ GET /admin/settings - Load system settings
// ============================================================
router.get('/settings', async (_req, res, next) => {
    try {
        const { rows } = await query(`
            SELECT config_key, config_value, description, updated_at
            FROM system_config
            ORDER BY config_key
        `);
        
        // Convert to key-value object
        const settings: Record<string, any> = {};
        for (const row of rows) {
            // Try to parse JSON values
            try {
                settings[row.config_key] = JSON.parse(row.config_value);
            } catch {
                settings[row.config_key] = row.config_value;
            }
        }
        
        res.json({ data: settings });
    } catch (e) {
        next(e);
    }
});

// ============================================================
// ✅ POST /admin/settings - Save system settings
// ============================================================
router.post('/settings', async (req, res, next) => {
    try {
        const settings = req.body;
        
        // Start transaction
        await query('BEGIN');
        
        for (const [key, value] of Object.entries(settings)) {
            // Convert value to JSON string for storage
            const jsonValue = JSON.stringify(value);
            
            await query(
                `INSERT INTO system_config (config_key, config_value, updated_at)
                 VALUES ($1, $2, NOW())
                 ON CONFLICT (config_key) 
                 DO UPDATE SET config_value = EXCLUDED.config_value, updated_at = NOW()`,
                [key, jsonValue]
            );
        }
        
        await query('COMMIT');
        
        // Log the action
        await audit(getUserId(req), 'UPDATE_SETTINGS', 'system_config', 
            `Updated ${Object.keys(settings).length} settings`, req.ip ?? null);
        
        res.json({ 
            data: { 
                message: 'Settings saved successfully',
                updated: Object.keys(settings)
            } 
        });
    } catch (e) {
        await query('ROLLBACK');
        next(e);
    }
});

// ============================================================
// ✅ GET /admin/stats - System statistics
// ============================================================


router.get('/stats', async (_req, res, next) => {
    try {
        // ✅ Get all counts in a single query
        const { rows } = await query(`
            SELECT 
                (SELECT COUNT(*) FROM users) AS users,
                (SELECT COUNT(*) FROM users WHERE is_active = TRUE) AS active_users,
                (SELECT COUNT(*) FROM api_keys WHERE is_active = TRUE) AS active_keys,
                (SELECT COUNT(*) FROM api_keys) AS total_keys,
                (SELECT COUNT(*) FROM spatial_geo) AS geographies,
                (SELECT COUNT(*) FROM spatial_geo WHERE level = 'region') AS regions,
                (SELECT COUNT(*) FROM spatial_geo WHERE level = 'department') AS departments,
                (SELECT COUNT(*) FROM spatial_geo WHERE level = 'district') AS districts,
                (SELECT COUNT(*) FROM spatial_geo WHERE level = 'village') AS villages,
                (SELECT COUNT(*) FROM indicators WHERE is_active = TRUE) AS indicators,
                (SELECT COUNT(*) FROM data_values) AS data_values,
                (SELECT COUNT(*) FROM usage_logs WHERE timestamp > now() - interval '24 hours') AS requests_24h,
                (SELECT COUNT(*) FROM usage_logs WHERE timestamp > now() - interval '7 days') AS requests_7d,
                (SELECT COUNT(*) FROM usage_logs WHERE timestamp > now() - interval '30 days') AS requests_30d
        `);
        
        // ✅ Also get users by type
        const { rows: byType } = await query(`
            SELECT user_type, COUNT(*) AS count 
            FROM users 
            GROUP BY user_type 
            ORDER BY user_type
        `);
        
        res.json({ 
            data: { 
                ...rows[0],
                users_by_type: byType 
            } 
        });
    } catch (e) {
        next(e);
    }
});

export default router;