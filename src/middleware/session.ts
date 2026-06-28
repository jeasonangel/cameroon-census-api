// src/middleware/session.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { query } from '../db/pool.js';
import { Unauthorized, Forbidden } from '../utils/errors.js';

export interface SessionPayload {
  uid: number;
  email: string;
  user_type: string;
}

export function signSession(payload: SessionPayload): string {
  // ✅ DEFINITIVE FIX: Use type assertion with 'as any'
  const secret = config.jwtSecret as any;
  const expiresIn = config.jwtExpiresIn || '7d';
  return jwt.sign(payload, secret, { expiresIn } as any);
}

export async function requireSession(req: Request, _res: Response, next: NextFunction) {
  try {
    const header = req.header('Authorization') || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : '';
    if (!token) throw Unauthorized('Missing Bearer token');
    
    let decoded: SessionPayload;
    try {
      decoded = jwt.verify(token, config.jwtSecret as any) as SessionPayload;
    } catch {
      throw Unauthorized('Invalid or expired session');
    }
    
    const { rows } = await query(
      `SELECT id, email, full_name, user_type, monthly_limit, requests_used, is_active
       FROM users WHERE id = $1`,
      [decoded.uid]
    );
    
    const user = rows[0];
    if (!user || !user.is_active) throw Unauthorized('Account not active');
    
    req.user = {
      id: user.id,
      email: user.email,
      user_type: user.user_type,
      monthly_limit: user.monthly_limit,
      requests_used: user.requests_used,
      is_unlimited: user.user_type === 'ADMIN',
    };
    (req as any).fullName = user.full_name;
    next();
  } catch (e) {
    next(e);
  }
}

export function requireSessionAdmin(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) return next(Unauthorized());
  if (req.user.user_type !== 'ADMIN') return next(Forbidden('Admin only'));
  next();
}