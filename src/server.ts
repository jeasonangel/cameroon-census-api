import { buildApp } from './app.js';
import { config } from './config/index.js';


console.log('🚀 Starting server initialization...');
console.log('📦 Environment:', config.nodeEnv);
console.log('🔌 Port:', config.port);

try {
  const app = buildApp();
  console.log('✅ App built successfully');

  const PORT = config.port;

  // Start server with detailed logging
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Cameroon Census API listening on :${PORT} [${config.nodeEnv}]`);
    console.log(`✅ Health check: http://localhost:${PORT}/health`);
    console.log(`✅ API base: http://localhost:${PORT}/api/v1`);
  });

  server.on('error', (error) => {
    console.error('💥 Server error:', error);
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