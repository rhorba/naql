-- =============================================================================
-- Naql RLS Foundation (S0-05 + S0-06)
-- Run ONCE by migration owner role (not the app role)
-- =============================================================================

-- 1. App role — used by the application at runtime (RLS-bound)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'naql_app') THEN
    CREATE ROLE naql_app LOGIN PASSWORD 'CHANGE_IN_ENV';
  END IF;
END
$$;

-- Grant connect + schema usage
GRANT CONNECT ON DATABASE naql TO naql_app;
GRANT USAGE ON SCHEMA public TO naql_app;

-- 2. Enable + force RLS on every business table
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

-- 3. Tenant isolation policy pattern
-- organizations: a user sees only their own org
CREATE POLICY tenant_isolation ON organizations
  FOR ALL TO naql_app
  USING (id = current_setting('app.current_org', true)::text);

-- users: scoped by organization_id
CREATE POLICY tenant_isolation ON users
  FOR ALL TO naql_app
  USING (organization_id = current_setting('app.current_org', true)::text);

-- vehicles
CREATE POLICY tenant_isolation ON vehicles
  FOR ALL TO naql_app
  USING (organization_id = current_setting('app.current_org', true)::text);

-- vehicle_documents
CREATE POLICY tenant_isolation ON vehicle_documents
  FOR ALL TO naql_app
  USING (organization_id = current_setting('app.current_org', true)::text);

-- clients
CREATE POLICY tenant_isolation ON clients
  FOR ALL TO naql_app
  USING (organization_id = current_setting('app.current_org', true)::text);

-- missions
CREATE POLICY tenant_isolation ON missions
  FOR ALL TO naql_app
  USING (organization_id = current_setting('app.current_org', true)::text);

-- fuel_logs
CREATE POLICY tenant_isolation ON fuel_logs
  FOR ALL TO naql_app
  USING (organization_id = current_setting('app.current_org', true)::text);

-- invoices
CREATE POLICY tenant_isolation ON invoices
  FOR ALL TO naql_app
  USING (organization_id = current_setting('app.current_org', true)::text);

-- payments
CREATE POLICY tenant_isolation ON payments
  FOR ALL TO naql_app
  USING (organization_id = current_setting('app.current_org', true)::text);

-- expenses
CREATE POLICY tenant_isolation ON expenses
  FOR ALL TO naql_app
  USING (organization_id = current_setting('app.current_org', true)::text);

-- employees
CREATE POLICY tenant_isolation ON employees
  FOR ALL TO naql_app
  USING (organization_id = current_setting('app.current_org', true)::text);

-- attendance
CREATE POLICY tenant_isolation ON attendance
  FOR ALL TO naql_app
  USING (organization_id = current_setting('app.current_org', true)::text);

-- advances
CREATE POLICY tenant_isolation ON advances
  FOR ALL TO naql_app
  USING (organization_id = current_setting('app.current_org', true)::text);

-- audit_logs
CREATE POLICY tenant_isolation ON audit_logs
  FOR ALL TO naql_app
  USING (organization_id = current_setting('app.current_org', true)::text);

-- alerts
CREATE POLICY tenant_isolation ON alerts
  FOR ALL TO naql_app
  USING (organization_id = current_setting('app.current_org', true)::text);

-- invoice_number_sequences
CREATE POLICY tenant_isolation ON invoice_number_sequences
  FOR ALL TO naql_app
  USING (organization_id = current_setting('app.current_org', true)::text);

-- 4. Grant table-level permissions to app role
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO naql_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO naql_app;

-- Future tables automatically granted
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO naql_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO naql_app;
