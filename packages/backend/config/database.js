/**
 * @fileoverview SQLite database connection using sql.js (pure JavaScript).
 * No native compilation required — works on any platform.
 */

import initSqlJs from 'sql.js';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import config from './index.js';

let db = null;
let SQL = null;

/**
 * Initialize sql.js and load or create the database.
 * Must be called once at startup (async).
 * @returns {Promise<Object>} The database instance
 */
export async function initDb() {
  if (db) return db;

  SQL = await initSqlJs();

  const dir = dirname(config.db.path);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  // Load existing database or create new
  if (existsSync(config.db.path)) {
    const buffer = readFileSync(config.db.path);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  // Enable foreign keys
  db.run('PRAGMA foreign_keys = ON');

  return db;
}

/**
 * Get the database instance (must call initDb first).
 * @returns {Object}
 */
export function getDb() {
  if (!db) {
    throw new Error('Database not initialized. Call initDb() first.');
  }
  return db;
}

/**
 * Save the database to disk.
 * Call after write operations.
 */
export function saveDb() {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  writeFileSync(config.db.path, buffer);
}

/**
 * Close the database and save to disk.
 */
export function closeDb() {
  if (db) {
    saveDb();
    db.close();
    db = null;
  }
}

/**
 * Helper: Run a query and return all rows as objects.
 * @param {string} sql
 * @param {Array} [params=[]]
 * @returns {Array<Object>}
 */
export function queryAll(sql, ...params) {
  const stmt = getDb().prepare(sql);
  if (params.length) stmt.bind(params);

  const results = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

/**
 * Helper: Run a query and return the first row as an object.
 * @param {string} sql
 * @param {Array} params
 * @returns {Object|undefined}
 */
export function queryOne(sql, ...params) {
  const results = queryAll(sql, ...params);
  return results[0] || undefined;
}

/**
 * Helper: Execute an INSERT/UPDATE/DELETE and save.
 * @param {string} sql
 * @param {Array} params
 * @returns {{ lastId: number, changes: number }}
 */
export function execute(sql, ...params) {
  getDb().run(sql, params);
  const lastId = getDb().exec('SELECT last_insert_rowid() as id')[0]?.values[0]?.[0] || 0;
  const changes = getDb().getRowsModified();
  saveDb();
  return { lastId, changes };
}
