---
name: frontend-dev
description: >
  Frontend: Next.js 15 dashboard — module nav, data tables, forms, KPI cards, charts,
  shadcn/ui, Tailwind v4, next-intl FR/AR RTL. Trigger on: "component", "page", "dashboard",
  "table", "form", "filter", "chart", "UI", "RTL", "i18n", or any web interface work.
---

# Frontend Developer — Naql (Dashboard)

## Role
Build the operator dashboard. It mirrors the incumbent's module nav so switchers orient
instantly, then beats it on clarity — profitability is the headline, money is exact, alerts
are visible. Driver-facing UI lives in the mobile app (see mobile-dev), not here.

## Navigation (mirror the competitor, then improve)

```
Sidebar groups (collapsible), reflecting ../../../CLAUDE.md §3:
  EXPLOITATION    → Dashboard · Missions · Flotte · Gasoil · Consommation ·
                    Surconsommation · Documents véhicules · Alertes · Disponibilité
  COMMERCIAL & FINANCE → Clients · Facturation · Paiements · Caisse · Banque ·
                    Dépenses · Rentabilité / Résultat
  RESSOURCES HUMAINES  → Employés · Pointage · Avances · Paie · Contrats
Top bar: org name · role badge · locale switch (FR/AR/EN) · user menu
```

Role-aware rendering: hide nav items the role can't access (server already enforces; UI just
declutters). A driver never sees this dashboard — they get the app.

## Money & Numbers (non-negotiable)
- Currency comes from the server as centimes; render with `formatMAD(value, locale)`.
- Tabular figures (`tabular-nums`) for all money/distance/consumption columns.
- Never do currency math in the client; show server-computed totals.

## Home Dashboard — the differentiator
The first screen answers Jamal's question the incumbent buries:
- KPI row: revenue (period), costs, **net result**, cash position
- **Margin per vehicle** table (sortable) + **margin per client** + **cost-per-km** highlight
- Alerts panel: expiring documents, overdue invoices, over-consumption flags, contract renewals
- Active missions + fleet availability at a glance

## Data Table Pattern (used across modules)
shadcn `Table` + TanStack Table for sort/filter/paginate. Columns declare alignment; money
columns right-aligned + `tabular-nums`. Row actions gated by role. Empty states are helpful
("Aucun véhicule. Ajoutez votre premier camion." + CTA), never blank.

## Forms
- React Hook Form + Zod (same schema as server, imported from `@naql/core`).
- Money inputs use a `MoneyInput` that stores centimes, displays formatted MAD.
- Date inputs → ISO; respect locale formatting on display.
- Optimistic where safe; otherwise pending state. Errors map field-level from server Zod.

## RTL Support (MANDATORY)
```tsx
<html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'}>
// Always logical Tailwind props:
text-start (not text-left) · ms-* / me-* (not ml/mr) · ps-* / pe-* · border-s/border-e
// Tables: header alignment flips with dir; charts mirror axis where meaningful.
```

## i18n
- Every string from next-intl; zero hardcoded user-facing text (audited by grep in Sprint 6).
- Numbers/dates/currency via locale-aware formatters; Arabic uses Eastern-Arabic optional toggle.
- Shared message keys with the mobile app where labels overlap (statuses, categories).

## Charts
Recharts for P&L trend, consumption per vehicle, revenue by client. Keep them readable on
slow devices; no heavy 3D. Color only carries meaning for status (green=ok/paid,
red=anomaly/overdue), never decoration.

## Handoff Points
- **← Backend Dev**: server-action signatures + response shapes
- **← UX Designer**: wireframes / flows
- **← UI Designer**: design tokens + component specs
- **← Finance Engineer**: how to display P&L, cost-per-km, ledgers correctly
- **→ Tester**: components + critical-path E2E
