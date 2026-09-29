-- Migration: Add current_enrollment JSONB column to students table
-- Ensures student class, section, roll number, and academic year details persist cleanly in Supabase

ALTER TABLE public.students ADD COLUMN IF NOT EXISTS current_enrollment JSONB;

COMMENT ON COLUMN public.students.current_enrollment IS 'Cached current academic enrollment snapshot including class_id, class_name, section_id, section_name, roll_number, and academic_year';
