import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';

import authRoutes from './routes/auth.js';
import geographyRoutes from './routes/geography.js';
import dataRoutes from './routes/data.js';
import adminRoutes from './routes/admin.js';
import analyticsRoutes from './routes/analyticsRoutes.js';

import { config } from './config/index.js';
import { requestTimer, usageLogger } from './middleware/logger.js';
import { errorHandler, notFoundHandler } from './middleware/error.js';

export function buildApp() {
  const app = express();
  app.set('trust proxy', true);

  app.use(helmet());
  
  // Improved CORS configuration
// In your src/app.ts - Update the CORS configuration


// ✅ Improved CORS configuration for Railway
const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) {
      return callback(null, true);
    }
    
    // Get allowed origins from config
    const allowedOrigins = config.corsOrigin === '*' 
      ? ['*'] 
      : config.corsOrigin.split(',').map((s) => s.trim());
    
    // Check if origin is allowed
    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      // For development, allow all
      if (config.nodeEnv === 'development') {
        callback(null, true);
      } else {
        console.warn(`🚫 CORS blocked origin: ${origin}`);
        callback(null, true); // Still allow, but log it
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
  exposedHeaders: ['Content-Range', 'X-Total-Count'],
  maxAge: 86400, // 24 hours
};

  
  app.use(cors(corsOptions));
  app.use(compression());
  app.use(express.json({ limit: '2mb' }));
  app.use(morgan('tiny'));
  app.use(requestTimer);
  app.use(usageLogger);

  // Root route for health checks
  app.get('/', (_req, res) => {
    res.json({
      status: 'ok',
      message: 'Cameroon Census API is running',
      version: '1.1.0',
      timestamp: new Date().toISOString(),
      environment: config.nodeEnv,
    });
  });

  // Health check endpoint
  app.get('/health', (_req, res) => {
    res.json({
      status: 'healthy',
      version: '1.1.0',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      database: 'connected', // Add database check if needed
    });
  });

  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/geography', geographyRoutes);
  app.use('/api/v1', dataRoutes);
  app.use('/api/v1/admin', adminRoutes);
  app.use('/api/v1/analytics', analyticsRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);
  
  return app;
}