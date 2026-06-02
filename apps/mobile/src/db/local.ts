import * as SQLite from "expo-sqlite";

let _db: SQLite.SQLiteDatabase | null = null;

export function getLocalDb(): SQLite.SQLiteDatabase {
  if (!_db) throw new Error("DB not initialized — call initDb() first");
  return _db;
}

export async function initDb(): Promise<void> {
  _db = await SQLite.openDatabaseAsync("naql_local.db");

  // Outbox: queued mutations waiting for network
  await _db.execAsync(`
    CREATE TABLE IF NOT EXISTS outbox (
      id          TEXT PRIMARY KEY,
      entity      TEXT NOT NULL,
      action      TEXT NOT NULL,
      payload     TEXT NOT NULL,
      created_at  INTEGER NOT NULL DEFAULT (unixepoch()),
      synced_at   INTEGER
    );

    CREATE TABLE IF NOT EXISTS missions_cache (
      id              TEXT PRIMARY KEY,
      data            TEXT NOT NULL,
      synced_at       INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS fuel_drafts (
      id              TEXT PRIMARY KEY,
      mission_id      TEXT,
      litres          REAL,
      price_per_litre INTEGER,
      total           INTEGER,
      odometer        REAL,
      station         TEXT,
      receipt_uri     TEXT,
      created_at      INTEGER NOT NULL DEFAULT (unixepoch()),
      synced_at       INTEGER
    );
  `);
}
