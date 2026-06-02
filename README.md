# Naql — نقل

**Gérez tout votre transport. Depuis une seule plateforme.**
_Manage all your transport. From one platform._

Naql is an all-in-one operations platform for road-transport SMEs — fleet, fuel, missions, invoicing, finance, and HR — built for the Moroccan and Francophone-Africa market.

---

## Quick Start (Development)

### Prerequisites
- Node.js >= 20, pnpm >= 9
- Docker + Docker Compose (for Postgres)

### 1. Clone & install
```bash
git clone https://github.com/your-org/naql.git
cd naql
pnpm install
```

### 2. Configure environment
```bash
cp .env.example .env
# Fill in: DATABASE_URL, AUTH_SECRET (openssl rand -base64 32)
```

### 3. Start Postgres
```bash
docker compose up -d postgres
```

### 4. Run migrations + seed
```bash
pnpm db:migrate
pnpm db:seed          # loads the demo org (Transport Demo SARL)
```

### 5. Start the dev server
```bash
pnpm dev              # http://localhost:3000
```

**Demo login:** jamal@transport-demo.ma / demo1234 (owner)
**Driver login:** brahim@transport-demo.ma / demo1234 (driver)

---

## Production Deploy

### Option A — Managed Cloud (Vercel + Neon/Supabase)

1. Push to GitHub; connect to Vercel
2. Set env vars in Vercel dashboard (see .env.example)
3. Point DATABASE_URL to your managed Postgres
4. Run `pnpm db:migrate` once via Vercel CLI or GitHub Action
5. Run `pnpm db:seed` once for demo data

> Run rls.sql against your DB to create the naql_app role and RLS policies.

### Option B — Self-host Docker

```bash
cp .env.example .env
# Fill in POSTGRES_PASSWORD, NAQL_APP_PASSWORD, AUTH_SECRET
docker compose up -d
```

Services: postgres, web (Next.js), worker (pg-boss), caddy (reverse proxy)

---

## Architecture

```
naql/
├── apps/
│   ├── web/          Next.js 15 App Router (owner/manager/accountant)
│   └── mobile/       Expo React Native driver app (offline-first)
├── packages/
│   ├── core/         Shared types, Money helpers, RBAC matrix
│   ├── db/           Drizzle ORM schema, migrations, RLS, seed
│   ├── billing/      Invoice numbering, VAT, PDF, profitability
│   ├── payroll/      Moroccan CNSS/IR/AMO payroll computation
│   ├── ocr/          Receipt OCR adapter (Google Vision / mock)
│   └── notifications/ Alert engine (expiry, overdue, over-consumption)
├── docker-compose.yml
└── .env.example
```

Stack: Next.js 15, TypeScript strict, Tailwind v4, Drizzle ORM, PostgreSQL 16 + RLS, Auth.js v5 (Argon2id), Expo/React Native, pg-boss, next-intl (FR/AR/EN)

---

## Multi-tenancy & Security

- Row-Level Security: every table has FORCE ROW LEVEL SECURITY. App connects as naql_app (RLS-bound). Cross-tenant leaks are structurally impossible.
- RBAC: roles (owner/manager/accountant/driver) enforced server-side. Role is read from JWT — never from request bodies.
- PII: CNSS numbers, salaries, driver data are role-gated and access-logged. Audit logs redact sensitive fields.
- Money: stored as integer centimes (Money branded type). No floats anywhere.

---

## Key Commands

| Command | Description |
|---|---|
| `pnpm dev` | Start web dev server |
| `pnpm build` | Production build |
| `pnpm test` | Run Vitest suite |
| `pnpm lint` | Biome lint check |
| `pnpm db:generate` | Generate migration |
| `pnpm db:migrate` | Apply migrations |
| `pnpm db:seed` | Load demo data |

---

## Environment Variables

See .env.example. Required:

| Variable | Description |
|---|---|
| DATABASE_URL | Postgres URL (migration owner role) |
| DATABASE_APP_URL | Postgres URL (RLS-bound naql_app role) |
| AUTH_SECRET | 32-byte random secret |
| EXPO_PUBLIC_API_URL | API base URL for mobile app |
| GOOGLE_VISION_API_KEY | (optional) Google Vision OCR |

---

## Mobile App

```bash
cd apps/mobile
npx expo start
```

Set EXPO_PUBLIC_API_URL in apps/mobile/.env. The driver app is offline-first — writes queue in SQLite and sync idempotently when connectivity returns.

---

v0.1 - Built with Claude Code