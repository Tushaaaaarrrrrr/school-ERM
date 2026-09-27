-- A teacher may teach a subject to an entire class without targeting a section.
-- Class-level room/Class Teacher assignments also do not require a section row.

ALTER TABLE public.teacher_assignments
  ALTER COLUMN section_id DROP NOT NULL;

ALTER TABLE public.teacher_assignments
  DROP CONSTRAINT IF EXISTS uq_teacher_assignments;

CREATE UNIQUE INDEX IF NOT EXISTS uq_teacher_assignment_section
  ON public.teacher_assignments (school_id, academic_year_id, teacher_id, class_id, section_id, subject_id)
  WHERE section_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_teacher_assignment_whole_class
  ON public.teacher_assignments (school_id, academic_year_id, teacher_id, class_id, subject_id)
  WHERE section_id IS NULL;

ALTER TABLE public.classes
  ADD COLUMN IF NOT EXISTS room_id UUID REFERENCES public.school_rooms(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS class_teacher_id UUID REFERENCES public.teachers(id) ON DELETE SET NULL;
