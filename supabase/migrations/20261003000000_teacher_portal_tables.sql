-- Create missing teacher portal tables. No attendance, leave, salary or coverage records are inserted.
-- Requires existing profiles, memberships, current_profile_id, manages_school and has_school_role.
BEGIN;
CREATE UNIQUE INDEX IF NOT EXISTS uq_teachers_id_school ON public.teachers(id, school_id);

CREATE TABLE IF NOT EXISTS public.teacher_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL,
  attendance_date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('present','absent','leave','partial')),
  remarks TEXT,
  marked_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (school_id, teacher_id, attendance_date),
  FOREIGN KEY (teacher_id, school_id) REFERENCES public.teachers(id, school_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.teacher_leaves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL,
  leave_type TEXT NOT NULL CHECK (leave_type IN ('full_day','partial_day')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  return_date DATE NOT NULL,
  reason TEXT NOT NULL,
  admin_notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','cancelled')),
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (end_date >= start_date),
  CHECK (return_date > end_date),
  FOREIGN KEY (teacher_id, school_id) REFERENCES public.teachers(id, school_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_teacher_attendance_school_date ON public.teacher_attendance(school_id, attendance_date);
CREATE INDEX IF NOT EXISTS idx_teacher_leaves_school_status ON public.teacher_leaves(school_id, status, start_date);

CREATE OR REPLACE FUNCTION public.current_teacher_id()
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT t.id FROM public.teachers t
  JOIN public.profiles p ON p.auth_user_id = auth.uid()
  JOIN public.school_memberships m ON m.user_id = p.id AND m.school_id = t.school_id
  WHERE t.auth_user_id = auth.uid() AND t.status = 'active'
    AND m.role = 'teacher' AND m.status = 'active' LIMIT 1
$$;

ALTER TABLE public.teacher_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_leaves ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS teacher_attendance_read ON public.teacher_attendance;
CREATE POLICY teacher_attendance_read ON public.teacher_attendance FOR SELECT USING (
  teacher_id = public.current_teacher_id() OR public.manages_school(school_id)
);
DROP POLICY IF EXISTS teacher_attendance_admin_manage ON public.teacher_attendance;
CREATE POLICY teacher_attendance_admin_manage ON public.teacher_attendance FOR ALL
  USING (public.has_school_role(school_id, ARRAY['school_admin']))
  WITH CHECK (public.has_school_role(school_id, ARRAY['school_admin']) AND marked_by = public.current_profile_id());

DROP POLICY IF EXISTS teacher_leaves_read ON public.teacher_leaves;
CREATE POLICY teacher_leaves_read ON public.teacher_leaves FOR SELECT USING (
  teacher_id = public.current_teacher_id() OR public.manages_school(school_id)
);
DROP POLICY IF EXISTS teacher_leaves_submit_own ON public.teacher_leaves;
CREATE POLICY teacher_leaves_submit_own ON public.teacher_leaves FOR INSERT WITH CHECK (
  teacher_id = public.current_teacher_id() AND status = 'pending'
  AND reviewed_by IS NULL AND reviewed_at IS NULL
);
DROP POLICY IF EXISTS teacher_leaves_admin_update ON public.teacher_leaves;
CREATE POLICY teacher_leaves_admin_update ON public.teacher_leaves FOR UPDATE
  USING (public.has_school_role(school_id, ARRAY['school_admin']))
  WITH CHECK (public.has_school_role(school_id, ARRAY['school_admin']));

REVOKE ALL ON FUNCTION public.current_teacher_id() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_teacher_id() TO authenticated;

CREATE TABLE IF NOT EXISTS public.temporary_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  absent_employee_id UUID NOT NULL,
  absent_employee_name VARCHAR(150) NOT NULL,
  absent_employee_role VARCHAR(50) NOT NULL,
  replacement_employee_id UUID NOT NULL,
  replacement_employee_name VARCHAR(150) NOT NULL,
  replacement_employee_role VARCHAR(50) NOT NULL,
  assignment_type VARCHAR(100) NOT NULL DEFAULT 'class_attendance_coverage',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  duty_details TEXT NOT NULL,
  notes TEXT,
  is_emergency_override BOOLEAN NOT NULL DEFAULT false,
  override_reason TEXT,
  created_by UUID,
  created_by_name VARCHAR(150),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_temp_assign_school ON public.temporary_assignments(school_id);
CREATE INDEX IF NOT EXISTS idx_temp_assign_absent ON public.temporary_assignments(school_id, absent_employee_id);
CREATE INDEX IF NOT EXISTS idx_temp_assign_replacement ON public.temporary_assignments(school_id, replacement_employee_id);
CREATE INDEX IF NOT EXISTS idx_temp_assign_dates ON public.temporary_assignments(school_id, start_date, end_date);


ALTER TABLE public.temporary_assignments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS temporary_assignments_school_isolation ON public.temporary_assignments;
CREATE POLICY temporary_assignments_school_isolation ON public.temporary_assignments FOR ALL
  USING (public.manages_school(school_id)) WITH CHECK (public.manages_school(school_id));
DROP POLICY IF EXISTS temporary_assignments_read_own ON public.temporary_assignments;
CREATE POLICY temporary_assignments_read_own ON public.temporary_assignments FOR SELECT
  USING (replacement_employee_id = public.current_teacher_id() OR absent_employee_id = public.current_teacher_id());
NOTIFY pgrst, 'reload schema';
COMMIT;
