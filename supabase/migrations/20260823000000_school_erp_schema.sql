-- ============================================================================
-- Multi-Tenant School ERP Database Schema & Row Level Security (RLS)
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ----------------------------------------------------------------------------
-- 1. SCHOOLS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.schools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    address TEXT,
    logo_url TEXT,
    timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'inactive')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_schools_code ON public.schools(code);
CREATE INDEX IF NOT EXISTS idx_schools_status ON public.schools(status);

-- ----------------------------------------------------------------------------
-- 2. PROFILES (Linked to Supabase auth.users)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID UNIQUE,
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('super_admin', 'school_admin', 'teacher', 'student', 'accountant', 'parent', 'staff')),
    display_name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_auth_user_id ON public.profiles(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_school_role ON public.profiles(school_id, role);

-- ----------------------------------------------------------------------------
-- 3. ACADEMIC YEARS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.academic_years (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_current BOOLEAN NOT NULL DEFAULT false,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed', 'upcoming')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_school_academic_year UNIQUE (school_id, name)
);

CREATE INDEX IF NOT EXISTS idx_academic_years_school ON public.academic_years(school_id, is_current);

-- ----------------------------------------------------------------------------
-- 4. CLASSES & SECTIONS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_school_class_name UNIQUE (school_id, name)
);

CREATE INDEX IF NOT EXISTS idx_classes_school ON public.classes(school_id, sort_order);

CREATE TABLE IF NOT EXISTS public.sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_school_class_section UNIQUE (school_id, class_id, name)
);

CREATE INDEX IF NOT EXISTS idx_sections_class ON public.sections(school_id, class_id);

-- ----------------------------------------------------------------------------
-- 5. SUBJECTS & CLASS SUBJECTS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_school_subject_name UNIQUE (school_id, name)
);

CREATE INDEX IF NOT EXISTS idx_subjects_school ON public.subjects(school_id);

CREATE TABLE IF NOT EXISTS public.class_subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    academic_year_id UUID NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_class_subjects UNIQUE (school_id, academic_year_id, class_id, subject_id)
);

-- ----------------------------------------------------------------------------
-- 6. STUDENTS, GUARDIANS & ENROLLMENTS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    auth_user_id UUID UNIQUE,
    registration_number TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    date_of_birth DATE,
    gender TEXT CHECK (gender IN ('male', 'female', 'other')),
    joining_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived', 'graduated')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_school_student_reg UNIQUE (school_id, registration_number)
);

CREATE INDEX IF NOT EXISTS idx_students_search ON public.students(school_id, registration_number, first_name, last_name);

CREATE TABLE IF NOT EXISTS public.guardians (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    father_name TEXT,
    mother_name TEXT,
    guardian_name TEXT,
    primary_phone TEXT NOT NULL,
    secondary_phone TEXT,
    email TEXT,
    address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_guardians_student ON public.guardians(student_id);
CREATE INDEX IF NOT EXISTS idx_guardians_phone ON public.guardians(school_id, primary_phone);

CREATE TABLE IF NOT EXISTS public.student_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    academic_year_id UUID NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    section_id UUID NOT NULL REFERENCES public.sections(id) ON DELETE CASCADE,
    roll_number TEXT NOT NULL,
    joined_at DATE NOT NULL DEFAULT CURRENT_DATE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'transferred', 'promoted', 'dropped')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_enrollment_roll UNIQUE (school_id, academic_year_id, class_id, section_id, roll_number)
);

CREATE INDEX IF NOT EXISTS idx_enrollments_lookup ON public.student_enrollments(school_id, academic_year_id, class_id, section_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_student ON public.student_enrollments(student_id);

-- ----------------------------------------------------------------------------
-- 7. TEACHERS & TEACHER ASSIGNMENTS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.teachers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    auth_user_id UUID UNIQUE,
    employee_number TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    joining_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_school_teacher_emp UNIQUE (school_id, employee_number)
);

CREATE INDEX IF NOT EXISTS idx_teachers_school ON public.teachers(school_id, employee_number);

CREATE TABLE IF NOT EXISTS public.teacher_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    academic_year_id UUID NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    section_id UUID NOT NULL REFERENCES public.sections(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_teacher_assignments UNIQUE (school_id, academic_year_id, teacher_id, class_id, section_id, subject_id)
);

CREATE INDEX IF NOT EXISTS idx_teacher_assignments_lookup ON public.teacher_assignments(school_id, teacher_id, academic_year_id);

-- ----------------------------------------------------------------------------
-- 8. TIMETABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.timetable_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    academic_year_id UUID NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    section_id UUID NOT NULL REFERENCES public.sections(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
    day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    room TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_timetable_class ON public.timetable_entries(school_id, academic_year_id, class_id, section_id, day_of_week);
CREATE INDEX IF NOT EXISTS idx_timetable_teacher ON public.timetable_entries(school_id, teacher_id, day_of_week);

-- ----------------------------------------------------------------------------
-- 9. FEES, INVOICES & PAYMENTS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.fee_structures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    academic_year_id UUID NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    billing_frequency TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_frequency IN ('monthly', 'quarterly', 'annually', 'one_time')),
    due_day INT NOT NULL DEFAULT 10 CHECK (due_day BETWEEN 1 AND 31),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fee_structures_school ON public.fee_structures(school_id, academic_year_id);

CREATE TABLE IF NOT EXISTS public.student_fee_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    academic_year_id UUID NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
    fee_structure_id UUID NOT NULL REFERENCES public.fee_structures(id) ON DELETE CASCADE,
    amount_override NUMERIC(12, 2),
    start_date DATE NOT NULL,
    end_date DATE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'paused')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.student_fee_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    academic_year_id UUID NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
    fee_structure_id UUID REFERENCES public.fee_structures(id) ON DELETE SET NULL,
    billing_month DATE NOT NULL,
    base_amount NUMERIC(12, 2) NOT NULL,
    discount_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    late_fee NUMERIC(12, 2) NOT NULL DEFAULT 0,
    final_amount NUMERIC(12, 2) NOT NULL,
    paid_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    due_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'partial', 'paid', 'overdue', 'waived', 'cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invoices_student ON public.student_fee_invoices(school_id, student_id, billing_month);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.student_fee_invoices(school_id, status);

CREATE TABLE IF NOT EXISTS public.student_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    invoice_id UUID NOT NULL REFERENCES public.student_fee_invoices(id) ON DELETE CASCADE,
    amount NUMERIC(12, 2) NOT NULL,
    payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'upi', 'bank', 'cheque', 'other')),
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    reference_number TEXT,
    received_by TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payments_invoice ON public.student_payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_school_date ON public.student_payments(school_id, payment_date);

-- ----------------------------------------------------------------------------
-- 10. EXAMS & RESULTS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.exams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    academic_year_id UUID NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    section_id UUID NOT NULL REFERENCES public.sections(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES public.teachers(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    max_marks NUMERIC(6, 2) NOT NULL,
    exam_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_exams_class_subject ON public.exams(school_id, academic_year_id, class_id, section_id, subject_id);

CREATE TABLE IF NOT EXISTS public.exam_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    marks_obtained NUMERIC(6, 2),
    absent BOOLEAN NOT NULL DEFAULT false,
    remarks TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_exam_result_student UNIQUE (exam_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_exam_results_student ON public.exam_results(student_id);

-- ----------------------------------------------------------------------------
-- 11. AUDIT LOGS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    actor_user_id UUID,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    old_values JSONB,
    new_values JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_school ON public.audit_logs(school_id, created_at DESC);

-- ----------------------------------------------------------------------------
-- 12. ROW LEVEL SECURITY (RLS) POLICIES
-- ----------------------------------------------------------------------------

ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guardians ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timetable_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_fee_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_fee_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper to get authenticated user's profile
CREATE OR REPLACE FUNCTION public.current_profile()
RETURNS public.profiles AS $$
  SELECT * FROM public.profiles WHERE auth_user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Schools Policies
CREATE POLICY "Super admin full access on schools"
    ON public.schools FOR ALL
    USING ((public.current_profile()).role = 'super_admin');

CREATE POLICY "School users can view their own school"
    ON public.schools FOR SELECT
    USING (id = (public.current_profile()).school_id);

-- Profiles Policies
CREATE POLICY "Users can view profiles in their school"
    ON public.profiles FOR SELECT
    USING (
        (public.current_profile()).role = 'super_admin'
        OR school_id = (public.current_profile()).school_id
    );

CREATE POLICY "School admin can manage profiles in their school"
    ON public.profiles FOR ALL
    USING (
        (public.current_profile()).role = 'super_admin'
        OR (
            (public.current_profile()).role = 'school_admin'
            AND school_id = (public.current_profile()).school_id
        )
    );

-- Generic tenant isolation policy template for school-owned tables
-- (Applies to classes, sections, subjects, students, teachers, fees, timetable, etc.)
CREATE POLICY "Tenant isolation for academic_years"
    ON public.academic_years FOR ALL
    USING (
        (public.current_profile()).role = 'super_admin'
        OR school_id = (public.current_profile()).school_id
    );

CREATE POLICY "Tenant isolation for classes"
    ON public.classes FOR ALL
    USING (
        (public.current_profile()).role = 'super_admin'
        OR school_id = (public.current_profile()).school_id
    );

CREATE POLICY "Tenant isolation for sections"
    ON public.sections FOR ALL
    USING (
        (public.current_profile()).role = 'super_admin'
        OR school_id = (public.current_profile()).school_id
    );

CREATE POLICY "Tenant isolation for subjects"
    ON public.subjects FOR ALL
    USING (
        (public.current_profile()).role = 'super_admin'
        OR school_id = (public.current_profile()).school_id
    );

CREATE POLICY "Tenant isolation for students"
    ON public.students FOR ALL
    USING (
        (public.current_profile()).role = 'super_admin'
        OR school_id = (public.current_profile()).school_id
    );

CREATE POLICY "Tenant isolation for student_enrollments"
    ON public.student_enrollments FOR ALL
    USING (
        (public.current_profile()).role = 'super_admin'
        OR school_id = (public.current_profile()).school_id
    );

CREATE POLICY "Tenant isolation for guardians"
    ON public.guardians FOR ALL
    USING (
        (public.current_profile()).role = 'super_admin'
        OR school_id = (public.current_profile()).school_id
    );

CREATE POLICY "Tenant isolation for teachers"
    ON public.teachers FOR ALL
    USING (
        (public.current_profile()).role = 'super_admin'
        OR school_id = (public.current_profile()).school_id
    );

CREATE POLICY "Tenant isolation for teacher_assignments"
    ON public.teacher_assignments FOR ALL
    USING (
        (public.current_profile()).role = 'super_admin'
        OR school_id = (public.current_profile()).school_id
    );

CREATE POLICY "Tenant isolation for timetable_entries"
    ON public.timetable_entries FOR ALL
    USING (
        (public.current_profile()).role = 'super_admin'
        OR school_id = (public.current_profile()).school_id
    );

CREATE POLICY "Tenant isolation for fee_structures"
    ON public.fee_structures FOR ALL
    USING (
        (public.current_profile()).role = 'super_admin'
        OR (
            (public.current_profile()).role = 'school_admin'
            AND school_id = (public.current_profile()).school_id
        )
    );

CREATE POLICY "Tenant isolation for student_fee_invoices"
    ON public.student_fee_invoices FOR ALL
    USING (
        (public.current_profile()).role = 'super_admin'
        OR (
            (public.current_profile()).role = 'school_admin'
            AND school_id = (public.current_profile()).school_id
        )
        OR (
            (public.current_profile()).role = 'student'
            AND student_id IN (SELECT id FROM public.students WHERE auth_user_id = auth.uid())
        )
    );

CREATE POLICY "Tenant isolation for student_payments"
    ON public.student_payments FOR ALL
    USING (
        (public.current_profile()).role = 'super_admin'
        OR (
            (public.current_profile()).role = 'school_admin'
            AND school_id = (public.current_profile()).school_id
        )
        OR (
            (public.current_profile()).role = 'student'
            AND student_id IN (SELECT id FROM public.students WHERE auth_user_id = auth.uid())
        )
    );

CREATE POLICY "Tenant isolation for exams"
    ON public.exams FOR ALL
    USING (
        (public.current_profile()).role = 'super_admin'
        OR (
            (public.current_profile()).role IN ('school_admin', 'teacher')
            AND school_id = (public.current_profile()).school_id
        )
        OR (
            (public.current_profile()).role = 'student'
            AND status = 'published'
            AND school_id = (public.current_profile()).school_id
        )
    );

CREATE POLICY "Tenant isolation for exam_results"
    ON public.exam_results FOR ALL
    USING (
        (public.current_profile()).role = 'super_admin'
        OR (
            (public.current_profile()).role IN ('school_admin', 'teacher')
            AND school_id = (public.current_profile()).school_id
        )
        OR (
            (public.current_profile()).role = 'student'
            AND student_id IN (SELECT id FROM public.students WHERE auth_user_id = auth.uid())
            AND exam_id IN (SELECT id FROM public.exams WHERE status = 'published')
        )
    );
