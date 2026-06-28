import { buildApp } from './app.js';
import { config } from './config/index.js';

const app = buildApp();

// Use config port instead of hardcoding
const PORT = config.port;

// For Railway, we need to listen on all interfaces
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Cameroon Census API listening on :${PORT} [${config.nodeEnv}]`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
});