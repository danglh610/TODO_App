// src/index.ts
// TODO App Backend - Entry Point

import { config } from 'dotenv';
import express from 'express';
import { testConnection, closePool } from './db/connection';
import { runMigrations } from './db/migrate';
import { dutiesRouter } from './routes/index';

// Load environment variables
config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Health check endpoint
app.get('/health', async (_req, res) => {
  const dbOk = await testConnection();
  res.json({
    status: dbOk ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    database: dbOk ? 'connected' : 'disconnected'
  });
});

// Basic route
app.get('/', (_req, res) => {
  res.json({
    message: 'TODO App API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      duties: '/api/duties'
    }
  });
});

// API Routes
app.use('/api/duties', dutiesRouter);

// Graceful shutdown
async function shutdown(): Promise<void> {
  console.log('[Server] Shutting down...');
  await closePool();
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start server
async function start(): Promise<void> {
  console.log('[Server] Starting TODO App Backend...\n');

  // Test database connection
  const dbConnected = await testConnection();
  if (!dbConnected) {
    console.error('[Server] Cannot start: Database connection failed');
    console.error('Please check your database settings in .env');
    process.exit(1);
  }

  // Run migrations
  console.log('');
  await runMigrations();

  // Start HTTP server
  app.listen(PORT, () => {
    console.log(`[Server] Running at http://localhost:${PORT}`);
    console.log(`[Server] API available at http://localhost:${PORT}/api`);
  });
}

start().catch((error) => {
  console.error('[Server] Failed to start:', error);
  process.exit(1);
});

export { app };
