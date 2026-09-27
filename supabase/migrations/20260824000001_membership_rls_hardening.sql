-- Replace legacy profile.school_id authorization with membership-authoritative RLS.
-- All policies are recreated so permissive legacy policies cannot remain OR-ed in.

CREATE OR REPLACE FUNCTION public.has_school_access(p_school_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_super_admin() OR EXISTS (
    SELECT 1 FROM public.school_memberships m
    WHERE m.user_id = public.current_profile_id()
      AND m.school_id = p_school_id AND m.status = 'active'
  )
$$;

CREATE OR REPLACE FUNCTION public.has_school_role(p_school_id UUID, p_roles TEXT[])
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_super_admin() OR EXISTS (
    SELECT 1 FROM public.school_memberships m
    WHERE m.user_id = public.current_profile_id()
      AND m.school_id = p_school_id AND m.status = 'active'
      AND m.role = ANY (p_roles)
  )
$$;

-- Remove every pre-membership policy from the affected tables. PostgreSQL combines
-- permissive policies with OR, so leaving even one legacy policy defeats hardening.
DO $$
DECLARE v_table TEXT; v_policy RECORD;
BEGIN
  FOREACH v_table IN ARRAY ARRAY[
    'schools','profiles','school_memberships','school_access_requests',
    'academic_years','classes','sections','subjects','class_subjects','students',
    'guardians','student_enrollments','teachers','teacher_assignments',
    'timetable_entries','fee_structures','student_fee_assignments',
    'student_fee_invoices','student_payments','exams','exam_results','audit_logs',
    'login_security_events','notices','student_attendance','school_holidays',
    'student_leaves','teacher_payments','staff','auth_events',
    'account_deletion_requests','school_deletion_requests','school_rooms',
    'employee_salary_history','employee_payments','vehicles','transport_routes',
    'transport_stops','student_transport_assignments','student_transport_events'
  ] LOOP
    IF to_regclass('public.' || v_table) IS NOT NULL THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', v_table);
      FOR v_policy IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = v_table LOOP
        EXECUTE format('DROP POLICY %I ON public.%I', v_policy.policyname, v_table);
      END LOOP;
    END IF;
  END LOOP;
END $$;

CREATE POLICY schools_select_authorized ON public.schools FOR SELECT
  USING (public.has_school_access(id));
CREATE POLICY schools_manage_super ON public.schools FOR ALL
  USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

CREATE POLICY profiles_select_authorized ON public.profiles FOR SELECT USING (
  auth_user_id = auth.uid() OR public.is_super_admin() OR public.profile_in_managed_school(id)
);
CREATE POLICY profiles_manage_super ON public.profiles FOR ALL
  USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

CREATE POLICY memberships_select_authorized ON public.school_memberships FOR SELECT
  USING (user_id = public.current_profile_id() OR public.manages_school(school_id));
CREATE POLICY memberships_manage_super ON public.school_memberships FOR ALL
  USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

CREATE POLICY requests_select_authorized ON public.school_access_requests FOR SELECT
  USING (user_id = public.current_profile_id() OR public.manages_school(school_id));
-- Request mutations intentionally have no table policy. Constrained RPCs are the API.

-- Baseline: active members may read their tenant; school admins own ordinary writes.
DO $$
DECLARE v_table TEXT;
BEGIN
  FOREACH v_table IN ARRAY ARRAY[
    'academic_years','classes','sections','subjects','class_subjects','students',
    'guardians','student_enrollments','teachers','teacher_assignments',
    'timetable_entries','fee_structures','student_fee_assignments',
    'student_fee_invoices','student_payments','exams','exam_results','audit_logs',
    'login_security_events','notices','student_attendance','school_holidays',
    'student_leaves','teacher_payments','staff','auth_events',
    'school_deletion_requests','school_rooms','employee_salary_history',
    'employee_payments','vehicles','transport_routes','transport_stops',
    'student_transport_assignments','student_transport_events'
  ] LOOP
    IF to_regclass('public.' || v_table) IS NOT NULL THEN
      EXECUTE format('CREATE POLICY tenant_read ON public.%I FOR SELECT USING (public.has_school_access(school_id))', v_table);
      EXECUTE format('CREATE POLICY tenant_admin_insert ON public.%I FOR INSERT WITH CHECK (public.has_school_role(school_id, ARRAY[''school_admin'']))', v_table);
      EXECUTE format('CREATE POLICY tenant_admin_update ON public.%I FOR UPDATE USING (public.has_school_role(school_id, ARRAY[''school_admin''])) WITH CHECK (public.has_school_role(school_id, ARRAY[''school_admin'']))', v_table);
      EXECUTE format('CREATE POLICY tenant_admin_delete ON public.%I FOR DELETE USING (public.has_school_role(school_id, ARRAY[''school_admin'']))', v_table);
    END IF;
  END LOOP;
END $$;

-- Teachers may perform teaching workflows, but cannot mutate tenant administration.
DO $$
DECLARE v_table TEXT;
BEGIN
  FOREACH v_table IN ARRAY ARRAY['student_attendance','student_leaves','exams','exam_results'] LOOP
    EXECUTE format('CREATE POLICY teacher_insert ON public.%I FOR INSERT WITH CHECK (public.has_school_role(school_id, ARRAY[''teacher'']))', v_table);
    EXECUTE format('CREATE POLICY teacher_update ON public.%I FOR UPDATE USING (public.has_school_role(school_id, ARRAY[''teacher''])) WITH CHECK (public.has_school_role(school_id, ARRAY[''teacher'']))', v_table);
  END LOOP;
END $$;

-- Accountants may operate finance/payroll records in their active school.
DO $$
DECLARE v_table TEXT;
BEGIN
  FOREACH v_table IN ARRAY ARRAY['fee_structures','student_fee_assignments','student_fee_invoices','student_payments','teacher_payments','employee_salary_history','employee_payments'] LOOP
    EXECUTE format('CREATE POLICY accountant_insert ON public.%I FOR INSERT WITH CHECK (public.has_school_role(school_id, ARRAY[''accountant'']))', v_table);
    EXECUTE format('CREATE POLICY accountant_update ON public.%I FOR UPDATE USING (public.has_school_role(school_id, ARRAY[''accountant''])) WITH CHECK (public.has_school_role(school_id, ARRAY[''accountant'']))', v_table);
  END LOOP;
END $$;

CREATE POLICY driver_event_insert ON public.student_transport_events FOR INSERT
  WITH CHECK (public.has_school_role(school_id, ARRAY['driver']));
CREATE POLICY driver_event_update ON public.student_transport_events FOR UPDATE
  USING (public.has_school_role(school_id, ARRAY['driver']))
  WITH CHECK (public.has_school_role(school_id, ARRAY['driver']));

-- This table is identity-owned rather than strictly tenant-owned.
CREATE POLICY deletion_request_select_own ON public.account_deletion_requests FOR SELECT
  USING (requested_by = auth.uid() OR (school_id IS NOT NULL AND public.manages_school(school_id)));
CREATE POLICY deletion_request_insert_own ON public.account_deletion_requests FOR INSERT
  WITH CHECK (requested_by = auth.uid() AND (school_id IS NULL OR public.has_school_access(school_id)));
CREATE POLICY deletion_request_admin_update ON public.account_deletion_requests FOR UPDATE
  USING (school_id IS NOT NULL AND public.manages_school(school_id))
  WITH CHECK (school_id IS NOT NULL AND public.manages_school(school_id));

REVOKE ALL ON FUNCTION public.has_school_access(UUID), public.has_school_role(UUID,TEXT[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_school_access(UUID), public.has_school_role(UUID,TEXT[]) TO authenticated;
