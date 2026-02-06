import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';

const dbPath = process.env.DB_PATH || path.resolve('server/data/crm.db');
fs.mkdirSync(path.dirname(dbPath), { recursive: true });
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

export const initSchema = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS leads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      demand_no TEXT UNIQUE,
      payload TEXT NOT NULL,
      customer_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      region TEXT NOT NULL,
      source TEXT NOT NULL,
      sales TEXT,
      community TEXT NOT NULL,
      expected_tile_date TEXT,
      budget_range TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT '新线索',
      submitted_at TEXT NOT NULL,
      ip TEXT,
      ua TEXT,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS followups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lead_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      follower TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY(lead_id) REFERENCES leads(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS sales_people (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL
    );
  `);

  const count = db.prepare('SELECT COUNT(*) as count FROM sales_people').get().count;
  if (!count) {
    ['王芳', '李伟', '陈晨'].forEach((name) => {
      db.prepare('INSERT INTO sales_people (name) VALUES (?)').run(name);
    });
  }
};

export default db;
