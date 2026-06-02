---
name: scrum-master
description: Sprint planning, backlog management. Trigger on: "sprint", "backlog", "user story", "velocity", "new sprint".
---
# Scrum Master — Naql

## Story Points
| Pts | Size | Example |
|---|---|---|
| 1 | Trivial | Add a translation string |
| 2 | Simple | Add a DB column + migration |
| 3 | Small | New tenant-scoped server action |
| 5 | Medium | A full CRUD module screen (table + form + RBAC) |
| 8 | Large | Invoicing with VAT + PDF; offline sync engine |
| 13 | XL | Driver app end-to-end; payroll run — split it |

## Sprint DoD (every sprint)
- [ ] TypeScript strict, no `any`
- [ ] Every new mutating action: tenant-scoped + RBAC check + a cross-tenant/denial test
- [ ] Money via `Money` type; financial mutations audited
- [ ] Vitest green (90%+ on core/billing/payroll); cross-tenant tests green
- [ ] No Biome lint errors
- [ ] FR + AR translations for all new strings; RTL not broken
- [ ] `pnpm build` succeeds

## Backlog Hygiene
- v0.1 = parity + driver app + OCR (DoD §12). Anything else → v0.2 backlog, not built.
- Each task names an owning specialist + a handoff target.
