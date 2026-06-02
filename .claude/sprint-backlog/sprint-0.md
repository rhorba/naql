# Sprint 0 — Scaffold + Auth + Multi-Tenancy + RLS

**Goal**: `pnpm install && docker compose up -d && pnpm dev` works. Postgres running with RLS.
A user can sign up (org created), log in, and **tenant isolation is proven by a test**. This is
the foundation everything else stands on — the part RabatEvents never needed.

**Duration**: 1–2 sessions
**Auto-handoff**: ENABLED

---

## Must

- [ ] S0-01 — Initialize pnpm workspace (monorepo: `apps/web`, `apps/mobile`, `packages/core`, `packages/db`, `packages/billing`, `packages/payroll`, `packages/ocr`, `packages/notifications`) — **Tech Lead** → handoff: DBA
- [ ] S0-02 — `apps/web` Next.js 15 App Router skeleton + TypeScript strict + Biome — **Tech Lead** → handoff: Frontend Dev
- [ ] S0-03 — `packages/core`: `Money` type + helpers, `Role`, RBAC matrix + `assertCan`, shared Zod schemas — **Tech Lead** → handoff: Backend Dev
- [ ] S0-04 — `packages/db`: Drizzle config, Postgres connection, `organizations` + `users` tables — **DBA** → handoff: DBA
- [ ] S0-05 — **RLS foundation**: enable+force RLS on `organizations`/`users`, tenant policy pattern, `withTenant` helper setting `app.current_org` — **DBA** → handoff: Security Engineer
- [ ] S0-06 — DB init SQL: create RLS-bound **app role** (separate from migration owner role) — **DBA** → handoff: DevOps
- [ ] S0-07 — Auth.js v5 credentials provider (Argon2id); session carries `{ userId, organizationId, role }` — **Security Engineer** → handoff: Backend Dev
- [ ] S0-08 — `withTenant` server wrapper (auth → set GUC → RBAC → handler) `action()` factory — **Backend Dev** → handoff: Tester
- [ ] S0-09 — Signup flow: create org + owner user in one transaction; login page — **Backend Dev** → handoff: Frontend Dev
- [ ] S0-10 — next-intl fr/ar/en routing + `[locale]` layout with `dir` switch; placeholder messages — **Frontend Dev** → handoff: Frontend Dev
- [ ] S0-11 — Tailwind v4 + design tokens (CLAUDE.md §9) + shadcn/ui init — **UI Designer** → handoff: Frontend Dev
- [ ] S0-12 — Dashboard shell: sidebar nav groups (Exploitation / Commercial & Finance / RH), top bar (org · role · locale) — **Frontend Dev** → handoff: Tester
- [ ] S0-13 — `apps/mobile` Expo skeleton: TS, auth screen, expo-sqlite + outbox table stub, secure-store — **Mobile Dev** → handoff: Tester
- [ ] S0-14 — Docker Compose (postgres + web + worker + caddy) + Dockerfile + Dockerfile.worker + `.env.example` — **DevOps** → handoff: DevOps
- [ ] S0-15 — pg-boss worker process bootstrap (connects, registers no-op queues) — **DevOps** → handoff: Backend Dev
- [ ] S0-16 — GitHub Actions CI: install → lint → db:migrate → test → build → gitleaks — **DevOps** → handoff: Tester
- [ ] S0-17 — **Tester: cross-tenant isolation test** — user in org A cannot read org B rows even with no WHERE clause; crafted orgId in payload ignored — **Tester** → handoff: Security Engineer
- [ ] S0-18 — Tester: `pnpm build` 0 TS errors, `pnpm lint` clean, login works, `/dashboard` 401 without session — **Tester** → handoff: Project Monitor
- [ ] S0-19 — Sprint 0 snapshot — **Project Monitor** → STOP → ask user for Sprint 1 approval

---

## Definition of Done — Sprint 0

- [ ] `pnpm install` completes; `pnpm dev` starts; `pnpm build` 0 TS errors
- [ ] `docker compose up -d` starts postgres + web + worker + caddy
- [ ] `pnpm db:migrate` applies cleanly **and every table has RLS enabled+forced**
- [ ] Signup creates an organization + owner user; login establishes a session with role+org
- [ ] `/[locale]/(dashboard)` redirects to login when unauthenticated
- [ ] **Cross-tenant isolation test passes** (org A cannot see org B; payload orgId ignored)
- [ ] App connects via the RLS-bound app role, not the owner role
- [ ] Mobile app builds and shows a login screen
- [ ] FR/AR/EN routing works; `dir=rtl` on `/ar`
- [ ] `pnpm test` runs; `pnpm lint` clean; gitleaks passes in CI
