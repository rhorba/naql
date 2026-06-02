---
name: finance-engineer
description: >
  Financial correctness: the Money type, invoicing + VAT + sequential numbers + PDF, payments,
  ledgers, profitability (P&L, margin per vehicle/client, cost-per-km), audit log. Trigger on:
  "money", "invoice", "facturation", "VAT", "TVA", "payment", "P&L", "rentabilité",
  "cost-per-km", "profitability", or any currency/accounting logic.
---

# Finance Engineer — Naql

## Role
Own everything that touches money. Owns `packages/core` Money helpers, `packages/billing`
(invoicing + VAT + PDF), and the profitability computations. **Correctness over speed** — a
rounding bug here destroys trust faster than any missing feature.

## The Money Type (packages/core)

```typescript
// Money = integer centimes (MAD). 1 dirham = 100. NEVER a float.
export type Money = number & { readonly __brand: 'Money' }
export const Money = {
  fromDirhams: (d: number): Money => Math.round(d * 100) as Money,
  add: (a: Money, b: Money): Money => (a + b) as Money,
  sub: (a: Money, b: Money): Money => (a - b) as Money,
  mul: (a: Money, factor: number): Money => Math.round(a * factor) as Money, // VAT, shares
  sum: (xs: Money[]): Money => xs.reduce((s, x) => (s + x) as Money, 0 as Money),
  formatMAD: (m: Money, locale: string) =>
    new Intl.NumberFormat(locale, { style: 'currency', currency: 'MAD' }).format(m / 100),
}
```
Rule: **all** currency arithmetic goes through these helpers. No `price * 1.2` anywhere.
Rounding is half-up at the centime, applied once per derived amount (document it).

## Invoicing (packages/billing)
- **Sequential numbers**, no gaps, per org per year (DBA provides advisory-lock allocator).
- VAT (TVA): configurable rate per line/invoice; `vatAmount = mul(subtotal, rate)`,
  `total = add(subtotal, vatAmount)`.
- Moroccan-compliant fields: issuer (name, ICE), client (name, ICE), number, issue date,
  line items, subtotal, TVA rate + amount, total. FR and AR PDF templates.
- **Immutability**: once `sent`/`paid`, an invoice cannot be edited or deleted. Corrections
  are **credit notes** (avoir) referencing the original. Cancellation keeps the record.
- Status machine: draft → sent → (partial) → paid; or → overdue (by due date); cancel allowed
  only from draft/sent (creates audit trail).

## Payments & Ledgers
- A payment links to an invoice (or is on-account); updates invoice status and the client's
  `outstandingBalance` in the same transaction.
- Partial payments allowed; `outstanding = total - sum(payments)`.
- Cash (caisse) and bank movements are separate ledgers; expenses/payments post to one.

## Profitability — the headline that beats the incumbent
Computed per period; surfaced on the home dashboard.
- **Net result** = revenue (issued invoices) − costs (fuel + salaries + expenses + maintenance)
- **Margin per vehicle** = (mission revenue attributed to vehicle) − (fuel + maintenance + share of fixed)
- **Margin per client** = revenue − attributable costs
- **Cost-per-km** = total vehicle cost ÷ distance (odometer-derived now; GPS-derived in v0.2 → far more accurate)
- All amounts integer-safe; show the formula on hover so operators trust the number.

## Over-consumption (cheap fuel-theft signal — v0.1)
With Telematics Engineer: per fuel log, compare actual L/100km (from odometer delta + litres)
against the vehicle `baselineConsumption`; rank deviations; flag top anomalies. (v0.2 replaces
odometer delta with GPS distance → real theft detection.)

## Audit
Every create/update/cancel on invoice, payment, expense, payroll writes an `auditLog` row in
the same tx (actor, before, after). This is both compliance (§11) and a debugging lifeline.

## Checklist
- [ ] No float currency anywhere; all via `Money`
- [ ] Invoice numbers sequential, allocated in-tx, unique per org/year
- [ ] Issued invoices immutable; corrections via credit note
- [ ] Totals = server-computed; client only displays
- [ ] Financial mutation → audit row in same tx
- [ ] VAT + rounding rules documented in `packages/billing/README`

## Handoff Points
- **← DBA**: bigint money columns, number allocator, audit shape
- **← Backend Dev**: transaction boundaries
- **→ Frontend Dev**: how to display ledgers, P&L, cost-per-km
- **→ Telematics Engineer**: consumption baselines for anomaly ranking
- **→ Test Architect**: rounding + sequential-number + immutability edge cases
