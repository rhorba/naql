# Naql — Claude Code Project Bible

> This is the root business document. All specialists read this first.
> `.claude/CLAUDE.md` governs HOW the team works (workflow, autonomy, sprints).
>
> **Naql** (نقل — "transport") is a working name. Rename freely; it appears only in
> docs, package scopes (`@naql/*`), and seed/demo data — never hardcoded in logic.

---

## §1 — Project Identity

**Name**: Naql
**Tagline (FR)**: "Gérez tout votre transport. Depuis une seule plateforme."
**Tagline (AR)**: "أدِر نقلك بالكامل. من منصة واحدة."
**Type**: Multi-tenant commercial SaaS. Self-hostable (Docker) for enterprise accounts.
**Purpose**: An all-in-one operations platform for road-transport SMEs — fleet, fuel,
missions, invoicing, finance, and HR in one place. Unlike incumbents (TransFlow Pro /
SuiviPro), Naql is *connected to reality*: a driver mobile app and OCR receipt capture
remove the manual desktop data-entry that makes legacy tools painful — and lay the rails
for live GPS telematics in v0.2.
**Audience**: Owner-operators and small/mid fleets (3–150 vehicles) in Morocco and the
broader Maghreb/Francophone-Africa market — exactly the operator profile in the competitor
demo (FUSO / Mitsubishi trucks, 3-vehicle fleet, "Admin" owner login).
**Language**: French primary (`fr`), Arabic secondary (`ar`) with full RTL. English (`en`)
optional for the dashboard.
**Tone**: Professional, operational, no hype. The product earns trust by being accurate
about money and reliable offline — not by marketing language.

### Positioning (the one sentence that drives every decision)
> "Stop typing your fleet into a screen. Let it report to you."

The competitor is a digital ledger: a human manually enters fuel, mileage, missions, and
consumption. **Naql's edge is automation, mobility, and intelligence.** Every feature
decision is judged against whether it removes manual entry or adds insight the incumbent
can't.

---

## §2 — User Personas

| Persona | Name | Profile | Primary Need |
|---|---|---|---|
| Owner / Admin | **Jamal** | 48, Casablanca, runs a 12-truck haulage company | See profitability per truck/client in real time; control costs; one source of truth |
| Dispatcher (Exploitation) | **Yassine** | 34, operations manager | Assign missions, track which trucks are available, log trips |
| Accountant | **Salma** | 41, part-time bookkeeper | Invoice clients, reconcile payments, track expenses and cash |
| Driver | **Brahim** | 52, long-haul driver, basic smartphone | Log trips, snap fuel receipts, prove delivery — even with no signal |
| HR Manager | **Khadija** | 38, handles payroll + contracts | Track attendance, advances, payroll, contract renewals |

A single small operator may be **Jamal + Yassine + Salma + Khadija all in one person**.
Design for that: role separation must exist, but a one-person company must not be forced
through five roles to do one thing.

---

## §3 — Core Features (v0.1 scope)

v0.1 = **parity with the incumbent + the two cheapest high-impact wedges** (driver app, OCR).
Modules mirror the competitor's sidebar so a switcher feels at home, then we go further.

### Module A — Fleet (Flotte)
- Vehicle registry: code, registration (immatriculation), make/model, year, capacity, type
- Vehicle documents: insurance, technical inspection (visite technique), licenses — with **expiry alerts**
- Availability status (available / on-mission / maintenance / out-of-service)
- Per-vehicle cost & profitability rollup (feeds Module F)

### Module B — Missions / Dispatch (Exploitation)
- Create a mission: client, origin → destination, assigned vehicle + driver, cargo, dates, agreed price
- Mission lifecycle: planned → in-progress → completed → invoiced
- Operations dashboard: active missions, available fleet, today's movements

### Module C — Fuel & Consumption (Gasoil / Consommation)
- Fuel log entries (litres, price, odometer, station) — entered by driver app **or** desktop
- Consumption tracking: L/100km per vehicle, per trip
- **Over-consumption detection (Surconsommation)** — incumbent has a basic flag; Naql
  correlates distance vs. litres vs. expected baseline and ranks anomalies (cheapest path
  toward fuel-theft detection; full version with GPS distance is v0.2)

### Module D — Invoicing & Payments (Facturation / Paiements)
- Generate invoices from completed missions (or manual line items)
- Moroccan-compliant invoice fields (ICE, TVA), sequential numbering, PDF export (FR/AR)
- Payment tracking: paid / partial / overdue; link payments to invoices
- Client ledger (Clients): contact, ICE, outstanding balance

### Module E — Cash, Bank & Expenses (Caisse / Banque / Dépenses)
- Cash register (caisse) movements; bank account movements
- Expense entries with category + attachment (receipt photo via OCR)
- Reconciliation: match expenses/payments to cash or bank

### Module F — Profitability (Rentabilité / Résultat)
- Real-time P&L: revenue (invoices) − costs (fuel, salaries, expenses, maintenance)
- Margin per vehicle and per client; **cost-per-km** (incumbent does not surface this well)
- Period reports (month / quarter)

### Module G — Human Resources (RH)
- Employees registry (drivers + staff), contracts with **renewal alerts**
- Attendance (pointage) — drivers can clock via mobile app
- Salary advances (avances) tracked against payroll
- Payroll (paie): compute monthly net from base + advances + days worked (Morocco rules: CNSS, IR — configurable)

### Module H — Driver Mobile App (WEDGE #1 — the incumbent has nothing here)
- Offline-first. Works with no signal; queues and syncs when back online.
- Driver sees assigned missions; updates status; logs fuel; **snaps receipt photos**;
  captures **proof-of-delivery** (photo + signature); reports incidents.

### Module I — OCR Receipt & Document Capture (WEDGE #2)
- Photograph a fuel receipt or expense → OCR extracts amount, litres, price, date, station
  → pre-fills the fuel/expense entry. Human confirms. Kills manual data entry.

### Cross-cutting (v0.1, non-negotiable)
- **Auth + multi-tenancy + RBAC** (owner / manager / accountant / driver) — see §7, §15
- Bilingual FR/AR with RTL
- Audit log on all financial mutations
- Demo/seed data for instant onboarding

---

## §4 — Out of Scope (v0.1)

Explicitly OUT. Do not build, plan, or mention in v0.1. These are the **v0.2+ moat** — they
are *why we win*, but parity must ship first or there is nothing to win with.

| Deferred to | Feature |
|---|---|
| **v0.2** | Live GPS / telematics hardware integration (Teltonika / OBD trackers), geofencing, automatic mileage & route capture |
| **v0.2** | Predictive maintenance ML (service due from real usage, not fixed dates) |
| **v0.2** | Advanced fuel-theft detection using GPS distance vs. fuel purchased |
| **v0.2** | Client self-service portal (shipment tracking + invoice download) |
| **v0.2** | WhatsApp Business API notifications (driver + client) |
| **v0.3** | Fuel-card integrations, accounting-software export, customs/freight document automation |
| **v0.3** | Route-optimization / multi-stop planning |
| **out** | Marketplace / freight-matching, telematics *hardware manufacturing*, in-app chat |

Discipline rule: if a request isn't in §3 or the current sprint backlog, it goes to the
backlog as a v0.2 item — it does not get built in v0.1. (See YAGNI gate, `.claude/CLAUDE.md`.)

---

## §5 — Tech Stack (FINAL — do not deviate without explicit approval)

| Concern | Choice | Why |
|---|---|---|
| Web framework | Next.js 15 App Router | Same as RabatEvents; team knows it |
| Language | TypeScript strict | No `any` |
| Mobile (driver app) | **Expo / React Native** | Cross-platform, offline-first, shares TS types with web |
| Offline store (mobile) | SQLite (expo-sqlite) + sync queue | Drivers work with no signal (§10) |
| Styling (web) | Tailwind v4 + shadcn/ui | Consistent with prior project |
| Database | PostgreSQL 16 + Drizzle ORM | Relational, financial integrity, RLS for tenancy |
| Multi-tenancy | `organization_id` on every row + Postgres **Row-Level Security** | Defense in depth (§7) |
| Auth | **Auth.js (NextAuth) v5** with email+password and org membership | Real users now exist — unlike RabatEvents. NOT Basic Auth. |
| Money | **integers in centimes (MAD)** via a `Money` type | Never floats for currency |
| PDF (invoices) | `@react-pdf/renderer` or Puppeteer-render | FR/AR invoices |
| OCR | Cloud Vision API (Google Vision / AWS Textract) behind `packages/ocr` adapter | Swappable; no vendor lock-in |
| Background jobs | `pg-boss` (Postgres-backed queue) | OCR processing, payroll runs, alert sweeps — no extra infra |
| i18n | next-intl (fr / ar / en) + shared message catalog with mobile | RTL mandatory |
| API style | REST route handlers + typed server actions; tRPC optional later | Keep simple |
| Realtime | Deferred (v0.2 needs it for live GPS) | YAGNI for v0.1 |
| Testing | Vitest + Playwright (web) + Maestro/Detox (mobile smoke) | |
| Container | Docker + Compose (Postgres + web + worker + Caddy) | Self-host option |
| Package manager | pnpm workspaces (monorepo) | |
| Linting | Biome | |
| CI | GitHub Actions | |
| Hosting | Vercel (web) + managed Postgres (Neon/Supabase) + a worker host; or full Docker self-host | |

**Why a real auth + tenancy stack now?** RabatEvents was read-mostly and single-operator, so
Basic Auth was correct. Naql stores *other companies'* money, payroll, and driver PII. A
cross-tenant leak is an existential failure. Multi-tenant isolation and RBAC are core, not
optional. (ADR-01 in tech-lead skill.)

---

## §6 — Data Model (core entities)

Multi-tenant: **every business table carries `organizationId`** and is protected by RLS.
Money is stored as integer centimes. Full Drizzle schema lives in `packages/db/src/schema/`.

```typescript
// packages/core/src/types.ts  (shared web + mobile)

type Money = number // integer centimes (MAD). 1 dirham = 100. NEVER a float.

type Role = 'owner' | 'manager' | 'accountant' | 'driver'

type Organization = {
  id: string; name: string; ice?: string; // Moroccan tax ID
  currency: 'MAD'; locale: 'fr' | 'ar' | 'en'; plan: 'trial' | 'pro' | 'enterprise'
  createdAt: Date
}

type User = {
  id: string; organizationId: string; email: string; name: string
  role: Role; isActive: boolean; createdAt: Date
}

type Vehicle = {
  id: string; organizationId: string
  code: string; registration: string            // immatriculation
  make?: string; model?: string; year?: number   // e.g. FUSO, MITSUBISHI
  type?: 'truck' | 'van' | 'trailer' | 'other'
  capacityKg?: number; baselineConsumption?: number // L/100km expected
  status: 'available' | 'on_mission' | 'maintenance' | 'out_of_service'
  createdAt: Date; updatedAt: Date
}

type VehicleDocument = {
  id: string; organizationId: string; vehicleId: string
  kind: 'insurance' | 'technical_inspection' | 'license' | 'other'
  reference?: string; issuedAt?: Date; expiresAt: Date   // drives expiry alerts
  fileUrl?: string
}

type Driver = {                                  // a driver IS a User(role=driver) + employment data
  id: string; organizationId: string; userId?: string
  employeeId: string; licenseNumber?: string; licenseExpiresAt?: Date
}

type Mission = {
  id: string; organizationId: string
  clientId: string; vehicleId?: string; driverId?: string
  originCity: string; destinationCity: string; cargo?: string
  agreedPrice: Money
  status: 'planned' | 'in_progress' | 'completed' | 'invoiced' | 'cancelled'
  startDate: Date; endDate?: Date
  proofOfDeliveryUrl?: string                     // from driver app
  createdAt: Date; updatedAt: Date
}

type FuelLog = {
  id: string; organizationId: string; vehicleId: string; driverId?: string; missionId?: string
  litres: number; pricePerLitre: Money; total: Money
  odometer?: number; station?: string; filledAt: Date
  receiptUrl?: string; ocrConfidence?: number; source: 'driver_app' | 'desktop' | 'ocr'
}

type Client = {
  id: string; organizationId: string; name: string; ice?: string
  contactEmail?: string; contactPhone?: string; outstandingBalance: Money
}

type Invoice = {
  id: string; organizationId: string; clientId: string
  number: string                                  // sequential per org per year
  issueDate: Date; dueDate?: Date
  lines: InvoiceLine[]; subtotal: Money; vatRate: number; vatAmount: Money; total: Money
  status: 'draft' | 'sent' | 'partial' | 'paid' | 'overdue' | 'cancelled'
}
type InvoiceLine = { description: string; quantity: number; unitPrice: Money; amount: Money }

type Payment = {
  id: string; organizationId: string; invoiceId?: string
  amount: Money; method: 'cash' | 'bank' | 'cheque' | 'other'; paidAt: Date
}

type Expense = {
  id: string; organizationId: string; vehicleId?: string
  category: 'fuel' | 'maintenance' | 'tolls' | 'salary' | 'admin' | 'other'
  amount: Money; spentAt: Date; receiptUrl?: string; source: 'manual' | 'ocr'
}

type Employee = {
  id: string; organizationId: string; userId?: string
  fullName: string; role: string; baseSalary: Money
  contractType?: 'cdi' | 'cdd' | 'interim'; contractEndsAt?: Date  // → renewal alert
  cnssNumber?: string                             // PII — see §11
}
type Attendance = { id: string; organizationId: string; employeeId: string; date: Date; status: 'present' | 'absent' | 'leave'; hours?: number }
type Advance = { id: string; organizationId: string; employeeId: string; amount: Money; grantedAt: Date; repaid: boolean }

type AuditLog = {
  id: string; organizationId: string; actorUserId: string
  entity: string; entityId: string; action: 'create' | 'update' | 'delete' | 'approve'
  before?: unknown; after?: unknown; at: Date     // financial mutations MUST log
}
```

Indexing: every table indexed on `organizationId`; plus `(organizationId, status)`,
`(organizationId, startDate)`, document `expiresAt`, invoice `(organizationId, number)` unique.

---

## §7 — Multi-Tenancy & Roles

This is the part RabatEvents never had. Treat it as the most dangerous surface in the product.

**Tenancy model**: shared database, shared schema, **row-scoped by `organizationId`**.

1. **Every business query is scoped to the caller's `organizationId`.** No exceptions.
2. **Postgres Row-Level Security is enabled** as a backstop: even a buggy query cannot cross
   tenants. App sets `SET app.current_org = $orgId` per request/transaction; RLS policies
   enforce `organization_id = current_setting('app.current_org')::uuid`.
3. **Role is read server-side from the session**, never from a request body or header.
4. The driver role is the most restricted: sees only own missions/fuel/attendance; cannot
   read finance, other drivers, or org settings.

**Role → permission matrix (enforced server-side):**

| Capability | owner | manager | accountant | driver |
|---|---|---|---|---|
| Org settings, users | ✅ | — | — | — |
| Fleet & documents | ✅ | ✅ | read | read (own vehicle) |
| Missions: create/assign | ✅ | ✅ | read | update own status only |
| Fuel logs | ✅ | ✅ | read | create own |
| Invoicing & payments | ✅ | read | ✅ | — |
| Cash / bank / expenses | ✅ | read | ✅ | create own (with receipt) |
| Profitability / P&L | ✅ | read | read | — |
| HR & payroll | ✅ | read | ✅ | own attendance/advances only |

---

## §8 — Seed / Demo Data

Ship a realistic demo org so a new tenant sees value in 30 seconds (and so dev/test has
data). Mirror the competitor's demo to make switching feel familiar:

- Org: "Transport Demo SARL" (ICE placeholder), locale `fr`
- Users: 1 owner (Jamal), 1 dispatcher, 1 accountant, 2 drivers
- 3 vehicles: codes `50387` / `73472` / `92272`, makes FUSO / MITSUBISHI / MITSUBISHI
  (exactly the competitor demo shape), with insurance + visite-technique docs (one expiring soon → triggers an alert)
- ~8 missions across statuses; ~20 fuel logs (one deliberately over-consumption); 4 clients;
  3 invoices (one overdue); a handful of expenses, payments, employees, attendance rows.

Seed is idempotent and never loads into a real tenant.

---

## §9 — Design Identity

- **Aesthetic**: Clean operational dashboard. Dense where data lives (tables, KPIs), calm
  everywhere else. Think Linear/Stripe-dashboard discipline, not a busy ERP.
- **NOT**: the dark cramped sidebar of the incumbent screenshot; not generic SaaS purple.
- **Layout**: left module nav (Exploitation / Commercial & Finance / RH groups — mirrors the
  competitor so switchers orient instantly), top bar with org + role + locale switch.
- **Colors**: deep slate primary, a single confident accent (road-sign amber/orange works
  for transport), green/red reserved strictly for money & status (paid/overdue, ok/anomaly).
- **Typography**: Body — "Plus Jakarta Sans"; headings — "Bricolage Grotesque"; Arabic —
  "Noto Kufi Arabic". (Reused from RabatEvents — already proven RTL-clean.)
- **Numbers**: tabular figures everywhere money or distance appears. Currency always
  formatted from centimes; never show raw floats.
- **Mobile (driver app)**: huge tap targets, minimal typing, camera-first, works one-handed
  in a truck cab. Status of sync (offline/syncing/synced) is always visible.

---

## §10 — UX Principles

1. **Kill manual entry** — every screen asks: can this be captured by camera/app instead of typed?
2. **Money is sacred** — currency is always exact, always attributed, always auditable.
3. **Offline is normal, not an error** — the driver app must be fully usable with no signal; sync silently.
4. **One-person mode** — a solo owner can run everything without role friction.
5. **Alerts that matter** — document expiry, overdue invoices, over-consumption, contract renewals surface proactively; no alert spam.
6. **Profitability is the headline** — the home dashboard answers "am I making money, per truck and per client?" — the question the incumbent buries.
7. **RTL is equal** — Arabic is designed, not translated.
8. **Fast on cheap phones / slow networks** — the target market runs mid-range Android on 3G/4G.

---

## §11 — Legal, Privacy & Financial Integrity

Naql holds far more sensitive data than RabatEvents (payroll, CNSS numbers, driver
locations later, customer financials). Treat compliance as a feature.

1. **CNDP (Moroccan Law 09-08)**: employee/driver PII (CNSS, salary, license, future GPS
   location) is personal data. Store with encryption at rest; access is role-gated and
   audit-logged; document a retention policy; support data export & deletion per tenant.
2. **Tenant data isolation**: §7 RLS is a privacy control, not just a bug guard.
3. **Financial integrity**: money in integer centimes; every financial mutation writes an
   `AuditLog`; invoice numbers are sequential and immutable once issued (Moroccan invoicing
   rules); never delete a paid invoice — cancel/credit-note instead.
4. **Invoice compliance**: include ICE, TVA rate/amount, sequential number, issuer details.
5. **Receipts/OCR**: uploaded images may contain PII — same storage & access rules.
6. **Driver consent (forward-looking)**: GPS tracking (v0.2) requires explicit driver
   notice/consent; bake the consent record into the data model now even if tracking is later.
7. **No selling data, ever.** This is also a sales differentiator vs. incumbents.

---

## §12 — Definition of Done (v0.1 — 18 items)

- [ ] Multi-tenant signup → an org is created, owner user provisioned, RLS active
- [ ] RBAC enforced server-side for all 4 roles (verified by tests, including cross-tenant denial)
- [ ] Fleet module: CRUD vehicles + documents + expiry alerts
- [ ] Missions module: full lifecycle planned→invoiced
- [ ] Fuel & consumption: logging + L/100km + over-consumption ranking
- [ ] Invoicing: generate from mission, Moroccan-compliant PDF (FR + AR), sequential numbers
- [ ] Payments + client ledger + outstanding balance
- [ ] Cash / bank / expenses with receipt attachment
- [ ] Profitability dashboard: P&L, margin per vehicle, margin per client, cost-per-km
- [ ] HR: employees, contracts + renewal alerts, attendance, advances, basic payroll run
- [ ] **Driver mobile app**: login, see missions, update status, log fuel, snap receipt, proof-of-delivery — **all working offline with sync**
- [ ] **OCR**: receipt photo → pre-filled fuel/expense entry with confidence score
- [ ] Money stored as integer centimes everywhere; currency formatted on display
- [ ] Audit log on all financial mutations
- [ ] French fully translated; Arabic fully translated + RTL correct
- [ ] `pnpm build` passes, zero TypeScript errors; `pnpm test` all green; `pnpm lint` clean
- [ ] Demo/seed org loads; new tenant sees data instantly
- [ ] Deploys: Vercel + managed Postgres + worker, OR `docker compose up -d` works end-to-end

---

## §13 — Sprint Roadmap

| Sprint | Goal |
|---|---|
| **Sprint 0** | Scaffold: monorepo (web + mobile + packages), Postgres+Drizzle, **Auth.js + org/tenancy + RLS**, Docker, CI — `pnpm dev` works, login works, tenant isolation proven |
| **Sprint 1** | Data model + RBAC + Fleet module (vehicles, documents, expiry alerts) + demo seed |
| **Sprint 2** | Missions/Dispatch + Fuel & Consumption (incl. over-consumption ranking) |
| **Sprint 3** | Commercial & Finance: Clients, Invoicing (PDF), Payments, Cash/Bank/Expenses, Profitability |
| **Sprint 4** | HR: employees, contracts, attendance, advances, payroll run |
| **Sprint 5** | **Driver mobile app (offline-first)** + **OCR receipt capture** — the wedges |
| **Sprint 6** | i18n FR/AR complete + RTL polish + a11y |
| **Sprint 7** | Security hardening (tenant-isolation pentest, audit log), performance, deploy → v0.1 ship |

(v0.2 roadmap — GPS telematics, predictive maintenance, client portal, WhatsApp — lives in
`.claude/sprint-backlog/` only after v0.1 ships. Out of scope until then.)

---

## §14 — Repository Structure

```
naql/
├── CLAUDE.md                         ← this file
├── .claude/                          ← AI team config (skills, sprint backlogs, logs)
├── apps/
│   ├── web/                          ← Next.js 15 dashboard (owner/manager/accountant)
│   │   └── src/app/[locale]/(dashboard)/
│   │       ├── fleet/ missions/ fuel/ invoicing/ payments/
│   │       ├── cash/ expenses/ profitability/ hr/ settings/
│   │       └── ../api/               ← route handlers (typed server actions preferred)
│   └── mobile/                       ← Expo React Native driver app (offline-first)
│       └── src/ (screens: missions, fuel, pod, attendance; sync/ queue)
├── packages/
│   ├── core/                         ← shared TS types, Money helpers, RBAC matrix, validation (Zod)
│   ├── db/                           ← Drizzle schema, migrations, RLS policies, tenant-scoped query helpers, seed
│   ├── ocr/                          ← OCR adapter interface + Vision/Textract impls + parsers
│   ├── billing/                      ← invoice numbering, VAT, PDF generation
│   ├── payroll/                      ← Moroccan payroll calc (CNSS/IR configurable)
│   └── notifications/                ← alert engine (expiry, overdue, over-consumption); WhatsApp adapter stub (v0.2)
├── docker-compose.yml                ← postgres + web + worker (pg-boss) + caddy
├── Dockerfile
└── .env.example
```

---

## §15 — Auth & Access Model

Real authentication (this replaces RabatEvents' Basic Auth entirely).

- **Auth.js (NextAuth) v5**, credentials provider (email + password, Argon2id hashing).
- A session carries `userId`, `organizationId`, and `role`. The app reads role/org **only**
  from the session — never trusts client input.
- Every server action / route handler runs through a `withTenant(session, handler)` wrapper
  that (a) sets `app.current_org` for RLS, (b) checks the RBAC matrix (§7) for the action.
- Mobile app authenticates the same backend; tokens are short-lived with refresh; the device
  stores only what the driver role may see.
- Org provisioning: signup creates `Organization` + owner `User` in one transaction; invites
  add users with a role.
- Secrets (`AUTH_SECRET`, `DATABASE_URL`, OCR keys, etc.) live in `.env` only — never
  hardcoded, scanned in CI with gitleaks.

```typescript
// every protected handler, conceptually:
export const action = withTenant(async ({ db, orgId, role, userId }, input) => {
  assertCan(role, 'invoice:create')        // RBAC matrix, server-side
  // db is already tenant-scoped (RLS + helper) — queries cannot leak across orgs
})
```
