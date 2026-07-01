// src/server.ts
import { buildApp } from './app.js';
import { config } from './config/index.js';
import { testDatabaseConnection } from './database/index.js';

console.log('🚀 Starting server initialization...');
console.log('📦 Environment:', config.nodeEnv);
console.log('🔌 Port:', config.port);

async function startServer() {
  // Build the app
  const app = buildApp();
  console.log('✅ App built successfully');

  // ✅ Ensure port is a number (Railway injects PORT)
  const PORT: number = parseInt(process.env.PORT || String(config.port || 8080), 10);

  console.log(`📊 Starting server on port: ${PORT}`);

  // Start listening IMMEDIATELY so the platform health check passes.
  // The DB connection is verified afterwards and never blocks binding the port.
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Cameroon Census API listening on port ${PORT}`);
    console.log(`✅ Environment: ${config.nodeEnv}`);
    console.log(`✅ Health check: /health`);
    console.log(`✅ API base: /api/v1`);
  });

  server.on('error', (error: any) => {
    console.error('💥 Server error:', error);
    if (error.code === 'EADDRINUSE') {
      console.error(`❌ Port ${PORT} is already in use`);
    }
  });

  // Verify the database connection in the background — log only, never exit.
  // A transient DB outage must not take down the HTTP server (which would 502).
  console.log('📊 Testing database connection...');
  testDatabaseConnection()
    .then((connected) => {
      if (connected) {
        console.log('✅ Database reachable');
      } else {
        console.error('⚠️ Database not reachable yet — server is up, requests needing the DB will fail until it recovers');
      }
    })
    .catch((error) => {
      console.error('⚠️ Database check threw:', error);
    });

  // Handle graceful shutdown
  const shutdown = (signal: string) => {
    console.log(`🛑 Received ${signal}, shutting down gracefully...`);
    server.close(() => {
      console.log('✅ Server closed');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // Log unexpected errors but keep the server running — do NOT exit, or a single
  // stray rejection (e.g. a Redis hiccup) would kill the process and cause a 502.
  process.on('uncaughtException', (error) => {
    console.error('💥 Uncaught Exception:', error);
    console.error('Stack:', error.stack);
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('💥 Unhandled Rejection at:', promise);
    console.error('Reason:', reason);
  });
}

startServer().catch((error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});
