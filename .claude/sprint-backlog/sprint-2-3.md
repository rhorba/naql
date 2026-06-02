# Sprint 2 — Missions / Dispatch + Fuel & Consumption

**Goal**: The operational core. Dispatchers create and run missions through their lifecycle.
Fuel is logged and consumption is computed, with over-consumption ranking (the feature that
beats the incumbent's basic flag).

**Duration**: 1–2 sessions
**Depends on**: Sprint 1 DONE
**Auto-handoff**: ENABLED

---

## Must

- [ ] S2-01 — UX: mission lifecycle + dispatch board + fuel log wireframes — **UX Designer** → handoff: Frontend Dev
- [ ] S2-02 — Backend Dev: mission server actions — create, assign vehicle+driver, status transitions (planned→in_progress→completed→invoiced) — **Backend Dev** → handoff: Frontend Dev
- [ ] S2-03 — Backend Dev: fuel log server actions (create/list) + odometer capture — **Backend Dev** → handoff: Telematics Engineer
- [ ] S2-04 — Telematics Engineer: consumption baseline (rolling median) + odometer integrity validation + `DistanceSource` abstraction — **Telematics Engineer** → handoff: AI/ML Engineer
- [ ] S2-05 — AI/ML Engineer: over-consumption ranking (deviation vs baseline, impact-weighted; guards against bad odometer) — **AI/ML Engineer** → handoff: Finance Engineer
- [ ] S2-06 — Frontend Dev: Missions UI — dispatch board, mission form, status actions, fleet availability — **Frontend Dev** → handoff: Tester
- [ ] S2-07 — Frontend Dev: Fuel + Consommation + Surconsommation views (ranked anomalies) — **Frontend Dev** → handoff: Tester
- [ ] S2-08 — Integrations Engineer: over-consumption alerts into the sweep + panel — **Integrations Engineer** → handoff: Frontend Dev
- [ ] S2-09 — Content Editor: FR/AR for missions, fuel, consumption, statuses — **Content Editor** → handoff: Frontend Dev
- [ ] S2-10 — Tester: mission lifecycle + RBAC (driver updates own status only) + consumption math + anomaly edge cases — **Tester** → handoff: Project Monitor
- [ ] S2-11 — Sprint 2 snapshot — **Project Monitor** → STOP → ask user for Sprint 3 approval

---

## Definition of Done — Sprint 2

- [ ] Mission lifecycle works end-to-end; vehicle status reflects assignment
- [ ] Fuel logging works; L/100km computed; odometer integrity validated
- [ ] Over-consumption view ranks anomalies; bad odometer flagged "needs review", not false-flagged
- [ ] Distance read through `DistanceSource` (swappable for GPS in v0.2)
- [ ] Driver can only update own mission status (RBAC test)
- [ ] FR + AR complete; `pnpm build`/`test`/`lint` green

---

# Sprint 3 — Commercial & Finance

**Goal**: Money. Clients, invoicing (Moroccan-compliant PDF, sequential immutable numbers),
payments, cash/bank, expenses, and the profitability dashboard that is Naql's headline.

**Duration**: 2 sessions
**Depends on**: Sprint 2 DONE
**Auto-handoff**: ENABLED

---

## Must

- [ ] S3-01 — UX: invoicing flow + P&L dashboard + ledgers wireframes — **UX Designer** → handoff: Frontend Dev
- [ ] S3-02 — Finance Engineer: `packages/billing` — VAT, sequential numbers, totals (all integer-safe via Money) — **Finance Engineer** → handoff: Backend Dev
- [ ] S3-03 — Finance Engineer: invoice PDF (FR + AR), Moroccan fields (ICE, TVA) — **Finance Engineer** → handoff: Frontend Dev
- [ ] S3-04 — Backend Dev: invoice actions (create from mission, send), **immutability once issued**, credit notes — **Backend Dev** → handoff: Tester
- [ ] S3-05 — Backend Dev: payments (link to invoice, partial), client `outstandingBalance`, audit log on all — **Backend Dev** → handoff: Finance Engineer
- [ ] S3-06 — Backend Dev: cash/bank/expense actions + receipt attachment field — **Backend Dev** → handoff: Frontend Dev
- [ ] S3-07 — Finance Engineer: profitability — net result, margin/vehicle, margin/client, cost-per-km — **Finance Engineer** → handoff: Frontend Dev
- [ ] S3-08 — Frontend Dev: Clients, Facturation, Paiements, Caisse, Banque, Dépenses views — **Frontend Dev** → handoff: Tester
- [ ] S3-09 — Frontend Dev: home P&L dashboard (KPIs, margin tables, cost-per-km, alerts) — **Frontend Dev** → handoff: Tester
- [ ] S3-10 — Integrations Engineer: overdue-invoice alerts into sweep — **Integrations Engineer** → handoff: Frontend Dev
- [ ] S3-11 — Content Editor: FR/AR for finance terms (TVA, ICE, Net, statuses) — **Content Editor** → handoff: Frontend Dev
- [ ] S3-12 — Tester: money correctness (VAT/rounding), sequential numbers under concurrency, invoice immutability, RBAC (accountant vs manager), audit rows — **Tester** → handoff: Test Architect
- [ ] S3-13 — Test Architect: adversarial money + ledger reconciliation edge cases — **Test Architect** → handoff: Finance Engineer
- [ ] S3-14 — Sprint 3 snapshot — **Project Monitor** → STOP → ask user for Sprint 4 approval

---

## Definition of Done — Sprint 3

- [ ] Generate invoice from a completed mission; FR + AR PDF; ICE + TVA present
- [ ] Invoice numbers sequential, no gaps under concurrency; issued invoices immutable; credit notes work
- [ ] Payments update invoice status + client outstanding balance; audit rows written
- [ ] Cash/bank/expenses with receipt attachment
- [ ] Profitability dashboard: net result, margin per vehicle, margin per client, cost-per-km
- [ ] All money via `Money` (centimes); no float arithmetic anywhere
- [ ] FR + AR complete; `pnpm build`/`test`/`lint` green
