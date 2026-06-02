# sessions

<!-- append-only log — session start/end snapshots -->

## SESSION_START — 2026-06-01
Sprint: 0 — Scaffold + Auth + Multi-Tenancy + RLS
Status: Fresh project, no prior work. All S0 tasks pending.
Goal: `pnpm dev` works, signup/login works, Postgres running with RLS, cross-tenant isolation proven by a test.

## SESSION_END — 2026-06-01
Sprint: 0 — IN PROGRESS
Completed this session:
- Root monorepo scaffold (pnpm-workspace.yaml, package.json, tsconfig.json, biome.json, .gitignore)
- packages/core fully written (types, money helpers, RBAC matrix + assertCan, Zod schemas)
- packages/db schema fully written (all 9 tables) with indexes
Next session starts at: S0-01 (remaining package stubs) → S0-02 (apps/web) → S0-05 (RLS) → S0-07 (Auth.js)

## SESSION_START — 2026-06-02
Sprint: 0 — Resuming from IN PROGRESS
Goal: Complete all remaining S0 tasks (S0-01 through S0-19).

## SESSION_END — 2026-06-02
Sprint: 0 — COMPLETE ✅
Completed this session:
- S0-01: Package stubs for billing, payroll, ocr, notifications (with scoped tsconfigs + src/)
- S0-02: apps/web Next.js 15 scaffold (package.json, tsconfig, next.config, postcss, messages FR/AR/EN)
- S0-05+S0-06: RLS SQL (rls.sql): naql_app role, FORCE RLS on all 14 tables, tenant policies, withOrgContext GUC helper
- S0-07: Auth.js v5 credentials provider (Argon2id, session = {userId, orgId, role})
- S0-08: withTenant server wrapper (auth → GUC → RBAC → handler)
- S0-09: Signup server action (org+user in 1 tx) + login page + mobile driver JWT login API
- S0-10: next-intl routing (fr/ar/en), middleware (auth guard + i18n), [locale] layout with dir=rtl for AR
- S0-11: Tailwind v4 @theme tokens (slate + amber + green/red, fonts, shadows, tabular-nums)
- S0-12: Dashboard shell (Sidebar 3-group nav, TopBar locale+role+signout, auth layout, dashboard KPI skeleton)
- S0-13: apps/mobile Expo skeleton (login screen, SQLite outbox+missions_cache+fuel_drafts, SecureStore)
- S0-14: Docker Compose (postgres+web+worker+caddy), multi-stage Dockerfile, Caddyfile, .env.example
- S0-15: pg-boss worker bootstrap (4 queues: alert.sweep, invoice.overdue, payroll.run, ocr.process)
- S0-16: GitHub Actions CI (install→lint→type-check→db:migrate→test→build + gitleaks)
- S0-17: Cross-tenant isolation test (3 cases: org B sees 0 from A, A sees own, crafted orgId rejected)
- S0-18: pnpm install ✓, pnpm lint CLEAN (84 files, 0 errors)
Next: Sprint 1 approval → Fleet module + RBAC + demo seed

## SESSION_START — 2026-06-02 (Sprint 2)
Sprint: 2 — Missions/Dispatch + Fuel & Consumption
Goal: Mission lifecycle, fuel logging, consumption engine, over-consumption ranking.

## SESSION_END — 2026-06-02 (Sprint 2)
Sprint: 2 — COMPLETE ✅
Completed:
- consumption.ts in @naql/core: computeConsumption, detectAnomaly, rankAnomalies (DistanceSource abstraction)
- Mission server actions: create, assign, transitionMission (state machine), listMissions, getMission
- Fuel server actions: createFuelLog (with inline over-consumption check), listFuelLogs, getConsumptionRanking
- Missions UI: dispatch board table with inline status advance buttons, new mission form
- Fuel UI: fuel log table, consumption ranking panel (surconsommation view), new fuel log form
- Over-consumption alerts: written to alerts table on fuel log create
- FR/AR strings for missions + fuel
- 9 consumption tests + 16 RBAC tests = 25 total passing
Next: Sprint 3 approval → Commercial & Finance

## SESSION_START — 2026-06-02 (Sprint 3)
Sprint: 3 — Commercial & Finance
Goal: Invoicing, payments, expenses, profitability dashboard.

## SESSION_END — 2026-06-02 (Sprint 3)
Sprint: 3 — COMPLETE ✅
Completed:
- packages/billing: invoice-compute.ts (computeInvoiceTotals, buildCreditNoteTotals), invoice-pdf.ts (HTML invoice generator FR+AR with Moroccan ICE/TVA fields), profitability.ts (computeProfitability, VehicleMargin, ClientMargin)
- Invoice server actions: createInvoice (sequential number via allocator), sendInvoice (draft→sent, immutable after), createCreditNote, listInvoices
- Payment server actions: createPayment (updates invoice status + client.outstandingBalance atomically, audit logged), listPayments
- Expense/cash/bank server actions: createExpense, listExpenses, listCashMovements, listBankMovements
- UI pages: /clients, /invoicing (list + detail + PDF link), /payments, /expenses, /cash, /profitability (P&L + breakdown + per-client + per-vehicle)
- Invoice detail page with actions (send, PDF download via /api/invoices/[id]/pdf)
- Fixed alert-sweep.ts: corrected invoices.dueDate column reference (was using raw SQL snake_case)
- FR/AR finance strings: invoice status, payment methods, expense categories, VAT/ICE/margin fields
- 10 billing tests: VAT correctness, integer-only centimes, credit note negation, formatInvoiceNumber, profitability math (positive, zero revenue, negative margin)
- 35/35 tests pass · lint clean (124 files)
Next: Sprint 4 → HR module

## SESSION_START — 2026-06-02 (Sprint 4)
Sprint: 4 — HR + Payroll
Goal: Employees, contracts, attendance, advances, Moroccan payroll run.

## SESSION_END — 2026-06-02 (Sprint 4)
Sprint: 4 — COMPLETE ✅
Completed:
- packages/payroll: PayrollConfig (CNSS 4.48%, CNSS employer 21.09%, AMO employee 2.26%, employer 4.11%, configurable ceiling), computePayslip (absence pro-rata, CNSS+AMO+IR deductions, advance deduction, net ≥ 0, employer cost)
- Employee server actions: createEmployee, updateEmployee, listEmployees (PII audit-redacted)
- Attendance server actions: recordAttendance (upsert per day), listAttendance
- Advance server actions: createAdvance, repayAdvance, listAdvances
- Payroll run action: runPayroll (idempotent per org/month, computes payslips for all employees, marks advances repaid, creates salary expense entries, audit-logged with PII redacted)
- Driver license expiry check on mission assignment (throws if expired)
- HR UI: /hr/employees (salary hidden for driver/manager roles), /hr/attendance, /hr/payroll (client-side run form with payslip table)
- FR/AR HR strings: all HR terms, payslip fields, contract types, attendance status
- 7 payroll tests: baseline CNSS/AMO/IR, absence pro-rata, advance > net → net=0, CNSS ceiling, employer cost, zero gross, full absence
- 42/42 tests pass · lint clean (132 files)
Next: Sprint 5 → Driver mobile app + OCR

## SESSION_START — 2026-06-02 (Sprint 5)
Sprint: 5 — Driver Mobile App + OCR (the wedges)

## SESSION_END — 2026-06-02 (Sprint 5)
Sprint: 5 — COMPLETE ✅
Completed:
- POST /api/mobile/sync: idempotency keys, driver-scope enforcement, last-write-wins attendance, over-consumption check, returns updated missions
- GET /api/mobile/missions: driver-scoped with clientName join
- Mobile sync engine: outbox drain, fetchMissions, getCachedMissions, SyncStatus observable, periodic 30s sync
- Mobile screens: missions (FlatList + optimistic advance + pull-to-refresh), fuel (camera + offline enqueue), attendance (stepper + clock)
- App tab layout with live sync badge (⟳/⚠)
- packages/ocr: GoogleVisionAdapter, MockOcrAdapter, createOcrAdapter factory; parseReceipt with composite confidence, CONFIDENCE_THRESHOLD=0.75
- POST /api/mobile/ocr + /api/ocr/receipt: multipart → OCR → draft with requiresReview flag
- OcrReceiptForm (web): upload → OCR → pre-filled editable form → human confirm only
- FR/AR mobile catalog (fr.ts/ar.ts) + web OCR strings
- 9 OCR parser tests: empty, full parse, comma decimals, confidence gate, high-confidence pass, garbage input, implausible litres/price guards
- 51/51 tests pass · lint clean (147 files)
Next: Sprint 6 → i18n polish + RTL + a11y

## SESSION_START — 2026-06-02 (Sprint 6)
Sprint: 6 — i18n FR/AR Complete + RTL + Accessibility

## SESSION_END — 2026-06-02 (Sprint 6)
Sprint: 6 — COMPLETE ✅
Completed:
- ar.json: full parity with fr.json — all 8 modules complete (ocr, hr, finance.fields, missions.fields+actions, fuel.fields+source+consumption, roles, common.signOut/noData/confirm)
- en.json: full parity — all missing keys added (ocr, hr, finance, missions.fields+actions, fuel.fields+source, roles, common extensions)
- fr.json: added roles section + common.signOut/noData/backToList/detail/confirm
- Sidebar: hardcoded "Paramètres" → t("nav.settings"); RTL-safe (flex auto-mirrors in dir=rtl)
- TopBar: hardcoded role labels → useTranslations("roles"); hardcoded "Déconnexion" → t("common.signOut"); locale links get aria-current="page"; focus-visible ring on all interactive elements
- Dashboard layout: added SkipLink component (keyboard skip-to-content); main gets id="main-content" + tabIndex=-1; orgName now shows organizationId (proper per-tenant)
- globals.css: RTL table text alignment (.text-start/.text-end mirror in dir=rtl), global :focus-visible ring (amber, 2px), sr-only utility class
- i18n parity test: verifies AR + EN have all FR keys; no empty strings; 3 test cases
- SkipLink component: accessible keyboard navigation bypass
- 54/54 tests pass (3 i18n parity tests new) · lint clean (149 files)
Next: Sprint 7 → Security hardening + performance + deploy → v0.1 SHIP
