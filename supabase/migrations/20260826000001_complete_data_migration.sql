-- 1. Create 14 NEW tables

-- staff_attendance
CREATE TABLE IF NOT EXISTS public.staff_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  attendance_date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'leave', 'partial')),
  remarks TEXT,
  marked_by UUID,
  marked_by_name TEXT,
  staff_name TEXT,
  staff_type TEXT,
  employee_number TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_staff_daily_attendance UNIQUE(school_id, staff_id, attendance_date)
);
CREATE INDEX IF NOT EXISTS idx_staff_attendance_school ON public.staff_attendance(school_id, attendance_date);

-- staff_leaves
CREATE TABLE IF NOT EXISTS public.staff_leaves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  leave_type TEXT NOT NULL DEFAULT 'full_day' CHECK (leave_type IN ('full_day', 'partial_day', 'sick', 'casual', 'earned', 'maternity', 'other')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  return_date DATE,
  reason TEXT NOT NULL,
  admin_notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID,
  reviewed_by_name TEXT,
  staff_name TEXT,
  staff_type TEXT,
  employee_number TEXT
);
CREATE INDEX IF NOT EXISTS idx_staff_leaves_school ON public.staff_leaves(school_id, staff_id);

-- student_charges
CREATE TABLE IF NOT EXISTS public.student_charges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  academic_year_id UUID REFERENCES public.academic_years(id) ON DELETE SET NULL,
  charge_name TEXT NOT NULL,
  description TEXT,
  amount NUMERIC(12,2) NOT NULL,
  paid_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  remaining_amount NUMERIC(12,2) NOT NULL,
  charge_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'unpaid' CHECK (status IN ('unpaid', 'partial', 'paid', 'waived', 'cancelled')),
  created_by UUID,
  created_by_name TEXT,
  waive_reason TEXT,
  student_name TEXT,
  registration_number TEXT,
  bulk_charge_batch_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_student_charges_school ON public.student_charges(school_id, student_id);

-- payment_receipts
CREATE TABLE IF NOT EXISTS public.payment_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  payment_id UUID,
  receipt_number TEXT NOT NULL,
  student_name_snapshot TEXT NOT NULL,
  registration_number_snapshot TEXT,
  class_snapshot TEXT,
  section_snapshot TEXT,
  roll_number_snapshot TEXT,
  academic_year_snapshot TEXT,
  school_name_snapshot TEXT NOT NULL,
  school_code_snapshot TEXT,
  school_address_snapshot TEXT,
  school_phone_snapshot TEXT,
  school_email_snapshot TEXT,
  school_logo_url_snapshot TEXT,
  subtotal NUMERIC(12,2) NOT NULL,
  discount NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(12,2) NOT NULL,
  amount_paid NUMERIC(12,2) NOT NULL,
  balance_after_payment NUMERIC(12,2) NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'upi', 'bank', 'cheque', 'other')),
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_time TEXT,
  reference_number TEXT,
  received_by_name_snapshot TEXT NOT NULL,
  received_by_id UUID,
  is_reversed BOOLEAN DEFAULT false,
  reversal_reason TEXT,
  reversed_at TIMESTAMPTZ,
  reversed_by_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_payment_receipts_school ON public.payment_receipts(school_id, student_id);

-- payment_receipt_items
CREATE TABLE IF NOT EXISTS public.payment_receipt_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_id UUID NOT NULL REFERENCES public.payment_receipts(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('tuition', 'transport', 'exam', 'charge', 'fine', 'discount', 'other')),
  item_reference_id UUID,
  description TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_receipt_items_receipt ON public.payment_receipt_items(receipt_id);

-- parent_profiles
CREATE TABLE IF NOT EXISTS public.parent_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  auth_user_id UUID,
  father_name TEXT,
  mother_name TEXT,
  guardian_name TEXT NOT NULL,
  primary_phone TEXT NOT NULL,
  secondary_phone TEXT,
  email TEXT NOT NULL,
  address TEXT,
  photo_url TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(school_id, email)
);
CREATE INDEX IF NOT EXISTS idx_parent_profiles_school ON public.parent_profiles(school_id);

-- parent_student_links
CREATE TABLE IF NOT EXISTS public.parent_student_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  parent_id UUID NOT NULL REFERENCES public.parent_profiles(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  relationship TEXT NOT NULL DEFAULT 'guardian' CHECK (relationship IN ('father', 'mother', 'guardian', 'other')),
  is_primary_guardian BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(school_id, parent_id, student_id)
);
CREATE INDEX IF NOT EXISTS idx_parent_links_student ON public.parent_student_links(student_id);
CREATE INDEX IF NOT EXISTS idx_parent_links_parent ON public.parent_student_links(parent_id);

-- admission_enquiries
CREATE TABLE IF NOT EXISTS public.admission_enquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  parent_name TEXT NOT NULL,
  primary_phone TEXT NOT NULL,
  secondary_phone TEXT,
  email TEXT,
  interested_class TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'walk_in' CHECK (source IN ('phone', 'walk_in', 'website', 'referral', 'other')),
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'visit_scheduled', 'visited', 'applied', 'enrolled', 'rejected', 'withdrawn')),
  assigned_to UUID,
  assigned_to_name TEXT,
  next_follow_up_at TIMESTAMPTZ,
  last_contacted_at TIMESTAMPTZ,
  created_by UUID,
  created_by_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_enquiries_school ON public.admission_enquiries(school_id, status);

-- app_notifications
CREATE TABLE IF NOT EXISTS public.app_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  recipient_user_id UUID NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON public.app_notifications(recipient_user_id, read_at);
CREATE INDEX IF NOT EXISTS idx_notifications_school ON public.app_notifications(school_id);

-- fee_structure_versions
CREATE TABLE IF NOT EXISTS public.fee_structure_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  fee_structure_id UUID NOT NULL REFERENCES public.fee_structures(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL,
  effective_from TEXT NOT NULL,
  effective_to TEXT,
  created_by UUID,
  created_by_name TEXT,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_fee_versions_structure ON public.fee_structure_versions(fee_structure_id);

-- bulk_charge_batches
CREATE TABLE IF NOT EXISTS public.bulk_charge_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  academic_year_id UUID REFERENCES public.academic_years(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('entire_school', 'selected_classes', 'specific_class', 'specific_section', 'selected_students')),
  target_label TEXT NOT NULL,
  target_class_id UUID,
  target_section_id UUID,
  charge_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  description TEXT,
  total_students INT NOT NULL DEFAULT 0,
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled')),
  cancelled_at TIMESTAMPTZ,
  cancelled_by UUID,
  created_by UUID,
  created_by_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_bulk_charges_school ON public.bulk_charge_batches(school_id);

-- student_followups
CREATE TABLE IF NOT EXISTS public.student_followups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'general' CHECK (type IN ('attendance', 'academic', 'fee', 'general')),
  note TEXT NOT NULL,
  contact_method TEXT NOT NULL DEFAULT 'call' CHECK (contact_method IN ('call', 'message', 'in_person', 'other')),
  contacted_parent_id UUID,
  contacted_person_name TEXT,
  next_follow_up_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved')),
  created_by UUID,
  created_by_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_followups_student ON public.student_followups(school_id, student_id);

-- academic_year_transition_batches
CREATE TABLE IF NOT EXISTS public.academic_year_transition_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  source_academic_year_id UUID NOT NULL,
  source_academic_year_name TEXT NOT NULL,
  target_academic_year_id UUID NOT NULL,
  target_academic_year_name TEXT NOT NULL,
  total_students INT NOT NULL DEFAULT 0,
  promoted_count INT NOT NULL DEFAULT 0,
  repeated_count INT NOT NULL DEFAULT 0,
  left_count INT NOT NULL DEFAULT 0,
  graduated_count INT NOT NULL DEFAULT 0,
  decisions JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL CHECK (status IN ('completed', 'reversed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by_name TEXT NOT NULL,
  created_by_id UUID,
  reversed_at TIMESTAMPTZ,
  reversed_by_name TEXT
);
CREATE INDEX IF NOT EXISTS idx_academic_transition_school ON public.academic_year_transition_batches(school_id);

-- recycle_bin_items
CREATE TABLE IF NOT EXISTS public.recycle_bin_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  school_name TEXT,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  entity_name TEXT NOT NULL,
  entity_details TEXT NOT NULL,
  original_data JSONB NOT NULL,
  deleted_by_name TEXT NOT NULL,
  deleted_by_role TEXT NOT NULL,
  deleted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  permanent_purge_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'in_bin' CHECK (status IN ('in_bin', 'restored', 'purged')),
  restored_at TIMESTAMPTZ,
  restored_by TEXT
);
CREATE INDEX IF NOT EXISTS idx_recycle_bin_school ON public.recycle_bin_items(school_id);

-- 2. ALTER existing tables to add missing columns

-- schools
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS admin_email TEXT;
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS admin_name TEXT;
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS admin_pin TEXT;
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS admin_pin_failed_attempts INT DEFAULT 0;
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS is_admin_pin_locked BOOLEAN DEFAULT false;
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS school_contact_phone TEXT;
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS school_contact_alternate TEXT;
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS enabled_features JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS security_question TEXT;
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS security_answer TEXT;

-- students
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS guardian JSONB;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS emergency_info JSONB;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS transfer_info JSONB;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS uses_class_monthly_fee BOOLEAN DEFAULT true;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS monthly_fee_amount NUMERIC(12,2);
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS apply_new_student_charges BOOLEAN DEFAULT true;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS sibling_student_ids JSONB DEFAULT '[]'::jsonb;

-- teachers
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS designation TEXT;
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS subjects JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS salary NUMERIC(12,2);
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS security_pin TEXT;
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS pin_failed_attempts INT DEFAULT 0;
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS is_pin_locked BOOLEAN DEFAULT false;

-- staff
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS driving_license_number TEXT;
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS driving_license_expiry DATE;
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS security_pin TEXT;
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS pin_failed_attempts INT DEFAULT 0;
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS is_pin_locked BOOLEAN DEFAULT false;

-- transport_routes
ALTER TABLE public.transport_routes ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.transport_routes ADD COLUMN IF NOT EXISTS assigned_vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL;
ALTER TABLE public.transport_routes ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- transport_stops
ALTER TABLE public.transport_stops ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
ALTER TABLE public.transport_stops ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;
ALTER TABLE public.transport_stops ADD COLUMN IF NOT EXISTS address TEXT;

-- timetable_entries
ALTER TABLE public.timetable_entries ADD COLUMN IF NOT EXISTS period_number INT;
ALTER TABLE public.timetable_entries ADD COLUMN IF NOT EXISTS period_name TEXT;
ALTER TABLE public.timetable_entries ADD COLUMN IF NOT EXISTS slot_type TEXT DEFAULT 'regular';
ALTER TABLE public.timetable_entries ADD COLUMN IF NOT EXISTS notes TEXT;

-- classes
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS room_id UUID;
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS class_teacher_id UUID;
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS common_monthly_fee NUMERIC(12,2);
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS monthly_fee_generation_day INT;
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS monthly_fee_due_day INT;
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS new_student_charges JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS next_class_id UUID;

-- fee_structures
ALTER TABLE public.fee_structures ADD COLUMN IF NOT EXISTS class_id UUID;
ALTER TABLE public.fee_structures ADD COLUMN IF NOT EXISTS section_id UUID;
ALTER TABLE public.fee_structures ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.fee_structures ADD COLUMN IF NOT EXISTS applies_to TEXT;
ALTER TABLE public.fee_structures ADD COLUMN IF NOT EXISTS fee_type TEXT;

-- 3. Enable RLS and add tenant isolation policies for ALL new tables

DO $$ 
DECLARE
    tbl text;
BEGIN
    FOR tbl IN 
        SELECT unnest(ARRAY[
            'staff_attendance',
            'staff_leaves',
            'student_charges',
            'payment_receipts',
            'payment_receipt_items',
            'parent_profiles',
            'parent_student_links',
            'admission_enquiries',
            'app_notifications',
            'fee_structure_versions',
            'bulk_charge_batches',
            'student_followups',
            'academic_year_transition_batches',
            'recycle_bin_items'
        ])
    LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl);
        
        EXECUTE format('DROP POLICY IF EXISTS "Service role bypass for %I" ON public.%I;', tbl, tbl);
        EXECUTE format('
            CREATE POLICY "Service role bypass for %I"
            ON public.%I
            FOR ALL
            TO service_role
            USING (true)
            WITH CHECK (true);
        ', tbl, tbl);

        EXECUTE format('DROP POLICY IF EXISTS "Tenant isolation for %I" ON public.%I;', tbl, tbl);

        IF tbl = 'payment_receipt_items' THEN
            EXECUTE format('
                CREATE POLICY "Tenant isolation for %I"
                ON public.%I
                FOR ALL
                TO authenticated
                USING (
                    receipt_id IN (
                        SELECT id FROM public.payment_receipts 
                        WHERE school_id = (SELECT school_id FROM public.profiles WHERE auth_user_id = auth.uid() LIMIT 1)
                    )
                )
                WITH CHECK (
                    receipt_id IN (
                        SELECT id FROM public.payment_receipts 
                        WHERE school_id = (SELECT school_id FROM public.profiles WHERE auth_user_id = auth.uid() LIMIT 1)
                    )
                );
            ', tbl, tbl);
        ELSE
            EXECUTE format('
                CREATE POLICY "Tenant isolation for %I"
                ON public.%I
                FOR ALL
                TO authenticated
                USING (school_id = (SELECT school_id FROM public.profiles WHERE auth_user_id = auth.uid() LIMIT 1))
                WITH CHECK (school_id = (SELECT school_id FROM public.profiles WHERE auth_user_id = auth.uid() LIMIT 1));
            ', tbl, tbl);
        END IF;
    END LOOP;
END $$;


-- Add service_role bypass policies for ALL existing tables that already have RLS enabled
DO $$ 
DECLARE
    tbl text;
BEGIN
    FOR tbl IN 
        SELECT unnest(ARRAY[
            'schools',
            'profiles',
            'academic_years',
            'classes',
            'sections',
            'subjects',
            'students',
            'teachers',
            'staff',
            'transport_routes',
            'transport_stops',
            'vehicles',
            'timetable_entries',
            'fee_structures',
            'holidays',
            'notices',
            'attendance',
            'exams',
            'exam_results',
            'fees',
            'fee_payments',
            'events'
        ])
    LOOP
        IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = tbl) THEN
            EXECUTE format('DROP POLICY IF EXISTS "Service role bypass for %I" ON public.%I;', tbl, tbl);
            EXECUTE format('
                CREATE POLICY "Service role bypass for %I" 
                ON public.%I FOR ALL TO service_role USING (true) WITH CHECK (true);
            ', tbl, tbl);
        END IF;
    END LOOP;
END $$;

