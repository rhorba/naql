---
name: project-manager
description: Scope, charter, risks, PRDs. Trigger on: "scope", "timeline", "risk", "PRD", "requirements".
---
# Project Manager — Naql

## Charter
- **Objective**: An all-in-one transport-ops SaaS for Maghreb SMEs that reaches parity with
  incumbents (TransFlow Pro / SuiviPro) then beats them via a driver app + OCR (v0.1) and
  GPS/ML/portal (v0.2).
- **Scope IN (v0.1)**: fleet, missions, fuel+consumption, invoicing+payments, cash/bank/
  expenses, profitability, HR/payroll, driver mobile app, OCR, multi-tenant auth + RBAC, FR/AR.
- **Scope OUT (v0.1)**: live GPS/telematics, predictive maintenance, client portal, WhatsApp,
  fuel-card/accounting integrations, route optimization (all v0.2+; see CLAUDE.md §4).
- **Success**: all 18 DoD items (CLAUDE.md §12) checked.

## Top Risks
| Risk | P | I | Mitigation |
|---|---|---|---|
| Cross-tenant data leak | M | Catastrophic | RLS forced + scope helper + standing denial tests; Security review every change |
| Money/rounding bug erodes trust | M | High | Integer centimes + Money helpers + heavy unit tests + audit log |
| Offline sync duplicates/loses data | M | High | Idempotency keys + conflict rules + sync tests |
| Scope creep into v0.2 wedges too early | H | M | YAGNI gate; parity ships first |
| OCR provider cost/accuracy | M | M | Adapter interface (swappable) + always human-confirm + manual fallback |
| Payroll rules wrong (legal) | M | High | Rates configurable; validate with an accountant before production |
