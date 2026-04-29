import { openDatabaseSync } from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as schema from './schema';

const sqlite = openDatabaseSync('contractr.db', { enableChangeListener: true });

sqlite.execSync(`
  CREATE TABLE IF NOT EXISTS jobs (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    customer TEXT NOT NULL,
    customer_id TEXT NOT NULL,
    address TEXT NOT NULL DEFAULT '—',
    status TEXT NOT NULL DEFAULT 'new',
    scheduled TEXT NOT NULL DEFAULT 'Needs scheduling',
    due TEXT NOT NULL DEFAULT '—',
    price REAL NOT NULL DEFAULT 0,
    hours REAL NOT NULL DEFAULT 0,
    hours_est REAL NOT NULL DEFAULT 0,
    photos INTEGER NOT NULL DEFAULT 0,
    notes INTEGER NOT NULL DEFAULT 0,
    materials INTEGER NOT NULL DEFAULT 0,
    desc TEXT NOT NULL DEFAULT '',
    clocked_in_at INTEGER,
    created_at INTEGER NOT NULL DEFAULT (CAST(strftime('%s','now') * 1000 AS INTEGER))
  );
  CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL DEFAULT '',
    address TEXT NOT NULL DEFAULT '',
    jobs INTEGER NOT NULL DEFAULT 0,
    since TEXT NOT NULL DEFAULT ''
  );
  CREATE TABLE IF NOT EXISTS timeline (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id TEXT NOT NULL,
    "when" TEXT NOT NULL,
    who TEXT NOT NULL,
    what TEXT NOT NULL,
    kind TEXT NOT NULL,
    n INTEGER,
    uri TEXT,
    created_at INTEGER NOT NULL DEFAULT (CAST(strftime('%s','now') * 1000 AS INTEGER))
  );
  CREATE TABLE IF NOT EXISTS materials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id TEXT NOT NULL,
    name TEXT NOT NULL,
    qty TEXT NOT NULL DEFAULT '',
    cost REAL NOT NULL DEFAULT 0,
    supplier TEXT NOT NULL DEFAULT '',
    got INTEGER NOT NULL DEFAULT 0
  );
`);

export const db = drizzle(sqlite, { schema });
