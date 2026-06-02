# Naql — Claude Code Team Framework

> Read `../CLAUDE.md` for full business rules, data model, and tech stack.
> This file governs HOW the AI team works.

---

## Autonomous Mode (default)

- **Design choices**: Always pick 🟡 **BALANCED** unless user says otherwise.
- **Specialist handoffs**: Proceed automatically — never ask "ready to continue?"
- **Sprint execution**: Work top-to-bottom without pausing between tasks.
- **Testing**: After ANY code task, auto-invoke Tester — never wait for user.

### When to STOP and ask
Only these five reasons:
1. Genuine **blocker** (missing API creds for OCR/Vision, broken dep, schema can't migrate)
2. **Scope question** not answered in `../CLAUDE.md`
3. **DB schema change** that breaks existing migrations or weakens tenant isolation
4. **Security/tenancy risk** that can't be resolved within the team's rules
5. **Sprint boundary** (all tasks done — present summary, ask for Sprint N+1 approval)

---

## Sprint System

Sprint backlogs in `.claude/sprint-backlog/sprint-N.md`.

| Sprint | Goal |
|---|---|
| **Sprint 0** | Scaffold + Auth + org/tenancy + RLS — `pnpm dev` + login + tenant isolation proven |
| **Sprint 1** | Data model + RBAC + Fleet module + demo seed |
| **Sprint 2** | Missions/Dispatch + Fuel & Consumption (over-consumption ranking) |
| **Sprint 3** | Clients + Invoicing (PDF) + Payments + Cash/Bank/Expenses + Profitability |
| **Sprint 4** | HR: employees, contracts, attendance, advances, payroll |
| **Sprint 5** | Driver mobile app (offline-first) + OCR receipt capture |
| **Sprint 6** | i18n FR/AR + RTL + a11y polish |
| **Sprint 7** | Security hardening + performance + deploy → v0.1 ship |

---

## Auto-Handoff Protocol

```
TASK DONE → CHECK sprint backlog → FIND newly unblocked tasks → TRIGGER next specialist
```

| When | Auto-trigger |
|---|---|
| Backend/Frontend/Mobile/DBA task DONE | → Tester |
| DB schema change planned | → DBA review, then Security Engineer (tenancy) before Backend proceeds |
| API/server-action contract defined | → Frontend Dev + Mobile Dev can start in parallel |
| Anything touching money/invoicing/payroll | → Finance/Payroll Engineer owns, Test Architect reviews edge cases |
| Anything touching auth, tenancy, RBAC, PII | → Security Engineer immediate review |
| OCR / anomaly / prediction work | → AI/ML Engineer, then Tester with fixtures |
| Tests PASS for sprint | → Deployment: verify docker-compose + worker boot |
| Sprint all-green | → Project Monitor: generate sprint snapshot |

### Handoff note format (log to `.claude/.logs/communications.md`)
```
HANDOFF: [From Specialist] → [To Specialist]
Task: [task]
Context: [1 sentence]
Need: [what next specialist must do]
Constraints: [decisions locked in]
```

---

## Specialist Skills

| Specialist | Load from | Trigger |
|---|---|---|
| Orchestrator | `skills/orchestrator/SKILL.md` | Session start, routing |
| Project Manager | `skills/project-manager/SKILL.md` | Scope, charter, PRD, risk |
| Scrum Master | `skills/scrum-master/SKILL.md` | Sprint planning, backlog |
| Tech Lead | `skills/tech-lead/SKILL.md` | Architecture, ADRs, stack |
| DBA | `skills/dba/SKILL.md` | Schema, migrations, Drizzle, RLS |
| Backend Dev | `skills/backend-dev/SKILL.md` | API routes, server actions, business logic |
| Frontend Dev | `skills/frontend-dev/SKILL.md` | Dashboard React, tables, forms, RTL |
| Mobile Dev | `skills/mobile-dev/SKILL.md` | Expo driver app, offline sync, camera |
| Telematics Engineer | `skills/telematics-engineer/SKILL.md` | Consumption baselines, GPS rails (v0.2) |
| Finance Engineer | `skills/finance-engineer/SKILL.md` | Money, invoicing, VAT, P&L, cost-per-km |
| HR/Payroll Engineer | `skills/hr-payroll-engineer/SKILL.md` | Payroll calc, attendance, contracts |
| AI/ML Engineer | `skills/ai-ml-engineer/SKILL.md` | OCR parsing, anomaly detection |
| Integrations Engineer | `skills/integrations-engineer/SKILL.md` | Notifications, fuel cards, exports (mostly v0.2) |
| Tester | `skills/tester/SKILL.md` | Vitest, Playwright, mobile smoke |
| Test Architect | `skills/test-architect/SKILL.md` | Test strategy, adversarial, money edge cases |
| Security Engineer | `skills/security-engineer/SKILL.md` | Auth, tenancy isolation, RBAC, PII, OWASP |
| DevOps/DevSecOps | `skills/devops-devsecops/SKILL.md` | Docker, CI/CD, worker, secrets |
| Deployment | `skills/deployment/SKILL.md` | Vercel + Docker Compose verification |
| UX Designer | `skills/ux-designer/SKILL.md` | Flows, wireframes, driver-app UX |
| UI Designer | `skills/ui-designer/SKILL.md` | Design tokens, dashboard + mobile aesthetic |
| Content Editor | `skills/content-editor/SKILL.md` | FR/AR copy, labels, invoice strings |
| Project Monitor | `skills/project-monitor/SKILL.md` | Logs, KPIs, sprint reports |

---

## Log Files (`.claude/.logs/` — append-only)

- `activity.md` — completed tasks, milestones
- `decisions.md` — architecture decisions (ADRs)
- `issues.md` — bugs, blockers
- `risks.md` — risks + mitigations
- `corrections.md` — scope changes
- `communications.md` — specialist handoffs
- `sessions.md` — session start/end snapshots
- `metrics.md` — sprint KPI snapshots

---

## Naql-Specific Rules (the non-negotiables)

1. **Tenant isolation first** — every business query is scoped to `organizationId`, and RLS
   is the backstop. Before ANY new query or table, confirm scoping. A cross-tenant read is a
   STOP-the-line incident, logged in `.logs/issues.md` immediately.
2. **Money is integer centimes** — never a float, never a JS `number` masquerading as
   currency without the `Money` type. Format only on display. Rounding rules documented once,
   in `packages/billing`.
3. **Role is server-side** — never read role/org from request body, query, or header. Only
   from the authenticated session. RBAC checks (`assertCan`) on every mutating action.
4. **Audit financial mutations** — create/update/delete on invoices, payments, expenses,
   payroll writes an `AuditLog` row in the same transaction.
5. **Offline-first mobile** — the driver app must function with no network; all writes queue
   locally and sync idempotently. Never block the driver on connectivity.
6. **Idempotency** — sync, scrape-free imports, OCR re-submits, and webhooks use idempotency
   keys; replaying a request must not double-charge, double-log, or duplicate a mission.
7. **PII discipline (CNDP)** — employee/driver personal data (CNSS, salary, license,
   location) is encrypted at rest, role-gated, and access-logged. Never in logs, never in
   error payloads, never in OCR debug dumps.
8. **Invoices are immutable once issued** — no editing/deleting a sent or paid invoice;
   correct via credit note. Numbers are sequential per org per year.
9. **RTL & i18n** — every UI string in fr.json/ar.json (and the shared mobile catalog);
   logical Tailwind props (`text-start`, `ms-*`, `ps-*`); never hardcode user-facing text.
10. **Graceful degradation** — OCR failure falls back to manual entry; an alert sweep
    failure never blocks the dashboard; a sync conflict is resolved last-write-wins per field
    with the server as tiebreaker, and surfaced, never silently dropped.

---

## YAGNI Gate

```
"Does Naql v0.1 need this for the DoD (../CLAUDE.md §12)?"
  YES → Build it
  NO  → It's a v0.2 backlog item. Do not build, plan in code, or mention. Log to backlog only.
```

The competitor already has the parity modules; the wedges (GPS, ML, portal, WhatsApp) are
what win — but they are v0.2. Shipping parity + driver app + OCR first is the whole strategy.

## 3-Option Pattern (always pick 🟡 BALANCED)

```
🟢 SIMPLE:        [fastest, maybe limited]
🟡 BALANCED:      [moderate effort, good tradeoffs] ← SELECTED (autonomous mode)
🔴 COMPREHENSIVE: [most robust, highest effort]
→ "Proceeding with 🟡 BALANCED approach: [description]"
```
