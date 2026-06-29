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
import { corsMiddleware } from './middleware/cors.js';

export function buildApp() {
  const app = express();
  app.set('trust proxy', true);

  // ✅ CORS Middleware FIRST
  app.use(corsMiddleware);

  // ✅ Backup CORS with your actual URLs
  app.use(cors({
    origin: [
      'https://frontend-production-1a46.up.railway.app',
      'http://localhost:3000',
      'http://localhost:5173',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
  }));

  app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginOpenerPolicy: { policy: "unsafe-none" },
  }));
  
  app.use(compression());
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(morgan('tiny'));
  app.use(requestTimer);
  app.use(usageLogger);

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
  console.log('📋 Registering routes...');
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/geography', geographyRoutes);
  app.use('/api/v1', dataRoutes);
  app.use('/api/v1/admin', adminRoutes);
  app.use('/api/v1/analytics', analyticsRoutes);
  console.log('✅ All routes registered');

  app.use(notFoundHandler);
  app.use(errorHandler);
  
  return app;
}