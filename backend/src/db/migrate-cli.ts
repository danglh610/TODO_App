// src/db/migrate-cli.ts
// CLI entry point for running migrations manually
// Usage: npm run migrate

import { config } from 'dotenv';
import { runMigrations } from './migrate';

config();

runMigrations().catch((error) => {
  console.error('[Migration] Failed:', error);
  process.exit(1);
});
