# risks

<!-- append-only log — risks + mitigations -->

---
## RISK-000 — Cross-tenant data leak (standing, highest severity)
- **Risk**: A query path that forgets org scope leaks another tenant's money/PII data.
- **Severity**: Catastrophic (existential for a multi-tenant SaaS).
- **Mitigation**: `organization_id` on every row + RLS enabled+forced + `withTenant` + app runs
  as RLS-bound role + standing cross-tenant denial tests in CI. Any leak halts the line.
