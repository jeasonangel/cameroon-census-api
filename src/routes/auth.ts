import { Router } from 'express';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { query } from '../db/pool';
import { config, RATE_LIMITS, USER_TYPES } from '../config';
import { generateApiKey, hashApiKey } from '../utils/apiKey';
import { BadRequest, Conflict, Unauthorized, NotFound, Forbidden } from '../utils/errors';
import { requireSession, signSession } from '../middleware/session';

const router = Router();

const registerSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(8).max(128),
  full_name: z.string().min(1).max(255),
  organization: z.string().max(255).optional(),
  user_type: z
    .enum(USER_TYPES)
    .refine((v) => v !== 'ADMIN', { message: 'ADMIN accounts must be created by an existing admin' })
    .default('PUBLIC'),
});

router.post('/register', async (req, res, next) => {
  try {
    const body = registerSchema.parse(req.body);
    const existing = await query(`SELECT id FROM users WHERE email = $1`, [body.email]);
    if (existing.rowCount && existing.rowCount > 0) throw Conflict('Email already registered');

    const pwdHash = await bcrypt.hash(body.password, config.bcryptSaltRounds);
    const monthlyLimit = RATE_LIMITS[body.user_type] ?? RATE_LIMITS.PUBLIC;

    const { rows } = await query(
      `INSERT INTO users (email, password_hash, full_name, organization, user_type, monthly_limit, is_active, is_verified)
       VALUES ($1,$2,$3,$4,$5,$6, TRUE, FALSE)
       RETURNING id, email, full_name, user_type, monthly_limit, organization, is_active, created_at`,
      [body.email, pwdHash, body.full_name, body.organization ?? null, body.user_type, monthlyLimit]
    );
    const user = rows[0];
    const token = signSession({ uid: user.id, email: user.email, user_type: user.user_type });
    // NOTE: no API key is created automatically. User must click "Create API Key" in dashboard.
    res.status(201).json({ data: { user, token } });
  } catch (e) {
    next(e);
  }
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post('/login', async (req, res, next) => {
  try {
    const body = loginSchema.parse(req.body);
    const { rows } = await query(
      `SELECT id, email, password_hash, full_name, user_type, monthly_limit, requests_used, organization, is_active
       FROM users WHERE email = $1`,
      [body.email]
    );
    const user = rows[0];
    if (!user) throw Unauthorized('Invalid credentials');
    if (!user.is_active) throw Unauthorized('Account not active');
    const ok = await bcrypt.compare(body.password, user.password_hash);
    if (!ok) throw Unauthorized('Invalid credentials');

    await query(`UPDATE users SET last_login = now() WHERE id = $1`, [user.id]);

    const token = signSession({ uid: user.id, email: user.email, user_type: user.user_type });
    res.json({
      data: {
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          user_type: user.user_type,
          organization: user.organization,
          monthly_limit: user.monthly_limit,
          requests_used: user.requests_used,
        },
        token,
      },
    });
  } catch (e) {
    next(e);
  }
});

// --- Authenticated dashboard endpoints (JWT) ---
router.use(requireSession);

router.get('/me', async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT id, email, full_name, user_type, organization, monthly_limit, requests_used, is_unlimited, created_at, last_login
       FROM users WHERE id = $1`,
      [req.user!.id]
    );
    res.json({ data: rows[0] });
  } catch (e) {
    next(e);
  }
});

const createKeySchema = z.object({ name: z.string().min(1).max(100) });

router.post('/keys', async (req, res, next) => {
  try {
    if (req.user!.user_type === 'ADMIN') {
      throw Forbidden('Admin accounts do not use API keys — full access is via the dashboard.');
    }
    const body = createKeySchema.parse(req.body);
    const { raw, prefix } = generateApiKey();
    const keyHash = await hashApiKey(raw);
    const { rows } = await query(
      `INSERT INTO api_keys (user_id, name, key_hash, key_prefix) VALUES ($1,$2,$3,$4)
       RETURNING id, name, key_prefix, is_active, created_at`,
      [req.user!.id, body.name, keyHash, prefix]
    );
    res.status(201).json({ data: { ...rows[0], api_key: raw } });
  } catch (e) {
    next(e);
  }
});

router.get('/keys', async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT id, name, key_prefix, is_active, created_at, last_used
       FROM api_keys WHERE user_id = $1 ORDER BY created_at DESC`,
      [req.user!.id]
    );
    res.json({ data: rows });
  } catch (e) {
    next(e);
  }
});

router.delete('/keys/:keyId', async (req, res, next) => {
  try {
    const keyId = parseInt(req.params.keyId, 10);
    if (isNaN(keyId)) throw BadRequest('Invalid key id');
    const { rowCount } = await query(
      `UPDATE api_keys SET is_active = FALSE WHERE id = $1 AND user_id = $2`,
      [keyId, req.user!.id]
    );
    if (!rowCount) throw NotFound('Key not found');
    res.json({ data: { id: keyId, revoked: true } });
  } catch (e) {
    next(e);
  }
});

router.get('/usage', async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT id, email, user_type, monthly_limit, requests_used, is_unlimited
       FROM users WHERE id = $1`,
      [req.user!.id]
    );
    const recent = await query(
      `SELECT date_trunc('day', timestamp) AS day, COUNT(*)::int AS requests
       FROM usage_logs WHERE user_id = $1 AND timestamp > now() - interval '30 days'
       GROUP BY day ORDER BY day DESC`,
      [req.user!.id]
    );
    res.json({ data: { account: rows[0], last_30_days: recent.rows } });
  } catch (e) {
    next(e);
  }
});

export default router;
