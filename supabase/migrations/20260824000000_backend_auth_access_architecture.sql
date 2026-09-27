-- Backend-authoritative identity, membership and school access requests.
-- The product currently supports one active school per non-platform user.

ALTER TABLE public.profiles
  ALTER COLUMN role DROP NOT NULL,
  DROP CONSTRAINT IF EXISTS profiles_role_check,
  DROP CONSTRAINT IF EXISTS profiles_status_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check CHECK (
    role IS NULL OR role IN ('super_admin', 'school_admin', 'teacher', 'student', 'accountant', 'parent', 'staff', 'driver')
  ),
  ADD CONSTRAINT profiles_status_check CHECK (status IN ('active', 'inactive', 'disabled', 'revoked', 'archived'));

CREATE UNIQUE INDEX IF NOT EXISTS uq_profiles_email_lower
  ON public.profiles (lower(email)) WHERE email IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.school_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('school_admin', 'teacher', 'accountant', 'parent', 'staff', 'driver')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked', 'disabled')),
  permissions TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at TIMESTAMPTZ,
  revoked_by UUID REFERENCES public.profiles(id),
  UNIQUE (user_id, school_id)
);

-- Preserve the existing one-school business rule.
CREATE UNIQUE INDEX IF NOT EXISTS uq_one_active_school_per_user
  ON public.school_memberships (user_id) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_memberships_school_status
  ON public.school_memberships (school_id, status);

-- Backfill the existing one-school profile assignments before reads switch to memberships.
INSERT INTO public.school_memberships (user_id, school_id, role, status)
SELECT id, school_id, role, CASE WHEN status = 'active' THEN 'active' ELSE 'revoked' END
FROM public.profiles
WHERE school_id IS NOT NULL AND role IN ('school_admin', 'teacher', 'accountant', 'parent', 'staff', 'driver')
ON CONFLICT (user_id, school_id) DO UPDATE SET role = EXCLUDED.role, status = EXCLUDED.status, updated_at = now();

CREATE TABLE IF NOT EXISTS public.school_access_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  applicant_name TEXT,
  phone TEXT,
  applicant_notes TEXT,
  assigned_role TEXT CHECK (assigned_role IS NULL OR assigned_role IN ('teacher', 'accountant', 'parent', 'staff', 'driver')),
  assigned_designation TEXT,
  assigned_department TEXT,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES public.profiles(id),
  rejection_reason TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_one_pending_request_per_user
  ON public.school_access_requests (user_id) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_access_requests_school_status
  ON public.school_access_requests (school_id, status, requested_at DESC);

-- Carry existing authenticated platform/school admins into the new authority model.
UPDATE public.profiles p SET auth_user_id = u.id, role = 'super_admin', status = 'active', updated_at = now()
FROM auth.users u WHERE lower(p.email) = lower(u.email)
  AND lower(u.email) IN ('superadmin@platform.erp', 'superadmin@schoolerp.com', 'pay.laxmikant@gmail.com');
INSERT INTO public.profiles (auth_user_id, email, display_name, role, status)
SELECT u.id, lower(u.email), COALESCE(u.raw_user_meta_data->>'full_name', 'Super Admin'), 'super_admin', 'active'
FROM auth.users u WHERE lower(u.email) IN ('superadmin@platform.erp', 'superadmin@schoolerp.com', 'pay.laxmikant@gmail.com')
  AND NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.auth_user_id = u.id OR lower(p.email) = lower(u.email));

ALTER TABLE public.school_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_access_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view profiles in their school" ON public.profiles;
DROP POLICY IF EXISTS "School admin can manage profiles in their school" ON public.profiles;

CREATE OR REPLACE FUNCTION public.current_profile_id() RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id FROM profiles WHERE auth_user_id = auth.uid() LIMIT 1
$$;
CREATE OR REPLACE FUNCTION public.is_super_admin() RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM profiles WHERE auth_user_id = auth.uid() AND role = 'super_admin' AND status = 'active')
$$;
CREATE OR REPLACE FUNCTION public.manages_school(p_school_id UUID) RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_super_admin() OR EXISTS (SELECT 1 FROM school_memberships WHERE user_id = public.current_profile_id() AND school_id = p_school_id AND role = 'school_admin' AND status = 'active')
$$;
CREATE OR REPLACE FUNCTION public.profile_in_managed_school(p_user_id UUID) RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM school_memberships WHERE user_id = p_user_id AND public.manages_school(school_id))
$$;

CREATE OR REPLACE FUNCTION public.ensure_platform_profile(p_email TEXT, p_display_name TEXT)
RETURNS public.profiles LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_profile profiles%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL OR lower(COALESCE(auth.jwt()->>'email', '')) <> lower(trim(p_email)) THEN
    RAISE EXCEPTION 'identity_mismatch';
  END IF;
  SELECT * INTO v_profile FROM profiles WHERE auth_user_id = auth.uid() OR lower(email) = lower(trim(p_email)) ORDER BY (auth_user_id = auth.uid()) DESC LIMIT 1 FOR UPDATE;
  IF v_profile.id IS NULL THEN
    INSERT INTO profiles (auth_user_id, email, display_name, status) VALUES (auth.uid(), lower(trim(p_email)), p_display_name, 'active') RETURNING * INTO v_profile;
  ELSIF v_profile.auth_user_id IS NULL THEN
    UPDATE profiles SET auth_user_id = auth.uid(), display_name = COALESCE(NULLIF(display_name, ''), p_display_name), updated_at = now() WHERE id = v_profile.id RETURNING * INTO v_profile;
  ELSIF v_profile.auth_user_id <> auth.uid() THEN
    RAISE EXCEPTION 'identity_already_linked';
  END IF;
  RETURN v_profile;
END $$;

CREATE OR REPLACE FUNCTION public.submit_school_access_request(p_school_code TEXT, p_name TEXT, p_phone TEXT, p_notes TEXT)
RETURNS public.school_access_requests LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_profile profiles%ROWTYPE; v_school schools%ROWTYPE; v_request school_access_requests%ROWTYPE;
BEGIN
  SELECT * INTO v_profile FROM profiles WHERE auth_user_id = auth.uid() AND status = 'active';
  IF v_profile.id IS NULL THEN RAISE EXCEPTION 'unauthorized'; END IF;
  IF v_profile.role = 'super_admin' OR EXISTS (SELECT 1 FROM school_memberships WHERE user_id = v_profile.id AND status = 'active') THEN RAISE EXCEPTION 'already_has_access'; END IF;
  IF EXISTS (SELECT 1 FROM school_access_requests WHERE user_id = v_profile.id AND status = 'pending') THEN RAISE EXCEPTION 'request_already_pending'; END IF;
  SELECT * INTO v_school FROM schools WHERE upper(code) = upper(trim(p_school_code)) AND status = 'active';
  IF v_school.id IS NULL THEN RAISE EXCEPTION 'school_not_found'; END IF;
  INSERT INTO school_access_requests (user_id, school_id, applicant_name, phone, applicant_notes)
    VALUES (v_profile.id, v_school.id, COALESCE(NULLIF(trim(p_name), ''), v_profile.display_name), NULLIF(trim(p_phone), ''), NULLIF(trim(p_notes), '')) RETURNING * INTO v_request;
  RETURN v_request;
END $$;

CREATE POLICY profiles_read_self_or_super ON public.profiles FOR SELECT USING (
  auth_user_id = auth.uid() OR public.is_super_admin() OR public.profile_in_managed_school(id)
);
CREATE POLICY profiles_update_self_or_super ON public.profiles FOR UPDATE USING (
  public.is_super_admin()
) WITH CHECK (public.is_super_admin());
CREATE POLICY memberships_read_authorized ON public.school_memberships FOR SELECT USING (
  user_id = public.current_profile_id() OR public.manages_school(school_id)
);
CREATE POLICY memberships_manage_super ON public.school_memberships FOR ALL USING (
  public.is_super_admin()
) WITH CHECK (
  public.is_super_admin()
);
CREATE POLICY requests_read_authorized ON public.school_access_requests FOR SELECT USING (
  user_id = public.current_profile_id() OR public.manages_school(school_id)
);
CREATE POLICY schools_read_membership ON public.schools FOR SELECT USING (
  public.is_super_admin() OR EXISTS (SELECT 1 FROM public.school_memberships WHERE user_id = public.current_profile_id() AND school_id = schools.id AND status = 'active')
);

-- Atomic approval. Caller identity and school ownership are checked in SQL.
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
  IF p_role NOT IN ('teacher', 'accountant', 'parent', 'staff', 'driver') THEN
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

CREATE OR REPLACE FUNCTION public.cancel_school_access_request(p_request_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE school_access_requests SET status = 'cancelled', reviewed_at = now()
  WHERE id = p_request_id AND user_id = public.current_profile_id() AND status = 'pending';
  IF NOT FOUND THEN RAISE EXCEPTION 'request_not_pending'; END IF;
END $$;

CREATE OR REPLACE FUNCTION public.assign_user_school_access(p_user_id UUID, p_school_id UUID, p_role TEXT, p_name TEXT, p_phone TEXT, p_status TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_reviewer profiles%ROWTYPE;
BEGIN
  SELECT * INTO v_reviewer FROM profiles WHERE auth_user_id = auth.uid() AND role = 'super_admin' AND status = 'active';
  IF v_reviewer.id IS NULL THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF p_role NOT IN ('school_admin', 'teacher', 'accountant', 'parent', 'staff', 'driver') THEN RAISE EXCEPTION 'role_not_allowed'; END IF;
  IF p_status NOT IN ('active', 'disabled') THEN RAISE EXCEPTION 'status_not_allowed'; END IF;
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = p_user_id) THEN RAISE EXCEPTION 'user_not_found'; END IF;
  IF EXISTS (SELECT 1 FROM profiles WHERE id = p_user_id AND role = 'super_admin') THEN RAISE EXCEPTION 'role_not_allowed'; END IF;
  IF p_status = 'active' AND NOT EXISTS (SELECT 1 FROM schools WHERE id = p_school_id AND status = 'active') THEN RAISE EXCEPTION 'school_not_found'; END IF;
  UPDATE profiles SET display_name = COALESCE(NULLIF(trim(p_name), ''), display_name), phone = NULLIF(trim(p_phone), ''),
    status = CASE WHEN p_status = 'disabled' THEN 'disabled' ELSE 'active' END,
    school_id = CASE WHEN p_status = 'active' THEN p_school_id ELSE NULL END,
    role = CASE WHEN p_status = 'active' THEN p_role ELSE role END, updated_at = now() WHERE id = p_user_id;
  UPDATE school_memberships SET status = 'revoked', revoked_at = now(), revoked_by = v_reviewer.id, updated_at = now() WHERE user_id = p_user_id AND status = 'active';
  IF p_status = 'active' THEN
    INSERT INTO school_memberships (user_id, school_id, role, status) VALUES (p_user_id, p_school_id, p_role, 'active')
    ON CONFLICT (user_id, school_id) DO UPDATE SET role = EXCLUDED.role, status = 'active', revoked_at = NULL, revoked_by = NULL, updated_at = now();
    UPDATE school_access_requests SET status = 'approved', assigned_role = p_role, reviewed_by = v_reviewer.id, reviewed_at = now()
      WHERE user_id = p_user_id AND school_id = p_school_id AND status = 'pending';
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.reject_school_access_request(p_request_id UUID, p_reason TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_reviewer profiles%ROWTYPE; v_request school_access_requests%ROWTYPE;
BEGIN
  SELECT * INTO v_reviewer FROM profiles WHERE auth_user_id = auth.uid() AND status = 'active';
  IF v_reviewer.id IS NULL THEN RAISE EXCEPTION 'unauthorized'; END IF;
  SELECT * INTO v_request FROM school_access_requests WHERE id = p_request_id FOR UPDATE;
  IF v_request.id IS NULL THEN RAISE EXCEPTION 'request_not_found'; END IF;
  IF v_request.status <> 'pending' THEN RAISE EXCEPTION 'request_not_pending'; END IF;
  IF v_reviewer.role <> 'super_admin' AND NOT EXISTS (SELECT 1 FROM school_memberships WHERE user_id = v_reviewer.id AND school_id = v_request.school_id AND role = 'school_admin' AND status = 'active') THEN RAISE EXCEPTION 'forbidden'; END IF;
  UPDATE school_access_requests SET status = 'rejected', rejection_reason = COALESCE(NULLIF(trim(p_reason), ''), 'Rejected by school administrator'), reviewed_by = v_reviewer.id, reviewed_at = now() WHERE id = p_request_id;
END $$;

CREATE OR REPLACE FUNCTION public.revoke_school_membership(p_user_id UUID, p_school_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_reviewer profiles%ROWTYPE; v_target_role TEXT;
BEGIN
  SELECT * INTO v_reviewer FROM profiles WHERE auth_user_id = auth.uid() AND status = 'active';
  IF v_reviewer.id IS NULL THEN RAISE EXCEPTION 'unauthorized'; END IF;
  SELECT role INTO v_target_role FROM school_memberships WHERE user_id = p_user_id AND school_id = p_school_id AND status = 'active' FOR UPDATE;
  IF v_target_role IS NULL THEN RAISE EXCEPTION 'membership_not_found'; END IF;
  IF v_reviewer.role <> 'super_admin' AND NOT EXISTS (SELECT 1 FROM school_memberships WHERE user_id = v_reviewer.id AND school_id = p_school_id AND role = 'school_admin' AND status = 'active') THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF v_reviewer.role <> 'super_admin' AND v_target_role = 'school_admin' THEN RAISE EXCEPTION 'role_not_allowed'; END IF;
  UPDATE school_memberships SET status = 'revoked', revoked_at = now(), revoked_by = v_reviewer.id, updated_at = now() WHERE user_id = p_user_id AND school_id = p_school_id;
  UPDATE profiles SET school_id = NULL, updated_at = now() WHERE id = p_user_id;
END $$;

REVOKE INSERT, UPDATE, DELETE ON public.profiles, public.school_memberships, public.school_access_requests FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.approve_school_access_request(UUID,TEXT,TEXT,TEXT,TEXT,TEXT), public.reject_school_access_request(UUID,TEXT), public.revoke_school_membership(UUID,UUID), public.assign_user_school_access(UUID,UUID,TEXT,TEXT,TEXT,TEXT), public.cancel_school_access_request(UUID), public.submit_school_access_request(TEXT,TEXT,TEXT,TEXT), public.ensure_platform_profile(TEXT,TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.approve_school_access_request(UUID,TEXT,TEXT,TEXT,TEXT,TEXT), public.reject_school_access_request(UUID,TEXT), public.revoke_school_membership(UUID,UUID), public.assign_user_school_access(UUID,UUID,TEXT,TEXT,TEXT,TEXT), public.cancel_school_access_request(UUID), public.submit_school_access_request(TEXT,TEXT,TEXT,TEXT), public.ensure_platform_profile(TEXT,TEXT) TO authenticated;
