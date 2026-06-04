-- Naql RLS Foundation (applied via drizzle-kit migrate)
-- Creates the naql_app role, enables Row-Level Security on all business
-- tables, and installs tenant-isolation policies.

-- 1. App role — non-superuser, subject to RLS
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'naql_app') THEN
    CREATE ROLE naql_app;
  END IF;
END
$$;

-- Grant the migration owner membership in naql_app so SET ROLE works
-- in withOrgContext during tests (superuser can SET ROLE to any role).
DO $$
BEGIN
  EXECUTE format('GRANT naql_app TO %I', current_user);
EXCEPTION WHEN OTHERS THEN
  NULL; -- already granted
END
$$;

-- 2. Enable + FORCE RLS on every business table
-- FORCE means even the table owner must obey policies when running as naql_app.
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations FORCE ROW LEVEL SECURITY;

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE users FORCE ROW LEVEL SECURITY;

ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles FORCE ROW LEVEL SECURITY;

ALTER TABLE vehicle_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_documents FORCE ROW LEVEL SECURITY;

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients FORCE ROW LEVEL SECURITY;

ALTER TABLE missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE missions FORCE ROW LEVEL SECURITY;

ALTER TABLE fuel_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE fuel_logs FORCE ROW LEVEL SECURITY;

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices FORCE ROW LEVEL SECURITY;

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments FORCE ROW LEVEL SECURITY;

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses FORCE ROW LEVEL SECURITY;

ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees FORCE ROW LEVEL SECURITY;

ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance FORCE ROW LEVEL SECURITY;

ALTER TABLE advances ENABLE ROW LEVEL SECURITY;
ALTER TABLE advances FORCE ROW LEVEL SECURITY;

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs FORCE ROW LEVEL SECURITY;

ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts FORCE ROW LEVEL SECURITY;

ALTER TABLE invoice_number_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_number_sequences FORCE ROW LEVEL SECURITY;

-- 3. Tenant isolation policies (applied when role = naql_app)
-- app.current_org is set per-transaction by withOrgContext.

CREATE POLICY tenant_isolation ON organizations
  FOR ALL TO naql_app
  USING (id = current_setting('app.current_org', true)::text);

CREATE POLICY tenant_isolation ON users
  FOR ALL TO naql_app
  USING (organization_id = current_setting('app.current_org', true)::text);

CREATE POLICY tenant_isolation ON vehicles
  FOR ALL TO naql_app
  USING (organization_id = current_setting('app.current_org', true)::text);

CREATE POLICY tenant_isolation ON vehicle_documents
  FOR ALL TO naql_app
  USING (organization_id = current_setting('app.current_org', true)::text);

CREATE POLICY tenant_isolation ON clients
  FOR ALL TO naql_app
  USING (organization_id = current_setting('app.current_org', true)::text);

CREATE POLICY tenant_isolation ON missions
  FOR ALL TO naql_app
  USING (organization_id = current_setting('app.current_org', true)::text);

CREATE POLICY tenant_isolation ON fuel_logs
  FOR ALL TO naql_app
  USING (organization_id = current_setting('app.current_org', true)::text);

CREATE POLICY tenant_isolation ON invoices
  FOR ALL TO naql_app
  USING (organization_id = current_setting('app.current_org', true)::text);

CREATE POLICY tenant_isolation ON payments
  FOR ALL TO naql_app
  USING (organization_id = current_setting('app.current_org', true)::text);

CREATE POLICY tenant_isolation ON expenses
  FOR ALL TO naql_app
  USING (organization_id = current_setting('app.current_org', true)::text);

CREATE POLICY tenant_isolation ON employees
  FOR ALL TO naql_app
  USING (organization_id = current_setting('app.current_org', true)::text);

CREATE POLICY tenant_isolation ON attendance
  FOR ALL TO naql_app
  USING (organization_id = current_setting('app.current_org', true)::text);

CREATE POLICY tenant_isolation ON advances
  FOR ALL TO naql_app
  USING (organization_id = current_setting('app.current_org', true)::text);

CREATE POLICY tenant_isolation ON audit_logs
  FOR ALL TO naql_app
  USING (organization_id = current_setting('app.current_org', true)::text);

CREATE POLICY tenant_isolation ON alerts
  FOR ALL TO naql_app
  USING (organization_id = current_setting('app.current_org', true)::text);

CREATE POLICY tenant_isolation ON invoice_number_sequences
  FOR ALL TO naql_app
  USING (organization_id = current_setting('app.current_org', true)::text);

-- 4. Grant table-level DML permissions to the app role
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO naql_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO naql_app;
