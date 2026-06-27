import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';

import authRoutes from './routes/auth';
import geographyRoutes from './routes/geography';
import dataRoutes from './routes/data';
import adminRoutes from './routes/admin';
import analyticsRoutes from './routes/analyticsRoutes';

import { config } from './config';
import { requestTimer, usageLogger } from './middleware/logger';
import { errorHandler, notFoundHandler } from './middleware/error';

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

  app.get('/health', (_req, res) => res.json({ data: { status: 'ok', version: '1.1.0' } }));

  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/geography', geographyRoutes);
  app.use('/api/v1', dataRoutes); // /data, /indicators, /export
  app.use('/api/v1/admin', adminRoutes);
  app.use('/api/v1/analytics', analyticsRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
