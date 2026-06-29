// src/middleware/cors.ts
import { Request, Response, NextFunction } from 'express';

export const corsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin;
  
  // Allow all origins for testing
  const allowedOrigins = [
    'https://frontend-production-1a46.up.railway.app',
    'https://cameroon-census-frontend.up.railway.app',
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:4173',
  ];
  
  // Set CORS headers
  if (origin) {
    res.header('Access-Control-Allow-Origin', origin);
  } else {
    res.header('Access-Control-Allow-Origin', '*');
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key, X-Requested-With, Accept, Origin, Access-Control-Request-Method, Access-Control-Request-Headers');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Expose-Headers', 'Content-Range, X-Total-Count');
  res.header('Access-Control-Max-Age', '86400');
  
  // Log CORS
  if (origin) {
    console.log(`🌐 CORS: ${req.method} from ${origin} to ${req.path}`);
  }
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    console.log(`✅ CORS: Preflight handled for ${origin}`);
    return res.sendStatus(204);
  }
  
  next();
};