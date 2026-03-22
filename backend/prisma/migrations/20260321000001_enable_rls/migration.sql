-- ============================================================
-- Enable Row-Level Security (RLS) on all tenant-scoped tables
-- ============================================================
-- Purpose: defence-in-depth. The Node.js API uses the service_role key which
-- bypasses RLS entirely, so these policies only matter for:
--   • Direct Supabase client queries (anon or auth key)
--   • Supabase Studio / SQL editor sessions
--   • Any future client-side Supabase integration
--
-- Policy pattern: a security-definer helper function resolves the
-- current user's tenant_id from their Supabase UID. All policies
-- call this function to enforce per-tenant isolation.
-- ============================================================

-- ── Helper function ────────────────────────────────────────────────────────
-- Returns the tenant_id for the currently authenticated Supabase user.
-- SECURITY DEFINER so it can read the users table without a policy loop.

CREATE OR REPLACE FUNCTION get_my_tenant_id()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id FROM users WHERE supabase_user_id = auth.uid()::text LIMIT 1;
$$;


-- ── Enable RLS ────────────────────────────────────────────────────────────

ALTER TABLE users                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations          ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches               ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_assignments      ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations            ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_invites        ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients               ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments           ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_results            ENABLE ROW LEVEL SECURITY;
ALTER TABLE professionals          ENABLE ROW LEVEL SECURITY;
ALTER TABLE professional_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_offs              ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinic_hours           ENABLE ROW LEVEL SECURITY;
ALTER TABLE special_closures       ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices               ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_line_items     ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs             ENABLE ROW LEVEL SECURITY;


-- ── Tenant isolation policies ─────────────────────────────────────────────
-- Each policy allows authenticated users to see/modify only their own tenant's rows.
-- The service_role key bypasses all policies (used by the API server).

CREATE POLICY "tenant_isolation" ON users
  FOR ALL TO authenticated
  USING (tenant_id = get_my_tenant_id());

CREATE POLICY "tenant_isolation" ON organizations
  FOR ALL TO authenticated
  USING (tenant_id = get_my_tenant_id());

CREATE POLICY "tenant_isolation" ON branches
  FOR ALL TO authenticated
  USING (tenant_id = get_my_tenant_id());

CREATE POLICY "tenant_isolation" ON staff_assignments
  FOR ALL TO authenticated
  USING (tenant_id = get_my_tenant_id());

CREATE POLICY "tenant_isolation" ON invitations
  FOR ALL TO authenticated
  USING (tenant_id = get_my_tenant_id());

CREATE POLICY "tenant_isolation" ON patient_invites
  FOR ALL TO authenticated
  USING (tenant_id = get_my_tenant_id());

CREATE POLICY "tenant_isolation" ON patients
  FOR ALL TO authenticated
  USING (tenant_id = get_my_tenant_id());

CREATE POLICY "tenant_isolation" ON appointments
  FOR ALL TO authenticated
  USING (tenant_id = get_my_tenant_id());

CREATE POLICY "tenant_isolation" ON lab_results
  FOR ALL TO authenticated
  USING (tenant_id = get_my_tenant_id());

CREATE POLICY "tenant_isolation" ON professionals
  FOR ALL TO authenticated
  USING (tenant_id = get_my_tenant_id());

CREATE POLICY "tenant_isolation" ON professional_schedules
  FOR ALL TO authenticated
  USING (tenant_id = get_my_tenant_id());

CREATE POLICY "tenant_isolation" ON time_offs
  FOR ALL TO authenticated
  USING (tenant_id = get_my_tenant_id());

CREATE POLICY "tenant_isolation" ON clinic_hours
  FOR ALL TO authenticated
  USING (tenant_id = get_my_tenant_id());

CREATE POLICY "tenant_isolation" ON special_closures
  FOR ALL TO authenticated
  USING (tenant_id = get_my_tenant_id());

CREATE POLICY "tenant_isolation" ON invoices
  FOR ALL TO authenticated
  USING (tenant_id = get_my_tenant_id());

CREATE POLICY "tenant_isolation" ON invoice_line_items
  FOR ALL TO authenticated
  USING (tenant_id = get_my_tenant_id());


-- ── Audit log policy ──────────────────────────────────────────────────────
-- Users can read their own tenant's audit logs; only service_role can write.

CREATE POLICY "read_own_tenant_audit_logs" ON audit_logs
  FOR SELECT TO authenticated
  USING (tenant_id = get_my_tenant_id());

-- No INSERT/UPDATE/DELETE policy for authenticated role — only service_role writes.


CREATE POLICY "tenant_isolation" ON emr_visits
  FOR ALL TO authenticated
  USING (tenant_id = get_my_tenant_id());

CREATE POLICY "tenant_isolation" ON prescriptions
  FOR ALL TO authenticated
  USING (tenant_id = get_my_tenant_id());

CREATE POLICY "tenant_isolation" ON notifications
  FOR ALL TO authenticated
  USING (tenant_id = get_my_tenant_id());

ALTER TABLE services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON services
  FOR ALL TO authenticated
  USING (tenant_id = get_my_tenant_id());


-- ── Global tables (no RLS needed — read-only reference data) ─────────────
-- subscription_tiers, specialties, appointment_types, service_categories,
-- announcements, feature_flags, maintenance_windows are not tenant-scoped.
-- They are read-only for authenticated users and written only by service_role.

ALTER TABLE subscription_tiers    ENABLE ROW LEVEL SECURITY;
ALTER TABLE specialties           ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_types     ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_categories    ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements         ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flags         ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_windows   ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read_for_authenticated" ON subscription_tiers
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "read_for_authenticated" ON specialties
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "read_for_authenticated" ON appointment_types
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "read_for_authenticated" ON service_categories
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "read_for_authenticated" ON announcements
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "read_for_authenticated" ON feature_flags
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "read_for_authenticated" ON maintenance_windows
  FOR SELECT TO authenticated USING (true);
