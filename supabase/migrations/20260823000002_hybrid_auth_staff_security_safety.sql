-- ============================================================================
-- School ERP Migration: Hybrid Auth, Staff, Security Logs & Safety Workflows
-- ============================================================================

-- 1. Staff Members & Types
CREATE TABLE IF NOT EXISTS public.staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    staff_type TEXT NOT NULL CHECK (staff_type IN (
        'accountant',
        'receptionist',
        'office_staff',
        'caretaker',
        'keeper',
        'driver',
        'security',
        'librarian',
        'other'
    )),
    employee_number TEXT,
    joining_date DATE NOT NULL DEFAULT CURRENT_DATE,
    photo_url TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
    permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(school_id, email),
    UNIQUE(school_id, employee_number)
);

-- 2. Comprehensive Security & Auth Events Log
CREATE TABLE IF NOT EXISTS public.auth_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    email TEXT,
    registration_identifier TEXT,
    event_type TEXT NOT NULL CHECK (event_type IN (
        'login_success',
        'login_failure',
        'google_login_success',
        'unregistered_google_login',
        'logout',
        'rate_limited',
        'password_reset',
        'account_suspended_login',
        'user_deletion_attempt',
        'school_suspension_attempt',
        'school_deletion_attempt'
    )),
    success BOOLEAN NOT NULL DEFAULT TRUE,
    role TEXT,
    user_name TEXT,
    ip_hash TEXT,
    user_agent TEXT,
    platform TEXT,
    details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Account Deletion Requests (App Store Compliant)
CREATE TABLE IF NOT EXISTS public.account_deletion_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    user_role TEXT NOT NULL,
    user_name TEXT NOT NULL,
    user_email TEXT,
    requested_by UUID NOT NULL,
    request_reason TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled', 'completed')),
    reviewed_by UUID,
    reviewed_by_name TEXT,
    review_reason TEXT,
    requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);

-- 4. School Deletion Requests & Grace Periods
CREATE TABLE IF NOT EXISTS public.school_deletion_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    requested_by UUID NOT NULL,
    requested_by_name TEXT NOT NULL,
    reason TEXT NOT NULL,
    grace_period_days INT NOT NULL DEFAULT 14,
    scheduled_deletion_date TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending_deletion' CHECK (status IN ('pending_deletion', 'cancelled', 'completed')),
    cancelled_by UUID,
    cancellation_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    cancelled_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);

-- 5. Extend Schools table with Photo Limit & Status
ALTER TABLE public.schools 
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS profile_photo_max_mb INT DEFAULT 2,
ADD COLUMN IF NOT EXISTS pending_deletion_until TIMESTAMPTZ;

-- 6. Indexes for High Performance Queries
CREATE INDEX IF NOT EXISTS idx_staff_school ON public.staff(school_id, status);
CREATE INDEX IF NOT EXISTS idx_auth_events_school ON public.auth_events(school_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_auth_events_type ON public.auth_events(event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_deletion_requests_school ON public.account_deletion_requests(school_id, status);

-- 7. Row Level Security Policies
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auth_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_deletion_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_deletion_requests ENABLE ROW LEVEL SECURITY;

-- Staff Policies
CREATE POLICY "School Admin manages school staff"
ON public.staff
FOR ALL
USING (school_id = (auth.jwt() -> 'app_metadata' ->> 'school_id')::uuid);

CREATE POLICY "Staff can view their own profile"
ON public.staff
FOR SELECT
USING (auth_user_id = auth.uid());

-- Auth Events Policies
CREATE POLICY "Super Admin views all auth events"
ON public.auth_events
FOR SELECT
USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin');

CREATE POLICY "School Admin views their school auth events"
ON public.auth_events
FOR SELECT
USING (school_id = (auth.jwt() -> 'app_metadata' ->> 'school_id')::uuid);

-- Deletion Requests Policies
CREATE POLICY "Users can create and view their deletion requests"
ON public.account_deletion_requests
FOR ALL
USING (requested_by = auth.uid());

CREATE POLICY "School Admin reviews school deletion requests"
ON public.account_deletion_requests
FOR ALL
USING (school_id = (auth.jwt() -> 'app_metadata' ->> 'school_id')::uuid);

CREATE POLICY "Super Admin views all deletion requests"
ON public.account_deletion_requests
FOR ALL
USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin');
