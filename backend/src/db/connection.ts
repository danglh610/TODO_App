// src/db/connection.ts
// Database connection pool using pg library

import pg, { Pool } from 'pg';

let pool: Pool | null = null;

function getDbConfig() {
  return {
    host: String(process.env.DB_HOST || 'localhost'),
    port: parseInt(String(process.env.DB_PORT || '5432'), 10),
    database: String(process.env.DB_NAME || 'todoapp'),
    user: String(process.env.DB_USER || 'postgres'),
    password: String(process.env.DB_PASSWORD || ''),
    max: parseInt(String(process.env.DB_POOL_SIZE || '10'), 10),
  };
}

function getPool(): Pool {
  if (!pool) {
    pool = new Pool(getDbConfig());
    
    pool.on('connect', () => {
      console.log('[DB] New client connected');
    });

    pool.on('error', (err: Error) => {
      console.error('[DB] Unexpected error on idle client', err);
    });
  }
  return pool;
}

export async function query<T extends pg.QueryResultRow = pg.QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<pg.QueryResult<T>> {
  const start = Date.now();
  const result = await getPool().query<T>(text, params);
  const duration = Date.now() - start;
  console.log(`[SQL] ${text.substring(0, 50)}... [${duration}ms]`);
  return result;
}

export async function getClient(): Promise<pg.PoolClient> {
  return getPool().connect();
}

export async function testConnection(): Promise<boolean> {
  try {
    await query('SELECT NOW()');
    console.log('[DB] Connected successfully');
    return true;
  } catch (error) {
    console.error('[DB] Connection failed', error);
    return false;
  }
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
  console.log('[DB] Pool closed');
}
