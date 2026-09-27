-- ============================================================================
-- Fix: Allow school_admin in approve_school_access_request & add UPDATE RLS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.approve_school_access_request(
  p_request_id UUID,
  p_role TEXT,
  p_name TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL,
  p_designation TEXT DEFAULT NULL,
  p_department TEXT DEFAULT NULL
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_reviewer profiles%ROWTYPE;
  v_request school_access_requests%ROWTYPE;
BEGIN
  SELECT * INTO v_reviewer FROM profiles WHERE auth_user_id = auth.uid() AND status = 'active';
  IF v_reviewer.id IS NULL THEN RAISE EXCEPTION 'unauthorized'; END IF;
  IF p_role NOT IN ('school_admin', 'teacher', 'accountant', 'parent', 'staff', 'driver') THEN
    RAISE EXCEPTION 'role_not_allowed';
  END IF;
  SELECT * INTO v_request FROM school_access_requests WHERE id = p_request_id FOR UPDATE;
  IF v_request.id IS NULL THEN RAISE EXCEPTION 'request_not_found'; END IF;
  IF v_request.status <> 'pending' THEN RAISE EXCEPTION 'request_not_pending'; END IF;
  IF v_reviewer.role <> 'super_admin' AND NOT EXISTS (
    SELECT 1 FROM school_memberships m WHERE m.user_id = v_reviewer.id
      AND m.school_id = v_request.school_id AND m.role = 'school_admin' AND m.status = 'active'
  ) THEN RAISE EXCEPTION 'forbidden'; END IF;

  INSERT INTO school_memberships (user_id, school_id, role, status)
  VALUES (v_request.user_id, v_request.school_id, p_role, 'active')
  ON CONFLICT (user_id, school_id) DO UPDATE SET role = EXCLUDED.role, status = 'active', updated_at = now(), revoked_at = NULL;
  UPDATE profiles SET display_name = COALESCE(NULLIF(p_name, ''), display_name), phone = COALESCE(p_phone, phone), role = p_role, school_id = v_request.school_id, status = 'active', updated_at = now()
    WHERE id = v_request.user_id;
  UPDATE school_access_requests SET status = 'approved', assigned_role = p_role,
    assigned_designation = p_designation, assigned_department = p_department,
    reviewed_by = v_reviewer.id, reviewed_at = now()
    WHERE id = p_request_id;
END $$;

DROP POLICY IF EXISTS requests_update_authorized ON public.school_access_requests;
CREATE POLICY requests_update_authorized ON public.school_access_requests FOR UPDATE USING (
  public.is_super_admin() OR public.manages_school(school_id)
) WITH CHECK (
  public.is_super_admin() OR public.manages_school(school_id)
);
