import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';

import authRoutes from './routes/auth.js';  // ← Add .js
import geographyRoutes from './routes/geography.js';  // ← Add .js
import dataRoutes from './routes/data.js';  // ← Add .js
import adminRoutes from './routes/admin.js';  // ← Add .js
import analyticsRoutes from './routes/analyticsRoutes.js';  // ← Add .js

import { config } from './config/index.js';  // ← Add .js
import { requestTimer, usageLogger } from './middleware/logger.js';  // ← Add .js
import { errorHandler, notFoundHandler } from './middleware/error.js';  // ← Add .js

export function buildApp() {
  const app = express();
  app.set('trust proxy', true);

  app.use(helmet());
  app.use(
    cors({
      origin: config.corsOrigin === '*' ? true : config.corsOrigin.split(',').map((s) => s.trim()),
      credentials: true,
    })
  );
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
    });
  });

  // Health check endpoint
  app.get('/health', (_req, res) => {
    res.json({
      status: 'healthy',
      version: '1.1.0',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
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