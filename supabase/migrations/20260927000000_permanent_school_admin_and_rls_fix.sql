-- ============================================================================
-- Migration: Permanent School Admin Auto-Link & RLS Authorization Fix
-- Ensures that ANY newly created or existing school admin automatically receives
-- active school_admin membership and full access upon login without manual SQL.
-- ============================================================================

-- 1. Ensure public/authenticated read access to active schools so school codes
-- and basic institution details can be queried without RLS false negatives.
DROP POLICY IF EXISTS schools_select_authorized ON public.schools;
CREATE POLICY schools_select_authorized ON public.schools FOR SELECT
  USING (status = 'active' OR public.has_school_access(id));

-- 2. Update has_school_access to recognize designated admin_email natively.
CREATE OR REPLACE FUNCTION public.has_school_access(p_school_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_super_admin() 
    OR EXISTS (
      SELECT 1 FROM public.school_memberships m
      WHERE m.user_id = public.current_profile_id()
        AND m.school_id = p_school_id AND m.status = 'active'
    )
    OR EXISTS (
      SELECT 1 FROM public.schools s
      WHERE s.id = p_school_id 
        AND lower(s.admin_email) = lower(COALESCE(auth.jwt()->>'email', ''))
        AND s.status = 'active'
    );
$$;

-- 3. Update ensure_platform_profile to automatically detect if the authenticating
-- user's email is assigned as admin_email in any active school, and immediately
-- link their profile and active school_memberships record.
CREATE OR REPLACE FUNCTION public.ensure_platform_profile(p_email TEXT, p_display_name TEXT)
RETURNS public.profiles LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE 
  v_profile profiles%ROWTYPE;
  v_school schools%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL OR lower(COALESCE(auth.jwt()->>'email', '')) <> lower(trim(p_email)) THEN
    RAISE EXCEPTION 'identity_mismatch';
  END IF;

  SELECT * INTO v_profile FROM profiles 
  WHERE auth_user_id = auth.uid() OR lower(email) = lower(trim(p_email)) 
  ORDER BY (auth_user_id = auth.uid()) DESC LIMIT 1 FOR UPDATE;

  IF v_profile.id IS NULL THEN
    INSERT INTO profiles (auth_user_id, email, display_name, status) 
    VALUES (auth.uid(), lower(trim(p_email)), p_display_name, 'active') 
    RETURNING * INTO v_profile;
  ELSIF v_profile.auth_user_id IS NULL THEN
    UPDATE profiles 
    SET auth_user_id = auth.uid(), 
        display_name = COALESCE(NULLIF(display_name, ''), p_display_name), 
        updated_at = now() 
    WHERE id = v_profile.id 
    RETURNING * INTO v_profile;
  ELSIF v_profile.auth_user_id <> auth.uid() THEN
    RAISE EXCEPTION 'identity_already_linked';
  END IF;

  -- Permanent Auto-Link: If user doesn't already have an active membership,
  -- check if their email matches admin_email of any active school.
  IF NOT EXISTS (SELECT 1 FROM public.school_memberships WHERE user_id = v_profile.id AND status = 'active') THEN
    SELECT * INTO v_school FROM public.schools 
    WHERE lower(admin_email) = lower(trim(p_email)) 
      AND status = 'active' 
    ORDER BY created_at DESC LIMIT 1;

    IF v_school.id IS NOT NULL THEN
      UPDATE public.profiles 
      SET role = 'school_admin', 
          school_id = v_school.id, 
          updated_at = now() 
      WHERE id = v_profile.id 
      RETURNING * INTO v_profile;

      INSERT INTO public.school_memberships (user_id, school_id, role, status)
      VALUES (v_profile.id, v_school.id, 'school_admin', 'active')
      ON CONFLICT (user_id, school_id) 
      DO UPDATE SET role = 'school_admin', status = 'active', updated_at = now();
    END IF;
  END IF;

  RETURN v_profile;
END $$;
