import { getToken } from "../auth/session";
import { getLocalDb } from "../db/local";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";

export type SyncStatus = "idle" | "syncing" | "error" | "offline";

let _status: SyncStatus = "idle";
let _listeners: ((s: SyncStatus) => void)[] = [];

export function getSyncStatus(): SyncStatus {
  return _status;
}

export function onSyncStatus(cb: (s: SyncStatus) => void): () => void {
  _listeners.push(cb);
  return () => {
    _listeners = _listeners.filter((l) => l !== cb);
  };
}

function setStatus(s: SyncStatus) {
  _status = s;
  for (const l of _listeners) l(s);
}

/**
 * Drain the outbox: send all unsynced items to /api/mobile/sync.
 * Idempotent — safe to call multiple times.
 */
export async function syncOutbox(): Promise<void> {
  const db = getLocalDb();
  const token = await getToken();
  if (!token) return;

  const pending = await db.getAllAsync<{
    id: string;
    entity: string;
    action: string;
    payload: string;
  }>(
    "SELECT id, entity, action, payload FROM outbox WHERE synced_at IS NULL ORDER BY created_at ASC LIMIT 50"
  );

  if (pending.length === 0) {
    setStatus("idle");
    return;
  }

  setStatus("syncing");

  const items = pending.map((row) => JSON.parse(row.payload));

  try {
    const res = await fetch(`${API_URL}/api/mobile/sync`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ items }),
    });

    if (!res.ok) {
      setStatus("error");
      return;
    }

    const data = (await res.json()) as {
      results: { idempotencyKey: string; status: string }[];
      missions: unknown[];
    };

    // Mark synced items
    const now = Math.floor(Date.now() / 1000);
    for (const result of data.results) {
      if (result.status === "ok" || result.status === "skipped") {
        await db.runAsync("UPDATE outbox SET synced_at = ? WHERE payload LIKE ?", [
          now,
          `%"idempotencyKey":"${result.idempotencyKey}"%`,
        ]);
      }
    }

    // Cache updated missions
    if (data.missions && Array.isArray(data.missions)) {
      for (const mission of data.missions as { id: string }[]) {
        await db.runAsync(
          "INSERT OR REPLACE INTO missions_cache (id, data, synced_at) VALUES (?, ?, ?)",
          [mission.id, JSON.stringify(mission), now]
        );
      }
    }

    setStatus("idle");
  } catch {
    setStatus("offline");
  }
}

/** Fetch latest missions from server and cache them */
export async function fetchMissions(): Promise<void> {
  const token = await getToken();
  if (!token) return;

  try {
    const res = await fetch(`${API_URL}/api/mobile/missions`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) return;

    const data = (await res.json()) as { missions: { id: string }[] };
    const db = getLocalDb();
    const now = Math.floor(Date.now() / 1000);

    for (const mission of data.missions) {
      await db.runAsync(
        "INSERT OR REPLACE INTO missions_cache (id, data, synced_at) VALUES (?, ?, ?)",
        [mission.id, JSON.stringify(mission), now]
      );
    }
  } catch {
    // Offline — use cached data
  }
}

/** Add an item to the outbox (offline-safe write) */
export async function enqueueOutbox(
  entity: string,
  action: string,
  payload: object
): Promise<void> {
  const db = getLocalDb();
  const id = generateId();
  await db.runAsync("INSERT INTO outbox (id, entity, action, payload) VALUES (?, ?, ?, ?)", [
    id,
    entity,
    action,
    JSON.stringify(payload),
  ]);
}

/** Read cached missions from local SQLite */
export async function getCachedMissions(): Promise<unknown[]> {
  const db = getLocalDb();
  const rows = await db.getAllAsync<{ data: string }>(
    `SELECT data FROM missions_cache ORDER BY json_extract(data, '$.startDate') ASC`
  );
  return rows.map((r) => JSON.parse(r.data));
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
