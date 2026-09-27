-- Trusted authentication audit events. Identity, role and school are derived in SQL.
CREATE OR REPLACE FUNCTION public.record_authenticated_auth_event(
  p_event_type TEXT,
  p_success BOOLEAN DEFAULT TRUE,
  p_user_agent TEXT DEFAULT NULL,
  p_platform TEXT DEFAULT 'Web Browser',
  p_details JSONB DEFAULT '{}'::jsonb
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_profile profiles%ROWTYPE; v_membership school_memberships%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'unauthorized'; END IF;
  IF p_event_type NOT IN ('google_login_success', 'logout') THEN RAISE EXCEPTION 'event_type_not_allowed'; END IF;
  SELECT * INTO v_profile FROM profiles WHERE auth_user_id = auth.uid();
  IF v_profile.id IS NULL THEN RAISE EXCEPTION 'profile_not_found'; END IF;
  SELECT * INTO v_membership FROM school_memberships WHERE user_id = v_profile.id AND status = 'active' LIMIT 1;
  INSERT INTO auth_events (school_id, user_id, email, event_type, success, role, user_name, user_agent, platform, details)
  VALUES (v_membership.school_id, auth.uid(), v_profile.email, p_event_type, p_success,
    COALESCE(v_membership.role, v_profile.role), v_profile.display_name, left(p_user_agent, 500), left(p_platform, 100), p_details);
END $$;

REVOKE ALL ON FUNCTION public.record_authenticated_auth_event(TEXT,BOOLEAN,TEXT,TEXT,JSONB) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_authenticated_auth_event(TEXT,BOOLEAN,TEXT,TEXT,JSONB) TO authenticated;

