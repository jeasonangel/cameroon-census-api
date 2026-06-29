// src/server.ts
import { buildApp } from './app.js';
import { config } from './config/index.js';
import { testDatabaseConnection } from './database/index.js';

console.log('🚀 Starting server initialization...');
console.log('📦 Environment:', config.nodeEnv);
console.log('🔌 Port:', config.port);

async function startServer() {
  try {
    // Test database connection first
    console.log('📊 Testing database connection...');
    const dbConnected = await testDatabaseConnection();
    
    if (!dbConnected) {
      console.error('❌ Database connection failed. Exiting...');
      process.exit(1);
    }

    // Build the app
    const app = buildApp();
    console.log('✅ App built successfully');

    // ✅ Ensure port is a number
    const PORT: number = parseInt(process.env.PORT || String(config.port || 8080), 10);
    
    console.log(`📊 Starting server on port: ${PORT}`);

    // Start server - bind to all interfaces
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

    // Handle graceful shutdown
    process.on('SIGTERM', () => {
      console.log('🛑 Received SIGTERM, shutting down gracefully...');
      server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      console.log('🛑 Received SIGINT, shutting down gracefully...');
      server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
      });
    });

    // Handle uncaught errors
    process.on('uncaughtException', (error) => {
      console.error('💥 Uncaught Exception:', error);
      console.error('Stack:', error.stack);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('💥 Unhandled Rejection at:', promise);
      console.error('Reason:', reason);
      process.exit(1);
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();