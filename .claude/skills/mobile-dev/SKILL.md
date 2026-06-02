---
name: mobile-dev
description: >
  Mobile: Expo / React Native driver app, offline-first SQLite + sync outbox, camera capture
  (fuel receipts, proof-of-delivery), attendance clock. Trigger on: "mobile", "driver app",
  "Expo", "React Native", "offline", "sync", "camera", "POD", or any device-side work.
---

# Mobile Developer — Naql (Driver App)

## Role
Build the Expo driver app. This is **Wedge #1** — the incumbent has nothing here. The whole
value is that a driver in a dead zone, on a cheap Android, can do their job and the data
arrives accurately when signal returns. If the app blocks on connectivity, the wedge is lost.

## Hard Constraints
1. **Offline-first.** Every screen works with airplane mode on. Network is an enhancement.
2. **Camera-first, type-last.** Drivers photograph receipts and deliveries; they do not fill forms.
3. **One-handed in a cab.** Big targets, high contrast, minimal steps, FR/AR.
4. **Sync status always visible** (offline / pending N / syncing / synced).
5. Driver only ever sees/writes their own scope (enforced by backend; app shows only that).

## Architecture

```
Local store: expo-sqlite (mirror of driver-visible entities)
Outbox:      append-only table of pending writes, each with an idempotencyKey
Sync:        background task → POST /api/sync { changes, lastSyncedAt }
             apply server response → reconcile local store → clear acked outbox items
Auth:        short-lived token + refresh; secure storage (expo-secure-store)
Media:       photos compressed locally, uploaded on sync; entry created offline, image attaches later
```

### Outbox item
```typescript
type OutboxItem = {
  idempotencyKey: string        // uuid generated on device — dedupes server-side replays
  entity: 'mission_status' | 'fuel_log' | 'attendance' | 'pod'
  op: 'create' | 'update'
  payload: unknown
  clientTs: string              // ISO; used for conflict tiebreak
  mediaLocalUri?: string        // photo to upload with this item
  status: 'pending' | 'syncing' | 'synced' | 'error'
}
```

## Screens (v0.1)
- **Today / Missions** — assigned missions; tap to update status (planned→in_progress→completed)
- **Log fuel** — litres, price, odometer, station + **photo of receipt** (OCR runs server-side; driver just snaps)
- **Proof of delivery** — photo + on-screen signature, attached to the mission
- **Attendance (pointage)** — clock in/out; works offline, syncs later
- **Sync** — status, manual "sync now", conflict notices (human-readable, never silent loss)

## Sync Rules (mirror backend contract)
- Writes are optimistic: UI updates immediately, item queued in outbox.
- Replays are safe: same `idempotencyKey` never duplicates server-side.
- Conflicts: last-write-wins per field, server timestamp wins ties; if the server overrides a
  driver value, show a small notice — never drop data silently.
- Large media uploads resume; an entry is valid before its photo finishes uploading.

## Performance / Reality
- Target mid-range Android, 3G. Compress images before queueing. Lazy-load lists.
- Battery: batch sync, don't poll aggressively; sync on connectivity-regained + on foreground.

## Testing
- Maestro/Detox smoke: login → go offline → log fuel + change mission status → go online →
  verify single server-side record (no dupes) → verify POD photo attached.
- Unit-test the outbox reducer and conflict resolution with fixtures.

## Handoff Points
- **← Backend Dev**: `/api/sync` contract + driver-scope rules
- **← AI/ML Engineer**: how OCR result returns (driver just uploads; result confirmed on web or next sync)
- **← Content Editor**: FR/AR strings (shared catalog)
- **→ Tester**: offline→online smoke flows
