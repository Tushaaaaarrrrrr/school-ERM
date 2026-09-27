-- Per-class fee defaults and idempotent enrollment-time charges.

CREATE TABLE IF NOT EXISTS public.class_fee_defaults (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  academic_year_id UUID NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  monthly_amount NUMERIC(12,2) NOT NULL CHECK (monthly_amount > 0),
  invoice_generation_day INT NOT NULL DEFAULT 1 CHECK (invoice_generation_day BETWEEN 1 AND 28),
  due_day INT NOT NULL DEFAULT 10 CHECK (due_day BETWEEN 1 AND 31),
  effective_from DATE NOT NULL,
  effective_to DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','archived')),
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (effective_to IS NULL OR effective_to >= effective_from)
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_active_class_fee_default
  ON public.class_fee_defaults(school_id, academic_year_id, class_id) WHERE status = 'active' AND effective_to IS NULL;

CREATE TABLE IF NOT EXISTS public.class_joining_charge_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  academic_year_id UUID NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (length(trim(name)) > 0),
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','archived')),
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_class_joining_charge_name
  ON public.class_joining_charge_definitions(school_id, academic_year_id, class_id, lower(name)) WHERE status = 'active';

ALTER TABLE public.student_fee_assignments
  ADD COLUMN IF NOT EXISTS class_fee_default_id UUID REFERENCES public.class_fee_defaults(id) ON DELETE RESTRICT;
CREATE UNIQUE INDEX IF NOT EXISTS uq_student_active_class_fee
  ON public.student_fee_assignments(school_id, student_id, academic_year_id, class_fee_default_id)
  WHERE status = 'active' AND class_fee_default_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.student_enrollment_charges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  enrollment_id UUID NOT NULL REFERENCES public.student_enrollments(id) ON DELETE RESTRICT,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE RESTRICT,
  academic_year_id UUID NOT NULL REFERENCES public.academic_years(id) ON DELETE RESTRICT,
  source_definition_id UUID NOT NULL REFERENCES public.class_joining_charge_definitions(id) ON DELETE RESTRICT,
  description_snapshot TEXT NOT NULL,
  amount_snapshot NUMERIC(12,2) NOT NULL CHECK (amount_snapshot > 0),
  due_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','partial','paid','waived','cancelled')),
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (school_id, enrollment_id, source_definition_id)
);

ALTER TABLE public.class_fee_defaults ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_joining_charge_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_enrollment_charges ENABLE ROW LEVEL SECURITY;

CREATE POLICY class_fee_defaults_read ON public.class_fee_defaults FOR SELECT USING (public.has_school_access(school_id));
CREATE POLICY class_fee_defaults_manage ON public.class_fee_defaults FOR ALL
  USING (public.has_school_role(school_id, ARRAY['school_admin','accountant']))
  WITH CHECK (public.has_school_role(school_id, ARRAY['school_admin','accountant']));
CREATE POLICY joining_charge_definitions_read ON public.class_joining_charge_definitions FOR SELECT USING (public.has_school_access(school_id));
CREATE POLICY joining_charge_definitions_manage ON public.class_joining_charge_definitions FOR ALL
  USING (public.has_school_role(school_id, ARRAY['school_admin','accountant']))
  WITH CHECK (public.has_school_role(school_id, ARRAY['school_admin','accountant']));
CREATE POLICY enrollment_charges_admin_read ON public.student_enrollment_charges FOR SELECT
  USING (public.has_school_role(school_id, ARRAY['school_admin','accountant']));
CREATE POLICY enrollment_charges_admin_manage ON public.student_enrollment_charges FOR ALL
  USING (public.has_school_role(school_id, ARRAY['school_admin','accountant']))
  WITH CHECK (public.has_school_role(school_id, ARRAY['school_admin','accountant']));
