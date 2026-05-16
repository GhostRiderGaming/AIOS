/**
 * @fileoverview Database migration runner for sql.js.
 */

import { getDb, saveDb } from '../config/database.js';

/**
 * Run all database migrations.
 */
export function runMigrations() {
  const db = getDb();

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'viewer',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL DEFAULT 'New Conversation',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      conversation_id TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('user', 'agent', 'system')),
      agent_type TEXT,
      content TEXT NOT NULL,
      metadata TEXT DEFAULT '{}',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_type TEXT NOT NULL,
      agent_type TEXT,
      user_id INTEGER,
      action TEXT NOT NULL,
      details TEXT DEFAULT '{}',
      result TEXT,
      risk_level TEXT DEFAULT 'low',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS agent_permissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      agent_type TEXT NOT NULL,
      permission TEXT NOT NULL,
      allowed INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(agent_type, permission)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS security_alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      agent_type TEXT,
      resolved INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      resolved_at TEXT
    )
  `);

  // Indexes
  db.run('CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_audit_logs_event ON audit_logs(event_type)');
  db.run('CREATE INDEX IF NOT EXISTS idx_audit_logs_agent ON audit_logs(agent_type)');
  db.run('CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at)');

  saveDb();
}
