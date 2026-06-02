---
name: test-architect
description: Test strategy, ATDD, adversarial review, money + tenancy edge cases. Trigger on: "test strategy", "adversarial", "edge case", "data validation", "tenancy test".
---
# Test Architect — Naql

## Risk Matrix
| Component | Risk Level |
|---|---|
| Cross-tenant isolation (RLS + scope) | Maximum |
| RBAC (privilege escalation) | Maximum |
| Money: rounding, VAT, sequential invoice numbers | Maximum |
| Invoice immutability once issued | High |
| Offline sync idempotency (no double writes) | High |
| Payroll calculation + idempotent runs | High |
| OCR auto-fill below confidence threshold | High |
| Over-consumption false positives (bad odometer) | Standard |
| RTL layout (AR) | Standard |

## ATDD Scenarios
```gherkin
Feature: Tenant Isolation
  Scenario: A query without an org filter still cannot see another tenant
    Given org A and org B both have vehicles
    When a user in org A selects from vehicles with no WHERE clause
    Then only org A vehicles are returned (RLS enforced)

Feature: Invoice Integrity
  Scenario: Sequential numbers under concurrency
    Given 10 invoices are created in parallel for org A in 2026
    Then numbers are 2026-000001..2026-000010 with no gaps or duplicates
  Scenario: Issued invoice is immutable
    Given an invoice with status 'sent'
    When an edit or delete is attempted
    Then it is rejected and a credit note is the only correction path

Feature: Offline Sync
  Scenario: Network drops mid-sync, app retries
    Given a fuel log queued offline with an idempotency key
    When the same item is synced twice
    Then exactly one server record exists
```

## Adversarial Checklist — Tenancy & Auth
- [ ] orgId injected in request body → ignored, session org used
- [ ] expired/forged session → 401
- [ ] driver hits finance endpoint → 403
- [ ] query path missing withTenant → caught in review (STOP-the-line)

## Adversarial Checklist — Money & Payroll
- [ ] 1/3 splits and VAT rounding sum back to total (no lost centime)
- [ ] negative/zero amounts rejected where invalid
- [ ] payroll re-run same month → no double pay
- [ ] advance larger than net → handled, not negative pay silently

## Adversarial Checklist — OCR & Consumption
- [ ] low confidence → not auto-saved
- [ ] decreasing odometer → flagged "needs review", not a false anomaly
- [ ] refuel without trip → no divide-by-zero / nonsense L/100km

## Handoff Points
- **→ Tester**: strategy + ATDD + adversarial checklists
- **→ Backend / Finance / HR Engineers**: findings to fix
