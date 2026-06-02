---
name: ui-designer
description: >
  Visual design, design tokens, dashboard + mobile aesthetic, shadcn/ui. Trigger on:
  "design tokens", "colors", "typography", "visual design", "CSS variables", "theme", or styling work.
---
# UI Designer — Naql

## Design Direction
**Concept**: A clean operational dashboard — Stripe/Linear discipline, built for a transport
office. Dense where data lives (tables, KPIs), calm elsewhere.
**NOT**: the dark cramped sidebar of the incumbent; not generic SaaS purple; not tourist kitsch.

## Design Tokens (Tailwind v4 — apps/web/src/app/globals.css)
```css
@import "tailwindcss";
@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600&family=Noto+Kufi+Arabic:wght@400;500;600&display=swap');

@theme {
  /* PRIMARY — deep slate (trust, operational) */
  --color-primary:     oklch(0.30 0.03 250);
  --color-primary-fg:  oklch(0.98 0 0);
  /* ACCENT — road-sign amber (transport identity) */
  --color-accent:      oklch(0.72 0.16 70);
  /* SURFACE */
  --color-bg:          oklch(0.98 0.005 250);
  --color-surface:     oklch(1.00 0 0);
  --color-border:      oklch(0.90 0.01 250);
  --color-foreground:  oklch(0.20 0.02 250);
  --color-muted:       oklch(0.55 0.01 250);
  /* MONEY/STATUS — reserved, semantic only */
  --color-ok:          oklch(0.58 0.14 150);  /* paid / healthy */
  --color-danger:      oklch(0.55 0.20 25);   /* overdue / anomaly */
  --color-warn:        oklch(0.75 0.15 80);   /* expiring / needs review */
  /* TYPOGRAPHY */
  --font-display: "Bricolage Grotesque", system-ui, sans-serif;
  --font-body:    "Plus Jakarta Sans", system-ui, sans-serif;
  --font-arabic:  "Noto Kufi Arabic", "Tahoma", sans-serif;
  --font-mono:    "JetBrains Mono", monospace;
  --radius-card: 0.75rem;
}
```

## Rules
- **Color carries meaning only for money/status** (ok/danger/warn). Everywhere else: slate +
  one amber accent. No decorative color on data.
- **Tabular figures** (`tabular-nums`, mono optional) on every money/distance/consumption cell.
- KPI cards: big number, small label, trend chip. Net result is the largest element on home.
- Tables are the workhorse — tight rows, right-aligned numbers, sticky header, clear sort.

## Mobile (driver app) tokens
Same palette, but: larger base font, 48px min tap targets, high-contrast on outdoor screens,
camera button is the primary action color (amber accent). Sync status pill always visible.

## Status / Money Badges
```
paid/available/present  → --color-ok bg/10 text
overdue/anomaly/out-of-service → --color-danger
expiring/needs-review   → --color-warn
draft/planned/neutral   → muted
```

## Handoff Points
- **← UX Designer**: wireframes to apply the visual layer
- **→ Frontend Dev / Mobile Dev**: tokens + component class specs
