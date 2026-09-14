// src/db/migrate.ts
// Database migration runner - executes SQL migrations in order

import { config } from 'dotenv';
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import { query } from './connection.js';

// Load environment variables
config();

// Directory containing migration files
const MIGRATIONS_DIR = join(import.meta.dirname, 'migrations');

/**
 * Create the migrations tracking table if not exists
 */
async function ensureMigrationsTable(): Promise<void> {
  const result = await query<{ exists: boolean }>(
    "SELECT EXISTS (SELECT FROM pg_tables WHERE tablename = '_migrations') as exists"
  );
  
  if (!result.rows[0].exists) {
    // Use UUID instead of SERIAL to avoid catalog conflicts
    await query(`
      CREATE TABLE _migrations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }
  console.log('[Migration] _migrations table ready');
}

/**
 * Get list of already executed migrations
 * @returns Array of migration names
 */
async function getExecutedMigrations(): Promise<string[]> {
  const result = await query<{ name: string }>(
    'SELECT name FROM _migrations ORDER BY name'
  );
  return result.rows.map((row) => row.name);
}

/**
 * Get list of migration files in directory
 * @returns Sorted array of migration filenames
 */
async function getMigrationFiles(): Promise<string[]> {
  const files = await readdir(MIGRATIONS_DIR);
  return files
    .filter((file) => file.endsWith('.sql'))
    .sort();
}

/**
 * Read migration file content
 * @param filename - Migration filename
 * @returns SQL content
 */
async function readMigrationFile(filename: string): Promise<string> {
  const filepath = join(MIGRATIONS_DIR, filename);
  return readFile(filepath, 'utf-8');
}

/**
 * Execute a single migration
 * @param filename - Migration filename
 */
async function executeMigration(filename: string): Promise<void> {
  const sql = await readMigrationFile(filename);

  console.log(`[Migration] Running: ${filename}`);

  // Execute in transaction
  const client = await (await import('./connection.js')).getClient();
  try {
    await client.query('BEGIN');
    await client.query(sql);
    await client.query(
      'INSERT INTO _migrations (name) VALUES ($1)',
      [filename]
    );
    await client.query('COMMIT');
    console.log(`[Migration] Completed: ${filename}`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`[Migration] Failed: ${filename}`, error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Run all pending migrations
 */
export async function runMigrations(): Promise<void> {
  console.log('[Migration] Starting...\n');

  // Ensure migrations table exists
  await ensureMigrationsTable();

  // Get executed and available migrations
  const executed = await getExecutedMigrations();
  const files = await getMigrationFiles();

  // Filter out already executed migrations
  const pending = files.filter((file) => !executed.includes(file));

  if (pending.length === 0) {
    console.log('[Migration] No pending migrations. Database is up to date.\n');
    return;
  }

  console.log(`[Migration] Found ${pending.length} pending migration(s):\n`);

  // Execute pending migrations
  for (const filename of pending) {
    await executeMigration(filename);
  }

  console.log(`[Migration] All ${pending.length} migration(s) completed successfully!`);
}

// Run migrations if this file is executed directly
runMigrations().catch((error) => {
  console.error('[Migration] Failed:', error);
  process.exit(1);
});
