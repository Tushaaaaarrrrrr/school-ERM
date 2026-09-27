-- ============================================================================
-- Schema Migration: Notices, Attendance, Holidays, Leaves & Teacher Payments
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. EXTEND PROFILES & TEACHERS WITH LOGIN IDS & SALARIES
-- ----------------------------------------------------------------------------
ALTER TABLE public.profiles 
    ADD COLUMN IF NOT EXISTS login_id TEXT,
    ADD COLUMN IF NOT EXISTS require_password_change BOOLEAN DEFAULT true;

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_school_login_id 
    ON public.profiles (school_id, login_id) 
    WHERE school_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_platform_super_admin 
    ON public.profiles (login_id) 
    WHERE school_id IS NULL;

ALTER TABLE public.teachers
    ADD COLUMN IF NOT EXISTS monthly_salary NUMERIC(12, 2) DEFAULT 25000.00;

-- ----------------------------------------------------------------------------
-- 2. LOGIN SECURITY EVENTS LOGGING
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.login_security_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID REFERENCES public.schools(id) ON DELETE SET NULL,
    login_identifier TEXT NOT NULL,
    ip_address TEXT,
    event_type TEXT NOT NULL CHECK (event_type IN ('login_success', 'login_failed', 'rate_limited', 'password_reset', 'suspicious_login')),
    success BOOLEAN NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_security_events_school_type ON public.login_security_events(school_id, event_type);
CREATE INDEX IF NOT EXISTS idx_security_events_created_at ON public.login_security_events(created_at);

-- ----------------------------------------------------------------------------
-- 3. SCHOOL NOTICES
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    audience TEXT NOT NULL DEFAULT 'everyone' CHECK (audience IN ('everyone', 'students', 'teachers')),
    starts_at DATE NOT NULL DEFAULT CURRENT_DATE,
    expires_at DATE,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived', 'draft')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notices_school_audience ON public.notices(school_id, audience, starts_at, expires_at);

-- ----------------------------------------------------------------------------
-- 4. STUDENT ATTENDANCE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.student_attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    academic_year_id UUID NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    enrollment_id UUID REFERENCES public.student_enrollments(id) ON DELETE SET NULL,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    section_id UUID NOT NULL REFERENCES public.sections(id) ON DELETE CASCADE,
    attendance_date DATE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'leave', 'partial')),
    marked_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    remarks TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_student_daily_attendance UNIQUE(school_id, student_id, attendance_date)
);

CREATE INDEX IF NOT EXISTS idx_attendance_school_date ON public.student_attendance(school_id, attendance_date);
CREATE INDEX IF NOT EXISTS idx_attendance_class_section ON public.student_attendance(school_id, class_id, section_id, attendance_date);

-- ----------------------------------------------------------------------------
-- 5. SCHOOL HOLIDAYS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.school_holidays (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    academic_year_id UUID NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_holidays_school_dates ON public.school_holidays(school_id, start_date, end_date);

-- ----------------------------------------------------------------------------
-- 6. STUDENT LEAVES / APPROVED ABSENCES
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.student_leaves (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    academic_year_id UUID NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
    leave_type TEXT NOT NULL DEFAULT 'full_day' CHECK (leave_type IN ('full_day', 'partial_day')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    partial_start_time TIME,
    partial_end_time TIME,
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
    approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_student_leaves_dates ON public.student_leaves(school_id, student_id, start_date, end_date);

-- ----------------------------------------------------------------------------
-- 7. TEACHER PAYMENTS / SALARY RECORDS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.teacher_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
    billing_month DATE NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'paid' CHECK (status IN ('pending', 'paid', 'partial')),
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'upi', 'bank', 'cheque', 'other')),
    reference_number TEXT,
    notes TEXT,
    recorded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_teacher_payments_school_month ON public.teacher_payments(school_id, teacher_id, billing_month);

-- ----------------------------------------------------------------------------
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- ----------------------------------------------------------------------------
ALTER TABLE public.login_security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_leaves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_payments ENABLE ROW LEVEL SECURITY;

-- Notices Policies
CREATE POLICY "Super Admins view all notices" ON public.notices
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE auth_user_id = auth.uid() AND role = 'super_admin'));

CREATE POLICY "School staff manage school notices" ON public.notices
    FOR ALL TO authenticated
    USING (school_id = (SELECT school_id FROM public.profiles WHERE auth_user_id = auth.uid()))
    WITH CHECK (school_id = (SELECT school_id FROM public.profiles WHERE auth_user_id = auth.uid()));

-- Attendance Policies
CREATE POLICY "School users view attendance" ON public.student_attendance
    FOR SELECT TO authenticated
    USING (school_id = (SELECT school_id FROM public.profiles WHERE auth_user_id = auth.uid()));

CREATE POLICY "School Admin and Teachers mark attendance" ON public.student_attendance
    FOR ALL TO authenticated
    USING (school_id = (SELECT school_id FROM public.profiles WHERE auth_user_id = auth.uid()))
    WITH CHECK (school_id = (SELECT school_id FROM public.profiles WHERE auth_user_id = auth.uid()));

-- Holidays Policies
CREATE POLICY "School users view holidays" ON public.school_holidays
    FOR SELECT TO authenticated
    USING (school_id = (SELECT school_id FROM public.profiles WHERE auth_user_id = auth.uid()));

CREATE POLICY "School Admins manage holidays" ON public.school_holidays
    FOR ALL TO authenticated
    USING (school_id = (SELECT school_id FROM public.profiles WHERE auth_user_id = auth.uid() AND role IN ('school_admin', 'super_admin')))
    WITH CHECK (school_id = (SELECT school_id FROM public.profiles WHERE auth_user_id = auth.uid() AND role IN ('school_admin', 'super_admin')));

-- Student Leaves Policies
CREATE POLICY "School users view leaves" ON public.student_leaves
    FOR SELECT TO authenticated
    USING (school_id = (SELECT school_id FROM public.profiles WHERE auth_user_id = auth.uid()));

CREATE POLICY "School Admins manage student leaves" ON public.student_leaves
    FOR ALL TO authenticated
    USING (school_id = (SELECT school_id FROM public.profiles WHERE auth_user_id = auth.uid() AND role IN ('school_admin', 'super_admin')))
    WITH CHECK (school_id = (SELECT school_id FROM public.profiles WHERE auth_user_id = auth.uid() AND role IN ('school_admin', 'super_admin')));

-- Teacher Payments Policies
CREATE POLICY "Super and School Admins manage teacher payments" ON public.teacher_payments
    FOR ALL TO authenticated
    USING (school_id = (SELECT school_id FROM public.profiles WHERE auth_user_id = auth.uid() AND role IN ('school_admin', 'super_admin')))
    WITH CHECK (school_id = (SELECT school_id FROM public.profiles WHERE auth_user_id = auth.uid() AND role IN ('school_admin', 'super_admin')));

CREATE POLICY "Teachers view own payments" ON public.teacher_payments
    FOR SELECT TO authenticated
    USING (
        school_id = (SELECT school_id FROM public.profiles WHERE auth_user_id = auth.uid())
        AND teacher_id IN (SELECT id FROM public.teachers WHERE auth_user_id = auth.uid())
    );
