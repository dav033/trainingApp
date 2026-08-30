import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

const LATEST_SCHEMA = 1;

export function openDatabase(filename: string) {
  fs.mkdirSync(path.dirname(filename), { recursive: true });
  const db = new Database(filename);
  db.pragma("foreign_keys = ON");
  db.pragma("journal_mode = WAL");
  db.pragma("busy_timeout = 5000");
  migrate(db);
  return db;
}

export function migrate(db: Database.Database) {
  const version = Number(db.pragma("user_version", { simple: true }));
  if (version > LATEST_SCHEMA) throw new Error(`Unsupported database schema ${version}`);
  if (version === LATEST_SCHEMA) return;

  db.exec("BEGIN IMMEDIATE");
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        external_key TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        schema_version INTEGER NOT NULL,
        data_json TEXT NOT NULL CHECK(json_valid(data_json)),
        revision INTEGER NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS assets (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        field TEXT NOT NULL,
        relative_path TEXT NOT NULL UNIQUE,
        mime_type TEXT NOT NULL,
        byte_size INTEGER NOT NULL,
        sha256 TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
      PRAGMA user_version = 1;
    `);
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

export function assertDatabaseReady(db: Database.Database) {
  const result = db.prepare("PRAGMA integrity_check").get() as { integrity_check: string };
  if (result.integrity_check !== "ok") throw new Error(`SQLite integrity check failed: ${result.integrity_check}`);
  if (Number(db.pragma("user_version", { simple: true })) !== LATEST_SCHEMA) throw new Error("SQLite schema is not current");
}
