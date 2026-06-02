# Sprint 6 — i18n FR/AR Complete + RTL + Accessibility

**Goal**: A fully bilingual product. Every string translated (web + mobile), RTL correct
everywhere, accessible on the cheap Android phones the target market uses.

**Duration**: 1 session
**Depends on**: Sprint 5 DONE
**Auto-handoff**: ENABLED

---

## Must

- [ ] S6-01 — Content Editor: complete fr.json + ar.json sweep — every module, no gaps — **Content Editor** → handoff: Frontend Dev
- [ ] S6-02 — Content Editor: shared mobile catalog parity with web keys — **Content Editor** → handoff: Mobile Dev
- [ ] S6-03 — Frontend Dev: i18n audit — grep for hardcoded user-facing strings; zero allowed — **Frontend Dev** → handoff: Tester
- [ ] S6-04 — Frontend Dev: RTL audit — logical Tailwind props everywhere; tables/nav/charts mirror; no physical left/right — **Frontend Dev** → handoff: Tester
- [ ] S6-05 — Mobile Dev: RTL audit on driver app; Arabic layout correct — **Mobile Dev** → handoff: Tester
- [ ] S6-06 — UI Designer: currency/number locale formatting (tabular nums, MAD via Intl) verified FR/AR — **UI Designer** → handoff: Frontend Dev
- [ ] S6-07 — Frontend Dev: accessibility — focus states, labels, contrast, keyboard nav on dashboard — **Frontend Dev** → handoff: Tester
- [ ] S6-08 — Tester: i18n + RTL E2E (`/ar` dir=rtl, mirrored tables), a11y smoke — **Tester** → handoff: Project Monitor
- [ ] S6-09 — Sprint 6 snapshot — **Project Monitor** → STOP → ask user for Sprint 7 approval

---

## Definition of Done — Sprint 6

- [ ] Zero hardcoded user-facing strings (web + mobile), verified by audit
- [ ] AR RTL correct on every page and on the driver app
- [ ] Currency/dates locale-formatted; money never shows raw float
- [ ] Basic a11y pass on the dashboard
- [ ] `pnpm build`/`test`/`lint` + mobile smoke green

---

# Sprint 7 — Security Hardening + Performance + Deploy → v0.1 SHIP

**Goal**: Production-ready. Tenant isolation proven under adversarial testing, money audited,
performance acceptable on slow networks, deploys both to managed cloud and self-host Docker.
All 18 DoD items checked.

**Duration**: 1–2 sessions
**Depends on**: Sprint 6 DONE
**Auto-handoff**: ENABLED

---

## Must

- [ ] S7-01 — Security Engineer: **tenant-isolation hardening** — adversarial cross-tenant attempts across every endpoint; all return empty/403 — **Security Engineer** → handoff: Tester
- [ ] S7-02 — Security Engineer: Auth.js hardening — login rate-limit + lockout; session/refresh review — **Security Engineer** → handoff: Backend Dev
- [ ] S7-03 — Security Engineer: PII pass — encryption at rest, access logging, nothing sensitive in logs/errors/OCR dumps — **Security Engineer** → handoff: Backend Dev
- [ ] S7-04 — Security Engineer: security headers + CSP + upload validation — **Security Engineer** → handoff: DevOps
- [ ] S7-05 — Backend Dev: audit-log coverage check — every financial mutation writes a row — **Backend Dev** → handoff: Tester
- [ ] S7-06 — Tech Lead / Frontend: performance — query indexes used, dashboard loads fast, mobile bundle lean, image compression — **Tech Lead** → handoff: Tester
- [ ] S7-07 — DevOps: deploy path A — managed cloud (web + managed Postgres with RLS + worker), env documented — **DevOps** → handoff: Deployment
- [ ] S7-08 — DevOps: deploy path B — `docker compose up -d` end-to-end (migrate + seed + worker + caddy) — **DevOps** → handoff: Deployment
- [ ] S7-09 — Deployment: verify both paths; cross-tenant returns empty in prod; worker sweep active — **Deployment** → handoff: Tester
- [ ] S7-10 — Tester: full regression + cross-tenant denial suite + E2E critical paths + mobile smoke — **Tester** → handoff: Project Monitor
- [ ] S7-11 — README + `.env.example` complete (web + mobile setup, env vars, deploy, architecture) — **Project Manager** → handoff: Project Monitor
- [ ] S7-12 — Final DoD: all 18 items (CLAUDE.md §12) ✅ — **Project Monitor** → v0.1 SHIPPED

---

## Definition of Done — Sprint 7 (= v0.1 SHIPPED)

All 18 items from CLAUDE.md §12 checked. Specifically the ship-blockers:
- [ ] Cross-tenant denial tests green; adversarial isolation attempts fail to leak
- [ ] RLS enabled+forced on every table; app runs as RLS-bound role
- [ ] Money exact (centimes); financial mutations audited; invoices immutable
- [ ] Driver app works offline + syncs idempotently; OCR pre-fills with confidence gate
- [ ] PII encrypted, role-gated, access-logged
- [ ] Deploys via managed cloud AND `docker compose up -d`
- [ ] `pnpm build` 0 TS errors; `pnpm test` green; `pnpm lint` clean; gitleaks passes

---

> **v0.2 (only after v0.1 ships)**: live GPS/telematics, predictive maintenance, GPS-based
> fuel-theft detection, client portal, WhatsApp notifications, fuel-card + accounting
> integrations, route optimization. These are the moat — but they do not start until v0.1 is
> in customers' hands. (CLAUDE.md §4)
