# Sprint 4 — Human Resources + Payroll

**Goal**: The RH module — employees, contracts with renewal alerts, attendance, advances, and
a configurable Moroccan payroll run. PII handled per CNDP.

**Duration**: 1–2 sessions
**Depends on**: Sprint 3 DONE
**Auto-handoff**: ENABLED

---

## Must

- [ ] S4-01 — UX: employees + attendance + payroll wireframes — **UX Designer** → handoff: Frontend Dev
- [ ] S4-02 — HR/Payroll Engineer: `packages/payroll` — `PayrollConfig` (CNSS/IR configurable), net calc (Money) — **HR/Payroll Engineer** → handoff: Backend Dev
- [ ] S4-03 — Backend Dev: employee actions + contracts; contract-renewal alerts into sweep — **Backend Dev** → handoff: Integrations Engineer
- [ ] S4-04 — Backend Dev: attendance actions (office via dashboard; driver clock via mobile sync) — **Backend Dev** → handoff: Mobile Dev
- [ ] S4-05 — Backend Dev: advances + repayment-against-payroll — **Backend Dev** → handoff: HR/Payroll Engineer
- [ ] S4-06 — HR/Payroll Engineer: `payroll.run` pg-boss job — idempotent per (org, month), payslip + audit — **HR/Payroll Engineer** → handoff: Tester
- [ ] S4-07 — Security Engineer: PII review — CNSS/salary encryption at rest, role-gating, access logging — **Security Engineer** → handoff: Backend Dev
- [ ] S4-08 — Frontend Dev: Employés, Pointage, Avances, Paie, Contrats views (role-gated salaries) — **Frontend Dev** → handoff: Tester
- [ ] S4-09 — Content Editor: FR/AR for HR/payroll terms — **Content Editor** → handoff: Frontend Dev
- [ ] S4-10 — Tester: payroll math + idempotent re-run + PII role-gating + advance>net edge case — **Tester** → handoff: Test Architect
- [ ] S4-11 — Test Architect: adversarial payroll + leave/attendance deduction cases — **Test Architect** → handoff: HR/Payroll Engineer
- [ ] S4-12 — Sprint 4 snapshot — **Project Monitor** → STOP → ask user for Sprint 5 approval

---

## Definition of Done — Sprint 4

- [ ] Employees + contracts; renewal alerts fire
- [ ] Attendance recorded (dashboard + mobile); feeds payroll deductions
- [ ] Advances tracked and repaid against payroll
- [ ] Payroll run idempotent per (org, month); payslips + audit; rates from `PayrollConfig`
- [ ] Salaries/CNSS role-gated (owner/accountant), encrypted, access-logged; absent from logs
- [ ] Expired driver license warns at mission assignment
- [ ] FR + AR complete; `pnpm build`/`test`/`lint` green

---

# Sprint 5 — Driver Mobile App + OCR (THE WEDGES)

**Goal**: The two differentiators the incumbent has nothing for. An offline-first driver app
and OCR receipt capture that kills manual data entry.

**Duration**: 2–3 sessions
**Depends on**: Sprint 4 DONE
**Auto-handoff**: ENABLED

---

## Must

- [ ] S5-01 — UX: driver app flows (missions, fuel+photo, POD, attendance, sync status) — **UX Designer** → handoff: Mobile Dev
- [ ] S5-02 — Backend Dev: `POST /api/sync` contract — idempotency keys, driver-scope writes, conflict resolution, per-item results — **Backend Dev** → handoff: Mobile Dev
- [ ] S5-03 — Mobile Dev: offline store (expo-sqlite) + append-only outbox + sync engine — **Mobile Dev** → handoff: Tester
- [ ] S5-04 — Mobile Dev: Missions screen (status updates) — **Mobile Dev** → handoff: Tester
- [ ] S5-05 — Mobile Dev: Fuel log screen + camera receipt capture (queues offline) — **Mobile Dev** → handoff: AI/ML Engineer
- [ ] S5-06 — Mobile Dev: Proof-of-delivery (photo + signature) + Attendance clock — **Mobile Dev** → handoff: Tester
- [ ] S5-07 — AI/ML Engineer: `packages/ocr` — `OcrProvider` interface + Vision/Textract impl + fuel-receipt parser → `ReceiptDraft` — **AI/ML Engineer** → handoff: Backend Dev
- [ ] S5-08 — Backend Dev: `ocr.process` pg-boss job — draft pre-fills fuel/expense; low confidence → confirm, never auto-save — **Backend Dev** → handoff: Frontend Dev
- [ ] S5-09 — Frontend Dev: receipt-confirm UI (review OCR draft → save fuel/expense) — **Frontend Dev** → handoff: Tester
- [ ] S5-10 — Content Editor: FR/AR shared mobile catalog (statuses, sync, fuel, POD) — **Content Editor** → handoff: Mobile Dev
- [ ] S5-11 — Tester: offline→online sync idempotency (no dupes), OCR fixtures + confidence gate, driver-scope enforcement — **Tester** → handoff: Test Architect
- [ ] S5-12 — Test Architect: adversarial sync (replay, conflict, partial media) + OCR garbage input — **Test Architect** → handoff: Mobile Dev
- [ ] S5-13 — Sprint 5 snapshot — **Project Monitor** → STOP → ask user for Sprint 6 approval

---

## Definition of Done — Sprint 5

- [ ] Driver logs in, sees own missions, updates status — **fully offline**, syncs later
- [ ] Fuel log + receipt photo + proof-of-delivery + attendance all work offline and sync
- [ ] Replayed sync items never duplicate server records (idempotency)
- [ ] OCR turns a receipt photo into a pre-filled fuel/expense draft with a confidence score
- [ ] Below-threshold drafts require human confirmation; never auto-saved
- [ ] Driver can only read/write own scope (verified)
- [ ] FR + AR mobile strings; `pnpm build`/`test`/`lint` + mobile smoke green
