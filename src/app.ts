// src/app.ts
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
  // ✅ Create app variable here
  const app = express();
  app.set('trust proxy', true);

  // ✅ HELMET - Allow CORS
  app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginOpenerPolicy: { policy: "unsafe-none" },
  }));

  // ✅ CORS Configuration
  const allowedOrigins = [
    'https://frontend-production-1a46.up.railway.app',
    'https://cameroon-census-frontend.up.railway.app',
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:4173',
  ];

  const corsOptions = {
    origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
      if (!origin) {
        return callback(null, true);
      }
      
      if (allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
        callback(null, true);
      } else {
        console.warn(`🚫 CORS blocked origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH', 'HEAD'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-API-Key',
      'X-Requested-With',
      'Accept',
      'Origin',
      'Access-Control-Request-Method',
      'Access-Control-Request-Headers',
    ],
    exposedHeaders: ['Content-Range', 'X-Total-Count'],
    maxAge: 86400,
  };

  app.use(cors(corsOptions));

  // Handle OPTIONS requests
  app.options('*', (req, res) => {
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Max-Age', '86400');
    res.sendStatus(204);
  });

  app.use(compression());
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(morgan('tiny'));
  app.use(requestTimer);
  app.use(usageLogger);

  // Add CORS headers to every response
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin && allowedOrigins.includes(origin)) {
      res.header('Access-Control-Allow-Origin', origin);
      res.header('Access-Control-Allow-Credentials', 'true');
    }
    next();
  });

  // Root route
  app.get('/', (_req, res) => {
    res.json({
      status: 'ok',
      message: 'Cameroon Census API is running',
      version: '1.1.0',
      timestamp: new Date().toISOString(),
      environment: config.nodeEnv,
    });
  });

  // Health check
  app.get('/health', (_req, res) => {
    res.json({
      status: 'healthy',
      version: '1.1.0',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  });

  // Routes
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/geography', geographyRoutes);
  app.use('/api/v1', dataRoutes);
  app.use('/api/v1/admin', adminRoutes);
  app.use('/api/v1/analytics', analyticsRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);
  
  return app;
}