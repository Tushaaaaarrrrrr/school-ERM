-- ============================================================================
-- School ERP Seed Dataset (Realistic Multi-Tenant Demonstration Data)
-- ============================================================================

-- School 1: Delhi Public Academy (DPA01)
INSERT INTO public.schools (id, name, code, email, phone, address, timezone, status)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'Delhi Public Academy',
    'DPA01',
    'admin@dpa-delhi.edu.in',
    '+91 98765 43210',
    'Sector 14, Rohini, New Delhi, 110085',
    'Asia/Kolkata',
    'active'
) ON CONFLICT (code) DO NOTHING;

-- School 2: Greenwood International School (GWI02)
INSERT INTO public.schools (id, name, code, email, phone, address, timezone, status)
VALUES (
    'a0000000-0000-0000-0000-000000000002',
    'Greenwood International School',
    'GWI02',
    'info@greenwood.edu.in',
    '+91 98111 22334',
    'Whitefield, Bangalore, Karnataka, 560066',
    'Asia/Kolkata',
    'active'
) ON CONFLICT (code) DO NOTHING;

-- Academic Year for DPA
INSERT INTO public.academic_years (id, school_id, name, start_date, end_date, is_current, status)
VALUES (
    'b0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    '2026-27',
    '2026-04-01',
    '2027-03-31',
    true,
    'active'
) ON CONFLICT DO NOTHING;

-- Classes for DPA
INSERT INTO public.classes (id, school_id, name, sort_order, status) VALUES
('c0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001', 'Class 6', 6, 'active'),
('c0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000001', 'Class 7', 7, 'active'),
('c0000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000001', 'Class 8', 8, 'active'),
('c0000000-0000-0000-0000-000000000009', 'a0000000-0000-0000-0000-000000000001', 'Class 9', 9, 'active'),
('c0000000-0000-0000-0000-000000000010', 'a0000000-0000-0000-0000-000000000001', 'Class 10', 10, 'active')
ON CONFLICT DO NOTHING;

-- Sections for Class 8
INSERT INTO public.sections (id, school_id, class_id, name, status) VALUES
('d0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000008', 'A', 'active'),
('d0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000008', 'B', 'active')
ON CONFLICT DO NOTHING;

-- Subjects
INSERT INTO public.subjects (id, school_id, name, code, status) VALUES
('e0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Mathematics', 'MATH-08', 'active'),
('e0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Science', 'SCI-08', 'active'),
('e0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'English', 'ENG-08', 'active'),
('e0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'Social Science', 'SST-08', 'active'),
('e0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'Computer Science', 'CS-08', 'active')
ON CONFLICT DO NOTHING;

-- Teachers
INSERT INTO public.teachers (id, school_id, employee_number, first_name, last_name, phone, email, status) VALUES
('f0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'EMP-101', 'Rajesh', 'Sharma', '+91 98711 00101', 'rajesh.sharma@dpa-delhi.edu.in', 'active'),
('f0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'EMP-102', 'Sunita', 'Verma', '+91 98711 00102', 'sunita.verma@dpa-delhi.edu.in', 'active')
ON CONFLICT DO NOTHING;

-- Fee Structure (₹2,000 / month)
INSERT INTO public.fee_structures (id, school_id, academic_year_id, name, amount, billing_frequency, due_day, status)
VALUES (
    'fe000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    'Monthly Tuition Fee',
    2000.00,
    'monthly',
    10,
    'active'
) ON CONFLICT DO NOTHING;
