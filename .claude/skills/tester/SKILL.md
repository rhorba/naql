---
name: tester
description: >
  QA and testing. AUTO-TRIGGERED after every code task. Vitest (unit/integration), Playwright
  (web E2E), Maestro/Detox (mobile smoke). Trigger on: "test", "vitest", "playwright",
  "coverage", "QA", or after any code task completes.
---

# Tester — Naql (Vitest + Playwright + mobile smoke)

## AUTO-TRIGGER RULE
```
ANY code task DONE → Tester runs immediately → no confirmation
ALL PASS → log → trigger next task
FAILURES → fix (≤2 attempts) → still failing → BLOCKER → ask user
```

## The Tests That Matter Most (highest risk first)

### 1. Cross-tenant isolation (CRITICAL — gate for every sprint)
```typescript
test('org A cannot read org B data', async () => {
  const a = await seedOrg('A'); const b = await seedOrg('B')
  await asUser(a.owner, async (db) => {
    const rows = await db.select().from(vehicles)   // no WHERE clause on purpose
    expect(rows.every(r => r.organizationId === a.id)).toBe(true) // RLS must filter
  })
})
test('crafted orgId in payload is ignored (uses session org)', async () => {
  const res = await createVehicle.call(sessionFor(a.owner), { ...input, organizationId: b.id })
  expect(res.organizationId).toBe(a.id)
})
```

### 2. RBAC denial
```typescript
test('driver cannot create an invoice', async () => {
  await expect(createInvoice.call(sessionFor(driver), input)).rejects.toMatchObject({ status: 403 })
})
```

### 3. Money correctness
```typescript
test('VAT + total are exact in centimes', () => {
  const subtotal = Money.fromDirhams(1000)            // 100000
  const vat = Money.mul(subtotal, 0.2)                // 20000
  expect(Money.add(subtotal, vat)).toBe(120000)
})
test('invoice numbers are sequential with no gaps under concurrency', async () => { /* parallel allocs */ })
test('issued invoice cannot be edited or deleted', async () => { /* expect 409 */ })
```

### 4. OCR (fixtures, never live API)
```typescript
vi.mock('@naql/ocr', () => ({ extractReceipt: vi.fn().mockResolvedValue(FUEL_RECEIPT_DRAFT) }))
test('low-confidence draft is not auto-saved', async () => { /* expect needs-confirm state */ })
```

### 5. Offline sync (mobile)
```typescript
test('replayed outbox item does not duplicate server record', async () => {
  await sync([item]); await sync([item])              // same idempotencyKey
  expect(await countFuelLogs()).toBe(1)
})
```

### 6. Payroll
```typescript
test('payroll run is idempotent per (org, month)', async () => { /* re-run → no double pay */ })
```

## E2E Critical Paths (Playwright, web)
- signup → org created → owner logs in → sees demo dashboard
- create vehicle + document → expiry alert appears
- create mission → complete → generate invoice → record payment → invoice paid
- upload receipt → OCR pre-fills fuel entry → confirm → fuel log saved
- Arabic RTL: `/ar` → `dir=rtl`, tables/nav mirror correctly

## Mobile Smoke (Maestro/Detox)
login → airplane mode → log fuel + change mission status → online → exactly one server record, POD photo attached.

## Coverage Targets
| Area | Target |
|---|---|
| `packages/core`, `packages/billing`, `packages/payroll` | 90%+ (money/logic) |
| tenant scope + RBAC | 100% of mutating actions have a denial test |
| `packages/db` query helpers | 80%+ |
| API/server actions | 80%+ |
| Web components | smoke (render without crash) |
| Mobile | offline→online smoke |

## Handoff Points
- **← all code tasks**: auto-triggered
- **→ Backend/Frontend/Mobile**: bug reports with file:line
- **→ Project Monitor**: results for sprint metrics
- **→ Deployment**: green light when all pass
