-- Store the authoritative weekly operating schedule on each school tenant.
ALTER TABLE public.schools
  ADD COLUMN IF NOT EXISTS school_hours JSONB NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.schools.school_hours IS
  'Weekly school hours keyed by lowercase weekday; each value contains is_open, start_time, and end_time.';
