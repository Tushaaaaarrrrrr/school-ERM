// ============================================================================
// Core TypeScript Definitions for School ERP (People, Rooms, Transport & Payroll)
// ============================================================================

export type UserRole =
  | 'super_admin'
  | 'school_admin'
  | 'teacher'
  | 'student'
  | 'staff'
  | 'driver'
  | 'accountant'
  | 'parent'
  | 'unassigned';

export type SchoolStatus = 'active' | 'suspended' | 'pending_deletion' | 'deleted';
export type GeneralStatus = 'active' | 'inactive' | 'archived' | 'closed';
export type InvoiceStatus = 'pending' | 'partial' | 'paid' | 'overdue' | 'waived' | 'cancelled';
export type PaymentMethod = 'cash' | 'upi' | 'card' | 'bank_transfer' | 'bank' | 'cheque' | 'other';
export type ExamStatus = 'draft' | 'published';
export type BillingFrequency = 'monthly' | 'quarterly' | 'annually' | 'one_time';

export type AttendanceStatus = 'present' | 'absent' | 'leave' | 'partial';
export type LeaveType = 'full_day' | 'partial_day';
export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';
export type TeacherPaymentStatus = 'pending' | 'paid' | 'partial';
export type NoticeAudience = 'everyone' | 'students' | 'teachers' | 'staff' | 'parents';

// ----------------------------------------------------------------------------
// Staff Types & Permissions
// ----------------------------------------------------------------------------

export type StaffType =
  | 'accountant'
  | 'receptionist'
  | 'office_staff'
  | 'librarian'
  | 'driver'
  | 'transport_manager'
  | 'security'
  | 'caretaker'
  | 'cleaning_staff'
  | 'sweeper'
  | 'peon'
  | 'lab_assistant'
  | 'it_staff'
  | 'nurse'
  | 'counsellor'
  | 'cook'
  | 'helper'
  | 'other'
  | string;

export type StaffPermission =
  | 'view_fees'
  | 'record_student_payment'
  | 'view_all_collections'
  | 'view_teacher_payments'
  | 'view_students'
  | 'create_student'
  | 'edit_student'
  | 'view_parent_contact'
  | 'manage_attendance'
  | 'view_notices'
  | 'manage_inventory'
  | 'manage_transport'
  | 'record_pickup'
  | 'view_payroll'
  | 'manage_payroll'
  | 'manage_enquiries';

export interface Staff {
  id: string;
  school_id: string;
  auth_user_id?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  staff_type: StaffType;
  custom_staff_type?: string;
  custom_type_name?: string;
  department?: string;
  employee_number?: string;
  joining_date: string;
  photo_url?: string;
  salary?: number;
  portal_access: boolean;
  status: GeneralStatus;
  permissions: StaffPermission[];
  license_number?: string;
  driving_license_number?: string;
  license_expiry?: string;
  driving_license_expiry?: string;
  security_pin?: string;
  pin_failed_attempts?: number;
  is_pin_locked?: boolean;
  created_at: string;
  updated_at: string;
}

// ----------------------------------------------------------------------------
// Authentication & Security Event Logs
// ----------------------------------------------------------------------------

export type AuthEventType =
  | 'login_success'
  | 'login_failure'
  | 'google_login_success'
  | 'unregistered_google_login'
  | 'logout'
  | 'rate_limited'
  | 'password_reset'
  | 'account_suspended_login'
  | 'user_deletion_attempt'
  | 'school_suspension_attempt'
  | 'school_deletion_attempt'
  | 'student_updated'
  | 'teacher_updated'
  | 'teacher_salary_changed'
  | 'staff_updated'
  | 'staff_permission_changed'
  | 'transport_event_recorded'
  | 'fee_payment_recorded'
  | 'fee_payment_reversed'
  | 'student_charge_added'
  | 'fee_structure_changed'
  | 'bulk_charge_created'
  | 'bulk_charge_cancelled'
  | 'academic_session_transition_completed'
  | 'academic_session_transition_reversed'
  | 'entity_moved_to_recycle_bin'
  | 'entity_restored_from_recycle_bin'
  | 'pin_verification_success'
  | 'pin_verification_failed'
  | 'pin_account_locked'
  | 'pin_account_unlocked'
  | 'temporary_assignment_created'
  | 'temporary_assignment_updated'
  | 'salary_adjustment_created'
  | 'salary_adjustment_deleted'
  | 'csv_export_generated';

export interface AuthEvent {
  id: string;
  school_id?: string;
  school_name?: string;
  user_id?: string;
  email?: string;
  registration_identifier?: string;
  event_type: AuthEventType;
  success: boolean;
  role?: UserRole;
  user_name?: string;
  ip_hash?: string;
  user_agent?: string;
  platform?: string;
  details?: Record<string, unknown>;
  created_at: string;
}

// ----------------------------------------------------------------------------
// Account Deletion Requests
// ----------------------------------------------------------------------------

export type DeletionRequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled' | 'completed';

export interface AccountDeletionRequest {
  id: string;
  school_id?: string;
  school_name?: string;
  user_id: string;
  user_role: UserRole;
  user_name: string;
  user_email?: string;
  requested_by: string;
  request_reason?: string;
  status: DeletionRequestStatus;
  reviewed_by?: string;
  reviewed_by_name?: string;
  review_reason?: string;
  requested_at: string;
  reviewed_at?: string;
  completed_at?: string;
}

export interface SchoolDeletionRequest {
  id: string;
  school_id: string;
  school_name: string;
  requested_by: string;
  requested_by_name: string;
  reason: string;
  grace_period_days: number;
  scheduled_deletion_date: string;
  status: 'pending_deletion' | 'cancelled' | 'completed';
  cancelled_by?: string;
  cancellation_reason?: string;
  created_at: string;
  cancelled_at?: string;
  completed_at?: string;
}

export interface SchoolAccessRequest {
  id: string;
  user_email: string;
  user_name: string;
  user_photo?: string;
  school_id: string;
  school_name: string;
  school_code: string;
  phone?: string;
  applicant_notes?: string;
  assigned_role?: UserRole;
  assigned_designation?: string;
  assigned_department?: string;
  assigned_pin?: string;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string;
  created_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
}

export interface RecycleBinItem {
  id: string;
  school_id?: string;
  school_name?: string;
  entity_type:
    | 'school'
    | 'student'
    | 'teacher'
    | 'staff'
    | 'room'
    | 'vehicle'
    | 'route'
    | 'holiday'
    | 'notice'
    | 'class'
    | 'subject';
  entity_id: string;
  entity_name: string;
  entity_details: string;
  original_data: any;
  deleted_by_name: string;
  deleted_by_role: UserRole;
  deleted_at: string;
  permanent_purge_at: string;
  status: 'in_bin' | 'restored' | 'purged';
  restored_at?: string;
  restored_by?: string;
}

// Modular feature keys controlled by Super Admin per school
export type SchoolFeatureKey =
  | 'students'
  | 'teachers'
  | 'staff'
  | 'attendance'
  | 'teacher_attendance'
  | 'timetable'
  | 'academics'
  | 'fees'
  | 'payroll'
  | 'exams'
  | 'transport'
  | 'reception'
  | 'notices'
  | 'parent_portal'
  | 'recycle_bin'
  | 'security_logs';

export type SchoolFeatureCategory = 'core' | 'academics' | 'finance' | 'operations' | 'governance';

export interface SchoolFeatureDefinition {
  key: SchoolFeatureKey;
  name: string;
  category: SchoolFeatureCategory;
  description: string;
  defaultEnabled: boolean;
  required?: boolean;
}

export interface School {
  id: string;
  name: string;
  code: string;
  email: string;
  phone: string;
  school_contact_phone?: string;
  school_contact_alternate?: string;
  website?: string;
  address?: string;
  logo_url?: string;
  profile_photo_max_mb?: number;
  pending_deletion_until?: string;
  admin_email?: string;
  admin_name?: string;
  admin_pin?: string; // 5-digit PIN configured strictly by Super Admin
  admin_pin_failed_attempts?: number;
  is_admin_pin_locked?: boolean;
  security_question?: string;
  security_answer?: string;
  timezone: string;
  school_hours?: SchoolHours;
  weekly_timings?: SchoolHours;
  enabled_features?: SchoolFeatureKey[]; // Feature modules provisioned by Super Admin
  status: SchoolStatus;
  created_at: string;
  updated_at: string;
  student_count?: number;
  teacher_count?: number;
  staff_count?: number;
}

export type SchoolDayKey = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export type SchoolHours = Record<SchoolDayKey, {
  is_open: boolean;
  start_time: string;
  end_time: string;
}>;

export interface Profile {
  id: string;
  auth_user_id?: string;
  school_id?: string;
  login_id?: string;
  role: UserRole;
  display_name: string;
  phone?: string;
  email?: string;
  photo_url?: string;
  security_pin?: string;
  pin_failed_attempts?: number;
  is_pin_locked?: boolean;
  require_password_change?: boolean;
  status: GeneralStatus;
  created_at: string;
  updated_at: string;
}

export interface AcademicYear {
  id: string;
  school_id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  status: 'active' | 'inactive' | 'draft' | 'closed';
  created_at: string;
}

// ----------------------------------------------------------------------------
// School Rooms & Classrooms
// ----------------------------------------------------------------------------

export type RoomType = 'classroom' | 'lab' | 'library' | 'office' | 'activity_room' | 'other';

export interface SchoolRoom {
  id: string;
  school_id: string;
  name: string;
  room_number: string;
  building?: string;
  floor?: string;
  type: RoomType;
  capacity: number;
  status: GeneralStatus;
  created_at: string;
}

export interface SchoolClass {
  id: string;
  school_id: string;
  name: string;
  sort_order: number;
  status: GeneralStatus;
  default_room_number?: string;
  room_id?: string;
  room_name?: string;
  class_teacher_id?: string;
  class_teacher_name?: string;
  common_monthly_fee?: number;
  monthly_fee_generation_day?: number;
  monthly_fee_due_day?: number;
  new_student_charges?: ClassFeeItem[];
  next_class_id?: string;
  next_class_name?: string;
  created_at: string;
  sections?: Section[];
}

export interface ClassFeeItem {
  id: string;
  name: string;
  amount: number;
  status: 'active' | 'inactive';
}

export interface Section {
  id: string;
  school_id: string;
  class_id: string;
  name: string;
  status: GeneralStatus;
  room_id?: string;
  room_name?: string;
  room_number?: string;
  class_teacher_id?: string;
  class_teacher_name?: string;
  created_at: string;
  class_name?: string;
}

export interface Subject {
  id: string;
  school_id: string;
  name: string;
  code?: string;
  status: GeneralStatus;
  created_at: string;
}

// ----------------------------------------------------------------------------
// Teachers, Assignments & Salary History
// ----------------------------------------------------------------------------

export interface TeacherAssignment {
  id: string;
  school_id: string;
  academic_year_id: string;
  teacher_id: string;
  class_id: string;
  section_id: string;
  subject_id: string;
  teacher_name?: string;
  class_name?: string;
  section_name?: string;
  subject_name?: string;
  room_number?: string;
  created_at: string;
}

export interface EmployeeSalaryHistory {
  id: string;
  school_id: string;
  employee_id: string;
  employee_type: 'teacher' | 'staff';
  amount: number;
  effective_from: string;
  effective_to?: string | null;
  reason?: string;
  created_by?: string;
  created_at: string;
}

export interface Teacher {
  id: string;
  school_id: string;
  auth_user_id?: string;
  first_name: string;
  last_name: string;
  employee_number: string;
  phone: string;
  email: string;
  joining_date: string;
  photo_url?: string;
  designation?: string;
  subjects?: string[];
  assigned_classes?: { class_name: string; section_name?: string }[];
  monthly_salary?: number;
  salary?: number;
  security_pin?: string;
  pin_failed_attempts?: number;
  is_pin_locked?: boolean;
  status: GeneralStatus;
  created_at: string;
  assignments?: TeacherAssignment[];
  salary_history?: EmployeeSalaryHistory[];
}

// ----------------------------------------------------------------------------
// Students, Guardians & Enrollments
// ----------------------------------------------------------------------------

export interface StudentGuardian {
  father_name?: string;
  mother_name?: string;
  guardian_name?: string;
  primary_phone: string;
  secondary_phone?: string;
  email?: string;
  address?: string;
}

export interface StudentEnrollment {
  id: string;
  school_id: string;
  student_id: string;
  academic_year_id: string;
  class_id: string;
  section_id: string;
  roll_number?: string;
  joined_at: string;
  status: GeneralStatus;
  class_name?: string;
  section_name?: string;
  room_number?: string;
  class_teacher_name?: string;
  academic_year_name?: string;
  created_at: string;
}

export interface StudentEmergencyInfo {
  blood_group?: string;
  allergies_alert?: string;
  medical_condition_note?: string;
  medication_note?: string;
  emergency_contact_name: string;
  emergency_contact_relationship: string;
  emergency_contact_phone: string;
  doctor_clinic_contact?: string;
  visible_to_teachers: boolean;
  visible_to_transport: boolean;
  updated_at?: string;
  updated_by_name?: string;
}

export interface StudentTransferInfo {
  previous_school_name: string;
  previous_class: string;
  previous_marks_or_grade: string;
  transfer_reason: string;
}

export interface StudentLeave {
  id: string;
  school_id: string;
  student_id: string;
  academic_year_id?: string;
  leave_type: LeaveType;
  start_date: string;
  end_date: string;
  partial_start_time?: string;
  partial_end_time?: string;
  reason: string;
  notes?: string;
  requested_by_type?: 'student' | 'parent' | 'teacher' | 'school_admin';
  requested_by_user_id?: string;
  requested_by_name?: string;
  parent_confirmation_required?: boolean;
  parent_confirmed_at?: string;
  parent_confirmed_by?: string;
  status: LeaveStatus;
  approved_by?: string;
  approved_by_name?: string;
  approved_at?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at?: string;
  student_name?: string;
  registration_number?: string;
  class_name?: string;
  section_name?: string;
  roll_number?: string;
}

export interface StudentSiblingInfo {
  id: string;
  first_name: string;
  last_name: string;
  registration_number: string;
  date_of_birth?: string;
  gender?: 'male' | 'female' | 'other';
  class_name?: string;
  section_name?: string;
  roll_number?: string;
  photo_url?: string;
  status?: GeneralStatus;
  guardian?: StudentGuardian;
}

export interface Student {
  id: string;
  school_id: string;
  auth_user_id?: string;
  first_name: string;
  last_name: string;
  registration_number: string;
  date_of_birth?: string;
  gender?: 'male' | 'female' | 'other';
  joining_date: string;
  photo_url?: string;
  status: GeneralStatus;
  created_at: string;
  guardian?: StudentGuardian;
  emergency_info?: StudentEmergencyInfo;
  is_transferred_student?: boolean;
  transfer_info?: StudentTransferInfo;
  current_enrollment?: StudentEnrollment;
  enrollments?: StudentEnrollment[];
  fee_invoices?: StudentFeeInvoice[];
  active_leave?: StudentLeave | null;
  transport_assignment?: StudentTransportAssignment;
  progression_status?: 'ready' | 'repeat' | 'left_school' | 'transferred' | 'graduated' | 'pending';
  academic_status_note?: string;
  uses_class_monthly_fee?: boolean;
  monthly_fee_amount?: number;
  apply_new_student_charges?: boolean;
  sibling_student_ids?: string[];
  siblings?: StudentSiblingInfo[];
}

// ----------------------------------------------------------------------------
// Attendance & Holidays
// ----------------------------------------------------------------------------

export interface SchoolHoliday {
  id: string;
  school_id: string;
  academic_year_id?: string;
  name: string;
  start_date: string;
  end_date: string;
  reason?: string;
  description?: string;
  created_by?: string;
  created_at: string;
}

export interface StudentAttendance {
  id: string;
  school_id: string;
  academic_year_id?: string;
  student_id: string;
  class_id: string;
  section_id: string;
  attendance_date: string;
  status: AttendanceStatus;
  remarks?: string;
  marked_at?: string;
  marked_by?: string;
  marked_by_name?: string;
  recorded_by?: string;
  created_at: string;
  updated_at?: string;
  student_name?: string;
  registration_number?: string;
  roll_number?: string;
  class_name?: string;
  section_name?: string;
}

export interface TeacherAttendance {
  id: string;
  school_id: string;
  teacher_id: string;
  attendance_date: string;
  status: AttendanceStatus;
  remarks?: string;
  marked_by?: string;
  marked_by_name?: string;
  created_at: string;
  updated_at?: string;
  teacher_name?: string;
  employee_number?: string;
}

export interface TeacherLeave {
  id: string;
  school_id: string;
  teacher_id: string;
  leave_type: LeaveType;
  start_date: string;
  end_date: string;
  return_date: string;
  reason: string;
  admin_notes?: string;
  status: LeaveStatus;
  requested_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
  reviewed_by_name?: string;
  teacher_name?: string;
  employee_number?: string;
}

export interface StaffAttendance {
  id: string;
  school_id: string;
  staff_id: string;
  attendance_date: string;
  status: AttendanceStatus;
  remarks?: string;
  marked_by?: string;
  marked_by_name?: string;
  created_at: string;
  updated_at?: string;
  staff_name?: string;
  staff_type?: string;
  employee_number?: string;
}

export interface StaffLeave {
  id: string;
  school_id: string;
  staff_id: string;
  leave_type: LeaveType;
  start_date: string;
  end_date: string;
  return_date: string;
  reason: string;
  admin_notes?: string;
  status: LeaveStatus;
  requested_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
  reviewed_by_name?: string;
  staff_name?: string;
  staff_type?: string;
  employee_number?: string;
}

// ----------------------------------------------------------------------------
// Employee Compensation & Payroll
// ----------------------------------------------------------------------------
// Temporary Assignments (Leave & Work Coverage)
// ----------------------------------------------------------------------------

export type TemporaryAssignmentType =
  | 'class_attendance_coverage'
  | 'subject_coverage'
  | 'transport_route_coverage'
  | 'other_duty_coverage'
  | string;

export type TemporaryAssignmentStatus = 'active' | 'completed' | 'cancelled';

export interface TemporaryAssignment {
  id: string;
  school_id: string;
  absent_employee_id: string;
  absent_employee_name: string;
  absent_employee_role: 'teacher' | 'staff' | 'driver' | UserRole | string;
  replacement_employee_id: string;
  replacement_employee_name: string;
  replacement_employee_role: 'teacher' | 'staff' | 'driver' | UserRole | string;
  assignment_type: TemporaryAssignmentType;
  start_date: string; // YYYY-MM-DD
  end_date: string;   // YYYY-MM-DD
  status: TemporaryAssignmentStatus;
  duty_details: string;
  notes?: string | null;
  is_emergency_override?: boolean;
  override_reason?: string | null;
  created_by?: string;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
}

// ----------------------------------------------------------------------------
// Employee Salary Adjustments (Reimbursements & Deductions)
// ----------------------------------------------------------------------------

export type SalaryAdjustmentType = 'reimbursement' | 'deduction';

export interface EmployeeSalaryAdjustment {
  id: string;
  school_id: string;
  employee_id: string;
  employee_name?: string;
  employee_role: 'teacher' | 'staff' | 'driver' | UserRole | string;
  adjustment_type: SalaryAdjustmentType;
  reason: string;
  amount: number;
  effective_date: string; // YYYY-MM-DD
  billing_month?: string; // e.g. "2026-08"
  temporary_assignment_id?: string | null;
  temporary_assignment_label?: string | null;
  notes?: string | null;
  created_by?: string;
  created_by_name?: string;
  created_at: string;
  updated_at?: string;
}

export interface EmployeePayment {
  id: string;
  school_id: string;
  employee_id: string;
  employee_name: string;
  employee_number?: string;
  employee_type: 'teacher' | 'staff';
  designation: string;
  department?: string;
  billing_month: string; // e.g. "2026-08"
  amount: number; // Final net payable amount
  base_salary?: number;
  total_reimbursements?: number;
  total_deductions?: number;
  status: 'pending' | 'paid' | 'partial';
  payment_date?: string;
  payment_method?: PaymentMethod;
  reference_number?: string;
  notes?: string;
  recorded_by?: string;
  created_at: string;
}

export interface TeacherPayment {
  id: string;
  school_id: string;
  teacher_id: string;
  billing_month: string;
  amount: number;
  base_salary?: number;
  total_reimbursements?: number;
  total_deductions?: number;
  status: TeacherPaymentStatus;
  payment_date: string;
  payment_method: PaymentMethod;
  reference_number?: string;
  notes?: string;
  recorded_by?: string;
  created_at: string;
  teacher_name?: string;
  employee_number?: string;
  monthly_salary?: number;
}

// ----------------------------------------------------------------------------
// Transport Architecture
// ----------------------------------------------------------------------------

export interface Vehicle {
  id: string;
  school_id: string;
  vehicle_name: string;
  vehicle_number: string;
  vehicle_type?: 'bus' | 'van' | 'auto' | 'other';
  type?: 'bus' | 'van' | 'auto' | 'other';
  capacity: number;
  driver_id?: string;
  driver_name?: string;
  driver_phone?: string;
  helper_id?: string;
  helper_name?: string;
  status: 'active' | 'maintenance' | 'inactive';
  created_at: string;
}

export interface TransportRoute {
  id: string;
  school_id: string;
  route_name: string;
  route_code: string;
  city?: string;
  city_zone?: string;
  description?: string;
  stops?: TransportStop[];
  assigned_vehicle_id?: string;
  assigned_vehicle_name?: string;
  status?: 'active' | 'inactive';
  created_at: string;
}

export interface TransportStop {
  id: string;
  school_id: string;
  route_id: string;
  stop_name: string;
  city?: string;
  landmark?: string;
  latitude?: number;
  longitude?: number;
  stop_order: number;
  estimated_pickup_time: string;
  estimated_drop_time?: string;
  created_at: string;
}

export interface StudentTransportAssignment {
  id: string;
  school_id: string;
  student_id: string;
  vehicle_id: string;
  route_id: string;
  stop_id: string;
  city?: string;
  pickup_enabled: boolean;
  drop_enabled: boolean;
  academic_year_id?: string;
  status: 'active' | 'inactive' | 'paused';
  vehicle_name?: string;
  vehicle_number?: string;
  route_name?: string;
  stop_name?: string;
  drop_stop_name?: string;
  driver_name?: string;
  driver_phone?: string;
  driver_photo_url?: string;
  estimated_pickup_time?: string;
  created_at: string;
}

export interface StudentTransportEvent {
  id: string;
  school_id: string;
  student_id: string;
  student_name?: string;
  registration_number?: string;
  class_name?: string;
  section_name?: string;
  roll_number?: string;
  photo_url?: string;
  transport_assignment_id?: string;
  vehicle_id?: string;
  vehicle_name?: string;
  route_id?: string;
  route_name?: string;
  stop_id?: string;
  stop_name?: string;
  event_type: 'picked_up' | 'dropped_off' | 'not_riding' | 'missed';
  event_date: string;
  event_time: string;
  recorded_by?: string;
  recorded_by_name?: string;
  notes?: string;
  created_at: string;
}

// ----------------------------------------------------------------------------
// Notices, Timetable, Fees & Exams
// ----------------------------------------------------------------------------

export interface Notice {
  id: string;
  school_id: string;
  title: string;
  message: string;
  audience: NoticeAudience;
  starts_at: string;
  expires_at?: string;
  created_by?: string;
  created_by_name?: string;
  status: GeneralStatus;
  created_at: string;
}

export type TimetableSlotType = 'subject' | 'break' | 'games' | 'library' | 'activity' | 'assembly' | 'lab';

export interface TimetableEntry {
  id: string;
  school_id: string;
  academic_year_id: string;
  class_id: string;
  section_id: string;
  subject_id?: string;
  teacher_id?: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  room?: string;
  class_name?: string;
  section_name?: string;
  subject_name?: string;
  teacher_name?: string;
  period_number?: number;
  period_name?: string;
  slot_type?: TimetableSlotType;
  notes?: string;
}

export interface FeeStructure {
  id: string;
  school_id: string;
  academic_year_id?: string;
  name: string;
  amount: number;
  billing_frequency: BillingFrequency;
  due_day?: number;
  status: GeneralStatus;
  created_at: string;
}

export interface StudentPayment {
  id: string;
  school_id: string;
  student_id: string;
  invoice_id: string;
  receipt_id?: string;
  receipt_number?: string;
  amount: number;
  payment_method: PaymentMethod;
  payment_date: string;
  reference_number?: string;
  received_by?: string;
  received_by_name?: string;
  notes?: string;
  is_reversed?: boolean;
  reversal_reason?: string;
  created_at: string;
}

// ----------------------------------------------------------------------------
// Extra Student Charges & Fine Management
// ----------------------------------------------------------------------------

export type StudentChargeStatus = 'pending' | 'partial' | 'paid' | 'waived' | 'cancelled';

export interface StudentCharge {
  id: string;
  school_id: string;
  student_id: string;
  academic_year_id: string;
  charge_name: string;
  description?: string;
  amount: number;
  paid_amount: number;
  remaining_amount: number;
  charge_date: string;
  due_date?: string;
  status: StudentChargeStatus;
  created_by?: string;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
  waive_reason?: string;
  student_name?: string;
  registration_number?: string;
  bulk_charge_batch_id?: string;
}

// ----------------------------------------------------------------------------
// Fee Receipt Snapshot & Itemized Breakdown (1/4 A4 / A6 Design)
// ----------------------------------------------------------------------------

export interface PaymentReceiptItem {
  id: string;
  receipt_id: string;
  item_type: 'tuition' | 'transport' | 'exam' | 'charge' | 'fine' | 'discount' | 'other';
  item_reference_id?: string;
  description: string;
  amount: number;
  created_at: string;
}

export interface PaymentReceipt {
  id: string;
  school_id: string;
  student_id: string;
  payment_id: string;
  receipt_number: string; // e.g. "FEE-2026-001254"

  // Student details snapshot at payment time
  student_name_snapshot: string;
  registration_number_snapshot: string;
  class_snapshot: string;
  section_snapshot: string;
  roll_number_snapshot: string;
  academic_year_snapshot: string;

  // School identity snapshot
  school_name_snapshot: string;
  school_code_snapshot?: string;
  school_address_snapshot?: string;
  school_phone_snapshot?: string;
  school_email_snapshot?: string;
  school_logo_url_snapshot?: string;

  // Financial amounts
  subtotal: number;
  discount: number;
  total_amount: number;
  amount_paid: number;
  balance_after_payment: number;

  // Transaction details
  payment_method: PaymentMethod;
  payment_date: string;
  payment_time?: string;
  reference_number?: string;
  received_by_name_snapshot: string;
  received_by_id?: string;

  // Reversal status
  is_reversed?: boolean;
  reversal_reason?: string;
  reversed_at?: string;
  reversed_by_name?: string;

  items: PaymentReceiptItem[];
  created_at: string;
}

export interface StudentFeeInvoice {
  id: string;
  school_id: string;
  student_id: string;
  academic_year_id: string;
  fee_structure_id?: string;
  fee_structure_name?: string;
  billing_month: string;
  base_amount: number;
  discount_amount: number;
  fine_amount: number;
  final_amount: number;
  paid_amount: number;
  remaining_amount?: number;
  due_date: string;
  status: InvoiceStatus;
  created_at: string;
  student_name?: string;
  registration_number?: string;
  roll_number?: string;
  class_name?: string;
  section_name?: string;
  payments?: StudentPayment[];
}

export interface Exam {
  id: string;
  school_id: string;
  academic_year_id: string;
  class_id: string;
  section_id: string;
  subject_id: string;
  teacher_id?: string;
  name: string;
  exam_date: string;
  max_marks: number;
  passing_marks?: number;
  status: ExamStatus;
  created_at: string;
  class_name?: string;
  section_name?: string;
  subject_name?: string;
  teacher_name?: string;
}

export interface ExamResult {
  id: string;
  school_id: string;
  exam_id: string;
  student_id: string;
  marks_obtained?: number;
  absent: boolean;
  remarks?: string;
  created_at: string;
  student_name?: string;
  registration_number?: string;
  roll_number?: string;
}

// ----------------------------------------------------------------------------
// Active Persona / Context User Interface
// ----------------------------------------------------------------------------

export interface UserPersona {
  id: string;
  name: string;
  email?: string;
  role: UserRole;
  school_id?: string;
  school_name?: string;
  school_code?: string;
  student_id?: string;
  teacher_id?: string;
  staff_id?: string;
  driver_id?: string;
  parent_id?: string;
  login_id?: string;
  photo_url?: string;
  avatar?: string;
  permissions?: StaffPermission[];
  security_pin?: string;
  pin_failed_attempts?: number;
  is_pin_locked?: boolean;
}

// ----------------------------------------------------------------------------
// Admission Enquiries & Prospective Leads
// ----------------------------------------------------------------------------

export type EnquiryStatus =
  | 'new'
  | 'contacted'
  | 'interested'
  | 'follow_up'
  | 'admitted'
  | 'not_interested'
  | 'closed';

export interface AdmissionEnquiry {
  id: string;
  school_id: string;
  student_name: string;
  parent_name: string;
  primary_phone: string;
  secondary_phone?: string;
  email?: string;
  interested_class: string;
  source: 'phone' | 'walk_in' | 'website' | 'referral' | 'other';
  notes?: string;
  status: EnquiryStatus;
  assigned_to?: string;
  assigned_to_name?: string;
  next_follow_up_at?: string;
  last_contacted_at?: string;
  created_by: string;
  created_by_name: string;
  created_at: string;
  updated_at: string;
}

// ----------------------------------------------------------------------------
// Parents & Parent-Student Links
// ----------------------------------------------------------------------------

export interface ParentProfile {
  id: string;
  school_id: string;
  auth_user_id?: string;
  father_name?: string;
  mother_name?: string;
  guardian_name: string;
  primary_phone: string;
  secondary_phone?: string;
  email: string;
  address?: string;
  photo_url?: string;
  status: GeneralStatus;
  created_at: string;
  updated_at: string;
}

export interface ParentStudentLink {
  id: string;
  school_id: string;
  parent_id: string;
  student_id: string;
  relationship: 'father' | 'mother' | 'guardian' | 'other';
  is_primary_guardian: boolean;
  status: 'active' | 'inactive';
  created_by: string;
  created_at: string;
  student?: Student;
  parent?: ParentProfile;
}

// ----------------------------------------------------------------------------
// Application Notifications
// ----------------------------------------------------------------------------

export interface AppNotification {
  id: string;
  school_id: string;
  recipient_user_id: string;
  type:
    | 'leave_requested'
    | 'leave_parent_confirmation_required'
    | 'leave_parent_confirmed'
    | 'leave_approved'
    | 'leave_rejected'
    | 'leave_created_by_teacher'
    | 'leave_created_by_admin'
    | 'transport_pickup'
    | 'transport_drop'
    | 'notice_published'
    | 'fee_due';
  title: string;
  message: string;
  entity_type?: string;
  entity_id?: string;
  read_at?: string | null;
  created_at: string;
}

// ----------------------------------------------------------------------------
// Financial Collections Reporting Aggregates
// ----------------------------------------------------------------------------

export interface MethodCollectionSummary {
  method: PaymentMethod;
  label: string;
  total: number;
  count: number;
}

export interface EmployeeCollectionSummary {
  employee_name: string;
  employee_role: string;
  employee_id?: string;
  total: number;
  by_method: Record<string, number>;
  count: number;
}

export interface FeeCollectionSummary {
  period: 'today' | 'yesterday' | 'this_week' | 'this_month' | 'academic_year' | 'custom';
  period_label: string;
  total_collected: number;
  total_transactions: number;
  by_method: MethodCollectionSummary[];
  by_employee: EmployeeCollectionSummary[];
}

// ----------------------------------------------------------------------------
// Fee Structure Versions
// ----------------------------------------------------------------------------

export interface FeeStructureVersion {
  id: string;
  school_id: string;
  fee_structure_id: string;
  amount: number;
  effective_from: string; // e.g. '2026-09-01' or 'Sep 2026'
  effective_to?: string;
  created_by?: string;
  created_by_name?: string;
  reason: string;
  created_at: string;
}

// ----------------------------------------------------------------------------
// One-Time Bulk Charge Batches
// ----------------------------------------------------------------------------

export interface BulkChargeBatch {
  id: string;
  school_id: string;
  academic_year_id: string;
  name: string;
  amount: number;
  target_type: 'entire_school' | 'selected_classes' | 'specific_class' | 'specific_section' | 'selected_students';
  target_label: string;
  target_class_id?: string;
  target_section_id?: string;
  charge_date: string;
  due_date?: string;
  description?: string;
  total_students: number;
  total_amount: number;
  status: 'active' | 'cancelled';
  cancelled_at?: string;
  cancelled_by?: string;
  created_by?: string;
  created_by_name?: string;
  created_at: string;
}

// ----------------------------------------------------------------------------
// Student Follow-up Records
// ----------------------------------------------------------------------------

export type FollowUpType = 'attendance' | 'academic' | 'fee' | 'general';
export type ContactMethod = 'call' | 'message' | 'in_person' | 'other';
export type FollowUpStatus = 'pending' | 'in_progress' | 'resolved';

export interface StudentFollowUp {
  id: string;
  school_id: string;
  student_id: string;
  type: FollowUpType;
  note: string;
  contact_method: ContactMethod;
  contacted_parent_id?: string;
  contacted_person_name?: string;
  next_follow_up_at?: string;
  status: FollowUpStatus;
  created_by?: string;
  created_by_name?: string;
  created_at: string;
  resolved_at?: string;
}

// ----------------------------------------------------------------------------
// Attendance Concerns & Insights
// ----------------------------------------------------------------------------

export type AttendanceConcernLevel = 'watch' | 'concern' | 'critical';

export interface AttendanceConcern {
  student_id: string;
  student_name: string;
  registration_number: string;
  class_name: string;
  section_name: string;
  consecutive_absent_days: number;
  last_present_date: string;
  level: AttendanceConcernLevel;
  monthly_attendance_pct: number;
  parent_name?: string;
  parent_phone?: string;
  is_resolved: boolean;
  resolved_at?: string;
  latest_follow_up?: StudentFollowUp;
}

export interface ClassAttendanceInsights {
  class_id: string;
  section_id?: string;
  class_name: string;
  section_name?: string;
  today_present: number;
  today_absent: number;
  today_leave: number;
  total_enrolled: number;
  monthly_average_pct: number;
  perfect_attendance_students: { student_id: string; student_name: string; roll_number?: string }[];
  needs_attention_students: {
    student_id: string;
    student_name: string;
    roll_number?: string;
    attendance_pct: number;
    absent_days: number;
    consecutive_absent_days?: number;
  }[];
}

// ----------------------------------------------------------------------------
// Class Academic Insights (Toppers & Averages)
// ----------------------------------------------------------------------------

export interface ClassTopper {
  student_id: string;
  student_name: string;
  roll_number?: string;
  photo_url?: string;
  average_percentage: number;
  rank: number;
  is_joint: boolean;
  total_exams_evaluated: number;
}

export interface SubjectAverage {
  subject_id: string;
  subject_name: string;
  average_pct: number;
}

export interface ClassAcademicInsights {
  class_id: string;
  section_id?: string;
  class_name: string;
  section_name?: string;
  period: 'academic_year' | 'term' | 'month' | 'exam';
  class_average_pct: number;
  toppers: ClassTopper[];
  subject_averages: SubjectAverage[];
}

// ----------------------------------------------------------------------------
// Academic Year Transition & Student Progression (Move to New Session)
// ----------------------------------------------------------------------------

export type TransitionDecisionType =
  | 'promote'
  | 'repeat'
  | 'transfer_out'
  | 'left_school'
  | 'graduate'
  | 'pending';

export interface StudentTransitionItem {
  student_id: string;
  student_name: string;
  registration_number: string;
  roll_number?: string;
  photo_url?: string;
  current_class_id: string;
  current_class_name: string;
  current_section_id: string;
  current_section_name: string;
  current_status: GeneralStatus;
  progression_status?: 'ready' | 'repeat' | 'left_school' | 'transferred' | 'graduated' | 'pending';
  suggested_decision: TransitionDecisionType;
  selected_decision: TransitionDecisionType;
  target_class_id?: string;
  target_class_name?: string;
  target_section_id?: string;
  target_section_name?: string;
  notes?: string;
  is_exception: boolean;
  requires_resolution: boolean;
}

export interface TransitionSummaryBreakdown {
  total: number;
  promote: number;
  repeat: number;
  no_new_enrollment: number; // leaving + transfer
  graduate: number;
  pending: number;
}

export interface AcademicYearTransitionBatch {
  id: string;
  school_id: string;
  source_academic_year_id: string;
  source_academic_year_name: string;
  target_academic_year_id: string;
  target_academic_year_name: string;
  total_students: number;
  promoted_count: number;
  repeated_count: number;
  left_count: number;
  graduated_count: number;
  decisions: {
    student_id: string;
    student_name: string;
    decision: TransitionDecisionType;
    previous_enrollment_id: string;
    new_enrollment_id?: string;
    target_class_name?: string;
    target_section_name?: string;
  }[];
  status: 'completed' | 'reversed';
  created_at: string;
  created_by_name: string;
  created_by_id?: string;
  reversed_at?: string;
  reversed_by_name?: string;
}
