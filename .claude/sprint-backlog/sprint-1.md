# Sprint 1 — Data Model + RBAC + Fleet Module + Seed

**Goal**: The full multi-tenant schema is live with RLS on every table. RBAC is enforced and
tested for all four roles. The Fleet module works end-to-end (vehicles + documents + expiry
alerts). A demo org seeds instantly.

**Duration**: 1–2 sessions
**Depends on**: Sprint 0 DONE
**Auto-handoff**: ENABLED

---

## Must

- [ ] S1-01 — DBA: full schema — `vehicles`, `vehicle_documents`, `drivers`, `missions`, `fuel_logs`, `clients`, `invoices`, `payments`, `expenses`, `employees`, `attendance`, `advances`, `audit_log` — each with `organization_id`, indexes, money as bigint — **DBA** → handoff: Security Engineer
- [ ] S1-02 — DBA: RLS enabled+forced + tenant policy on **every** new table in the same migration — **DBA** → handoff: Security Engineer
- [ ] S1-03 — Security Engineer: review RLS coverage (no table without a policy) + app-role can't bypass — **Security Engineer** → handoff: Tester
- [ ] S1-04 — Backend Dev: finalize RBAC matrix (CLAUDE.md §7) in `packages/core` + `assertCan` for all permissions — **Backend Dev** → handoff: Tester
- [ ] S1-05 — DBA: invoice-number allocator (advisory lock per org/year) — **DBA** → handoff: Finance Engineer
- [ ] S1-06 — Backend Dev: Fleet server actions — vehicle CRUD + document CRUD (tenant-scoped + RBAC) — **Backend Dev** → handoff: Frontend Dev
- [ ] S1-07 — Backend Dev: `alerts.sweep` pg-boss job — document/license expiry → alert rows — **Backend Dev** → handoff: Integrations Engineer
- [ ] S1-08 — Integrations Engineer: alert engine + `NotificationChannel` interface + `InAppChannel` — **Integrations Engineer** → handoff: Frontend Dev
- [ ] S1-09 — UX Designer: Fleet list + vehicle detail + document expiry wireframes — **UX Designer** → handoff: Frontend Dev
- [ ] S1-10 — Frontend Dev: Fleet module UI — vehicle table (status, code, registration), vehicle form, documents tab, expiry badges — **Frontend Dev** → handoff: Tester
- [ ] S1-11 — Frontend Dev: alerts panel + nav counts (wired to alert rows) — **Frontend Dev** → handoff: Tester
- [ ] S1-12 — DBA + Backend Dev: idempotent demo seed — "Transport Demo SARL", 5 users, 3 vehicles (50387/73472/92272, FUSO/MITSUBISHI), docs (one expiring), clients, missions, fuel, invoices (CLAUDE.md §8) — **DBA** → handoff: Tester
- [ ] S1-13 — Content Editor: FR/AR for fleet, documents, alerts, vehicle statuses — **Content Editor** → handoff: Frontend Dev
- [ ] S1-14 — Tester: RBAC denial tests (driver can't write fleet; accountant read-only) + cross-tenant on new tables + Fleet CRUD integration — **Tester** → handoff: Test Architect
- [ ] S1-15 — Test Architect: adversarial — orgId injection, expired doc edge cases, RLS on every table — **Test Architect** → handoff: Backend Dev
- [ ] S1-16 — Sprint 1 snapshot — **Project Monitor** → STOP → ask user for Sprint 2 approval

---

## Definition of Done — Sprint 1

- [ ] All core tables exist with `organization_id` + RLS enabled+forced + indexes
- [ ] RBAC enforced server-side; denial tests pass for all 4 roles
- [ ] Cross-tenant denial tests pass on every new table
- [ ] Fleet: create/edit/list vehicles + documents; expiry alerts appear
- [ ] Alert engine writes tenant-scoped, deduped alert rows; dashboard panel shows them
- [ ] Invoice-number allocator returns sequential numbers with no gaps under concurrency
- [ ] Demo org seeds idempotently; new tenant sees the 3-truck demo fleet
- [ ] FR + AR strings for everything added; RTL intact
- [ ] `pnpm build` + `pnpm test` + `pnpm lint` all green
