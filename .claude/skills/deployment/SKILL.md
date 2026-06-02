---
name: deployment
description: Deployment verification. Trigger on: "deploy", "Vercel", "docker compose up", "release", "production", "worker".
---
# Deployment — Naql

## Vercel + Managed DB Checklist
- [ ] `vercel --prod` (web) passes; worker deployed separately (or as a cron/container)
- [ ] Managed Postgres (Neon/Supabase) with RLS migrations applied
- [ ] TWO DB roles configured: migration owner + RLS-bound app role
- [ ] Env vars set: DATABASE_URL (app role), AUTH_SECRET, OCR_API_KEY, etc.
- [ ] All routes 200; `/api/*` mutations 401 without session; cross-tenant returns empty
- [ ] pg-boss worker running (alerts.sweep schedule active)
- [ ] OCR provider key valid (or feature-flagged off with manual-entry fallback)

## Self-Host Checklist (Docker Compose)
```bash
git clone <repo> && cd Naql
cp .env.example .env   # set AUTH_SECRET, DB passwords, OCR key
docker compose up -d   # postgres + web + worker + caddy
docker compose exec web pnpm db:migrate
docker compose exec web pnpm db:seed   # demo org only
```
- [ ] Postgres persists across restart; RLS active
- [ ] Worker (pg-boss) healthy; alert sweep runs
- [ ] HTTPS via Caddy auto-cert
- [ ] Mobile app points at the deployed API base URL

## Sprint End Gate
- [ ] `pnpm build` zero TS errors · `pnpm test` all green · `pnpm lint` clean
- [ ] No hardcoded secrets; gitleaks passes
- [ ] Cross-tenant denial tests green
- [ ] `.env.example` complete
