-- ============================================================================
-- Migration: People Management, Salary History, Rooms, Transport & Driver Portal
-- Date: 2026-08-23
-- ============================================================================

-- 1. School Rooms
CREATE TABLE IF NOT EXISTS public.school_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  room_number VARCHAR(50) NOT NULL,
  building VARCHAR(100),
  floor VARCHAR(50),
  type VARCHAR(50) NOT NULL DEFAULT 'classroom' CHECK (type IN ('classroom', 'lab', 'library', 'office', 'activity_room', 'other')),
  capacity INT DEFAULT 40,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_school_rooms_school ON public.school_rooms(school_id);

-- 2. Extend Sections with Classroom & Class Teacher
ALTER TABLE public.sections ADD COLUMN IF NOT EXISTS room_id UUID REFERENCES public.school_rooms(id) ON DELETE SET NULL;
ALTER TABLE public.sections ADD COLUMN IF NOT EXISTS class_teacher_id UUID REFERENCES public.teachers(id) ON DELETE SET NULL;

-- 3. Employee Salary History (Preserves previous compensation levels)
CREATE TABLE IF NOT EXISTS public.employee_salary_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL,
  employee_type VARCHAR(20) NOT NULL CHECK (employee_type IN ('teacher', 'staff')),
  amount DECIMAL(12, 2) NOT NULL,
  effective_from DATE NOT NULL,
  effective_to DATE,
  reason VARCHAR(255),
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_emp_salary_hist_school ON public.employee_salary_history(school_id, employee_id);

-- 4. Unified Employee Payments / Payroll
CREATE TABLE IF NOT EXISTS public.employee_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL,
  employee_name VARCHAR(150) NOT NULL,
  employee_type VARCHAR(20) NOT NULL CHECK (employee_type IN ('teacher', 'staff')),
  designation VARCHAR(100) NOT NULL,
  billing_month VARCHAR(20) NOT NULL, -- e.g. '2026-08'
  amount DECIMAL(12, 2) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'partial')),
  payment_date DATE,
  payment_method VARCHAR(50) DEFAULT 'bank',
  reference_number VARCHAR(100),
  notes TEXT,
  recorded_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_employee_payments_school ON public.employee_payments(school_id, billing_month);

-- 5. Vehicles
CREATE TABLE IF NOT EXISTS public.vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  vehicle_name VARCHAR(100) NOT NULL,
  vehicle_number VARCHAR(50) NOT NULL,
  vehicle_type VARCHAR(50) NOT NULL DEFAULT 'bus' CHECK (vehicle_type IN ('bus', 'van', 'auto', 'other')),
  capacity INT NOT NULL DEFAULT 40,
  driver_id UUID REFERENCES public.staff(id) ON DELETE SET NULL,
  helper_id UUID REFERENCES public.staff(id) ON DELETE SET NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vehicles_school ON public.vehicles(school_id);

-- 6. Transport Routes & Stops
CREATE TABLE IF NOT EXISTS public.transport_routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  route_name VARCHAR(100) NOT NULL,
  route_code VARCHAR(50) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.transport_stops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  route_id UUID NOT NULL REFERENCES public.transport_routes(id) ON DELETE CASCADE,
  stop_name VARCHAR(150) NOT NULL,
  stop_order INT NOT NULL DEFAULT 1,
  estimated_pickup_time TIME NOT NULL,
  estimated_drop_time TIME,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transport_stops_route ON public.transport_stops(route_id, stop_order);

-- 7. Student Transport Assignments
CREATE TABLE IF NOT EXISTS public.student_transport_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  route_id UUID NOT NULL REFERENCES public.transport_routes(id) ON DELETE CASCADE,
  stop_id UUID NOT NULL REFERENCES public.transport_stops(id) ON DELETE CASCADE,
  pickup_enabled BOOLEAN NOT NULL DEFAULT true,
  drop_enabled BOOLEAN NOT NULL DEFAULT true,
  academic_year_id UUID,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'paused')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_student_trans_assign ON public.student_transport_assignments(student_id, vehicle_id);

-- 8. Student Transport Events (Real-time pickup logs)
CREATE TABLE IF NOT EXISTS public.student_transport_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  transport_assignment_id UUID REFERENCES public.student_transport_assignments(id) ON DELETE SET NULL,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  route_id UUID REFERENCES public.transport_routes(id) ON DELETE SET NULL,
  stop_id UUID REFERENCES public.transport_stops(id) ON DELETE SET NULL,
  event_type VARCHAR(20) NOT NULL CHECK (event_type IN ('picked_up', 'dropped_off', 'not_riding', 'missed')),
  event_date DATE NOT NULL DEFAULT CURRENT_DATE,
  event_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  recorded_by UUID,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_student_trans_events_student ON public.student_transport_events(student_id, event_date);
CREATE INDEX IF NOT EXISTS idx_student_trans_events_vehicle ON public.student_transport_events(vehicle_id, event_date);

-- 9. Attendance Table Extensions
ALTER TABLE public.student_attendance ADD COLUMN IF NOT EXISTS marked_at TIMESTAMPTZ;
ALTER TABLE public.student_attendance ADD COLUMN IF NOT EXISTS marked_by_name VARCHAR(150);

-- 10. Staff Table Extensions
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS department VARCHAR(100);
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS salary DECIMAL(12, 2) DEFAULT 0;
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS portal_access BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS custom_staff_type VARCHAR(100);
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS license_number VARCHAR(100);
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS license_expiry DATE;
