// src/middleware/either.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authenticate } from './auth.js';
import { config } from '../config/index.js';
import { query } from '../db/pool.js';
import { Unauthorized } from '../utils/errors.js';
import type { SessionPayload } from './session.js';

export async function authenticateOrSession(req: Request, res: Response, next: NextFunction) {
  const header = req.header('Authorization') || '';
  
  // ✅ Check for JWT (Bearer token)
  if (header.startsWith('Bearer ')) {
    try {
      const token = header.slice(7);
      const decoded = jwt.verify(token, config.jwtSecret) as SessionPayload;
      
      const { rows } = await query(
        `SELECT id, email, user_type, is_active, monthly_limit, requests_used
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
      req.authMethod = 'jwt';
      return next();
    } catch (e) {
      // JWT failed, try API key
      console.log('⚠️ JWT verification failed, trying API key...');
    }
  }
  
  // Fallback to API key
  return authenticate(req, res, next);
}