import initSqlJs from 'sql.js';
import type { Database as SqlJsDatabase } from 'sql.js';
import fs from 'fs';
import path from 'path';
import { config } from './config';

let db: SqlJsDatabase | null = null;
let saveTimer: ReturnType<typeof setTimeout> | null = null;

function getDbPath(): string {
  return path.resolve(config.db.path);
}

export async function initDb(): Promise<void> {
  const SQL = await initSqlJs();
  const dbPath = getDbPath();
  const dbDir = path.dirname(dbPath);

  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  db.run('PRAGMA journal_mode = WAL');
  db.run('PRAGMA foreign_keys = ON');
}

function scheduleSave(): void {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    persistDb();
  }, 1000);
}

export function persistDb(): void {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(getDbPath(), buffer);
}

export function getDatabase(): SqlJsDatabase {
  if (!db) throw new Error('Database not initialized. Call initDb() first.');
  return db;
}

interface PreparedResult {
  get(...params: any[]): any;
  all(...params: any[]): any[];
  run(...params: any[]): { changes: number; lastInsertRowid: number };
}

export function prepare(sql: string): PreparedResult {
  const database = getDatabase();

  return {
    get(...params: any[]): any {
      const stmt = database.prepare(sql);
      if (params.length > 0) stmt.bind(params);
      if (stmt.step()) {
        const row = stmt.getAsObject();
        stmt.free();
        return row;
      }
      stmt.free();
      return undefined;
    },

    all(...params: any[]): any[] {
      const stmt = database.prepare(sql);
      if (params.length > 0) stmt.bind(params);
      const results: any[] = [];
      while (stmt.step()) {
        results.push(stmt.getAsObject());
      }
      stmt.free();
      return results;
    },

    run(...params: any[]): { changes: number; lastInsertRowid: number } {
      database.run(sql, params);
      const changesResult = database.exec('SELECT changes() as c, last_insert_rowid() as r');
      const changes = changesResult.length > 0 ? (changesResult[0].values[0][0] as number) : 0;
      const lastId = changesResult.length > 0 ? (changesResult[0].values[0][1] as number) : 0;
      scheduleSave();
      return { changes, lastInsertRowid: lastId };
    },
  };
}

export function exec(sql: string): void {
  getDatabase().run(sql);
  scheduleSave();
}

export function transaction<T>(fn: () => T): T {
  const database = getDatabase();
  database.run('BEGIN TRANSACTION');
  try {
    const result = fn();
    database.run('COMMIT');
    scheduleSave();
    return result;
  } catch (err) {
    database.run('ROLLBACK');
    throw err;
  }
}

process.on('exit', () => {
  persistDb();
});

process.on('SIGINT', () => {
  persistDb();
  process.exit(0);
});

process.on('SIGTERM', () => {
  persistDb();
  process.exit(0);
});
