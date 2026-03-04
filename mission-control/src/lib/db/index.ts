import { createClient, type Client, type InStatement } from '@libsql/client';
import { schema } from './schema';
import { runMigrations } from './migrations';

let client: Client | null = null;
let initialized = false;

function getClient(): Client {
  if (!client) {
    const url = process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;

    if (!url) {
      throw new Error('TURSO_DATABASE_URL or DATABASE_URL environment variable is required');
    }

    client = createClient({
      url,
      authToken,
    });
  }
  return client;
}

/**
 * Initialize the database schema and run migrations.
 * Called once on first query (lazy init).
 */
async function ensureInitialized(): Promise<void> {
  if (initialized) return;

  const c = getClient();

  // Enable foreign keys
  await c.execute('PRAGMA foreign_keys = ON');

  // Execute schema (multi-statement)
  await c.executeMultiple(schema);

  // Run migrations
  await runMigrations(c);

  initialized = true;
  console.log('[DB] Turso database initialized');
}

// Type-safe async query helpers

export async function queryAll<T>(sql: string, params: unknown[] = []): Promise<T[]> {
  await ensureInitialized();
  const result = await getClient().execute({ sql, args: params as any[] });
  return result.rows as unknown as T[];
}

export async function queryOne<T>(sql: string, params: unknown[] = []): Promise<T | undefined> {
  await ensureInitialized();
  const result = await getClient().execute({ sql, args: params as any[] });
  return (result.rows[0] as unknown as T) ?? undefined;
}

export async function run(sql: string, params: unknown[] = []): Promise<{ changes: number; lastInsertRowid: bigint | number }> {
  await ensureInitialized();
  const result = await getClient().execute({ sql, args: params as any[] });
  return {
    changes: result.rowsAffected,
    lastInsertRowid: result.lastInsertRowid ?? 0,
  };
}

/**
 * Execute multiple statements in a batch (transaction).
 * Each statement is { sql, args }.
 */
export async function batch(statements: InStatement[]): Promise<void> {
  await ensureInitialized();
  await getClient().batch(statements, 'write');
}

/**
 * Get the raw libsql client for advanced usage.
 * Prefer using queryAll/queryOne/run/batch instead.
 */
export async function getDb(): Promise<Client> {
  await ensureInitialized();
  return getClient();
}

export async function closeDb(): Promise<void> {
  if (client) {
    client.close();
    client = null;
    initialized = false;
  }
}

// Export migration utilities for CLI use
export { runMigrations, getMigrationStatus } from './migrations';
