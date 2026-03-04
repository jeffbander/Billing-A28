/**
 * Database Migrations System (Turso/libsql)
 *
 * Handles schema changes in a production-safe way:
 * 1. Tracks which migrations have been applied
 * 2. Runs new migrations automatically on startup
 * 3. Never runs the same migration twice
 */

import type { Client } from '@libsql/client';

interface Migration {
  id: string;
  name: string;
  up: (db: Client) => Promise<void>;
}

/** Helper: check if a column exists in a table */
async function columnExists(db: Client, table: string, column: string): Promise<boolean> {
  const result = await db.execute({ sql: `PRAGMA table_info(${table})`, args: [] });
  return result.rows.some((row: any) => row.name === column);
}

// All migrations in order - NEVER remove or reorder existing migrations
const migrations: Migration[] = [
  {
    id: '001',
    name: 'initial_schema',
    up: async () => {
      // Core tables - these are created in schema.ts on fresh databases
      // This migration exists to mark the baseline for existing databases
      console.log('[Migration 001] Baseline schema marker');
    }
  },
  {
    id: '002',
    name: 'add_workspaces',
    up: async (db) => {
      console.log('[Migration 002] Adding workspaces table and columns...');

      await db.executeMultiple(`
        CREATE TABLE IF NOT EXISTS workspaces (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          slug TEXT NOT NULL UNIQUE,
          description TEXT,
          icon TEXT DEFAULT '📁',
          created_at TEXT DEFAULT (datetime('now')),
          updated_at TEXT DEFAULT (datetime('now'))
        );
        INSERT OR IGNORE INTO workspaces (id, name, slug, description, icon)
        VALUES ('default', 'Default Workspace', 'default', 'Default workspace', '🏠');
      `);

      if (!(await columnExists(db, 'tasks', 'workspace_id'))) {
        await db.execute(`ALTER TABLE tasks ADD COLUMN workspace_id TEXT DEFAULT 'default' REFERENCES workspaces(id)`);
        await db.execute(`CREATE INDEX IF NOT EXISTS idx_tasks_workspace ON tasks(workspace_id)`);
        console.log('[Migration 002] Added workspace_id to tasks');
      }

      if (!(await columnExists(db, 'agents', 'workspace_id'))) {
        await db.execute(`ALTER TABLE agents ADD COLUMN workspace_id TEXT DEFAULT 'default' REFERENCES workspaces(id)`);
        await db.execute(`CREATE INDEX IF NOT EXISTS idx_agents_workspace ON agents(workspace_id)`);
        console.log('[Migration 002] Added workspace_id to agents');
      }
    }
  },
  {
    id: '003',
    name: 'add_planning_tables',
    up: async (db) => {
      console.log('[Migration 003] Adding planning tables...');

      await db.executeMultiple(`
        CREATE TABLE IF NOT EXISTS planning_questions (
          id TEXT PRIMARY KEY,
          task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
          category TEXT NOT NULL,
          question TEXT NOT NULL,
          question_type TEXT DEFAULT 'multiple_choice' CHECK (question_type IN ('multiple_choice', 'text', 'yes_no')),
          options TEXT,
          answer TEXT,
          answered_at TEXT,
          sort_order INTEGER DEFAULT 0,
          created_at TEXT DEFAULT (datetime('now'))
        );
        CREATE TABLE IF NOT EXISTS planning_specs (
          id TEXT PRIMARY KEY,
          task_id TEXT NOT NULL UNIQUE REFERENCES tasks(id) ON DELETE CASCADE,
          spec_markdown TEXT NOT NULL,
          locked_at TEXT NOT NULL,
          locked_by TEXT,
          created_at TEXT DEFAULT (datetime('now'))
        );
        CREATE INDEX IF NOT EXISTS idx_planning_questions_task ON planning_questions(task_id, sort_order);
      `);

      const taskSchema = await db.execute({ sql: "SELECT sql FROM sqlite_master WHERE type='table' AND name='tasks'", args: [] });
      const row = taskSchema.rows[0] as any;
      if (row && row.sql && !row.sql.includes("'planning'")) {
        console.log('[Migration 003] Note: tasks table needs planning status - will be handled by schema recreation on fresh dbs');
      }
    }
  },
  {
    id: '004',
    name: 'add_planning_session_columns',
    up: async (db) => {
      console.log('[Migration 004] Adding planning session columns to tasks...');

      if (!(await columnExists(db, 'tasks', 'planning_session_key'))) {
        await db.execute(`ALTER TABLE tasks ADD COLUMN planning_session_key TEXT`);
        console.log('[Migration 004] Added planning_session_key');
      }
      if (!(await columnExists(db, 'tasks', 'planning_messages'))) {
        await db.execute(`ALTER TABLE tasks ADD COLUMN planning_messages TEXT`);
        console.log('[Migration 004] Added planning_messages');
      }
      if (!(await columnExists(db, 'tasks', 'planning_complete'))) {
        await db.execute(`ALTER TABLE tasks ADD COLUMN planning_complete INTEGER DEFAULT 0`);
        console.log('[Migration 004] Added planning_complete');
      }
      if (!(await columnExists(db, 'tasks', 'planning_spec'))) {
        await db.execute(`ALTER TABLE tasks ADD COLUMN planning_spec TEXT`);
        console.log('[Migration 004] Added planning_spec');
      }
      if (!(await columnExists(db, 'tasks', 'planning_agents'))) {
        await db.execute(`ALTER TABLE tasks ADD COLUMN planning_agents TEXT`);
        console.log('[Migration 004] Added planning_agents');
      }
    }
  },
  {
    id: '005',
    name: 'add_agent_model_field',
    up: async (db) => {
      console.log('[Migration 005] Adding model field to agents...');
      if (!(await columnExists(db, 'agents', 'model'))) {
        await db.execute(`ALTER TABLE agents ADD COLUMN model TEXT`);
        console.log('[Migration 005] Added model to agents');
      }
    }
  },
  {
    id: '006',
    name: 'add_planning_dispatch_error_column',
    up: async (db) => {
      console.log('[Migration 006] Adding planning_dispatch_error column to tasks...');
      if (!(await columnExists(db, 'tasks', 'planning_dispatch_error'))) {
        await db.execute(`ALTER TABLE tasks ADD COLUMN planning_dispatch_error TEXT`);
        console.log('[Migration 006] Added planning_dispatch_error to tasks');
      }
    }
  },
  {
    id: '007',
    name: 'add_agent_source_and_gateway_id',
    up: async (db) => {
      console.log('[Migration 007] Adding source and gateway_agent_id to agents...');
      if (!(await columnExists(db, 'agents', 'source'))) {
        await db.execute(`ALTER TABLE agents ADD COLUMN source TEXT DEFAULT 'local'`);
        console.log('[Migration 007] Added source to agents');
      }
      if (!(await columnExists(db, 'agents', 'gateway_agent_id'))) {
        await db.execute(`ALTER TABLE agents ADD COLUMN gateway_agent_id TEXT`);
        console.log('[Migration 007] Added gateway_agent_id to agents');
      }
    }
  }
];

/**
 * Run all pending migrations
 */
export async function runMigrations(db: Client): Promise<void> {
  // Create migrations tracking table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // Get already applied migrations
  const result = await db.execute('SELECT id FROM _migrations');
  const applied = new Set(result.rows.map((m: any) => m.id));

  // Run pending migrations in order
  for (const migration of migrations) {
    if (applied.has(migration.id)) {
      continue;
    }

    console.log(`[DB] Running migration ${migration.id}: ${migration.name}`);

    try {
      await migration.up(db);
      await db.execute({
        sql: 'INSERT INTO _migrations (id, name) VALUES (?, ?)',
        args: [migration.id, migration.name],
      });
      console.log(`[DB] Migration ${migration.id} completed`);
    } catch (error) {
      console.error(`[DB] Migration ${migration.id} failed:`, error);
      throw error;
    }
  }
}

/**
 * Get migration status
 */
export async function getMigrationStatus(db: Client): Promise<{ applied: string[]; pending: string[] }> {
  const result = await db.execute('SELECT id FROM _migrations ORDER BY id');
  const appliedIds = result.rows.map((m: any) => m.id as string);
  const pending = migrations.filter(m => !appliedIds.includes(m.id)).map(m => m.id);
  return { applied: appliedIds, pending };
}
