-- ============================================================================
-- Migration: Temporary Work Coverage Assignments & Employee Salary Adjustments
-- Date: 2026-08-26
-- ============================================================================

-- 1. Temporary Assignments Table
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

-- 2. Employee Salary Adjustments Table (Reimbursements & Deductions)
CREATE TABLE IF NOT EXISTS public.employee_salary_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL,
  employee_name VARCHAR(150),
  employee_role VARCHAR(50) NOT NULL,
  adjustment_type VARCHAR(20) NOT NULL CHECK (adjustment_type IN ('reimbursement', 'deduction')),
  reason VARCHAR(255) NOT NULL,
  amount DECIMAL(12, 2) NOT NULL CHECK (amount >= 0),
  effective_date DATE NOT NULL,
  billing_month VARCHAR(20), -- e.g. '2026-08'
  temporary_assignment_id UUID REFERENCES public.temporary_assignments(id) ON DELETE SET NULL,
  temporary_assignment_label VARCHAR(255),
  notes TEXT,
  created_by UUID,
  created_by_name VARCHAR(150),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_emp_sal_adj_school ON public.employee_salary_adjustments(school_id);
CREATE INDEX IF NOT EXISTS idx_emp_sal_adj_employee ON public.employee_salary_adjustments(school_id, employee_id);
CREATE INDEX IF NOT EXISTS idx_emp_sal_adj_temp_assign ON public.employee_salary_adjustments(temporary_assignment_id);
CREATE INDEX IF NOT EXISTS idx_emp_sal_adj_month ON public.employee_salary_adjustments(school_id, billing_month);

-- 3. Row-Level Security (RLS)
ALTER TABLE public.temporary_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_salary_adjustments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "temporary_assignments_school_isolation"
  ON public.temporary_assignments
  FOR ALL
  USING (
    school_id IN (
      SELECT school_id FROM public.school_memberships
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "employee_salary_adjustments_school_isolation"
  ON public.employee_salary_adjustments
  FOR ALL
  USING (
    school_id IN (
      SELECT school_id FROM public.school_memberships
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );
