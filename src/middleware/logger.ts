import { Request, Response, NextFunction } from 'express';
import { query } from '../db/pool';

export function requestTimer(req: Request, _res: Response, next: NextFunction) {
  req.startTime = Date.now();
  next();
}

export function usageLogger(req: Request, res: Response, next: NextFunction) {
  res.on('finish', () => {
    if (!req.user) return; // only log authenticated calls
    const responseTime = req.startTime ? Date.now() - req.startTime : null;
    query(
      `INSERT INTO usage_logs (user_id, api_key_id, endpoint, method, status_code, response_time_ms, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        req.user.id,
        req.apiKeyId ?? null,
        req.originalUrl,
        req.method,
        res.statusCode,
        responseTime,
        req.ip ?? null,
      ]
    ).catch((e) => console.error('usage log error', e.message));
  });
  next();
}
