---
name: devops-devsecops
description: >
  CI/CD, Docker, infrastructure, the pg-boss worker, secrets scanning. Trigger on: "docker",
  "CI", "GitHub Actions", "worker", "infra", "environment", "Vercel", "secrets", "gitleaks".
---

# DevOps / DevSecOps — Naql

## Docker Compose (postgres + web + worker + caddy)

```yaml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: Naql
      POSTGRES_USER: ${POSTGRES_OWNER_USER}        # migration owner role
      POSTGRES_PASSWORD: ${POSTGRES_OWNER_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./packages/db/init:/docker-entrypoint-initdb.d   # creates RLS-bound app role
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_OWNER_USER}"]

  web:
    build: { context: ., args: { NEXT_OUTPUT: standalone } }
    depends_on: { postgres: { condition: service_healthy } }
    environment:
      DATABASE_URL: ${DATABASE_URL}                # app role (RLS-bound), NOT owner
      AUTH_SECRET: ${AUTH_SECRET}
      OCR_PROVIDER: ${OCR_PROVIDER}
      OCR_API_KEY: ${OCR_API_KEY}
    labels:
      caddy: ${APP_DOMAIN}
      caddy.reverse_proxy: "{{upstreams 3000}}"

  worker:                                          # pg-boss: alerts.sweep, ocr.process, payroll.run
    build: { context: ., dockerfile: Dockerfile.worker }
    depends_on: { postgres: { condition: service_healthy } }
    environment:
      DATABASE_URL: ${DATABASE_URL}
      OCR_PROVIDER: ${OCR_PROVIDER}
      OCR_API_KEY: ${OCR_API_KEY}

  caddy:
    image: lucaslorentz/caddy-docker-proxy:ci-alpine
    ports: ["80:80", "443:443"]
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - caddy_data:/data

volumes: { postgres_data: , caddy_data: }
```

## Two DB Roles (critical for tenancy defense-in-depth)
- **owner role**: runs migrations, owns tables, can alter schema. Used only by `pnpm db:migrate`.
- **app role**: RLS-bound, used by web + worker at runtime. Cannot bypass RLS (no `BYPASSRLS`,
  not table owner). `DATABASE_URL` uses this role. Init SQL in `packages/db/init` creates it.

## .env.example
```bash
# Database — app role (RLS-bound) for runtime
DATABASE_URL=postgresql://Naql_app:changeme@localhost:5432/Naql
# Owner role for migrations only
POSTGRES_OWNER_USER=Naql_owner
POSTGRES_OWNER_PASSWORD=changeme
# Auth
AUTH_SECRET=generate-with-openssl-rand-hex-32
# OCR
OCR_PROVIDER=google_vision        # or aws_textract
OCR_API_KEY=your-key-here
# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
APP_DOMAIN=localhost
```

## GitHub Actions CI
```yaml
name: CI
on: [push, pull_request]
jobs:
  ci:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env: { POSTGRES_PASSWORD: test, POSTGRES_DB: Naql_test }
        ports: ["5432:5432"]
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22 }
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm db:migrate          # applies RLS policies too
      - run: pnpm test --coverage      # includes cross-tenant denial tests
      - run: pnpm build
      - uses: gitleaks/gitleaks-action@v2   # secrets must never land in the repo
```

## Mobile build (Expo)
- EAS build profiles (dev / preview / production) in `apps/mobile/eas.json`.
- API base URL injected per profile; never bundle secrets into the app.
- CI runs `pnpm --filter mobile typecheck` + Maestro smoke on preview builds.

## DevSecOps Checklist
- [ ] gitleaks in CI; `.env` git-ignored
- [ ] App runs as RLS-bound DB role, migrations as owner role
- [ ] No secret bundled into the mobile app
- [ ] Worker healthy; `alerts.sweep` schedule active
- [ ] Security headers (from Security Engineer) set at the web layer / Caddy
- [ ] Dependency audit in CI (pnpm audit) — review high/critical

## Handoff Points
- **→ Deployment**: verified compose + worker + two-role DB
- **← Security Engineer**: headers, gitleaks, role separation requirements
- **← DBA**: init SQL for app role + RLS
