---
name: dba
description: >
  Database skill: Drizzle ORM schema, PostgreSQL migrations, Row-Level Security,
  tenant-scoped queries, indexing. Trigger on: "schema", "migration", "drizzle", "postgres",
  "RLS", "tenant", "index", "db migrate", or any data model work.
---

# DBA — Naql (Drizzle + PostgreSQL 16 + RLS)

## Role
Own `packages/db`. Design the multi-tenant schema, write migrations, **enforce tenant
isolation with Row-Level Security**, and provide tenant-scoped query helpers so application
code physically cannot forget the org scope.

## The Tenancy Contract (most important thing this skill owns)

1. Every business table has `organization_id uuid not null references organizations(id)`.
2. RLS is **enabled and forced** on every business table.
3. Policies require `organization_id = current_setting('app.current_org')::uuid`.
4. The app sets the GUC per request/transaction inside `withTenant`.
5. A dedicated low-privilege DB role runs app queries (cannot bypass RLS). Migrations run as
   a separate owner role.

```sql
-- pattern applied to every business table (example: vehicles)
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON vehicles
  USING (organization_id = current_setting('app.current_org', true)::uuid)
  WITH CHECK (organization_id = current_setting('app.current_org', true)::uuid);
```

## Schema (Drizzle — `packages/db/src/schema/`)

Split by domain file: `tenancy.ts`, `fleet.ts`, `missions.ts`, `fuel.ts`, `finance.ts`,
`hr.ts`, `audit.ts`. Enums shared in `enums.ts`. Money columns are `bigint` (centimes).

```typescript
// enums.ts
export const roleEnum = pgEnum('role', ['owner','manager','accountant','driver'])
export const vehicleStatusEnum = pgEnum('vehicle_status', ['available','on_mission','maintenance','out_of_service'])
export const missionStatusEnum = pgEnum('mission_status', ['planned','in_progress','completed','invoiced','cancelled'])
export const invoiceStatusEnum = pgEnum('invoice_status', ['draft','sent','partial','paid','overdue','cancelled'])
export const docKindEnum = pgEnum('doc_kind', ['insurance','technical_inspection','license','other'])

// tenancy.ts
export const organizations = pgTable('organizations', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  ice: text('ice'),                                   // Moroccan tax id
  currency: text('currency').default('MAD').notNull(),
  locale: text('locale').default('fr').notNull(),
  plan: text('plan').default('trial').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id),
  email: text('email').notNull(),
  passwordHash: text('password_hash').notNull(),      // Argon2id
  name: text('name').notNull(),
  role: roleEnum('role').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  emailOrgUnique: unique().on(t.organizationId, t.email),
  idxOrg: index('idx_users_org').on(t.organizationId),
}))

// fleet.ts
export const vehicles = pgTable('vehicles', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id),
  code: text('code').notNull(),
  registration: text('registration').notNull(),       // immatriculation
  make: text('make'), model: text('model'), year: integer('year'),
  type: text('type'),
  capacityKg: integer('capacity_kg'),
  baselineConsumption: doublePrecision('baseline_consumption'), // L/100km expected
  status: vehicleStatusEnum('status').default('available').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  idxOrg: index('idx_vehicles_org').on(t.organizationId),
  idxOrgStatus: index('idx_vehicles_org_status').on(t.organizationId, t.status),
  regOrgUnique: unique().on(t.organizationId, t.registration),
}))

export const vehicleDocuments = pgTable('vehicle_documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id),
  vehicleId: uuid('vehicle_id').notNull().references(() => vehicles.id),
  kind: docKindEnum('kind').notNull(),
  reference: text('reference'),
  issuedAt: timestamp('issued_at', { withTimezone: true }),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),  // alert source
  fileUrl: text('file_url'),
}, (t) => ({
  idxExpiry: index('idx_docs_org_expiry').on(t.organizationId, t.expiresAt),
}))

// finance.ts — money columns are bigint centimes
export const invoices = pgTable('invoices', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id),
  clientId: uuid('client_id').notNull(),
  number: text('number').notNull(),                   // sequential per org per year
  issueDate: timestamp('issue_date', { withTimezone: true }).notNull(),
  dueDate: timestamp('due_date', { withTimezone: true }),
  subtotal: bigint('subtotal', { mode: 'number' }).notNull(),
  vatRate: doublePrecision('vat_rate').notNull(),
  vatAmount: bigint('vat_amount', { mode: 'number' }).notNull(),
  total: bigint('total', { mode: 'number' }).notNull(),
  status: invoiceStatusEnum('status').default('draft').notNull(),
}, (t) => ({
  numberUnique: unique().on(t.organizationId, t.number),
  idxOrgStatus: index('idx_invoices_org_status').on(t.organizationId, t.status),
}))
// (missions, fuel_logs, payments, expenses, clients, employees, attendance, advances,
//  audit_log follow the same pattern — org_id + RLS + bigint money + indexes)
```

## Tenant-Scoped Query Helper (app never queries raw)

```typescript
// packages/db/src/tenant.ts
export async function withTenant<T>(orgId: string, fn: (tx) => Promise<T>): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.execute(sql`SELECT set_config('app.current_org', ${orgId}, true)`) // local to tx
    return fn(tx)
  })
}
// Usage: const rows = await withTenant(orgId, (tx) => tx.select().from(vehicles))
// Even if a WHERE clause is forgotten, RLS returns only this org's rows.
```

## Sequential Invoice Numbers (no gaps, no races)

```typescript
// allocate inside the same tx as the insert; advisory lock per (org, year)
await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${orgId} || ${year}))`)
const next = await getNextSeq(tx, orgId, year)   // e.g. 2026-000042
```

## Migration Rules
1. One migration per change; never edit an applied migration
2. RLS policy added in the SAME migration as a new business table — never a table without RLS
3. Backward-compatible first (add nullable, backfill, then constrain)
4. `drizzle-kit check` before applying; migrations run as owner role, app uses RLS-bound role
5. Seed (`packages/db/src/seed.ts`) is idempotent and only targets the demo org

## Handoff Points
- **→ Backend Dev**: schema exports, `withTenant`, query helpers, invoice-number allocator
- **→ Security Engineer**: RLS policies + role separation for review (mandatory before merge)
- **→ Finance Engineer**: money column types, audit_log shape
- **→ DevOps**: two DB roles (owner + app), connection string config
