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
import { requestTimer, usageLogger } from './middleware/logger.js';
import { errorHandler, notFoundHandler } from './middleware/error.js';

const ALLOWED_ORIGINS = [
  'https://frontend-production-1a46.up.railway.app',
  'https://cameroon-census-frontend.up.railway.app',
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:4173',
];

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, origin ?? '*');
    } else {
      callback(new Error(`CORS blocked: ${origin}`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Total-Count'],
  maxAge: 86400,
};

export function buildApp() {
  const app = express();
  app.set('trust proxy', true);

  // 1. Helmet with CORS-compatible settings
  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginOpenerPolicy: false,
    crossOriginEmbedderPolicy: false,
  }));


  // 3. Apply CORS headers to every other request
  app.use(cors(corsOptions));

  // 4. Body parsing and utilities
  app.use(compression());
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(morgan('tiny'));
  app.use(requestTimer);
  app.use(usageLogger);

  // 5. Routes
  app.get('/', (_req, res) => {
    res.json({ status: 'ok', message: 'Cameroon Census API is running' });
  });
  app.get('/health', (_req, res) => {
    res.json({ status: 'healthy', version: '1.1.0', uptime: process.uptime() });
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