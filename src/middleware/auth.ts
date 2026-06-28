// src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import { query } from '../db/pool.js';
import { compareApiKey } from '../utils/apiKey.js';
import { Unauthorized, TooManyRequests, Forbidden } from '../utils/errors.js';

/**
 * authenticate — validates X-API-Key on data endpoints.
 * 
 * ✅ Regular users: Must use API keys
 * ✅ Admins: CAN use API keys for scripts and automation
 * ❌ Admins: Should NOT use API keys for dashboard (use JWT instead)
 */
export async function authenticate(req: Request, _res: Response, next: NextFunction) {
    try {
        const raw = req.header('X-API-Key');
        if (!raw) {
            throw Unauthorized('Missing X-API-Key header. Create one in your dashboard.');
        }

        const prefix = raw.slice(0, 12);

        const { rows } = await query<{
            id: number;
            user_id: number;
            key_hash: string;
            is_active: boolean;
        }>(
            `SELECT id, user_id, key_hash, is_active
             FROM api_keys
             WHERE key_prefix = $1 AND is_active = TRUE`,
            [prefix]
        );

        let matched: { id: number; user_id: number } | null = null;
        for (const row of rows) {
            if (await compareApiKey(raw, row.key_hash)) {
                matched = { id: row.id, user_id: row.user_id };
                break;
            }
        }
        
        if (!matched) {
            throw Unauthorized('Invalid API key');
        }

        // Get user info
        const { rows: userRows } = await query(
            `SELECT id, email, user_type, is_active, monthly_limit, requests_used
             FROM users WHERE id = $1`,
            [matched.user_id]
        );
        
        const user = userRows[0];
        if (!user) throw Unauthorized('User not found');
        if (!user.is_active) throw Forbidden('Account is not active');
        
        // ✅ ALLOW ADMIN to use API keys (for scripts)
        // But admins should still have limits (unlimited for admin)
        if (user.user_type === 'ADMIN') {
            req.user = {
                id: user.id,
                email: user.email,
                user_type: user.user_type,
                monthly_limit: 9999999, // Unlimited for admin
                requests_used: 0,
                is_unlimited: true,
            };
            req.apiKeyId = matched.id;
            
            // Update last_used
            await query(`UPDATE api_keys SET last_used = now() WHERE id = $1`, [matched.id]);
            
            return next();
        }

        // ============================================================
        // Regular users: Check monthly limits
        // ============================================================
        
        // Monthly reset
        await query(
            `UPDATE users
             SET requests_used = CASE
                 WHEN date_trunc('month', now()) > date_trunc('month', updated_at) THEN 0
                 ELSE requests_used
             END,
             updated_at = now()
             WHERE id = $1`,
            [user.id]
        );
        
        const fresh = await query<{ requests_used: number }>(
            `SELECT requests_used FROM users WHERE id = $1`,
            [user.id]
        );
        
        const requestsUsed = fresh.rows[0].requests_used;

        // Check limit
        if (requestsUsed >= user.monthly_limit) {
            throw TooManyRequests(
                `Monthly quota of ${user.monthly_limit} requests reached. Upgrade your plan from the dashboard.`
            );
        }

        // Increment usage
        await query(`UPDATE users SET requests_used = requests_used + 1 WHERE id = $1`, [user.id]);
        await query(`UPDATE api_keys SET last_used = now() WHERE id = $1`, [matched.id]);

        req.user = {
            id: user.id,
            email: user.email,
            user_type: user.user_type,
            monthly_limit: user.monthly_limit,
            requests_used: requestsUsed + 1,
            is_unlimited: false,
        };
        req.apiKeyId = matched.id;
        
        next();
    } catch (err) {
        next(err);
    }
}

export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
    if (!req.user) {
        return next(Unauthorized('Authentication required'));
    }
    if (req.user.user_type !== 'ADMIN') {
        return next(Forbidden('Admin access required'));
    }
    next();
}

// ============================================================
// Optional: Check if user is authenticated (JWT or API Key)
// ============================================================
export function isAuthenticated(req: Request): boolean {
    return !!req.user;
}

// ============================================================
// Optional: Get auth method used
// ============================================================
export function getAuthMethod(req: Request): 'jwt' | 'api_key' | null {
    return req.authMethod || null;
}