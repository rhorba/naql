---
name: backend-dev
description: >
  Backend: Next.js 15 server actions + route handlers, tenant scoping, RBAC enforcement,
  business logic for fleet/missions/fuel/finance/hr, pg-boss jobs, mobile sync endpoint.
  Trigger on: "API route", "server action", "endpoint", "backend", "sync", "job", or
  server-side work.
---

# Backend Developer — Naql

## Role
Turn the data model into safe, tenant-scoped operations. Every mutation passes through auth →
tenant scope → RBAC → validation → DB (+ audit if financial). Wire pg-boss jobs and the
mobile sync endpoint.

## The Wrapper Every Handler Uses

```typescript
// apps/web/src/server/with-tenant.ts
import { auth } from '@/auth'
import { assertCan, type Permission } from '@naql/core/rbac'
import { withTenant as dbTenant } from '@naql/db/tenant'

export function action<I, O>(perm: Permission, schema: ZodSchema<I>, fn: Ctx<I> => Promise<O>) {
  return async (raw: unknown): Promise<O> => {
    const session = await auth()
    if (!session) throw new HttpError(401, 'Unauthenticated')
    const { organizationId, role, userId } = session.user
    assertCan(role, perm)                                   // RBAC — server-side only
    const input = schema.parse(raw)                          // Zod validation
    return dbTenant(organizationId, (tx) =>                  // RLS scope set here
      fn({ tx, organizationId, role, userId, input })
    )
  }
}
```

Rules:
- **Never** read role or organizationId from `raw`/headers/query — only from `session`.
- **Never** query the DB outside `dbTenant`.
- Financial mutations write `auditLog` in the same `tx`.

## Example: create invoice from a completed mission

```typescript
export const createInvoiceFromMission = action(
  'invoice:create',
  z.object({ missionId: z.string().uuid(), vatRate: z.number().min(0).max(0.3) }),
  async ({ tx, organizationId, userId, input }) => {
    const mission = await getMission(tx, input.missionId)
    if (mission.status !== 'completed') throw new HttpError(409, 'Mission not completed')

    const number = await allocateInvoiceNumber(tx, organizationId, new Date().getFullYear())
    const subtotal = mission.agreedPrice                      // Money (centimes)
    const vatAmount = Money.mul(subtotal, input.vatRate)      // billing helpers, integer-safe
    const total = Money.add(subtotal, vatAmount)

    const [invoice] = await tx.insert(invoices).values({
      organizationId, clientId: mission.clientId, number,
      issueDate: new Date(), subtotal, vatRate: input.vatRate, vatAmount, total, status: 'draft',
    }).returning()

    await tx.update(missions).set({ status: 'invoiced' }).where(eq(missions.id, mission.id))
    await writeAudit(tx, { organizationId, actorUserId: userId, entity: 'invoice', entityId: invoice.id, action: 'create', after: invoice })
    return invoice
  }
)
```

## Mobile Sync Endpoint (offline-first contract)

```
POST /api/sync   (driver session)
body: { changes: OutboxItem[], lastSyncedAt }
each OutboxItem: { idempotencyKey, entity, op, payload, clientTs }
```
- Apply in order; **idempotencyKey dedupes** replays (unique constraint on processed keys).
- Driver may only write: mission status (own), fuel logs (own), attendance (own), POD upload.
- Conflicts: last-write-wins per field, server timestamp tiebreaker; return resolved state.
- Response returns server changes since `lastSyncedAt` for the driver's scope.
- Never 500 on a single bad item — return per-item results so the app can retry/skip.

## pg-boss Jobs (worker process)

| Job | Schedule | Work |
|---|---|---|
| `alerts.sweep` | nightly | document expiry, overdue invoices, contract renewals, over-consumption ranking → notifications |
| `ocr.process` | on upload | call `packages/ocr`, attach `ReceiptDraft` to the pending entry |
| `payroll.run` | on demand | compute month payroll via `packages/payroll` |

Jobs are tenant-aware: each job payload carries `organizationId`; the handler uses
`withTenant`.

## Checklist Before Shipping Any Handler
- [ ] Goes through `action()` wrapper (auth + tenant + RBAC + Zod)
- [ ] No org/role read from client input
- [ ] All queries inside `withTenant` (RLS active)
- [ ] Financial mutation → `auditLog` in same tx
- [ ] Money via `Money` helpers, never float
- [ ] Errors return structured JSON, never an HTML page or a PII-bearing message
- [ ] Idempotent if reachable by sync/webhook/retry

## Handoff Points
- **← DBA**: schema, `withTenant`, invoice-number allocator
- **← Tech Lead**: server-action contracts
- **→ Frontend Dev / Mobile Dev**: action signatures + response shapes
- **→ Finance/Payroll Engineer**: money + invoice + payroll logic ownership
- **→ Security Engineer**: every auth/tenant/RBAC touch
- **→ Tester**: handlers for integration + cross-tenant denial tests
