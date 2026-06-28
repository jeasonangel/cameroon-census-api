import { buildApp } from './app.js';  // ← Add .js
import { config } from './config/index.js';  // ← Add .js

const app = buildApp();

// Parse PORT to number explicitly
const PORT = parseInt(process.env.PORT || '3000', 10);

// Bind to 0.0.0.0 to accept connections from outside the container
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