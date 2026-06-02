---
name: tech-lead
description: >
  Technical leadership, architecture decisions, ADRs, stack enforcement. Trigger on:
  "architecture", "ADR", "tech stack", "system design", "refactor", "multi-tenant",
  "monorepo", or technical tradeoffs.
---

# Tech Lead — Naql

## Committed Stack (FINAL — see ../../../CLAUDE.md §5)

| Concern | Choice |
|---|---|
| Web | Next.js 15 App Router, TypeScript strict |
| Mobile | Expo / React Native, offline-first (expo-sqlite + sync queue) |
| DB | PostgreSQL 16 + Drizzle ORM + Row-Level Security |
| Tenancy | `organization_id` on every row + RLS backstop |
| Auth | Auth.js (NextAuth) v5, credentials (Argon2id) |
| Money | integer centimes via `Money` type in `packages/core` |
| Jobs | pg-boss (Postgres-backed queue) — OCR, payroll, alert sweeps |
| OCR | `packages/ocr` adapter (Vision/Textract behind interface) |
| PDF | invoice rendering in `packages/billing` |
| i18n | next-intl (fr/ar/en), shared catalog with mobile |
| Styling | Tailwind v4 + shadcn/ui |
| Testing | Vitest + Playwright (web), Maestro/Detox smoke (mobile) |
| Container | Docker Compose: postgres + web + worker + caddy |
| PM | pnpm workspaces |

## YAGNI Gate

```
"Does Naql v0.1 need this for DoD (§12)?"  YES → propose | NO → v0.2 backlog, skip
```

Avoid in v0.1:
- Realtime/websockets — only needed for live GPS (v0.2)
- Microservices — monorepo is correct at this scale
- GraphQL — typed server actions + REST handlers
- A separate ML service — OCR is a cloud API call behind an adapter; anomaly detection is plain SQL/stats
- Kafka/Redis — pg-boss + Postgres are enough

## Key ADRs

### ADR-01: Multi-tenant, shared-schema, RLS-enforced (NOT Basic Auth like the prior project)
Naql stores other companies' money, payroll, and PII. A cross-tenant leak is existential.
Shared DB + `organization_id` on every row + Postgres RLS (`app.current_org` GUC) gives
defense in depth: even a query that forgets the WHERE clause cannot leak. Auth.js carries
org+role in the session; a `withTenant` wrapper sets the GUC and runs RBAC. This is the
single most important architectural commitment.

### ADR-02: Money as integer centimes
Floating point and currency do not mix. All amounts are integers (1 MAD = 100). A `Money`
type + helpers (`add`, `mul`, `formatMAD`, `parseMAD`) live in `packages/core`. VAT/rounding
rules live once in `packages/billing`. Lint rule: no float arithmetic on fields typed Money.

### ADR-03: Offline-first mobile with a sync queue (not "mobile-friendly web")
Drivers work in dead zones. The driver app is a real Expo app with a local SQLite store and
an append-only outbox; writes are optimistic and sync idempotently (idempotency keys). The
web dashboard is online-only. Do not try to make a PWA cover the driver case.

### ADR-04: pg-boss for background work (not a new broker)
OCR processing, payroll runs, and nightly alert sweeps (expiry/overdue/over-consumption) are
async. pg-boss runs on the same Postgres — zero extra infra, transactional with our data.

### ADR-05: OCR behind an adapter interface
`packages/ocr` exposes `extractReceipt(image): ReceiptDraft`. Concrete impls (Google Vision,
AWS Textract) are swappable; the rest of the app depends only on the interface. Enables
testing with fixtures and avoids vendor lock-in.

## Data Flow

```
Driver app (offline) ──outbox sync──┐
Web dashboard ──server actions──────┤→ withTenant(session) → RBAC check → tenant-scoped Drizzle (RLS)
                                     │                                          ↓
OCR upload → pg-boss job → packages/ocr → ReceiptDraft → fuel/expense entry  Postgres 16
Nightly pg-boss sweep → packages/notifications → expiry/overdue/over-consumption alerts
Invoicing → packages/billing → sequential number + VAT + PDF (fr/ar)
```

## Code Standards
1. TypeScript strict — no `any`
2. Money is `Money` (centimes); never raw float currency
3. Every business query tenant-scoped; RBAC on every mutation
4. All user-facing strings in i18n catalogs; logical Tailwind props for RTL
5. Financial mutations write `AuditLog` in the same transaction
6. Idempotency keys on sync, webhooks, OCR resubmits

## Handoff Points
- **→ DBA**: data requirements → Drizzle schema + RLS policies
- **→ Backend Dev**: server-action/route contracts + `withTenant` wrapper
- **→ Mobile Dev**: shared types + sync contract
- **→ Security Engineer**: tenancy/auth architecture for review
