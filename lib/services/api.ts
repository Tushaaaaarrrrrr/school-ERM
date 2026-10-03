// ============================================================================
// Multi-Tenant School ERP API Layer (Hybrid Auth, Staff, Security Logs & Safety)
// ============================================================================

import {
  School,
  SchoolFeatureKey,
  AcademicYear,
  SchoolClass,
  Section,
  Subject,
  Teacher,
  TeacherAssignment,
  Student,
  StudentGuardian,
  StudentEnrollment,
  TimetableEntry,
  FeeStructure,
  StudentFeeInvoice,
  Exam,
  ExamResult,
  Notice,
  StudentAttendance,
  AttendanceStatus,
  SchoolHoliday,
  StudentLeave,
  TeacherAttendance,
  TeacherLeave,
  TeacherPayment,
  Staff,
  StaffAttendance,
  StaffLeave,
  StaffPermission,
  AuthEvent,
  AuthEventType,
  AccountDeletionRequest,
  SchoolDeletionRequest,
  UserPersona,
  StudentPayment,
  PaymentMethod,
  SchoolRoom,
  RoomType,
  EmployeeSalaryHistory,
  EmployeePayment,
  Vehicle,
  TransportRoute,
  TransportStop,
  StudentTransportAssignment,
  StudentTransportEvent,
  StudentCharge,
  StudentChargeStatus,
  PaymentReceipt,
  PaymentReceiptItem,
  AdmissionEnquiry,
  ParentProfile,
  ParentStudentLink,
  AppNotification,
  StudentEmergencyInfo,
  FeeCollectionSummary,
  MethodCollectionSummary,
  EmployeeCollectionSummary,
  LeaveType,
  EnquiryStatus,
  GeneralStatus,
  FeeStructureVersion,
  BulkChargeBatch,
  StudentFollowUp,
  AttendanceConcern,
  ClassAttendanceInsights,
  ClassTopper,
  ClassAcademicInsights,
  SubjectAverage,
  TransitionDecisionType,
  StudentTransitionItem,
  TransitionSummaryBreakdown,
  AcademicYearTransitionBatch,
  SchoolAccessRequest,
  Profile,
  StaffType,
  RecycleBinItem,
  UserRole,
  TemporaryAssignment,
  TemporaryAssignmentType,
  TemporaryAssignmentStatus,
  EmployeeSalaryAdjustment,
  SalaryAdjustmentType,
} from '@/lib/types';

import {
  INITIAL_SCHOOLS,
  INITIAL_ACADEMIC_YEARS,
  INITIAL_CLASSES,
  INITIAL_SECTIONS,
  INITIAL_SUBJECTS,
  INITIAL_TEACHERS,
  INITIAL_STUDENTS,
  INITIAL_STAFF,
  INITIAL_TIMETABLE,
  INITIAL_FEE_STRUCTURES,
  INITIAL_FEE_INVOICES,
  INITIAL_EXAMS,
  INITIAL_EXAM_RESULTS,
  INITIAL_NOTICES,
  INITIAL_HOLIDAYS,
  INITIAL_STUDENT_LEAVES,
  INITIAL_TEACHER_PAYMENTS,
  INITIAL_AUTH_EVENTS,
  INITIAL_DELETION_REQUESTS,
  INITIAL_SCHOOL_DELETION_REQUESTS,
  INITIAL_ROOMS,
  INITIAL_EMPLOYEE_SALARY_HISTORY,
  INITIAL_EMPLOYEE_PAYMENTS,
  INITIAL_VEHICLES,
  INITIAL_TRANSPORT_ROUTES,
  INITIAL_TRANSPORT_STOPS,
  INITIAL_STUDENT_TRANSPORT_ASSIGNMENTS,
  INITIAL_STUDENT_TRANSPORT_EVENTS,
  INITIAL_STUDENT_CHARGES,
  INITIAL_PAYMENT_RECEIPTS,
  INITIAL_PARENTS,
  INITIAL_PARENT_STUDENT_LINKS,
  INITIAL_ADMISSION_ENQUIRIES,
  INITIAL_NOTIFICATIONS,
  INITIAL_FEE_STRUCTURE_VERSIONS,
  INITIAL_BULK_CHARGE_BATCHES,
  INITIAL_STUDENT_FOLLOWUPS,
  INITIAL_TRANSITION_BATCHES,
  INITIAL_TEMPORARY_ASSIGNMENTS,
  INITIAL_EMPLOYEE_SALARY_ADJUSTMENTS,
} from './mock-data';

import {
  GENERIC_AUTH_ERROR,
  UNREGISTERED_GOOGLE_ERROR,
  checkRateLimit,
  recordFailedAttempt,
  resetRateLimit,
  validatePasswordStrength,
  validateImageFileContent,
  generateSafeStoragePath,
  generateSecurePin,
  isDemoEnvironment,
  RateLimitError,
} from '@/lib/utils/security';
import { validateSchoolCodeFormat, sanitizeSchoolCode } from '@/lib/utils/school-code';

export const STORAGE_KEYS = {
  SCHOOLS: 'school_erp_schools',
  ACADEMIC_YEARS: 'school_erp_academic_years',
  CLASSES: 'school_erp_classes',
  SECTIONS: 'school_erp_sections',
  SUBJECTS: 'school_erp_subjects',
  TEACHERS: 'school_erp_teachers',
  STAFF: 'school_erp_staff',
  STUDENTS: 'school_erp_students',
  TIMETABLE: 'school_erp_timetable',
  FEE_STRUCTURES: 'school_erp_fee_structures',
  FEE_INVOICES: 'school_erp_fee_invoices',
  STUDENT_CHARGES: 'school_erp_student_charges',
  PAYMENT_RECEIPTS: 'school_erp_payment_receipts',
  PARENTS: 'school_erp_parents',
  PARENT_STUDENT_LINKS: 'school_erp_parent_student_links',
  ADMISSION_ENQUIRIES: 'school_erp_admission_enquiries',
  NOTIFICATIONS: 'school_erp_notifications',
  EXAMS: 'school_erp_exams',
  EXAM_RESULTS: 'school_erp_exam_results',
  NOTICES: 'school_erp_notices',
  HOLIDAYS: 'school_erp_holidays',
  STUDENT_LEAVES: 'school_erp_student_leaves',
  ATTENDANCE: 'school_erp_attendance',
  TEACHER_ATTENDANCE: 'school_erp_teacher_attendance',
  TEACHER_LEAVES: 'school_erp_teacher_leaves',
  STAFF_ATTENDANCE: 'school_erp_staff_attendance',
  STAFF_LEAVES: 'school_erp_staff_leaves',
  TEACHER_PAYMENTS: 'school_erp_teacher_payments',
  AUTH_EVENTS: 'school_erp_auth_events',
  DELETION_REQUESTS: 'school_erp_deletion_requests',
  SCHOOL_DELETION_REQUESTS: 'school_erp_school_deletion_requests',
  ROOMS: 'school_erp_rooms',
  EMPLOYEE_SALARY_HISTORY: 'school_erp_employee_salary_history',
  EMPLOYEE_PAYMENTS: 'school_erp_employee_payments',
  VEHICLES: 'school_erp_vehicles',
  TRANSPORT_ROUTES: 'school_erp_transport_routes',
  TRANSPORT_STOPS: 'school_erp_transport_stops',
  STUDENT_TRANSPORT_ASSIGNMENTS: 'school_erp_student_transport_assignments',
  STUDENT_TRANSPORT_EVENTS: 'school_erp_student_transport_events',
  FEE_STRUCTURE_VERSIONS: 'school_erp_fee_structure_versions',
  BULK_CHARGE_BATCHES: 'school_erp_bulk_charge_batches',
  STUDENT_FOLLOWUPS: 'school_erp_student_followups',
  TRANSITION_BATCHES: 'school_erp_transition_batches',
  ACCESS_REQUESTS: 'school_erp_access_requests',
  PROFILES: 'school_erp_profiles',
  RECYCLE_BIN: 'school_erp_recycle_bin',
  TEMPORARY_ASSIGNMENTS: 'school_erp_temporary_assignments',
  EMPLOYEE_SALARY_ADJUSTMENTS: 'school_erp_employee_salary_adjustments',
  USER_PASSWORDS: 'school_erp_user_passwords',
  PASSKEYS: 'school_erp_passkeys',
};

// High-performance in-memory cache layer for storageService
const memoryStorageCache = new Map<string, { raw: string; data: any }>();

if (typeof window !== 'undefined') {
  // Invalidate memory cache when storage changes across browser tabs
  window.addEventListener('storage', (e) => {
    if (e.key) {
      memoryStorageCache.delete(e.key);
    } else {
      memoryStorageCache.clear();
    }
  });
}

// Safe storage helper with in-memory caching and SSR fallback
export const storageService = {
  getItem<T>(key: string, defaultVal: T): T {
    if (typeof window === 'undefined') return defaultVal;
    try {
      const cached = memoryStorageCache.get(key);
      if (cached !== undefined) {
        return cached.data as T;
      }
      const stored = localStorage.getItem(key);
      if (stored !== null) {
        const parsed = JSON.parse(stored);
        memoryStorageCache.set(key, { raw: stored, data: parsed });
        return parsed as T;
      }
      return defaultVal;
    } catch {
      return defaultVal;
    }
  },
  setItem<T>(key: string, value: T): void {
    if (typeof window === 'undefined') return;
    try {
      const raw = JSON.stringify(value);
      const cached = memoryStorageCache.get(key);
      if (cached && cached.raw === raw) {
        // Data is identical, avoid unnecessary write and event cascade
        return;
      }
      memoryStorageCache.set(key, { raw, data: value });
      localStorage.setItem(key, raw);
      window.dispatchEvent(new CustomEvent('school_erp_data_sync', { detail: { key } }));
    } catch (e) {
      console.error(`Failed to write ${key} to local storage`, e);
    }
  },
  removeItem(key: string): void {
    if (typeof window === 'undefined') return;
    memoryStorageCache.delete(key);
    try {
      localStorage.removeItem(key);
      window.dispatchEvent(new CustomEvent('school_erp_data_sync', { detail: { key } }));
    } catch {}
  },
  clearMemoryCache(key?: string): void {
    if (key) {
      memoryStorageCache.delete(key);
    } else {
      memoryStorageCache.clear();
    }
  },
};

// ============================================================================
// 1. HYBRID AUTHENTICATION SERVICE (Email/Pwd, Google OAuth, Student RegID)
// ============================================================================

export const authService = {
  /**
   * Primary Email + Password Sign In for Super Admin, School Admin, Teachers, Staff
   */
  async authenticateWithEmailPassword(
    email: string,
    password: string
  ): Promise<{ success: boolean; user?: UserPersona; redirectUrl?: string; error?: string }> {
    const rawEmail = email.trim().toLowerCase();
    const rateKey = `auth_email_${rawEmail}`;

    const rateCheck = checkRateLimit(rateKey);
    if (!rateCheck.isAllowed) {
      authLogService.logEvent({
        email: rawEmail,
        event_type: 'rate_limited',
        success: false,
        details: { retryAfterSeconds: rateCheck.retryAfterSeconds },
      });
      return {
        success: false,
        error: `Too many failed attempts. Cooldown active for ${rateCheck.retryAfterSeconds}s.`,
      };
    }

    // 1. Super Admin Match (Platform Owner, school_id = NULL)
    if (
      rawEmail === 'superadmin@platform.erp' ||
      rawEmail === 'superadmin@schoolerp.com' ||
      rawEmail === 'pay.laxmikant@gmail.com'
    ) {
      resetRateLimit(rateKey);
      authLogService.logEvent({
        email: rawEmail,
        event_type: 'login_success',
        success: true,
        role: 'super_admin',
        user_name: 'Laxmikant (Super Admin)',
      });

      return {
        success: true,
        user: {
          id: 'usr-super-01',
          name: 'Super Admin',
          email: rawEmail,
          role: 'super_admin',
        },
        redirectUrl: '/super-admin',
      };
    }

    // 2. School Admin Match
    const schools = storageService.getItem<School[]>(STORAGE_KEYS.SCHOOLS, INITIAL_SCHOOLS);
    const adminSchool = schools.find((s) => {
      const expectedEmail = `admin@${s.code.toLowerCase()}.edu.in`;
      const genericAdmin = `admin@delhipublic.edu.in`;
      return (
        s.email.toLowerCase() === rawEmail ||
        rawEmail === expectedEmail ||
        (s.id === 'sch-001' && rawEmail === genericAdmin)
      );
    });

    if (adminSchool) {
      if (adminSchool.status === 'suspended') {
        authLogService.logEvent({
          school_id: adminSchool.id,
          school_name: adminSchool.name,
          email: rawEmail,
          event_type: 'account_suspended_login',
          success: false,
          role: 'school_admin',
        });
        return { success: false, error: 'Your school access is currently suspended. Please contact platform support.' };
      }

      resetRateLimit(rateKey);
      authLogService.logEvent({
        school_id: adminSchool.id,
        school_name: adminSchool.name,
        email: rawEmail,
        event_type: 'login_success',
        success: true,
        role: 'school_admin',
        user_name: `Administrator (${adminSchool.name})`,
      });

      return {
        success: true,
        user: {
          id: `usr-admin-${adminSchool.id}`,
          name: adminSchool.id === 'sch-001' ? 'Dr. Anita Deshmukh' : 'Principal Admin',
          email: rawEmail,
          role: 'school_admin',
          school_id: adminSchool.id,
          school_name: adminSchool.name,
          school_code: adminSchool.code,
          avatar: '👩‍🏫',
        },
        redirectUrl: '/admin',
      };
    }

    // 3. Teacher Match (by email)
    const teachers = storageService.getItem<Teacher[]>(STORAGE_KEYS.TEACHERS, INITIAL_TEACHERS);
    const teacher = teachers.find((t) => t.email.toLowerCase() === rawEmail && t.status === 'active');

    if (teacher) {
      const sch = schools.find((s) => s.id === teacher.school_id);
      if (sch?.status === 'suspended') {
        return { success: false, error: 'Your school access is currently suspended. Please contact your school administrator.' };
      }

      resetRateLimit(rateKey);
      authLogService.logEvent({
        school_id: teacher.school_id,
        school_name: sch?.name,
        email: rawEmail,
        event_type: 'login_success',
        success: true,
        role: 'teacher',
        user_name: `${teacher.first_name} ${teacher.last_name}`,
      });

      return {
        success: true,
        user: {
          id: `usr-${teacher.id}`,
          name: `${teacher.first_name} ${teacher.last_name}`,
          email: teacher.email,
          role: 'teacher',
          school_id: teacher.school_id,
          school_name: sch?.name,
          school_code: sch?.code,
          teacher_id: teacher.id,
          login_id: teacher.employee_number,
          photo_url: teacher.photo_url,
          avatar: '👨‍🏫',
        },
        redirectUrl: '/teacher',
      };
    }

    // 4. Staff Match (by email)
    const staffList = storageService.getItem<Staff[]>(STORAGE_KEYS.STAFF, INITIAL_STAFF);
    const staffMember = staffList.find((s) => s.email.toLowerCase() === rawEmail && s.status === 'active');

    if (staffMember) {
      if (staffMember.portal_access === false) {
        return {
          success: false,
          error: 'Portal access has not been enabled for your staff account. Please contact your school administrator.',
        };
      }

      const sch = schools.find((s) => s.id === staffMember.school_id);
      if (sch?.status === 'suspended') {
        return { success: false, error: 'Your school access is currently suspended. Please contact your school administrator.' };
      }

      resetRateLimit(rateKey);
      authLogService.logEvent({
        school_id: staffMember.school_id,
        school_name: sch?.name,
        email: rawEmail,
        event_type: 'login_success',
        success: true,
        role: staffMember.staff_type === 'driver' ? 'driver' : 'staff',
        user_name: `${staffMember.first_name} ${staffMember.last_name}`,
      });

      const isDriver = staffMember.staff_type === 'driver';

      return {
        success: true,
        user: {
          id: `usr-${staffMember.id}`,
          name: `${staffMember.first_name} ${staffMember.last_name}`,
          email: staffMember.email,
          role: isDriver ? 'driver' : 'staff',
          school_id: staffMember.school_id,
          school_name: sch?.name,
          school_code: sch?.code,
          staff_id: staffMember.id,
          driver_id: isDriver ? staffMember.id : undefined,
          login_id: staffMember.employee_number,
          photo_url: staffMember.photo_url,
          avatar: isDriver ? '🚌' : '👔',
          permissions: staffMember.permissions,
        },
        redirectUrl: isDriver ? '/driver' : '/staff',
      };
    }

    // 5. Parent Match (by email)
    const parents = storageService.getItem<ParentProfile[]>(STORAGE_KEYS.PARENTS, INITIAL_PARENTS);
    const parent = parents.find((p) => p.email.toLowerCase() === rawEmail && p.status === 'active');
    if (parent) {
      const sch = schools.find((s) => s.id === parent.school_id);
      if (sch?.status === 'suspended') {
        return { success: false, error: 'Your school access is currently suspended. Please contact your school administrator.' };
      }

      resetRateLimit(rateKey);
      authLogService.logEvent({
        school_id: parent.school_id,
        school_name: sch?.name,
        email: rawEmail,
        event_type: 'login_success',
        success: true,
        role: 'parent',
        user_name: parent.guardian_name,
      });

      return {
        success: true,
        user: {
          id: parent.auth_user_id || `usr-${parent.id}`,
          name: parent.guardian_name,
          email: parent.email,
          role: 'parent',
          school_id: parent.school_id,
          school_name: sch?.name,
          school_code: sch?.code,
          parent_id: parent.id,
          login_id: `PRT-${parent.id.slice(-3)}`,
          photo_url: parent.photo_url,
          avatar: '👨‍👩‍👧',
        },
        redirectUrl: '/parent',
      };
    }

    // Fallback: Failed authentication attempt
    const attempt = recordFailedAttempt(rateKey);
    authLogService.logEvent({
      email: rawEmail,
      event_type: 'login_failure',
      success: false,
    });

    return {
      success: false,
      error: attempt.isAllowed
        ? GENERIC_AUTH_ERROR
        : `Too many attempts. Cooldown active for ${attempt.retryAfterSeconds}s.`,
    };
  },

  /**
   * Google OAuth Authentication Flow
   * Strictly matches existing active ERP profile. Does NOT create an account for strangers.
   */
  async authenticateWithGoogle(
    googleEmail: string
  ): Promise<{ success: boolean; user?: UserPersona; redirectUrl?: string; error?: string }> {
    const rawEmail = googleEmail.trim().toLowerCase();

    // 0. Connect directly to Server Backend & Database for live multi-tenant verification
    try {
      if (typeof window !== 'undefined') {
        const res = await fetch('/api/auth/google', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: rawEmail }),
        });
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.user) {
            // Also sync live schools list from server
            try {
              const schRes = await fetch('/api/schools');
              if (schRes.ok) {
                const schData = await schRes.json();
                if (schData.data && schData.data.length > 0) {
                  storageService.setItem(STORAGE_KEYS.SCHOOLS, schData.data);
                }
              }
            } catch {}
            return json;
          }
        }
      }
    } catch (e) {
      console.warn('Backend server auth query fallback to local cache:', e);
    }

    // 1. Check Super Admin
    if (
      rawEmail === 'superadmin@platform.erp' ||
      rawEmail === 'superadmin@schoolerp.com' ||
      rawEmail === 'pay.laxmikant@gmail.com'
    ) {
      authLogService.logEvent({
        email: rawEmail,
        event_type: 'google_login_success',
        success: true,
        role: 'super_admin',
        user_name: 'Laxmikant (Super Admin)',
      });

      return {
        success: true,
        user: {
          id: 'usr-super-01',
          name: 'Super Admin',
          email: rawEmail,
          role: 'super_admin',
        },
        redirectUrl: '/super-admin',
      };
    }

    // 2. Check School Admin
    const schools = storageService.getItem<School[]>(STORAGE_KEYS.SCHOOLS, INITIAL_SCHOOLS);
    const profiles = storageService.getItem<Profile[]>(STORAGE_KEYS.PROFILES, []);
    const adminProfile = profiles.find((p) => p.email?.toLowerCase() === rawEmail && p.role === 'school_admin');
    
    const adminSchool = schools.find((s) => {
      const adminEmails = (s.admin_email || '')
        .split(',')
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean);
      return (
        adminEmails.includes(rawEmail) ||
        (adminProfile && adminProfile.school_id === s.id)
      );
    });

    if (adminSchool) {
      if (adminSchool.status === 'suspended') {
        authLogService.logEvent({
          school_id: adminSchool.id,
          school_name: adminSchool.name,
          email: rawEmail,
          event_type: 'account_suspended_login',
          success: false,
          role: 'school_admin',
        });
        return { success: false, error: 'Your school access is currently suspended. Please contact platform support.' };
      }

      authLogService.logEvent({
        school_id: adminSchool.id,
        school_name: adminSchool.name,
        email: rawEmail,
        event_type: 'google_login_success',
        success: true,
        role: 'school_admin',
        user_name: adminSchool.admin_name || adminProfile?.display_name || `Administrator (${adminSchool.name})`,
      });

      return {
        success: true,
        user: {
          id: `usr-admin-${adminSchool.id}`,
          name: adminSchool.admin_name || adminProfile?.display_name || `${adminSchool.name} Administrator`,
          email: rawEmail,
          role: 'school_admin',
          school_id: adminSchool.id,
          school_name: adminSchool.name,
          school_code: adminSchool.code,
        },
        redirectUrl: '/admin',
      };
    }

    // 3. Check Teacher
    const teachers = storageService.getItem<Teacher[]>(STORAGE_KEYS.TEACHERS, INITIAL_TEACHERS);
    const teacher = teachers.find((t) => t.email.toLowerCase() === rawEmail && t.status === 'active');

    if (teacher) {
      const sch = schools.find((s) => s.id === teacher.school_id);
      if (sch?.status === 'suspended') {
        return { success: false, error: 'Your school access is currently suspended. Please contact your school administrator.' };
      }

      authLogService.logEvent({
        school_id: teacher.school_id,
        school_name: sch?.name,
        email: rawEmail,
        event_type: 'google_login_success',
        success: true,
        role: 'teacher',
        user_name: `${teacher.first_name} ${teacher.last_name}`,
      });

      return {
        success: true,
        user: {
          id: `usr-${teacher.id}`,
          name: `${teacher.first_name} ${teacher.last_name}`,
          email: teacher.email,
          role: 'teacher',
          school_id: teacher.school_id,
          school_name: sch?.name,
          school_code: sch?.code,
          teacher_id: teacher.id,
          login_id: teacher.employee_number,
          photo_url: teacher.photo_url,
          avatar: '👨‍🏫',
        },
        redirectUrl: '/teacher',
      };
    }

    // 4. Check Staff
    const staffList = storageService.getItem<Staff[]>(STORAGE_KEYS.STAFF, INITIAL_STAFF);
    const staffMember = staffList.find((s) => s.email.toLowerCase() === rawEmail && s.status === 'active');

    if (staffMember) {
      if (staffMember.portal_access === false) {
        return {
          success: false,
          error: 'Portal access has not been enabled for your staff account. Please contact your school administrator.',
        };
      }

      const sch = schools.find((s) => s.id === staffMember.school_id);
      if (sch?.status === 'suspended') {
        return { success: false, error: 'Your school access is currently suspended. Please contact your school administrator.' };
      }

      const isDriver = staffMember.staff_type === 'driver';

      authLogService.logEvent({
        school_id: staffMember.school_id,
        school_name: sch?.name,
        email: rawEmail,
        event_type: 'google_login_success',
        success: true,
        role: isDriver ? 'driver' : 'staff',
        user_name: `${staffMember.first_name} ${staffMember.last_name}`,
      });

      return {
        success: true,
        user: {
          id: `usr-${staffMember.id}`,
          name: `${staffMember.first_name} ${staffMember.last_name}`,
          email: staffMember.email,
          role: isDriver ? 'driver' : 'staff',
          school_id: staffMember.school_id,
          school_name: sch?.name,
          school_code: sch?.code,
          staff_id: staffMember.id,
          driver_id: isDriver ? staffMember.id : undefined,
          login_id: staffMember.employee_number,
          photo_url: staffMember.photo_url,
          avatar: isDriver ? '🚌' : '👔',
          permissions: staffMember.permissions,
        },
        redirectUrl: isDriver ? '/driver' : '/staff',
      };
    }

    // 5. Parent Match (by Google email)
    const parents = storageService.getItem<ParentProfile[]>(STORAGE_KEYS.PARENTS, INITIAL_PARENTS);
    const parent = parents.find((p) => p.email.toLowerCase() === rawEmail && p.status === 'active');
    if (parent) {
      const sch = schools.find((s) => s.id === parent.school_id);
      if (sch?.status === 'suspended') {
        return { success: false, error: 'Your school access is currently suspended. Please contact your school administrator.' };
      }

      authLogService.logEvent({
        school_id: parent.school_id,
        school_name: sch?.name,
        email: rawEmail,
        event_type: 'google_login_success',
        success: true,
        role: 'parent',
        user_name: parent.guardian_name,
      });

      return {
        success: true,
        user: {
          id: parent.auth_user_id || `usr-${parent.id}`,
          name: parent.guardian_name,
          email: parent.email,
          role: 'parent',
          school_id: parent.school_id,
          school_name: sch?.name,
          school_code: sch?.code,
          parent_id: parent.id,
          login_id: `PRT-${parent.id.slice(-3)}`,
          photo_url: parent.photo_url,
        },
        redirectUrl: '/parent',
      };
    }

    // 6. Unassigned User -> Direct to /join to submit or view School Join Request
    const requests = storageService.getItem<SchoolAccessRequest[]>(STORAGE_KEYS.ACCESS_REQUESTS, []);
    const pendingReq = requests.find((r) => r.user_email.toLowerCase() === rawEmail && r.status === 'pending');

    authLogService.logEvent({
      email: rawEmail,
      event_type: 'google_login_success',
      success: true,
      role: 'unassigned',
      user_name: rawEmail.split('@')[0],
      details: {
        reason: pendingReq ? 'Pending join request active' : 'Prompt to enter school code and request access',
      },
    });

    return {
      success: true,
      user: {
        id: `usr-unassigned-${rawEmail}`,
        name: rawEmail.split('@')[0],
        email: rawEmail,
        role: 'unassigned',
      },
      redirectUrl: '/join',
    };
  },

  /**
   * Student Authentication Flow
   * Uses School Code + Registration Number + Password
   */
  async authenticateStudent(
    schoolCode: string,
    registrationNumber: string,
    password: string
  ): Promise<{ success: boolean; user?: UserPersona; redirectUrl?: string; error?: string }> {
    const rawCode = schoolCode.trim().toUpperCase();
    const rawReg = registrationNumber.trim().replace(/[\u2010-\u2015\u2212\uFE58\uFE63\uFF0D]/g, '-');
    const rateKey = `auth_student_${rawCode}_${rawReg}`;

    const rateCheck = checkRateLimit(rateKey);
    if (!rateCheck.isAllowed) {
      authLogService.logEvent({
        registration_identifier: `${rawCode}:${rawReg}`,
        event_type: 'rate_limited',
        success: false,
        details: { retryAfterSeconds: rateCheck.retryAfterSeconds },
      });
      return {
        success: false,
        error: `Too many attempts. Cooldown active for ${rateCheck.retryAfterSeconds}s.`,
      };
    }

    const schools = storageService.getItem<School[]>(STORAGE_KEYS.SCHOOLS, INITIAL_SCHOOLS);
    const targetSchool = schools.find((s) => s.code.toUpperCase() === rawCode);

    if (!targetSchool) {
      recordFailedAttempt(rateKey);
      authLogService.logEvent({
        registration_identifier: `${rawCode}:${rawReg}`,
        event_type: 'login_failure',
        success: false,
        details: { reason: 'School code not recognized' },
      });
      return { success: false, error: GENERIC_AUTH_ERROR };
    }

    if (targetSchool.status === 'suspended') {
      return { success: false, error: 'Your school access is currently suspended. Please contact your school administrator.' };
    }

    const students = storageService.getItem<Student[]>(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS);
    const student = students.find(
      (s) =>
        s.school_id === targetSchool.id &&
        s.registration_number.replace(/[\u2010-\u2015\u2212\uFE58\uFE63\uFF0D]/g, '-').toLowerCase() === rawReg.toLowerCase() &&
        s.status === 'active'
    );

    if (!student) {
      recordFailedAttempt(rateKey);
      authLogService.logEvent({
        school_id: targetSchool.id,
        school_name: targetSchool.name,
        registration_identifier: rawReg,
        event_type: 'login_failure',
        success: false,
        details: { reason: 'Student registration number not found' },
      });
      return { success: false, error: GENERIC_AUTH_ERROR };
    }

    resetRateLimit(rateKey);
    authLogService.logEvent({
      school_id: targetSchool.id,
      school_name: targetSchool.name,
      registration_identifier: rawReg,
      user_id: student.id,
      event_type: 'login_success',
      success: true,
      role: 'student',
      user_name: `${student.first_name} ${student.last_name}`,
    });

    return {
      success: true,
      user: {
        id: `usr-${student.id}`,
        name: `${student.first_name} ${student.last_name}`,
        role: 'student',
        school_id: targetSchool.id,
        school_name: targetSchool.name,
        school_code: targetSchool.code,
        student_id: student.id,
        login_id: student.registration_number,
        photo_url: student.photo_url,
        avatar: '🎒',
      },
      redirectUrl: '/student',
    };
  },

  /**
   * Universal Identifier + Password Authentication for ALL User Roles
   * Accepts: Email, Registration Number, Phone Number, or Employee ID
   */
  async verifyIdentifierExists(
    identifier: string,
    schoolCode?: string
  ): Promise<{
    exists: boolean;
    schoolNotFound?: boolean;
    userNotFound?: boolean;
    error?: string;
    user?: UserPersona;
    suggestGoogle?: boolean;
  }> {
    const rawId = identifier.trim().replace(/[\u2010-\u2015\u2212\uFE58\uFE63\uFF0D]/g, '-');
    const rawLower = rawId.toLowerCase();
    const rawCode = (schoolCode || '').trim().toUpperCase();

    if (!rawLower) {
      return { exists: false, error: 'Please enter your email or registration number.' };
    }

    const schools = storageService.getItem<School[]>(STORAGE_KEYS.SCHOOLS, INITIAL_SCHOOLS);

    // Validate School Code if provided
    let targetSchool: School | null = null;
    if (rawCode) {
      targetSchool = schools.find((s) => s.code.toUpperCase() === rawCode) || null;
      if (!targetSchool) {
        return {
          exists: false,
          schoolNotFound: true,
          error: `School code "${rawCode}" is wrong or does not exist. Please check your school code.`,
        };
      }
    }

    // 1. Super Admin
    const isHardcodedSuperAdmin =
      rawLower === 'superadmin@platform.erp' ||
      rawLower === 'superadmin@schoolerp.com' ||
      rawLower === 'pay.laxmikant@gmail.com' ||
      rawLower === 'superadmin' ||
      rawLower === 'admin';

    const passwordsMap = userPasswordService.getPasswordsMap();
    const isSuperInPasswordMap =
      Boolean(passwordsMap[rawLower]) &&
      Boolean(
        passwordsMap['superadmin'] === passwordsMap[rawLower] ||
        passwordsMap['usr-super-01'] === passwordsMap[rawLower] ||
        passwordsMap['pay.laxmikant@gmail.com'] === passwordsMap[rawLower]
      );

    if (isHardcodedSuperAdmin || isSuperInPasswordMap) {
      return {
        exists: true,
        user: {
          id: 'usr-super-01',
          name: 'Super Admin',
          email: rawLower.includes('@') ? rawLower : 'pay.laxmikant@gmail.com',
          role: 'super_admin',
        },
      };
    }

    // 2. School Admin
    const adminSchool = schools.find((s) => {
      const adminEmails = (s.admin_email || '')
        .split(',')
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean);
      const schoolEmail = s.email?.toLowerCase();
      const genericAdmin = `admin@${s.code.toLowerCase()}.edu.in`;
      const isEmailMatch = adminEmails.includes(rawLower) || schoolEmail === rawLower || genericAdmin === rawLower;
      const schoolMatch = !targetSchool || s.id === targetSchool.id;
      return (isEmailMatch || (schoolMatch && (rawLower === 'admin' || rawLower === s.code.toLowerCase()))) && schoolMatch;
    });

    if (adminSchool) {
      const adminEmails = (adminSchool.admin_email || '')
        .split(',')
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean);
      const matchedEmail = adminEmails.find((e) => e === rawLower) || adminEmails[0] || adminSchool.email || `admin@${adminSchool.code.toLowerCase()}.edu.in`;
      return {
        exists: true,
        user: {
          id: `usr-admin-${adminSchool.id}`,
          name: adminSchool.admin_name || `${adminSchool.name} Administrator`,
          email: matchedEmail,
          role: 'school_admin',
          school_id: adminSchool.id,
          school_name: adminSchool.name,
          school_code: adminSchool.code,
          photo_url: adminSchool.logo_url,
        },
      };
    }

    // 3. Student (Registration Number)
    const students = storageService.getItem<Student[]>(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS);
    const anyStudentByReg = students.find((s) => {
      const sReg = s.registration_number.replace(/[\u2010-\u2015\u2212\uFE58\uFE63\uFF0D]/g, '-').toLowerCase();
      const schoolMatch = !targetSchool || s.school_id === targetSchool.id;
      return sReg === rawLower && schoolMatch;
    });

    if (anyStudentByReg && anyStudentByReg.status !== 'active') {
      return {
        exists: false,
        error: `This student account (${anyStudentByReg.registration_number}) has been deactivated or suspended. Please contact your school administrator.`,
      };
    }

    let matchedStudentByReg = anyStudentByReg?.status === 'active' ? anyStudentByReg : undefined;

    // If not found in browser localStorage, check the centralized server database
    if (!matchedStudentByReg && typeof window !== 'undefined') {
      try {
        const queryParams = new URLSearchParams({ identifier: rawId });
        if (rawCode) queryParams.set('schoolCode', rawCode);
        const res = await fetch(`/api/auth/lookup?${queryParams.toString()}`);
        if (res.ok) {
          const lookup = await res.json();
          if (lookup.isDeactivated) {
            return {
              exists: false,
              error: lookup.error || 'This student account has been deactivated or suspended. Please contact your school administrator.',
            };
          }
          if (lookup.success && lookup.exists && lookup.studentData) {
            matchedStudentByReg = lookup.studentData;
            // Cache student and school into localStorage so subsequent operations succeed
            const currentStudents = storageService.getItem<Student[]>(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS);
            if (!currentStudents.some((s) => s.id === lookup.studentData.id)) {
              currentStudents.push(lookup.studentData);
              storageService.setItem(STORAGE_KEYS.STUDENTS, currentStudents);
            }
            if (lookup.schoolData) {
              const currentSchools = storageService.getItem<School[]>(STORAGE_KEYS.SCHOOLS, INITIAL_SCHOOLS);
              if (!currentSchools.some((s) => s.id === lookup.schoolData.id)) {
                currentSchools.push(lookup.schoolData);
                storageService.setItem(STORAGE_KEYS.SCHOOLS, currentSchools);
              }
            }
          }
        }
      } catch (err) {
        console.warn('Server student lookup fallback warning:', err);
      }
    }

    if (matchedStudentByReg) {
      const sch = schools.find((s) => s.id === matchedStudentByReg.school_id) || targetSchool || schools[0];
      return {
        exists: true,
        user: {
          id: `usr-${matchedStudentByReg.id}`,
          name: `${matchedStudentByReg.first_name} ${matchedStudentByReg.last_name}`,
          email: matchedStudentByReg.guardian?.email,
          role: 'student',
          school_id: sch?.id,
          school_name: sch?.name,
          school_code: sch?.code,
          student_id: matchedStudentByReg.id,
          login_id: matchedStudentByReg.registration_number,
          photo_url: matchedStudentByReg.photo_url,
        },
      };
    }

    // 3b. Parent (by Student Guardian Email)
    const matchedStudentByGuardian = students.find((s) => {
      const guardianEmailMatch = s.guardian?.email && s.guardian.email.toLowerCase() === rawLower;
      const schoolMatch = !targetSchool || s.school_id === targetSchool.id;
      return guardianEmailMatch && schoolMatch && s.status === 'active';
    });

    if (matchedStudentByGuardian) {
      const sch = schools.find((s) => s.id === matchedStudentByGuardian.school_id) || targetSchool || schools[0];
      const g = matchedStudentByGuardian.guardian;
      const gName = g?.guardian_name || g?.father_name || g?.mother_name || `${matchedStudentByGuardian.first_name}'s Parent`;
      return {
        exists: true,
        user: {
          id: `usr-parent-${matchedStudentByGuardian.id}`,
          name: gName,
          email: g?.email,
          role: 'parent',
          school_id: sch?.id,
          school_name: sch?.name,
          school_code: sch?.code,
          student_id: matchedStudentByGuardian.id,
          photo_url: (matchedStudentByGuardian.guardian as any)?.photo_url,
        },
      };
    }

    // 4. Teacher
    const teachers = storageService.getItem<Teacher[]>(STORAGE_KEYS.TEACHERS, INITIAL_TEACHERS);
    const anyTeacher = teachers.find((t) => {
      const emailMatch = t.email.toLowerCase() === rawLower;
      const empMatch = t.employee_number && t.employee_number.toLowerCase() === rawLower;
      const schoolMatch = !targetSchool || t.school_id === targetSchool.id;
      return (emailMatch || empMatch) && schoolMatch;
    });

    if (anyTeacher && anyTeacher.status !== 'active') {
      return {
        exists: false,
        error: 'This teacher account has been deactivated. Please contact your school administrator.',
      };
    }

    const matchedTeacher = anyTeacher?.status === 'active' ? anyTeacher : undefined;

    if (matchedTeacher) {
      const sch = schools.find((s) => s.id === matchedTeacher.school_id) || targetSchool || schools[0];
      return {
        exists: true,
        user: {
          id: `usr-${matchedTeacher.id}`,
          name: `${matchedTeacher.first_name} ${matchedTeacher.last_name}`,
          email: matchedTeacher.email,
          role: 'teacher',
          school_id: sch?.id,
          school_name: sch?.name,
          school_code: sch?.code,
          teacher_id: matchedTeacher.id,
          login_id: matchedTeacher.employee_number,
          photo_url: matchedTeacher.photo_url,
        },
      };
    }

    // 5. Staff / Driver
    const staffList = storageService.getItem<Staff[]>(STORAGE_KEYS.STAFF, INITIAL_STAFF);
    const anyStaff = staffList.find((st) => {
      const emailMatch = st.email.toLowerCase() === rawLower;
      const empMatch = st.employee_number && st.employee_number.toLowerCase() === rawLower;
      const phoneMatch = st.phone && (st.phone === rawId || st.phone.replace(/\D/g, '') === rawId.replace(/\D/g, ''));
      const schoolMatch = !targetSchool || st.school_id === targetSchool.id;
      return (emailMatch || empMatch || phoneMatch) && schoolMatch;
    });

    if (anyStaff && (anyStaff.status !== 'active' || anyStaff.portal_access === false)) {
      return {
        exists: false,
        error: 'Portal access has been disabled for this staff account. Please contact your school administrator.',
      };
    }

    const matchedStaff = anyStaff?.status === 'active' && anyStaff.portal_access !== false ? anyStaff : undefined;

    if (matchedStaff) {
      const sch = schools.find((s) => s.id === matchedStaff.school_id) || targetSchool || schools[0];
      const isDriver = matchedStaff.staff_type === 'driver';
      return {
        exists: true,
        user: {
          id: `usr-${matchedStaff.id}`,
          name: `${matchedStaff.first_name} ${matchedStaff.last_name}`,
          email: matchedStaff.email,
          role: isDriver ? 'driver' : 'staff',
          school_id: sch?.id,
          school_name: sch?.name,
          school_code: sch?.code,
          staff_id: matchedStaff.id,
          driver_id: isDriver ? matchedStaff.id : undefined,
          login_id: matchedStaff.employee_number,
          photo_url: matchedStaff.photo_url,
        },
      };
    }

    // 6. Parent
    const parents = storageService.getItem<ParentProfile[]>(STORAGE_KEYS.PARENTS, INITIAL_PARENTS);
    const matchedParent = parents.find((p) => {
      const emailMatch = p.email && p.email.toLowerCase() === rawLower;
      const schoolMatch = !targetSchool || p.school_id === targetSchool.id;
      return emailMatch && schoolMatch && p.status === 'active';
    });

    if (matchedParent) {
      const sch = schools.find((s) => s.id === matchedParent.school_id) || schools[0];
      return {
        exists: true,
        user: {
          id: matchedParent.auth_user_id || `usr-${matchedParent.id}`,
          name: matchedParent.guardian_name,
          email: matchedParent.email,
          role: 'parent',
          school_id: sch?.id,
          school_name: sch?.name,
          school_code: sch?.code,
          parent_id: matchedParent.id,
          photo_url: (matchedParent as any).photo_url,
        },
      };
    }

    return {
      exists: false,
      userNotFound: true,
      suggestGoogle: true,
      error: `No registered account found with "${identifier}". If you are new, please continue with Google to create your account.`,
    };
  },

  async authenticateWithIdentifierAndPassword(
    identifier: string,
    password: string,
    schoolCode?: string
  ): Promise<{ success: boolean; user?: UserPersona; redirectUrl?: string; error?: string }> {
    const rawId = identifier.trim().replace(/[\u2010-\u2015\u2212\uFE58\uFE63\uFF0D]/g, '-');
    const rawLower = rawId.toLowerCase();
    const rawCode = (schoolCode || '').trim().toUpperCase();
    const isEmail = rawId.includes('@');
    const rateKey = `auth_unified_${rawLower}`;

    const rateCheck = checkRateLimit(rateKey);
    if (!rateCheck.isAllowed) {
      authLogService.logEvent({
        email: isEmail ? rawLower : undefined,
        registration_identifier: !isEmail ? rawId : undefined,
        event_type: 'rate_limited',
        success: false,
        details: { retryAfterSeconds: rateCheck.retryAfterSeconds },
      });
      return {
        success: false,
        error: `Too many failed attempts. Cooldown active for ${rateCheck.retryAfterSeconds}s.`,
      };
    }

    const schools = storageService.getItem<School[]>(STORAGE_KEYS.SCHOOLS, INITIAL_SCHOOLS);
    const targetSchool = rawCode ? schools.find((s) => s.code.toUpperCase() === rawCode) : null;

    // 1. Super Admin Check
    const isHardcodedSuperAdmin =
      rawLower === 'superadmin@platform.erp' ||
      rawLower === 'superadmin@schoolerp.com' ||
      rawLower === 'pay.laxmikant@gmail.com' ||
      rawLower === 'superadmin' ||
      rawLower === 'admin';

    const passwordsMap = userPasswordService.getPasswordsMap();
    const isSuperInPasswordMap =
      Boolean(passwordsMap[rawLower]) &&
      Boolean(
        passwordsMap['superadmin'] === passwordsMap[rawLower] ||
        passwordsMap['usr-super-01'] === passwordsMap[rawLower] ||
        passwordsMap['pay.laxmikant@gmail.com'] === passwordsMap[rawLower]
      );

    if (isHardcodedSuperAdmin || isSuperInPasswordMap) {
      const superUser: UserPersona = {
        id: 'usr-super-01',
        name: 'Super Admin',
        email: rawLower.includes('@') ? rawLower : 'pay.laxmikant@gmail.com',
        role: 'super_admin',
      };
      const isPassValid = await userPasswordService.verifyUserPassword(superUser, password);
      if (!isPassValid) {
        recordFailedAttempt(rateKey);
        return { success: false, error: 'Invalid password. Please try again.' };
      }

      resetRateLimit(rateKey);
      authLogService.logEvent({
        email: superUser.email,
        event_type: 'login_success',
        success: true,
        role: 'super_admin',
        user_name: 'Super Admin',
      });

      return {
        success: true,
        user: superUser,
        redirectUrl: '/super-admin',
      };
    }

    // 2. School Admin Check
    const adminSchool = schools.find((s) => {
      const adminEmails = (s.admin_email || '')
        .split(',')
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean);
      const schoolEmail = s.email?.toLowerCase();
      const genericAdmin = `admin@${s.code.toLowerCase()}.edu.in`;
      return (
        adminEmails.includes(rawLower) ||
        schoolEmail === rawLower ||
        rawLower === genericAdmin ||
        s.phone === rawId ||
        (targetSchool && s.id === targetSchool.id && (rawLower === 'admin' || rawLower === s.code.toLowerCase()))
      );
    });

    if (adminSchool) {
      if (adminSchool.status === 'suspended') {
        return { success: false, error: 'Your school access is currently suspended. Please contact platform support.' };
      }

      const adminEmails = (adminSchool.admin_email || '')
        .split(',')
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean);
      const matchedEmail = adminEmails.find((e) => e === rawLower) || adminEmails[0] || adminSchool.email || `admin@${adminSchool.code.toLowerCase()}.edu.in`;

      const adminUser: UserPersona = {
        id: `usr-admin-${adminSchool.id}`,
        name: adminSchool.admin_name || `${adminSchool.name} Administrator`,
        email: matchedEmail,
        role: 'school_admin',
        school_id: adminSchool.id,
        school_name: adminSchool.name,
        school_code: adminSchool.code,
        avatar: '👩‍🏫',
      };

      const isPassValid = await userPasswordService.verifyUserPassword(adminUser, password);
      if (!isPassValid) {
        recordFailedAttempt(rateKey);
        return { success: false, error: 'Invalid password. Please check your credentials.' };
      }

      resetRateLimit(rateKey);
      authLogService.logEvent({
        school_id: adminSchool.id,
        school_name: adminSchool.name,
        email: adminUser.email,
        event_type: 'login_success',
        success: true,
        role: 'school_admin',
        user_name: adminUser.name,
      });

      return {
        success: true,
        user: adminUser,
        redirectUrl: '/admin',
      };
    }

    // 3. Student Check (Registration Number, Guardian Email, or Guardian Phone)
    const students = storageService.getItem<Student[]>(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS);
    const anyStudent = students.find((s) => {
      const sReg = s.registration_number.replace(/[\u2010-\u2015\u2212\uFE58\uFE63\uFF0D]/g, '-').toLowerCase();
      const regMatch = sReg === rawLower;
      const guardianEmailMatch = s.guardian?.email && s.guardian.email.toLowerCase() === rawLower;
      const guardianPhoneMatch =
        (s.guardian?.primary_phone && (s.guardian.primary_phone === rawId || s.guardian.primary_phone.replace(/\D/g, '') === rawId.replace(/\D/g, ''))) ||
        (s.guardian?.secondary_phone && (s.guardian.secondary_phone === rawId || s.guardian.secondary_phone.replace(/\D/g, '') === rawId.replace(/\D/g, '')));
      const schoolMatch = !targetSchool || s.school_id === targetSchool.id;
      return (regMatch || guardianEmailMatch || guardianPhoneMatch) && schoolMatch;
    });

    if (anyStudent && anyStudent.status !== 'active') {
      return { success: false, error: `This student account (${anyStudent.registration_number}) has been deactivated or suspended. Please contact your school administrator.` };
    }

    let matchedStudent = anyStudent?.status === 'active' ? anyStudent : undefined;

    if (!matchedStudent && typeof window !== 'undefined') {
      try {
        const queryParams = new URLSearchParams({ identifier: rawId });
        if (rawCode) queryParams.set('schoolCode', rawCode);
        const res = await fetch(`/api/auth/lookup?${queryParams.toString()}`);
        if (res.ok) {
          const lookup = await res.json();
          if (lookup.isDeactivated) {
            return { success: false, error: lookup.error || 'This student account has been deactivated or suspended. Please contact your school administrator.' };
          }
          if (lookup.success && lookup.exists && lookup.studentData) {
            matchedStudent = lookup.studentData;
            // Cache student and school locally so subsequent operations and dashboards succeed
            const currentStudents = storageService.getItem<Student[]>(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS);
            if (!currentStudents.some((s) => s.id === lookup.studentData.id)) {
              currentStudents.push(lookup.studentData);
              storageService.setItem(STORAGE_KEYS.STUDENTS, currentStudents);
            }
            if (lookup.schoolData) {
              const currentSchools = storageService.getItem<School[]>(STORAGE_KEYS.SCHOOLS, INITIAL_SCHOOLS);
              if (!currentSchools.some((s) => s.id === lookup.schoolData.id)) {
                currentSchools.push(lookup.schoolData);
                storageService.setItem(STORAGE_KEYS.SCHOOLS, currentSchools);
              }
            }
          }
        }
      } catch (err) {
        console.warn('Server student login lookup warning:', err);
      }
    }

    if (matchedStudent) {
      const sch = schools.find((s) => s.id === matchedStudent.school_id) || targetSchool || schools[0];
      if (sch?.status === 'suspended') {
        return { success: false, error: 'Your school access is currently suspended. Please contact your school administrator.' };
      }

      const studentUser: UserPersona = {
        id: `usr-${matchedStudent.id}`,
        name: `${matchedStudent.first_name} ${matchedStudent.last_name}`,
        email: matchedStudent.guardian?.email,
        role: 'student',
        school_id: sch?.id,
        school_name: sch?.name,
        school_code: sch?.code,
        student_id: matchedStudent.id,
        login_id: matchedStudent.registration_number,
        photo_url: matchedStudent.photo_url,
        avatar: '🎒',
      };

      const isPassValid = await userPasswordService.verifyUserPassword(studentUser, password);
      if (!isPassValid) {
        recordFailedAttempt(rateKey);
        return { success: false, error: 'Invalid password. Please check your credentials.' };
      }

      resetRateLimit(rateKey);
      authLogService.logEvent({
        school_id: sch?.id,
        school_name: sch?.name,
        registration_identifier: matchedStudent.registration_number,
        user_id: matchedStudent.id,
        event_type: 'login_success',
        success: true,
        role: 'student',
        user_name: studentUser.name,
      });

      return {
        success: true,
        user: studentUser,
        redirectUrl: '/student',
      };
    }

    // 4. Teacher Check (Email, Phone, Employee ID)
    const teachers = storageService.getItem<Teacher[]>(STORAGE_KEYS.TEACHERS, INITIAL_TEACHERS);
    const anyTeacher = teachers.find((t) => {
      const emailMatch = t.email.toLowerCase() === rawLower;
      const phoneMatch = t.phone && (t.phone === rawId || t.phone.replace(/\D/g, '') === rawId.replace(/\D/g, ''));
      const empMatch = t.employee_number && t.employee_number.toLowerCase() === rawLower;
      const schoolMatch = !targetSchool || t.school_id === targetSchool.id;
      return (emailMatch || phoneMatch || empMatch) && schoolMatch;
    });

    if (anyTeacher && anyTeacher.status !== 'active') {
      return { success: false, error: 'This teacher account has been deactivated. Please contact your school administrator.' };
    }

    const matchedTeacher = anyTeacher?.status === 'active' ? anyTeacher : undefined;

    if (matchedTeacher) {
      const sch = schools.find((s) => s.id === matchedTeacher.school_id) || targetSchool || schools[0];
      if (sch?.status === 'suspended') {
        return { success: false, error: 'Your school access is currently suspended. Please contact your school administrator.' };
      }

      const teacherUser: UserPersona = {
        id: `usr-${matchedTeacher.id}`,
        name: `${matchedTeacher.first_name} ${matchedTeacher.last_name}`,
        email: matchedTeacher.email,
        role: 'teacher',
        school_id: sch?.id,
        school_name: sch?.name,
        school_code: sch?.code,
        teacher_id: matchedTeacher.id,
        login_id: matchedTeacher.employee_number,
        photo_url: matchedTeacher.photo_url,
        avatar: '👨‍🏫',
      };

      const isPassValid = await userPasswordService.verifyUserPassword(teacherUser, password);
      if (!isPassValid) {
        recordFailedAttempt(rateKey);
        return { success: false, error: 'Invalid password. Please check your credentials.' };
      }

      resetRateLimit(rateKey);
      authLogService.logEvent({
        school_id: sch?.id,
        school_name: sch?.name,
        email: matchedTeacher.email,
        event_type: 'login_success',
        success: true,
        role: 'teacher',
        user_name: teacherUser.name,
      });

      return {
        success: true,
        user: teacherUser,
        redirectUrl: '/teacher',
      };
    }

    // 5. Staff / Driver Check (Email, Phone, Employee ID)
    const staffList = storageService.getItem<Staff[]>(STORAGE_KEYS.STAFF, INITIAL_STAFF);
    const anyStaff = staffList.find((st) => {
      const emailMatch = st.email.toLowerCase() === rawLower;
      const phoneMatch = st.phone && (st.phone === rawId || st.phone.replace(/\D/g, '') === rawId.replace(/\D/g, ''));
      const empMatch = st.employee_number && st.employee_number.toLowerCase() === rawLower;
      const schoolMatch = !targetSchool || st.school_id === targetSchool.id;
      return (emailMatch || phoneMatch || empMatch) && schoolMatch;
    });

    if (anyStaff && (anyStaff.status !== 'active' || anyStaff.portal_access === false)) {
      return { success: false, error: 'Portal access has been disabled for this staff account. Please contact your school administrator.' };
    }

    const matchedStaff = anyStaff?.status === 'active' && anyStaff.portal_access !== false ? anyStaff : undefined;

    if (matchedStaff) {
      const sch = schools.find((s) => s.id === matchedStaff.school_id) || targetSchool || schools[0];
      if (sch?.status === 'suspended') {
        return { success: false, error: 'Your school access is currently suspended. Please contact your school administrator.' };
      }

      const isDriver = matchedStaff.staff_type === 'driver';
      const staffUser: UserPersona = {
        id: `usr-${matchedStaff.id}`,
        name: `${matchedStaff.first_name} ${matchedStaff.last_name}`,
        email: matchedStaff.email,
        role: isDriver ? 'driver' : 'staff',
        school_id: sch?.id,
        school_name: sch?.name,
        school_code: sch?.code,
        staff_id: matchedStaff.id,
        driver_id: isDriver ? matchedStaff.id : undefined,
        login_id: matchedStaff.employee_number,
        photo_url: matchedStaff.photo_url,
        avatar: isDriver ? '🚌' : '👔',
        permissions: matchedStaff.permissions,
      };

      const isPassValid = await userPasswordService.verifyUserPassword(staffUser, password);
      if (!isPassValid) {
        recordFailedAttempt(rateKey);
        return { success: false, error: 'Invalid password. Please check your credentials.' };
      }

      resetRateLimit(rateKey);
      authLogService.logEvent({
        school_id: sch?.id,
        school_name: sch?.name,
        email: matchedStaff.email,
        event_type: 'login_success',
        success: true,
        role: staffUser.role,
        user_name: staffUser.name,
      });

      return {
        success: true,
        user: staffUser,
        redirectUrl: isDriver ? '/driver' : '/staff',
      };
    }

    // 6. Parent Check (Email, Primary/Secondary Phone)
    const parents = storageService.getItem<ParentProfile[]>(STORAGE_KEYS.PARENTS, INITIAL_PARENTS);
    const matchedParent = parents.find((p) => {
      const emailMatch = p.email && p.email.toLowerCase() === rawLower;
      const phoneMatch =
        (p.primary_phone && (p.primary_phone === rawId || p.primary_phone.replace(/\D/g, '') === rawId.replace(/\D/g, ''))) ||
        (p.secondary_phone && (p.secondary_phone === rawId || p.secondary_phone.replace(/\D/g, '') === rawId.replace(/\D/g, '')));
      return (emailMatch || phoneMatch) && p.status === 'active';
    });

    if (matchedParent) {
      const sch = schools.find((s) => s.id === matchedParent.school_id) || schools[0];
      const parentUser: UserPersona = {
        id: matchedParent.auth_user_id || `usr-${matchedParent.id}`,
        name: matchedParent.guardian_name,
        email: matchedParent.email,
        role: 'parent',
        school_id: sch?.id,
        school_name: sch?.name,
        school_code: sch?.code,
        parent_id: matchedParent.id,
        login_id: `PRT-${matchedParent.id.slice(-3)}`,
        photo_url: matchedParent.photo_url,
        avatar: '👨‍👩‍👧',
      };

      const isPassValid = await userPasswordService.verifyUserPassword(parentUser, password);
      if (!isPassValid) {
        recordFailedAttempt(rateKey);
        return { success: false, error: 'Invalid password. Please check your credentials.' };
      }

      resetRateLimit(rateKey);
      authLogService.logEvent({
        school_id: sch?.id,
        school_name: sch?.name,
        email: matchedParent.email,
        event_type: 'login_success',
        success: true,
        role: 'parent',
        user_name: parentUser.name,
      });

      return {
        success: true,
        user: parentUser,
        redirectUrl: '/parent',
      };
    }

    // Not found
    recordFailedAttempt(rateKey);
    authLogService.logEvent({
      email: isEmail ? rawLower : undefined,
      registration_identifier: !isEmail ? rawId : undefined,
      event_type: 'login_failure',
      success: false,
      details: { reason: 'User not found in any registered school role' },
    });

    return {
      success: false,
      error: 'Account not found. Please check your registered email, registration number, or mobile number.',
    };
  },
};

// ============================================================================
// 2. STAFF SERVICE & GRANULAR PERMISSIONS
// ============================================================================

export const staffService = {
  async getStaff(
    schoolId: string,
    filters?: { staffType?: StaffType; status?: GeneralStatus; department?: string; search?: string }
  ): Promise<Staff[]> {
    try {
      if (typeof window !== 'undefined') {
        const res = await fetch(`/api/staff?schoolId=${schoolId}`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data) && json.data.length > 0) {
            storageService.setItem(STORAGE_KEYS.STAFF, json.data);
            let serverList: Staff[] = json.data;
            if (filters?.staffType) serverList = serverList.filter((s) => s.staff_type === filters.staffType);
            if (filters?.status) serverList = serverList.filter((s) => s.status === filters.status);
            if (filters?.department) serverList = serverList.filter((s) => s.department === filters.department);
            if (filters?.search) {
              const q = filters.search.toLowerCase();
              serverList = serverList.filter(
                (s) =>
                  (s.first_name || '').toLowerCase().includes(q) ||
                  (s.last_name || '').toLowerCase().includes(q) ||
                  (s.email || '').toLowerCase().includes(q) ||
                  (s.phone || '').includes(q) ||
                  (s.employee_number || '').toLowerCase().includes(q)
              );
            }
            return serverList.sort((a, b) => (a.first_name || '').localeCompare(b.first_name || ''));
          }
        }
      }
    } catch (e) {
      console.warn('API staff fetch fallback:', e);
    }

    let list = storageService.getItem<Staff[]>(STORAGE_KEYS.STAFF, INITIAL_STAFF).filter((s) => s.school_id === schoolId);

    if (filters?.staffType) {
      list = list.filter((s) => s.staff_type === filters.staffType);
    }
    if (filters?.status) {
      list = list.filter((s) => s.status === filters.status);
    }
    if (filters?.department) {
      list = list.filter((s) => s.department === filters.department);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        (s) =>
          (s.first_name || '').toLowerCase().includes(q) ||
          (s.last_name || '').toLowerCase().includes(q) ||
          (s.email || '').toLowerCase().includes(q) ||
          (s.phone || '').includes(q) ||
          (s.employee_number || '').toLowerCase().includes(q)
      );
    }

    return list.sort((a, b) => (a.first_name || '').localeCompare(b.first_name || ''));
  },

  async getStaffById(id: string): Promise<Staff | null> {
    const list = storageService.getItem<Staff[]>(STORAGE_KEYS.STAFF, INITIAL_STAFF);
    return list.find((s) => s.id === id) || null;
  },

  async createStaff(
    schoolId: string,
    staffData: Omit<Staff, 'id' | 'school_id' | 'created_at' | 'updated_at' | 'status'> & {
      status?: Staff['status'];
    },
    schoolCode?: string
  ): Promise<Staff> {
    const list = storageService.getItem<Staff[]>(STORAGE_KEYS.STAFF, INITIAL_STAFF);
    const employeeNumber = await schoolIdentifierService.nextStaffNumber(schoolId, schoolCode);

    // Centralized email and domain validation
    const emailCheck = await emailValidationService.verifyEmailAvailability(staffData.email, {
      targetSchoolId: schoolId,
      targetRole: staffData.staff_type,
    });
    if (!emailCheck.isValid || !emailCheck.isAvailable) {
      throw new Error(emailCheck.error || `Invalid or duplicate email "${staffData.email}".`);
    }

    // Email conflict check inside school
    const conflict = list.find(
      (s) => s.school_id === schoolId && s.email.toLowerCase() === staffData.email.toLowerCase()
    );
    if (conflict) {
      throw new Error(`Staff with email "${staffData.email}" already exists.`);
    }
    if (list.some((staff) => staff.school_id === schoolId && staff.employee_number?.toUpperCase() === employeeNumber.toUpperCase())) {
      throw new Error(`Staff employee ID "${employeeNumber}" already exists.`);
    }

    const newStaff: Staff = {
      ...staffData,
      employee_number: employeeNumber,
      id: `stf-${Date.now().toString().slice(-4)}`,
      school_id: schoolId,
      status: staffData.status || 'active',
      portal_access: staffData.portal_access ?? false,
      permissions: staffData.permissions || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    try {
      if (typeof window !== 'undefined') {
        const res = await fetch('/api/staff', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...newStaff, school_id: schoolId }),
        });
        const json = await res.json();
        if (!res.ok || !json.success || !json.data) {
          throw new Error(json.error || 'Could not save staff to database.');
        }
        Object.assign(newStaff, json.data);
      }
    } catch (e) {
      throw e instanceof Error ? e : new Error('Could not save staff to database.');
    }

    list.push(newStaff);
    storageService.setItem(STORAGE_KEYS.STAFF, list);

    // If salary provided, log initial salary history
    if (staffData.salary && staffData.salary > 0) {
      const salHist = storageService.getItem<EmployeeSalaryHistory[]>(
        STORAGE_KEYS.EMPLOYEE_SALARY_HISTORY,
        INITIAL_EMPLOYEE_SALARY_HISTORY
      );
      salHist.push({
        id: `sal-${Date.now().toString().slice(-4)}`,
        school_id: schoolId,
        employee_id: newStaff.id,
        employee_type: 'staff',
        amount: staffData.salary,
        effective_from: staffData.joining_date || new Date().toISOString().split('T')[0],
        effective_to: null,
        reason: 'Initial joining salary appointment',
        created_at: new Date().toISOString(),
      });
      storageService.setItem(STORAGE_KEYS.EMPLOYEE_SALARY_HISTORY, salHist);
    }

    return newStaff;
  },

  async updateStaff(
    id: string,
    data: Partial<Staff>,
    actorId?: string,
    actorName?: string
  ): Promise<Staff> {
    const list = storageService.getItem<Staff[]>(STORAGE_KEYS.STAFF, INITIAL_STAFF);
    const index = list.findIndex((s) => s.id === id);
    if (index === -1) throw new Error('Staff member not found');

    list[index] = {
      ...list[index],
      ...data,
      updated_at: new Date().toISOString(),
    };

    try {
      if (typeof window !== 'undefined') {
        const res = await fetch(`/api/staff/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        const json = await res.json();
        if (!res.ok || !json.success || !json.data) {
          throw new Error(json.error || 'Could not update staff in database.');
        }
        list[index] = { ...list[index], ...json.data };
      }
    } catch (e) {
      throw e instanceof Error ? e : new Error('Could not update staff in database.');
    }

    storageService.setItem(STORAGE_KEYS.STAFF, list);

    authLogService.logEvent({
      school_id: list[index].school_id,
      user_id: id,
      event_type: 'staff_updated',
      success: true,
      role: 'school_admin',
      user_name: actorName || 'School Administrator',
      details: { staffName: `${list[index].first_name} ${list[index].last_name}`, changes: Object.keys(data) },
    });

    return list[index];
  },

  async updateStaffSalary(
    staffId: string,
    newSalary: number,
    effectiveFrom: string,
    reason = 'Annual Increment',
    actorId?: string,
    actorName?: string
  ): Promise<Staff> {
    const list = storageService.getItem<Staff[]>(STORAGE_KEYS.STAFF, INITIAL_STAFF);
    const index = list.findIndex((s) => s.id === staffId);
    if (index === -1) throw new Error('Staff member not found');

    const salHist = storageService.getItem<EmployeeSalaryHistory[]>(
      STORAGE_KEYS.EMPLOYEE_SALARY_HISTORY,
      INITIAL_EMPLOYEE_SALARY_HISTORY
    );

    // Close any previous open salary record
    const lastOpenIndex = salHist.findIndex((h) => h.employee_id === staffId && !h.effective_to);
    if (lastOpenIndex !== -1) {
      salHist[lastOpenIndex].effective_to = effectiveFrom;
    }

    // Add new salary history
    salHist.push({
      id: `sal-${Date.now().toString().slice(-4)}`,
      school_id: list[index].school_id,
      employee_id: staffId,
      employee_type: 'staff',
      amount: newSalary,
      effective_from: effectiveFrom,
      effective_to: null,
      reason,
      created_by: actorId,
      created_at: new Date().toISOString(),
    });
    storageService.setItem(STORAGE_KEYS.EMPLOYEE_SALARY_HISTORY, salHist);

    list[index].salary = newSalary;
    list[index].updated_at = new Date().toISOString();
    storageService.setItem(STORAGE_KEYS.STAFF, list);

    authLogService.logEvent({
      school_id: list[index].school_id,
      user_id: staffId,
      event_type: 'teacher_salary_changed',
      success: true,
      role: 'school_admin',
      user_name: actorName || 'School Administrator',
      details: { staffName: `${list[index].first_name} ${list[index].last_name}`, newSalary, effectiveFrom, reason },
    });

    return list[index];
  },

  async getStaffSalaryHistory(staffId: string): Promise<EmployeeSalaryHistory[]> {
    const list = storageService.getItem<EmployeeSalaryHistory[]>(
      STORAGE_KEYS.EMPLOYEE_SALARY_HISTORY,
      INITIAL_EMPLOYEE_SALARY_HISTORY
    );
    return list
      .filter((h) => h.employee_id === staffId)
      .sort((a, b) => b.effective_from.localeCompare(a.effective_from));
  },

  async togglePortalAccess(staffId: string, portalAccess: boolean, actorName?: string): Promise<Staff> {
    return this.updateStaff(staffId, { portal_access: portalAccess }, undefined, actorName);
  },

  async updateStaffPermissions(id: string, permissions: StaffPermission[], actorName?: string): Promise<Staff> {
    const updated = await this.updateStaff(id, { permissions }, undefined, actorName);
    authLogService.logEvent({
      school_id: updated.school_id,
      user_id: id,
      event_type: 'staff_permission_changed',
      success: true,
      role: 'school_admin',
      user_name: actorName || 'School Administrator',
      details: { staffName: `${updated.first_name} ${updated.last_name}`, permissions },
    });
    return updated;
  },

  async deleteStaff(id: string, actorName: string = 'School Administrator', actorRole: UserRole = 'school_admin'): Promise<void> {
    let list = storageService.getItem<Staff[]>(STORAGE_KEYS.STAFF, INITIAL_STAFF);
    const target = list.find((s) => s.id === id);
    if (!target) return;

    // School Admins can only DEACTIVATE, not delete
    if (actorRole !== 'super_admin') {
      await this.updateStaff(id, { status: 'inactive', portal_access: false }, undefined, actorName);
      authLogService.logEvent({
        school_id: target.school_id,
        event_type: 'staff_updated',
        success: true,
        role: actorRole,
        user_name: actorName,
        details: {
          action: 'deactivate_staff',
          reason: 'School Admins can only deactivate staff profiles to preserve payroll and institutional records.',
          staffId: id,
          staffName: `${target.first_name} ${target.last_name}`,
        },
      });
      return;
    }

    // Super Admin: Move to 30-Day Recycle Bin
    try {
      if (typeof window !== 'undefined') {
        await fetch(`/api/staff/${id}`, { method: 'DELETE' });
      }
    } catch (e) {}

    await recycleBinService.moveToBin({
      schoolId: target.school_id,
      entityType: 'staff',
      entityId: target.id,
      entityName: `${target.first_name} ${target.last_name}`,
      entityDetails: `Staff #${target.employee_number || target.id} • ${target.staff_type?.toUpperCase() || 'OFFICE STAFF'}`,
      originalData: target,
      deletedByName: actorName,
      deletedByRole: actorRole,
    });
    list = list.filter((s) => s.id !== id);
    storageService.setItem(STORAGE_KEYS.STAFF, list);

    const schools = storageService.getItem<School[]>(STORAGE_KEYS.SCHOOLS, []);
    const schIdx = schools.findIndex((s) => s.id === target.school_id);
    if (schIdx !== -1) {
      schools[schIdx].staff_count = Math.max(0, (schools[schIdx].staff_count || 1) - 1);
      storageService.setItem(STORAGE_KEYS.SCHOOLS, schools);
    }
  },
};

// ============================================================================
// 3. SECURITY & AUTH EVENT LOGS SERVICE
// ============================================================================

export const authLogService = {
  logEvent(eventData: Omit<AuthEvent, 'id' | 'created_at'>): AuthEvent {
    const events = storageService.getItem<AuthEvent[]>(STORAGE_KEYS.AUTH_EVENTS, INITIAL_AUTH_EVENTS);
    const newEvent: AuthEvent = {
      ...eventData,
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      created_at: new Date().toISOString(),
    };
    events.unshift(newEvent);
    if (events.length > 500) events.pop();
    storageService.setItem(STORAGE_KEYS.AUTH_EVENTS, events);
    return newEvent;
  },

  async getEvents(
    filter?: { schoolId?: string; eventType?: string; success?: boolean; role?: string; limit?: number }
  ): Promise<AuthEvent[]> {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams();
      if (filter?.schoolId) params.set('schoolId', filter.schoolId);
      if (filter?.eventType) params.set('eventType', filter.eventType);
      if (filter?.role) params.set('role', filter.role);
      if (filter?.limit) params.set('limit', String(filter.limit));
      const response = await fetch(`/api/auth/events?${params}`, { cache: 'no-store' });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to load authentication events');
      return result.data || [];
    }
    let list = storageService.getItem<AuthEvent[]>(STORAGE_KEYS.AUTH_EVENTS, INITIAL_AUTH_EVENTS);
    if (filter?.schoolId) list = list.filter((e) => e.school_id === filter.schoolId);
    if (filter?.eventType) list = list.filter((e) => e.event_type === filter.eventType);
    if (filter?.success !== undefined) list = list.filter((e) => e.success === filter.success);
    if (filter?.role) list = list.filter((e) => e.role === filter.role);

    const limit = filter?.limit || 100;
    return list.slice(0, limit);
  },

  async getLogs(
    filter?: { schoolId?: string; eventType?: string; success?: boolean; role?: string; limit?: number }
  ): Promise<AuthEvent[]> {
    return this.getEvents(filter);
  },
};

// ============================================================================
// 4. ROOM MANAGEMENT SERVICE (Classrooms, Labs, Library)
// ============================================================================

export const roomService = {
  async getRooms(schoolId: string, type?: RoomType): Promise<SchoolRoom[]> {
    try {
      if (typeof window !== 'undefined') {
        const res = await fetch(`/api/rooms?schoolId=${encodeURIComponent(schoolId)}`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data) && json.data.length > 0) {
            const allRooms = storageService.getItem<SchoolRoom[]>(STORAGE_KEYS.ROOMS, INITIAL_ROOMS);
            const otherRooms = allRooms.filter((r) => r.school_id !== schoolId);
            storageService.setItem(STORAGE_KEYS.ROOMS, [...otherRooms, ...json.data]);
          }
        }
      }
    } catch {}

    let list = storageService.getItem<SchoolRoom[]>(STORAGE_KEYS.ROOMS, INITIAL_ROOMS).filter(
      (r) => r.school_id === schoolId
    );

    if (type) list = list.filter((r) => r.type === type);
    return list.sort((a, b) => a.room_number.localeCompare(b.room_number));
  },

  async getRoomById(id: string): Promise<SchoolRoom | null> {
    const list = storageService.getItem<SchoolRoom[]>(STORAGE_KEYS.ROOMS, INITIAL_ROOMS);
    return list.find((r) => r.id === id) || null;
  },

  async createRoom(data: Omit<SchoolRoom, 'id' | 'created_at'>): Promise<SchoolRoom> {
    const list = storageService.getItem<SchoolRoom[]>(STORAGE_KEYS.ROOMS, INITIAL_ROOMS);
    const newRoom: SchoolRoom = {
      ...data,
      id: `rm-${Date.now().toString().slice(-4)}`,
      created_at: new Date().toISOString(),
    };
    list.push(newRoom);
    storageService.setItem(STORAGE_KEYS.ROOMS, list);
    return newRoom;
  },

  async updateRoom(id: string, data: Partial<SchoolRoom>): Promise<SchoolRoom> {
    const list = storageService.getItem<SchoolRoom[]>(STORAGE_KEYS.ROOMS, INITIAL_ROOMS);
    const index = list.findIndex((r) => r.id === id);
    if (index === -1) throw new Error('Room not found');
    list[index] = { ...list[index], ...data };
    storageService.setItem(STORAGE_KEYS.ROOMS, list);
    return list[index];
  },

  async deleteRoom(id: string, actorName = 'School Administrator', actorRole: UserRole = 'school_admin'): Promise<void> {
    let list = storageService.getItem<SchoolRoom[]>(STORAGE_KEYS.ROOMS, INITIAL_ROOMS);
    const target = list.find((r) => r.id === id);
    if (target) {
      await recycleBinService.moveToBin({
        schoolId: target.school_id,
        entityType: 'room',
        entityId: target.id,
        entityName: `Room ${target.room_number}`,
        entityDetails: `${target.type?.toUpperCase()} • Capacity: ${target.capacity || 0} (${target.building || 'Main'})`,
        originalData: target,
        deletedByName: actorName,
        deletedByRole: actorRole,
      });
      list = list.filter((r) => r.id !== id);
      storageService.setItem(STORAGE_KEYS.ROOMS, list);
    }
  },
};

// ============================================================================
// 5. TRANSPORT SERVICE & DRIVER ROSTER
// ============================================================================

export const transportService = {
  async getVehicles(schoolId: string): Promise<Vehicle[]> {
    try {
      if (typeof window !== 'undefined') {
        const res = await fetch(`/api/vehicles?schoolId=${schoolId}`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data)) {
            storageService.setItem(STORAGE_KEYS.VEHICLES, json.data);
            return json.data;
          }
        }
      }
    } catch (e) {
      console.warn('Failed to fetch /api/vehicles, using cache:', e);
    }
    const list = storageService
      .getItem<Vehicle[]>(STORAGE_KEYS.VEHICLES, INITIAL_VEHICLES)
      .filter((v) => v.school_id === schoolId);
    return list;
  },

  async getVehicleById(id: string): Promise<Vehicle | null> {
    const list = await this.getVehicles('sch-001');
    return list.find((v) => v.id === id) || null;
  },

  async createVehicle(data: Omit<Vehicle, 'id' | 'created_at'>): Promise<Vehicle> {
    const list = storageService.getItem<Vehicle[]>(STORAGE_KEYS.VEHICLES, INITIAL_VEHICLES);
    const newVehicle: Vehicle = {
      ...data,
      id: `veh-${Date.now().toString().slice(-4)}`,
      created_at: new Date().toISOString(),
    };
    try {
      if (typeof window !== 'undefined') {
        const res = await fetch('/api/vehicles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newVehicle),
        });
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            newVehicle.id = json.data.id || newVehicle.id;
          }
        }
      }
    } catch (e) {
      console.warn('Failed to POST /api/vehicles:', e);
    }
    list.push(newVehicle);
    storageService.setItem(STORAGE_KEYS.VEHICLES, list);
    return newVehicle;
  },

  async updateVehicle(id: string, data: Partial<Vehicle>): Promise<Vehicle> {
    const list = storageService.getItem<Vehicle[]>(STORAGE_KEYS.VEHICLES, INITIAL_VEHICLES);
    const index = list.findIndex((v) => v.id === id);
    if (index !== -1) {
      list[index] = { ...list[index], ...data };
      storageService.setItem(STORAGE_KEYS.VEHICLES, list);
    }
    try {
      if (typeof window !== 'undefined') {
        await fetch(`/api/vehicles/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
      }
    } catch (e) {
      console.warn(`Failed to PUT /api/vehicles/${id}:`, e);
    }
    return index !== -1 ? list[index] : ({ id, ...data } as Vehicle);
  },

  async deleteVehicle(id: string, actorName = 'School Administrator', actorRole: UserRole = 'school_admin'): Promise<void> {
    let list = storageService.getItem<Vehicle[]>(STORAGE_KEYS.VEHICLES, INITIAL_VEHICLES);
    const target = list.find((v) => v.id === id);
    if (target) {
      try {
        if (typeof window !== 'undefined') {
          await fetch(`/api/vehicles/${id}`, { method: 'DELETE' });
        }
      } catch (e) {
        console.warn(`Failed to DELETE /api/vehicles/${id}:`, e);
      }
      await recycleBinService.moveToBin({
        schoolId: target.school_id,
        entityType: 'vehicle',
        entityId: target.id,
        entityName: `Vehicle ${target.vehicle_number || target.vehicle_name}`,
        entityDetails: `${target.vehicle_type?.toUpperCase() || 'BUS'} • Capacity: ${target.capacity || 0}`,
        originalData: target,
        deletedByName: actorName,
        deletedByRole: actorRole,
      });
      list = list.filter((v) => v.id !== id);
      storageService.setItem(STORAGE_KEYS.VEHICLES, list);
    }
  },

  async getRoutes(schoolId: string): Promise<TransportRoute[]> {
    try {
      if (typeof window !== 'undefined') {
        const [rRes, sRes] = await Promise.all([
          fetch(`/api/transport-routes?schoolId=${schoolId}`),
          fetch(`/api/transport-stops?schoolId=${schoolId}`),
        ]);
        if (rRes.ok) {
          const rJson = await rRes.json();
          const sJson = sRes.ok ? await sRes.json() : { data: [] };
          if (rJson.success && Array.isArray(rJson.data)) {
            const routes: TransportRoute[] = rJson.data;
            const stops: TransportStop[] = Array.isArray(sJson.data) ? sJson.data : [];
            storageService.setItem(STORAGE_KEYS.TRANSPORT_ROUTES, routes);
            storageService.setItem(STORAGE_KEYS.TRANSPORT_STOPS, stops);
            return routes.map((r) => ({
              ...r,
              stops: stops.filter((s) => s.route_id === r.id).sort((a, b) => a.stop_order - b.stop_order),
            }));
          }
        }
      }
    } catch (e) {
      console.warn('Failed to fetch routes from server:', e);
    }
    const routes = storageService
      .getItem<TransportRoute[]>(STORAGE_KEYS.TRANSPORT_ROUTES, INITIAL_TRANSPORT_ROUTES)
      .filter((r) => r.school_id === schoolId);
    const allStops = storageService
      .getItem<TransportStop[]>(STORAGE_KEYS.TRANSPORT_STOPS, INITIAL_TRANSPORT_STOPS);

    return routes.map((r) => ({
      ...r,
      stops: allStops.filter((s) => s.route_id === r.id).sort((a, b) => a.stop_order - b.stop_order),
    }));
  },

  async getRouteById(id: string): Promise<TransportRoute | null> {
    const routes = await this.getRoutes('sch-001');
    return routes.find((r) => r.id === id) || null;
  },

  async createRoute(
    data: Omit<TransportRoute, 'id' | 'created_at'>,
    stops?: Omit<TransportStop, 'id' | 'school_id' | 'route_id' | 'created_at'>[]
  ): Promise<TransportRoute> {
    const routes = storageService.getItem<TransportRoute[]>(STORAGE_KEYS.TRANSPORT_ROUTES, INITIAL_TRANSPORT_ROUTES);
    const allStops = storageService.getItem<TransportStop[]>(STORAGE_KEYS.TRANSPORT_STOPS, INITIAL_TRANSPORT_STOPS);

    const newRouteId = `rt-${Date.now().toString().slice(-4)}`;
    const newRoute: TransportRoute = {
      ...data,
      id: newRouteId,
      created_at: new Date().toISOString(),
    };

    try {
      if (typeof window !== 'undefined') {
        const res = await fetch('/api/transport-routes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...newRoute, stops }),
        });
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            newRoute.id = json.data.id || newRoute.id;
          }
        }
      }
    } catch (e) {
      console.warn('Failed to POST /api/transport-routes:', e);
    }

    routes.push(newRoute);
    storageService.setItem(STORAGE_KEYS.TRANSPORT_ROUTES, routes);

    if (stops && stops.length > 0) {
      for (let idx = 0; idx < stops.length; idx++) {
        const st = stops[idx];
        const newStop: TransportStop = {
          ...st,
          id: `stp-${Date.now().toString().slice(-4)}-${idx}`,
          school_id: data.school_id,
          route_id: newRoute.id,
          created_at: new Date().toISOString(),
        };
        allStops.push(newStop);
      }
      storageService.setItem(STORAGE_KEYS.TRANSPORT_STOPS, allStops);
    }

    return newRoute;
  },

  async updateRoute(
    id: string,
    data: Partial<TransportRoute>,
    stops?: TransportStop[]
  ): Promise<TransportRoute> {
    const routes = storageService.getItem<TransportRoute[]>(STORAGE_KEYS.TRANSPORT_ROUTES, INITIAL_TRANSPORT_ROUTES);
    const index = routes.findIndex((r) => r.id === id);
    if (index !== -1) {
      routes[index] = { ...routes[index], ...data, stops: stops || routes[index].stops };
      storageService.setItem(STORAGE_KEYS.TRANSPORT_ROUTES, routes);
    }

    try {
      if (typeof window !== 'undefined') {
        await fetch(`/api/transport-routes/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...data, stops }),
        });
      }
    } catch (e) {
      console.warn(`Failed to PUT /api/transport-routes/${id}:`, e);
    }

    if (stops) {
      let allStops = storageService.getItem<TransportStop[]>(STORAGE_KEYS.TRANSPORT_STOPS, INITIAL_TRANSPORT_STOPS);
      allStops = allStops.filter((s) => s.route_id !== id);
      for (const st of stops) {
        const newStop = { ...st, route_id: id };
        allStops.push(newStop);
      }
      storageService.setItem(STORAGE_KEYS.TRANSPORT_STOPS, allStops);
    }

    return index !== -1 ? routes[index] : ({ id, ...data, stops } as TransportRoute);
  },

  async deleteRoute(id: string, actorName = 'School Administrator', actorRole: UserRole = 'school_admin'): Promise<void> {
    let routes = storageService.getItem<TransportRoute[]>(STORAGE_KEYS.TRANSPORT_ROUTES, INITIAL_TRANSPORT_ROUTES);
    const target = routes.find((r) => r.id === id);
    if (target) {
      try {
        if (typeof window !== 'undefined') {
          await fetch(`/api/transport-routes/${id}`, { method: 'DELETE' });
        }
      } catch (e) {}
      await recycleBinService.moveToBin({
        schoolId: target.school_id,
        entityType: 'route',
        entityId: target.id,
        entityName: `Route ${target.route_name}`,
        entityDetails: `Code: ${target.route_code || target.id} • ${target.description || 'Active Route'}`,
        originalData: target,
        deletedByName: actorName,
        deletedByRole: actorRole,
      });
      routes = routes.filter((r) => r.id !== id);
      storageService.setItem(STORAGE_KEYS.TRANSPORT_ROUTES, routes);
    }
  },

  async getStudentAssignments(
    schoolId: string,
    filter?: { routeId?: string; vehicleId?: string; studentId?: string }
  ): Promise<StudentTransportAssignment[]> {
    try {
      if (typeof window !== 'undefined') {
        const res = await fetch(`/api/transport-assignments?schoolId=${schoolId}`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data)) {
            storageService.setItem(STORAGE_KEYS.STUDENT_TRANSPORT_ASSIGNMENTS, json.data);
            let list: StudentTransportAssignment[] = json.data;
            if (filter?.routeId) list = list.filter((a) => a.route_id === filter.routeId);
            if (filter?.vehicleId) list = list.filter((a) => a.vehicle_id === filter.vehicleId);
            if (filter?.studentId) list = list.filter((a) => a.student_id === filter.studentId);
            return list;
          }
        }
      }
    } catch (e) {}
    let list = storageService.getItem<StudentTransportAssignment[]>(
      STORAGE_KEYS.STUDENT_TRANSPORT_ASSIGNMENTS,
      INITIAL_STUDENT_TRANSPORT_ASSIGNMENTS
    ).filter((a) => a.school_id === schoolId);

    if (filter?.routeId) list = list.filter((a) => a.route_id === filter.routeId);
    if (filter?.vehicleId) list = list.filter((a) => a.vehicle_id === filter.vehicleId);
    if (filter?.studentId) list = list.filter((a) => a.student_id === filter.studentId);

    return list;
  },

  async assignStudentTransport(
    data: Omit<StudentTransportAssignment, 'id' | 'created_at'>
  ): Promise<StudentTransportAssignment> {
    let list = storageService.getItem<StudentTransportAssignment[]>(
      STORAGE_KEYS.STUDENT_TRANSPORT_ASSIGNMENTS,
      INITIAL_STUDENT_TRANSPORT_ASSIGNMENTS
    );

    list = list.filter((a) => a.student_id !== data.student_id);

    const vehicles = storageService.getItem<Vehicle[]>(STORAGE_KEYS.VEHICLES, INITIAL_VEHICLES);
    const routes = storageService.getItem<TransportRoute[]>(STORAGE_KEYS.TRANSPORT_ROUTES, INITIAL_TRANSPORT_ROUTES);
    const stops = storageService.getItem<TransportStop[]>(STORAGE_KEYS.TRANSPORT_STOPS, INITIAL_TRANSPORT_STOPS);

    const targetRoute = routes.find((r) => r.id === data.route_id);
    const targetStop = stops.find((s) => s.id === data.stop_id);
    const resolvedVehicleId = data.vehicle_id || targetRoute?.assigned_vehicle_id;
    const targetVeh = vehicles.find((v) => v.id === resolvedVehicleId) || (vehicles.length > 0 ? vehicles[0] : undefined);
    const staffList = storageService.getItem<Staff[]>(STORAGE_KEYS.STAFF, INITIAL_STAFF);
    const driver = targetVeh?.driver_id ? staffList.find((s) => s.id === targetVeh.driver_id || s.email === targetVeh.driver_id) : null;

    const newAssignment: StudentTransportAssignment = {
      ...data,
      id: `sta-${Date.now().toString().slice(-4)}`,
      city: data.city || targetStop?.city || targetRoute?.city || targetRoute?.route_name,
      vehicle_id: targetVeh?.id || data.vehicle_id || '',
      vehicle_name: targetVeh?.vehicle_name,
      vehicle_number: targetVeh?.vehicle_number,
      route_name: targetRoute?.route_name,
      stop_name: targetStop?.stop_name,
      estimated_pickup_time: targetStop?.estimated_pickup_time,
      driver_name: driver ? `${driver.first_name} ${driver.last_name}` : targetVeh?.driver_name,
      driver_phone: driver?.phone || targetVeh?.driver_phone,
      driver_photo_url: driver?.photo_url,
      created_at: new Date().toISOString(),
    };

    try {
      if (typeof window !== 'undefined') {
        const res = await fetch('/api/transport-assignments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newAssignment),
        });
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            newAssignment.id = json.data.id || newAssignment.id;
          }
        }
      }
    } catch (e) {}

    list.push(newAssignment);
    storageService.setItem(STORAGE_KEYS.STUDENT_TRANSPORT_ASSIGNMENTS, list);

    const students = storageService.getItem<Student[]>(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS);
    const sIndex = students.findIndex((s) => s.id === data.student_id);
    if (sIndex !== -1) {
      students[sIndex].transport_assignment = newAssignment;
      storageService.setItem(STORAGE_KEYS.STUDENTS, students);
    }

    return newAssignment;
  },

  async updateStudentAssignment(
    id: string,
    data: Partial<StudentTransportAssignment>
  ): Promise<StudentTransportAssignment> {
    let list = storageService.getItem<StudentTransportAssignment[]>(
      STORAGE_KEYS.STUDENT_TRANSPORT_ASSIGNMENTS,
      INITIAL_STUDENT_TRANSPORT_ASSIGNMENTS
    );
    const index = list.findIndex((a) => a.id === id);
    if (index === -1) throw new Error('Assignment not found');

    const vehicles = storageService.getItem<Vehicle[]>(STORAGE_KEYS.VEHICLES, INITIAL_VEHICLES);
    const routes = storageService.getItem<TransportRoute[]>(STORAGE_KEYS.TRANSPORT_ROUTES, INITIAL_TRANSPORT_ROUTES);
    const stops = storageService.getItem<TransportStop[]>(STORAGE_KEYS.TRANSPORT_STOPS, INITIAL_TRANSPORT_STOPS);

    const routeId = data.route_id || list[index].route_id;
    const stopId = data.stop_id || list[index].stop_id;
    const targetRoute = routes.find((r) => r.id === routeId);
    const targetStop = stops.find((s) => s.id === stopId);
    const resolvedVehicleId = data.vehicle_id || targetRoute?.assigned_vehicle_id || list[index].vehicle_id;
    const targetVeh = vehicles.find((v) => v.id === resolvedVehicleId) || (vehicles.length > 0 ? vehicles[0] : undefined);
    const staffList = storageService.getItem<Staff[]>(STORAGE_KEYS.STAFF, INITIAL_STAFF);
    const driver = targetVeh?.driver_id ? staffList.find((s) => s.id === targetVeh.driver_id || s.email === targetVeh.driver_id) : null;

    list[index] = {
      ...list[index],
      ...data,
      city: data.city || targetStop?.city || targetRoute?.city || list[index].city,
      vehicle_id: targetVeh?.id || list[index].vehicle_id || '',
      vehicle_name: targetVeh?.vehicle_name || list[index].vehicle_name,
      vehicle_number: targetVeh?.vehicle_number || list[index].vehicle_number,
      route_name: targetRoute?.route_name || list[index].route_name,
      stop_name: targetStop?.stop_name || list[index].stop_name,
      estimated_pickup_time: targetStop?.estimated_pickup_time || list[index].estimated_pickup_time,
      driver_name: driver ? `${driver.first_name} ${driver.last_name}` : targetVeh?.driver_name || list[index].driver_name,
      driver_phone: driver?.phone || targetVeh?.driver_phone || list[index].driver_phone,
      driver_photo_url: driver?.photo_url || list[index].driver_photo_url,
    };

    try {
      if (typeof window !== 'undefined') {
        await fetch(`/api/transport-assignments/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(list[index]),
        });
      }
    } catch (e) {}

    storageService.setItem(STORAGE_KEYS.STUDENT_TRANSPORT_ASSIGNMENTS, list);

    const students = storageService.getItem<Student[]>(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS);
    const sIndex = students.findIndex((s) => s.id === list[index].student_id);
    if (sIndex !== -1) {
      students[sIndex].transport_assignment = list[index];
      storageService.setItem(STORAGE_KEYS.STUDENTS, students);
    }

    return list[index];
  },

  async deleteStudentAssignment(id: string): Promise<void> {
    let list = storageService.getItem<StudentTransportAssignment[]>(
      STORAGE_KEYS.STUDENT_TRANSPORT_ASSIGNMENTS,
      INITIAL_STUDENT_TRANSPORT_ASSIGNMENTS
    );
    const target = list.find((a) => a.id === id);
    if (target) {
      try {
        if (typeof window !== 'undefined') {
          await fetch(`/api/transport-assignments/${id}`, { method: 'DELETE' });
        }
      } catch (e) {}

      list = list.filter((a) => a.id !== id);
      storageService.setItem(STORAGE_KEYS.STUDENT_TRANSPORT_ASSIGNMENTS, list);

      const students = storageService.getItem<Student[]>(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS);
      const sIndex = students.findIndex((s) => s.id === target.student_id);
      if (sIndex !== -1) {
        delete (students[sIndex] as any).transport_assignment;
        storageService.setItem(STORAGE_KEYS.STUDENTS, students);
      }
    }
  },

  async recordTransportEvent(
    data: Omit<StudentTransportEvent, 'id' | 'created_at'>
  ): Promise<StudentTransportEvent> {
    let list = storageService.getItem<StudentTransportEvent[]>(
      STORAGE_KEYS.STUDENT_TRANSPORT_EVENTS,
      INITIAL_STUDENT_TRANSPORT_EVENTS
    );

    const cutoff = Date.now() - 48 * 60 * 60 * 1000;
    const targetDate = data.event_date || new Date().toISOString().split('T')[0];
    list = list.filter((e) => {
      const eventMs = new Date(e.created_at || `${e.event_date} ${e.event_time || ''}`).getTime();
      const isOld = !isNaN(eventMs) && eventMs < cutoff;
      const isSameEvent = e.student_id === data.student_id && e.event_date === targetDate && e.event_type === data.event_type;
      return !isOld && !isSameEvent;
    });

    let newEvent: StudentTransportEvent = {
      ...data,
      id: `ste-${Date.now().toString().slice(-4)}`,
      event_date: targetDate,
      created_at: new Date().toISOString(),
    };

    try {
      if (typeof window !== 'undefined') {
        const res = await fetch('/api/transport-events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newEvent),
        });
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            newEvent = { ...newEvent, ...json.data };
          }
        }
      }
    } catch (e) {}

    list.push(newEvent);
    storageService.setItem(STORAGE_KEYS.STUDENT_TRANSPORT_EVENTS, list);
    return newEvent;
  },

  async getTodayTransportEvents(schoolId: string): Promise<StudentTransportEvent[]> {
    const today = new Date().toISOString().split('T')[0];
    try {
      if (typeof window !== 'undefined') {
        const res = await fetch(`/api/transport-events?schoolId=${schoolId}&event_date=${today}`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data)) {
            storageService.setItem(STORAGE_KEYS.STUDENT_TRANSPORT_EVENTS, json.data);
            return json.data;
          }
        }
      }
    } catch (e) {}
    return storageService
      .getItem<StudentTransportEvent[]>(STORAGE_KEYS.STUDENT_TRANSPORT_EVENTS, INITIAL_STUDENT_TRANSPORT_EVENTS)
      .filter((e) => {
        const eventMs = new Date(e.created_at || `${e.event_date} ${e.event_time || ''}`).getTime();
        return e.school_id === schoolId && e.event_date === today && (isNaN(eventMs) || eventMs >= Date.now() - 48 * 60 * 60 * 1000);
      });
  },

  async revertTransportEvent(studentId: string, eventDate?: string, eventType?: StudentTransportEvent['event_type']): Promise<void> {
    const targetDate = eventDate || new Date().toISOString().split('T')[0];
    try {
      if (typeof window !== 'undefined') {
        await fetch(`/api/transport-events?student_id=${encodeURIComponent(studentId)}&event_date=${targetDate}${eventType ? `&event_type=${eventType}` : ''}`, {
          method: 'DELETE',
        });
      }
    } catch (e) {}

    let events = storageService.getItem<StudentTransportEvent[]>(
      STORAGE_KEYS.STUDENT_TRANSPORT_EVENTS,
      INITIAL_STUDENT_TRANSPORT_EVENTS
    );
    events = events.filter((e) => !(e.student_id === studentId && e.event_date === targetDate && (!eventType || e.event_type === eventType)));
    storageService.setItem(STORAGE_KEYS.STUDENT_TRANSPORT_EVENTS, events);
  },

  /**
   * Driver Scoped Endpoint:
   * STRICT BACKEND RESTRICTION: Driver can ONLY access their own vehicle, assigned route, stops, and assigned students.
   */
  async getDriverRouteAndStudents(
    driverEmailOrId?: string,
    schoolId: string = 'sch-001',
    userPersona?: UserPersona
  ): Promise<{
    driver: Staff | null;
    vehicle: Vehicle | null;
    route: TransportRoute | null;
    routes: TransportRoute[];
    stops: TransportStop[];
    students: (Student & { stop: TransportStop; assignment: StudentTransportAssignment; todayStatus?: StudentTransportEvent })[];
  }> {
    // 0. Primary: Fetch real-time live data directly from server database API
    try {
      if (typeof window !== 'undefined') {
        const res = await fetch('/api/driver/roster');
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            return json.data;
          }
        }
      }
    } catch (e) {
      console.warn('Driver roster API fetch failed, falling back to local query:', e);
    }
    const targetEmail = (userPersona?.email || (driverEmailOrId?.includes('@') ? driverEmailOrId : '')).trim().toLowerCase();
    const targetId = userPersona?.id || driverEmailOrId || '';
    const staffList = storageService.getItem<Staff[]>(STORAGE_KEYS.STAFF, INITIAL_STAFF);

    // 1. Locate Driver Staff Profile strictly by email, ID, or employee number
    let driver =
      staffList.find(
        (s) =>
          (targetEmail && s.email?.trim().toLowerCase() === targetEmail) ||
          (targetId && (s.id === targetId || s.employee_number?.toLowerCase() === targetId.toLowerCase()))
      ) || null;

    // If driver staff profile not yet in staff table, construct real driver profile from the authenticated user persona
    if (!driver && (userPersona || targetEmail)) {
      const realName = (userPersona?.name || targetEmail.split('@')[0] || 'Driver').trim();
      const nameParts = realName.split(' ');
      driver = {
        id: userPersona?.id || `stf-${Date.now().toString().slice(-4)}`,
        school_id: schoolId || userPersona?.school_id || 'sch-001',
        first_name: nameParts[0] || 'Driver',
        last_name: nameParts.slice(1).join(' ') || '',
        email: targetEmail || userPersona?.email || '',
        phone: (userPersona as any)?.phone || '',
        staff_type: 'driver',
        department: 'Transport',
        employee_number: (userPersona as any)?.employee_number || `DRV-${Date.now().toString().slice(-4)}`,
        joining_date: new Date().toISOString().split('T')[0],
        salary: 0,
        portal_access: true,
        license_number: '',
        license_expiry: '',
        status: 'active',
        permissions: ['record_pickup', 'manage_transport'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      staffList.push(driver);
      storageService.setItem(STORAGE_KEYS.STAFF, staffList);
    }

    // 2. Fetch and resolve Vehicle assigned to this specific driver
    const rawVehicles = storageService.getItem<Vehicle[]>(STORAGE_KEYS.VEHICLES, INITIAL_VEHICLES);
    const vehicles = rawVehicles.filter(
      (v) =>
        v.vehicle_number !== 'DL-01-AB-1234' &&
        v.vehicle_number !== 'DL-01-CD-5678' &&
        v.id !== 'veh-01' &&
        v.id !== 'veh-02'
    );

    let vehicle: Vehicle | null = null;
    if (driver) {
      const driverFullName = `${driver.first_name} ${driver.last_name}`.trim().toLowerCase();
      vehicle =
        vehicles.find(
          (v) =>
            (v.driver_id && (v.driver_id === driver.id || (driver.email && v.driver_id.toLowerCase() === driver.email.toLowerCase()))) ||
            (v.driver_name && v.driver_name.trim().toLowerCase() === driverFullName)
        ) || null;
    }

    // 3. Fetch and resolve Routes assigned to this specific vehicle
    const rawRoutes = storageService.getItem<TransportRoute[]>(STORAGE_KEYS.TRANSPORT_ROUTES, INITIAL_TRANSPORT_ROUTES);
    const routes = rawRoutes.filter(
      (r) =>
        r.id !== 'rt-01' &&
        r.id !== 'rt-02' &&
        r.route_name !== 'Route 4 - North Zone' &&
        r.route_name !== 'Route 2 - Central Express'
    );

    let driverRoutes: TransportRoute[] = [];
    if (vehicle) {
      driverRoutes = routes.filter((r) => r.assigned_vehicle_id === vehicle.id);
    }

    let route: TransportRoute | null = driverRoutes[0] || null;

    // 4. Resolve Stops strictly for active route
    const rawStops = storageService.getItem<TransportStop[]>(STORAGE_KEYS.TRANSPORT_STOPS, INITIAL_TRANSPORT_STOPS);
    const allStops = rawStops.filter(
      (s) =>
        !s.id?.startsWith('stp-0') &&
        s.stop_name !== 'Main Lal Chowk (Sector 9 Gandhi Chowk)' &&
        s.stop_name !== 'Data Nagar (Station Road Metro Gate 2)'
    );

    let stops: TransportStop[] = [];
    if (route) {
      stops = (route.stops && route.stops.length > 0)
        ? route.stops
        : allStops.filter((s) => s.route_id === route.id);
    }
    stops.sort((a, b) => a.stop_order - b.stop_order);

    // 5. Resolve Students strictly assigned to this vehicle or route
    const allAssignments = storageService
      .getItem<StudentTransportAssignment[]>(
        STORAGE_KEYS.STUDENT_TRANSPORT_ASSIGNMENTS,
        INITIAL_STUDENT_TRANSPORT_ASSIGNMENTS
      )
      .filter((a) => !a.id?.startsWith('sta-0') && a.route_name !== 'Route 4 - North Zone');

    const relevantAssignments = allAssignments.filter((a) => {
      if (vehicle && a.vehicle_id === vehicle.id) return true;
      if (route && a.route_id === route.id) return true;
      return false;
    });

    const allStudents = storageService.getItem<Student[]>(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS);
    const todayStr = new Date().toISOString().split('T')[0];
    const events = storageService
      .getItem<StudentTransportEvent[]>(
        STORAGE_KEYS.STUDENT_TRANSPORT_EVENTS,
        INITIAL_STUDENT_TRANSPORT_EVENTS
      )
      .filter((e) => !e.id?.startsWith('ste-0') && e.event_date === todayStr);

    const driverStudents = relevantAssignments
      .map((asg) => {
        const student = allStudents.find((s) => s.id === asg.student_id);
        const stop = stops.find((st) => st.id === asg.stop_id) || {
          id: asg.stop_id || 'stp-default',
          school_id: schoolId,
          route_id: route?.id || 'rt-default',
          stop_name: asg.stop_name || 'Designated Pickup Stop',
          stop_order: 1,
          estimated_pickup_time: asg.estimated_pickup_time || '07:20 AM',
          created_at: new Date().toISOString(),
        };

        const todayEvt = events.find((e) => e.student_id === asg.student_id);
        if (!student) return null;
        return {
          ...student,
          stop,
          assignment: asg,
          todayStatus: todayEvt,
        };
      })
      .filter((s): s is NonNullable<typeof s> => s !== null);

    driverStudents.sort((a, b) => a.stop.stop_order - b.stop.stop_order || a.first_name.localeCompare(b.first_name));

    return {
      driver,
      vehicle,
      route,
      routes: driverRoutes,
      stops,
      students: driverStudents,
    };
  },

  async getStudentTodayTransportStatus(
    studentId: string,
    date?: string
  ): Promise<{ assignment: StudentTransportAssignment | null; todayEvent: StudentTransportEvent | null }> {
    const targetDate = date || new Date().toISOString().split('T')[0];
    const assignments = storageService.getItem<StudentTransportAssignment[]>(
      STORAGE_KEYS.STUDENT_TRANSPORT_ASSIGNMENTS,
      INITIAL_STUDENT_TRANSPORT_ASSIGNMENTS
    );
    const assignment = assignments.find((a) => a.student_id === studentId) || null;

    const events = storageService.getItem<StudentTransportEvent[]>(
      STORAGE_KEYS.STUDENT_TRANSPORT_EVENTS,
      INITIAL_STUDENT_TRANSPORT_EVENTS
    );
    const todayEvent = events.find((e) => e.student_id === studentId && e.event_date === targetDate) || null;

    return { assignment, todayEvent };
  },

  async getTransportDashboardStats(schoolId: string): Promise<{
    vehiclesActive: number;
    routesRunning: number;
    totalStudents: number;
    todayPickedUp: number;
    todayNotRiding: number;
    todayPending: number;
  }> {
    const vehicles = await this.getVehicles(schoolId);
    const routes = await this.getRoutes(schoolId);
    const assignments = await this.getStudentAssignments(schoolId);
    const todayEvents = await this.getTodayTransportEvents(schoolId);

    const pickedCount = todayEvents.filter((e) => e.event_type === 'picked_up').length;
    const notRidingCount = todayEvents.filter((e) => e.event_type === 'not_riding').length;
    const pendingCount = Math.max(0, assignments.length - pickedCount - notRidingCount);

    return {
      vehiclesActive: vehicles.filter((v) => v.status === 'active').length,
      routesRunning: routes.length,
      totalStudents: assignments.length,
      todayPickedUp: pickedCount,
      todayNotRiding: notRidingCount,
      todayPending: pendingCount,
    };
  },
};

// ============================================================================
// TEMPORARY WORK COVERAGE ASSIGNMENT SERVICE
// ============================================================================

export const temporaryAssignmentService = {
  async getAssignments(
    schoolId: string,
    filter?: { absentEmployeeId?: string; replacementEmployeeId?: string; status?: string }
  ): Promise<TemporaryAssignment[]> {
    let list = storageService.getItem<TemporaryAssignment[]>(
      STORAGE_KEYS.TEMPORARY_ASSIGNMENTS,
      INITIAL_TEMPORARY_ASSIGNMENTS
    ).filter((a) => a.school_id === schoolId);

    if (filter?.absentEmployeeId) {
      list = list.filter((a) => a.absent_employee_id === filter.absentEmployeeId);
    }
    if (filter?.replacementEmployeeId) {
      list = list.filter((a) => a.replacement_employee_id === filter.replacementEmployeeId);
    }
    if (filter?.status) {
      list = list.filter((a) => a.status === filter.status);
    }

    return list.sort((a, b) => b.created_at.localeCompare(a.created_at));
  },

  async getAssignmentById(id: string): Promise<TemporaryAssignment | null> {
    const list = storageService.getItem<TemporaryAssignment[]>(
      STORAGE_KEYS.TEMPORARY_ASSIGNMENTS,
      INITIAL_TEMPORARY_ASSIGNMENTS
    );
    return list.find((a) => a.id === id) || null;
  },

  async createAssignment(
    schoolId: string,
    assignment: Omit<TemporaryAssignment, 'id' | 'school_id' | 'created_at' | 'updated_at'>,
    currentUser?: { id?: string; name?: string }
  ): Promise<TemporaryAssignment> {
    const list = storageService.getItem<TemporaryAssignment[]>(
      STORAGE_KEYS.TEMPORARY_ASSIGNMENTS,
      INITIAL_TEMPORARY_ASSIGNMENTS
    );

    const now = new Date().toISOString();
    const newAssignment: TemporaryAssignment = {
      ...assignment,
      id: `tmp-asg-${Date.now().toString().slice(-4)}`,
      school_id: schoolId,
      status: assignment.status || 'active',
      created_by: currentUser?.id || 'usr-admin-01',
      created_by_name: currentUser?.name || 'School Administrator',
      created_at: now,
      updated_at: now,
    };

    list.unshift(newAssignment);
    storageService.setItem(STORAGE_KEYS.TEMPORARY_ASSIGNMENTS, list);

    authLogService.logEvent({
      school_id: schoolId,
      user_id: currentUser?.id,
      user_name: currentUser?.name,
      event_type: 'temporary_assignment_created',
      success: true,
      details: {
        absent_employee: assignment.absent_employee_name,
        replacement_employee: assignment.replacement_employee_name,
        duty: assignment.duty_details,
        is_emergency_override: assignment.is_emergency_override,
        override_reason: assignment.override_reason,
      },
    });

    return newAssignment;
  },

  async updateAssignment(
    id: string,
    updates: Partial<TemporaryAssignment>,
    currentUser?: { id?: string; name?: string }
  ): Promise<TemporaryAssignment> {
    const list = storageService.getItem<TemporaryAssignment[]>(
      STORAGE_KEYS.TEMPORARY_ASSIGNMENTS,
      INITIAL_TEMPORARY_ASSIGNMENTS
    );
    const index = list.findIndex((a) => a.id === id);
    if (index === -1) throw new Error('Temporary assignment not found');

    const updated: TemporaryAssignment = {
      ...list[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    list[index] = updated;
    storageService.setItem(STORAGE_KEYS.TEMPORARY_ASSIGNMENTS, list);

    authLogService.logEvent({
      school_id: updated.school_id,
      user_id: currentUser?.id,
      user_name: currentUser?.name,
      event_type: 'temporary_assignment_updated',
      success: true,
      details: { id, updates },
    });

    return updated;
  },
};

// ============================================================================
// EMPLOYEE SALARY ADJUSTMENTS SERVICE (Reimbursements & Deductions)
// ============================================================================

export const salaryAdjustmentService = {
  async getAdjustments(
    schoolId: string,
    filter?: { employeeId?: string; month?: string; type?: string; assignmentId?: string }
  ): Promise<EmployeeSalaryAdjustment[]> {
    let list = storageService.getItem<EmployeeSalaryAdjustment[]>(
      STORAGE_KEYS.EMPLOYEE_SALARY_ADJUSTMENTS,
      INITIAL_EMPLOYEE_SALARY_ADJUSTMENTS
    ).filter((a) => a.school_id === schoolId);

    if (filter?.employeeId) {
      list = list.filter((a) => a.employee_id === filter.employeeId);
    }
    if (filter?.month) {
      list = list.filter((a) => (a.billing_month || a.effective_date.slice(0, 7)) === filter.month);
    }
    if (filter?.type) {
      list = list.filter((a) => a.adjustment_type === filter.type);
    }
    if (filter?.assignmentId) {
      list = list.filter((a) => a.temporary_assignment_id === filter.assignmentId);
    }

    return list.sort((a, b) => b.effective_date.localeCompare(a.effective_date));
  },

  async createAdjustment(
    schoolId: string,
    adjustment: Omit<EmployeeSalaryAdjustment, 'id' | 'school_id' | 'created_at' | 'updated_at'>,
    currentUser?: { id?: string; name?: string }
  ): Promise<EmployeeSalaryAdjustment> {
    const list = storageService.getItem<EmployeeSalaryAdjustment[]>(
      STORAGE_KEYS.EMPLOYEE_SALARY_ADJUSTMENTS,
      INITIAL_EMPLOYEE_SALARY_ADJUSTMENTS
    );

    const now = new Date().toISOString();
    const billingMonth = adjustment.billing_month || adjustment.effective_date.slice(0, 7);

    const newAdjustment: EmployeeSalaryAdjustment = {
      ...adjustment,
      id: `sal-adj-${Date.now().toString().slice(-4)}`,
      school_id: schoolId,
      billing_month: billingMonth,
      created_by: currentUser?.id || 'usr-admin-01',
      created_by_name: currentUser?.name || 'School Administrator',
      created_at: now,
      updated_at: now,
    };

    list.unshift(newAdjustment);
    storageService.setItem(STORAGE_KEYS.EMPLOYEE_SALARY_ADJUSTMENTS, list);

    authLogService.logEvent({
      school_id: schoolId,
      user_id: currentUser?.id,
      user_name: currentUser?.name,
      event_type: 'salary_adjustment_created',
      success: true,
      details: {
        employee_id: adjustment.employee_id,
        employee_name: adjustment.employee_name,
        type: adjustment.adjustment_type,
        amount: adjustment.amount,
        reason: adjustment.reason,
        effective_date: adjustment.effective_date,
      },
    });

    return newAdjustment;
  },

  async deleteAdjustment(
    id: string,
    currentUser?: { id?: string; name?: string }
  ): Promise<void> {
    let list = storageService.getItem<EmployeeSalaryAdjustment[]>(
      STORAGE_KEYS.EMPLOYEE_SALARY_ADJUSTMENTS,
      INITIAL_EMPLOYEE_SALARY_ADJUSTMENTS
    );
    const existing = list.find((a) => a.id === id);
    list = list.filter((a) => a.id !== id);
    storageService.setItem(STORAGE_KEYS.EMPLOYEE_SALARY_ADJUSTMENTS, list);

    if (existing) {
      authLogService.logEvent({
        school_id: existing.school_id,
        user_id: currentUser?.id,
        user_name: currentUser?.name,
        event_type: 'salary_adjustment_deleted',
        success: true,
        details: { id, reason: existing.reason, amount: existing.amount },
      });
    }
  },

  async getEmployeeSalarySummary(
    schoolId: string,
    employeeId: string,
    baseSalary: number,
    billingMonth?: string
  ): Promise<{
    baseSalary: number;
    totalReimbursements: number;
    totalDeductions: number;
    netSalary: number;
    adjustments: EmployeeSalaryAdjustment[];
  }> {
    const allAdjustments = await this.getAdjustments(schoolId, {
      employeeId,
      month: billingMonth,
    });

    const totalReimbursements = allAdjustments
      .filter((a) => a.adjustment_type === 'reimbursement')
      .reduce((sum, a) => sum + Number(a.amount || 0), 0);

    const totalDeductions = allAdjustments
      .filter((a) => a.adjustment_type === 'deduction')
      .reduce((sum, a) => sum + Number(a.amount || 0), 0);

    const netSalary = Math.max(0, baseSalary + totalReimbursements - totalDeductions);

    return {
      baseSalary,
      totalReimbursements,
      totalDeductions,
      netSalary,
      adjustments: allAdjustments,
    };
  },
};

// ============================================================================
// 6. EMPLOYEE COMPENSATION & PAYROLL SERVICE
// ============================================================================

export const payrollService = {
  async getEmployeePayments(
    schoolId: string,
    filter?: { month?: string; employeeType?: 'teacher' | 'staff'; status?: string }
  ): Promise<EmployeePayment[]> {
    let list = storageService.getItem<EmployeePayment[]>(
      STORAGE_KEYS.EMPLOYEE_PAYMENTS,
      INITIAL_EMPLOYEE_PAYMENTS
    ).filter((p) => p.school_id === schoolId);

    if (filter?.month) list = list.filter((p) => p.billing_month === filter.month);
    if (filter?.employeeType) list = list.filter((p) => p.employee_type === filter.employeeType);
    if (filter?.status) list = list.filter((p) => p.status === filter.status);

    const adjustments = storageService.getItem<EmployeeSalaryAdjustment[]>(
      STORAGE_KEYS.EMPLOYEE_SALARY_ADJUSTMENTS,
      INITIAL_EMPLOYEE_SALARY_ADJUSTMENTS
    ).filter((a) => a.school_id === schoolId);

    const enrichedList = list.map((p) => {
      const month = p.billing_month;
      const empAdjs = adjustments.filter(
        (a) => a.employee_id === p.employee_id && (a.billing_month || a.effective_date.slice(0, 7)) === month
      );
      const reimbursements = empAdjs
        .filter((a) => a.adjustment_type === 'reimbursement')
        .reduce((sum, a) => sum + Number(a.amount || 0), 0);
      const deductions = empAdjs
        .filter((a) => a.adjustment_type === 'deduction')
        .reduce((sum, a) => sum + Number(a.amount || 0), 0);

      const baseSalary = p.base_salary !== undefined ? p.base_salary : p.amount;
      const netAmount = Math.max(0, baseSalary + reimbursements - deductions);

      return {
        ...p,
        base_salary: baseSalary,
        total_reimbursements: reimbursements,
        total_deductions: deductions,
        amount: netAmount,
      };
    });

    return enrichedList.sort((a, b) => b.billing_month.localeCompare(a.billing_month));
  },

  async recordEmployeePayment(
    payment: Omit<EmployeePayment, 'id' | 'created_at'>
  ): Promise<EmployeePayment> {
    const list = storageService.getItem<EmployeePayment[]>(
      STORAGE_KEYS.EMPLOYEE_PAYMENTS,
      INITIAL_EMPLOYEE_PAYMENTS
    );

    const newPayment: EmployeePayment = {
      ...payment,
      id: `emp-pmt-${Date.now().toString().slice(-4)}`,
      created_at: new Date().toISOString(),
    };

    list.unshift(newPayment);
    storageService.setItem(STORAGE_KEYS.EMPLOYEE_PAYMENTS, list);
    return newPayment;
  },

  async updatePaymentStatus(
    id: string,
    status: 'pending' | 'paid' | 'partial',
    details?: Partial<EmployeePayment>
  ): Promise<EmployeePayment> {
    const list = storageService.getItem<EmployeePayment[]>(
      STORAGE_KEYS.EMPLOYEE_PAYMENTS,
      INITIAL_EMPLOYEE_PAYMENTS
    );
    const index = list.findIndex((p) => p.id === id);
    if (index === -1) throw new Error('Payment record not found');

    list[index] = {
      ...list[index],
      ...details,
      status,
      payment_date: status === 'paid' ? details?.payment_date || new Date().toISOString().split('T')[0] : list[index].payment_date,
    };

    storageService.setItem(STORAGE_KEYS.EMPLOYEE_PAYMENTS, list);
    return list[index];
  },

  async getPayrollSummary(schoolId: string, billingMonth: string): Promise<{
    totalStaff: number;
    totalTeachers: number;
    totalPayrollAmount: number;
    paidAmount: number;
    pendingAmount: number;
  }> {
    const payments = await this.getEmployeePayments(schoolId, { month: billingMonth });
    const paid = payments.filter((p) => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0);
    const pending = payments.filter((p) => p.status !== 'paid').reduce((sum, p) => sum + p.amount, 0);

    return {
      totalStaff: payments.filter((p) => p.employee_type === 'staff').length,
      totalTeachers: payments.filter((p) => p.employee_type === 'teacher').length,
      totalPayrollAmount: paid + pending,
      paidAmount: paid,
      pendingAmount: pending,
    };
  },

  async generateMonthlyPayroll(
    schoolId: string,
    billingMonth: string,
    teachers: Teacher[],
    staffList: Staff[]
  ): Promise<EmployeePayment[]> {
    let list = storageService.getItem<EmployeePayment[]>(
      STORAGE_KEYS.EMPLOYEE_PAYMENTS,
      INITIAL_EMPLOYEE_PAYMENTS
    );

    const existingKeys = new Set(
      list.filter((p) => p.school_id === schoolId && p.billing_month === billingMonth).map((p) => `${p.employee_type}_${p.employee_id}`)
    );

    const now = new Date().toISOString();

    // 1. Add active teachers
    teachers.filter((t) => t.status === 'active').forEach((t) => {
      const key = `teacher_${t.id}`;
      if (!existingKeys.has(key)) {
        const baseSal = t.monthly_salary || t.salary || 35000;
        list.push({
          id: `emp-pmt-${Date.now().toString().slice(-4)}-${t.id.slice(-4)}`,
          school_id: schoolId,
          employee_id: t.id,
          employee_type: 'teacher',
          employee_name: `${t.first_name} ${t.last_name}`,
          employee_number: t.employee_number,
          designation: 'Teacher / Faculty',
          department: 'Academics',
          billing_month: billingMonth,
          base_salary: baseSal,
          amount: baseSal,
          status: 'pending',
          created_at: now,
        });
      }
    });

    // 2. Add active staff
    staffList.filter((s) => s.status === 'active').forEach((s) => {
      const key = `staff_${s.id}`;
      if (!existingKeys.has(key)) {
        const baseSal = s.salary || 25000;
        list.push({
          id: `emp-pmt-${Date.now().toString().slice(-4)}-${s.id.slice(-4)}`,
          school_id: schoolId,
          employee_id: s.id,
          employee_type: 'staff',
          employee_name: `${s.first_name} ${s.last_name}`,
          employee_number: s.employee_number,
          designation: s.custom_staff_type || s.staff_type.replace('_', ' '),
          department: s.department || 'Staff & Support',
          billing_month: billingMonth,
          base_salary: baseSal,
          amount: baseSal,
          status: 'pending',
          created_at: now,
        });
      }
    });

    storageService.setItem(STORAGE_KEYS.EMPLOYEE_PAYMENTS, list);
    return this.getEmployeePayments(schoolId, { month: billingMonth });
  },

  async bulkDisburse(
    schoolId: string,
    billingMonth: string,
    paymentMethod: EmployeePayment['payment_method'] = 'bank'
  ): Promise<void> {
    let list = storageService.getItem<EmployeePayment[]>(
      STORAGE_KEYS.EMPLOYEE_PAYMENTS,
      INITIAL_EMPLOYEE_PAYMENTS
    );
    const today = new Date().toISOString().split('T')[0];

    list = list.map((p) => {
      if (p.school_id === schoolId && p.billing_month === billingMonth && p.status !== 'paid') {
        return {
          ...p,
          status: 'paid',
          payment_date: today,
          payment_method: paymentMethod,
          reference_number: `BULK-NEFT-${Math.floor(100000 + Math.random() * 900000)}`,
        };
      }
      return p;
    });

    storageService.setItem(STORAGE_KEYS.EMPLOYEE_PAYMENTS, list);
  },
};

// ============================================================================
// 7. RECEPTIONIST FAST STUDENT LOOKUP SERVICE
// ============================================================================

export const receptionService = {
  async searchStudentForVisitor(
    schoolId: string,
    query: string
  ): Promise<
    {
      student: Student;
      roomNumber?: string;
      roomFloor?: string;
      classTeacherName?: string;
      classTeacherPhone?: string;
    }[]
  > {
    if (!query.trim()) return [];

    const q = query.trim().toLowerCase();
    const students = storageService.getItem<Student[]>(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS).filter(
      (s) => s.school_id === schoolId
    );
    const sections = storageService.getItem<Section[]>(STORAGE_KEYS.SECTIONS, INITIAL_SECTIONS);
    const rooms = storageService.getItem<SchoolRoom[]>(STORAGE_KEYS.ROOMS, INITIAL_ROOMS);
    const teachers = storageService.getItem<Teacher[]>(STORAGE_KEYS.TEACHERS, INITIAL_TEACHERS);

    const matches = students.filter(
      (s) =>
        `${s.first_name} ${s.last_name}`.toLowerCase().includes(q) ||
        s.registration_number.toLowerCase().includes(q) ||
        s.current_enrollment?.roll_number?.toLowerCase().includes(q) ||
        s.guardian?.primary_phone?.includes(q)
    );

    return matches.map((st) => {
      const section = sections.find((sec) => sec.id === st.current_enrollment?.section_id);
      const room = rooms.find((rm) => rm.id === section?.room_id);
      const classTeacher = teachers.find((tch) => tch.id === section?.class_teacher_id);

      return {
        student: st,
        roomNumber: room?.room_number || section?.room_number,
        roomFloor: room?.floor,
        classTeacherName: classTeacher ? `${classTeacher.first_name} ${classTeacher.last_name}` : undefined,
        classTeacherPhone: classTeacher?.phone,
      };
    });
  },
};

// ============================================================================
// 8. STUDENT SERVICE (Full Edit, Photo, Guardian, Transport, Status)
// ============================================================================

const getSchoolIdentifierPrefix = (schoolId: string, explicitSchoolCode?: string): string => {
  const school = storageService.getItem<School[]>(STORAGE_KEYS.SCHOOLS, INITIAL_SCHOOLS).find((item) => item.id === schoolId);
  const prefix = (explicitSchoolCode || school?.code || school?.name || 'SCH').replace(/[^a-z0-9]/gi, '').toUpperCase().slice(0, 8);
  return prefix || 'SCH';
};

const nextIdentifier = (existingIds: string[], basePrefix: string): string => {
  const normalized = new Set(existingIds.map((value) => value.toUpperCase()));
  let sequence = existingIds.length + 1;
  let candidate = `${basePrefix}-${sequence}`;
  while (normalized.has(candidate.toUpperCase())) {
    sequence += 1;
    candidate = `${basePrefix}-${sequence}`;
  }
  return candidate;
};

export const schoolIdentifierService = {
  async nextStudentNumber(schoolId: string, schoolCode?: string): Promise<string> {
    const records = storageService.getItem<Student[]>(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS).filter((item) => item.school_id === schoolId);
    return nextIdentifier(records.map((item) => item.registration_number), getSchoolIdentifierPrefix(schoolId, schoolCode));
  },
  async nextTeacherNumber(schoolId: string, schoolCode?: string): Promise<string> {
    const records = storageService.getItem<Teacher[]>(STORAGE_KEYS.TEACHERS, INITIAL_TEACHERS).filter((item) => item.school_id === schoolId);
    return nextIdentifier(records.map((item) => item.employee_number), `${getSchoolIdentifierPrefix(schoolId, schoolCode)}-TCHR`);
  },
  async nextStaffNumber(schoolId: string, schoolCode?: string): Promise<string> {
    const records = storageService.getItem<Staff[]>(STORAGE_KEYS.STAFF, INITIAL_STAFF).filter((item) => item.school_id === schoolId);
    return nextIdentifier(records.map((item) => item.employee_number || ''), `${getSchoolIdentifierPrefix(schoolId, schoolCode)}-STFF`);
  },
};

export interface RegisterStudentInput {
  school_id: string;
  school_code?: string;
  academic_year_id: string;
  academic_year_name?: string;
  first_name: string;
  last_name?: string;
  registration_number: string;
  date_of_birth?: string;
  gender?: 'male' | 'female' | 'other';
  joining_date?: string;
  photo_url?: string;
  class_id: string;
  section_id: string;
  roll_number: string;
  guardian_name?: string;
  primary_phone?: string;
  guardian_email?: string;
  address?: string;
  guardian?: StudentGuardian;
  enable_login?: boolean;
  temporary_password?: string;
  use_class_monthly_fee?: boolean;
  monthly_fee_override?: number;
  apply_new_student_charges?: boolean;
  selected_new_student_charges?: { definition_id: string; name: string; amount: number }[];
  emergency_info?: StudentEmergencyInfo;
  is_transferred_student?: boolean;
  transfer_info?: {
    previous_school_name: string;
    previous_class: string;
    previous_marks_or_grade: string;
    transfer_reason: string;
  };
  selected_sibling_id?: string;
  sibling_student_ids?: string[];
  keep_parents_same?: boolean;
}

export const studentService = {
  mergeStudentRecord(serverStudent: Student, localStudents: Student[]): Student {
    const local = localStudents.find((l) => l.id === serverStudent.id || (l.registration_number && l.registration_number === serverStudent.registration_number));
    return {
      ...local,
      ...serverStudent,
      current_enrollment: serverStudent.current_enrollment || local?.current_enrollment,
      guardian: serverStudent.guardian || local?.guardian,
      emergency_info: serverStudent.emergency_info || local?.emergency_info,
      transfer_info: serverStudent.transfer_info || local?.transfer_info,
      sibling_student_ids: serverStudent.sibling_student_ids || local?.sibling_student_ids,
    };
  },

  async getStudents(
    schoolId: string,
    filter?: { classId?: string; sectionId?: string; search?: string }
  ): Promise<Student[]> {
    try {
      if (typeof window !== 'undefined') {
        const res = await fetch(`/api/students?schoolId=${schoolId}`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data) && json.data.length > 0) {
            const localStudents = storageService.getItem<Student[]>(STORAGE_KEYS.STUDENTS, []);
            const classes = storageService.getItem<SchoolClass[]>(STORAGE_KEYS.CLASSES, INITIAL_CLASSES).filter((c) => c.school_id === schoolId);
            const sections = storageService.getItem<Section[]>(STORAGE_KEYS.SECTIONS, INITIAL_SECTIONS).filter((sec) => sec.school_id === schoolId);

            const merged = (json.data as Student[]).map((srv) => {
              const student = this.mergeStudentRecord(srv, localStudents);
              let enr = student.current_enrollment;

              // If enrollment has class_name, ensure class_id and section_id match actual school classes
              if (enr && enr.class_name) {
                const cName = enr.class_name.trim().toLowerCase();
                const sName = (enr.section_name || 'a').toLowerCase();
                const targetCls = classes.find((c) => c.name.toLowerCase() === cName);
                if (targetCls) {
                  const targetSec = sections.find((s) => s.class_id === targetCls.id && (s.name.toLowerCase() === sName)) || sections.find((s) => s.class_id === targetCls.id);
                  enr = {
                    ...enr,
                    class_id: targetCls.id,
                    section_id: targetSec?.id || enr.section_id,
                    section_name: targetSec?.name || enr.section_name,
                  };
                }
              } else if (enr && enr.class_id) {
                // If enrollment lacks class_name, attempt auto-resolution
                const targetCls = classes.find((c) => c.id === enr?.class_id) || (classes.length === 1 ? classes[0] : undefined);
                const targetSec = sections.find((s) => s.id === enr?.section_id) || (targetCls ? sections.find((s) => s.class_id === targetCls.id) : undefined);
                if (targetCls) {
                  enr = {
                    id: enr?.id || `enr-${srv.id}`,
                    school_id: student.school_id,
                    student_id: student.id,
                    academic_year_id: enr?.academic_year_id || 'ay-2026',
                    academic_year_name: enr?.academic_year_name || '2026-27',
                    class_id: targetCls.id,
                    class_name: targetCls.name,
                    section_id: targetSec?.id || '',
                    section_name: targetSec?.name,
                    roll_number: enr?.roll_number || '01',
                    joined_at: enr?.joined_at || student.joining_date,
                    status: 'active',
                    created_at: enr?.created_at || student.created_at,
                  };
                }
              }

              return {
                ...student,
                current_enrollment: enr,
              };
            });

            storageService.setItem(STORAGE_KEYS.STUDENTS, merged);
            let serverList: Student[] = merged;
            if (filter?.classId) {
              const targetClass = classes.find((c) => c.id === filter.classId);
              serverList = serverList.filter(
                (s) =>
                  s.current_enrollment?.class_id === filter.classId ||
                  (targetClass && s.current_enrollment?.class_name?.toLowerCase() === targetClass.name.toLowerCase())
              );
            }
            if (filter?.sectionId) {
              serverList = serverList.filter((s) => s.current_enrollment?.section_id === filter.sectionId);
            }
            if (filter?.search) {
              const q = filter.search.toLowerCase();
              serverList = serverList.filter(
                (s) =>
                  s.first_name.toLowerCase().includes(q) ||
                  s.last_name.toLowerCase().includes(q) ||
                  s.registration_number.toLowerCase().includes(q) ||
                  s.current_enrollment?.roll_number?.toLowerCase().includes(q) ||
                  s.guardian?.primary_phone?.includes(q)
              );
            }
            return serverList;
          }
        }
      }
    } catch (e) {
      console.warn('API students fetch fallback:', e);
    }

    let list = storageService.getItem<Student[]>(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS).filter((s) => s.school_id === schoolId);

    if (filter?.classId) {
      const classes = storageService.getItem<SchoolClass[]>(STORAGE_KEYS.CLASSES, INITIAL_CLASSES).filter((c) => c.school_id === schoolId);
      const targetClass = classes.find((c) => c.id === filter.classId);
      list = list.filter(
        (s) =>
          s.current_enrollment?.class_id === filter.classId ||
          (targetClass && s.current_enrollment?.class_name?.toLowerCase() === targetClass.name.toLowerCase())
      );
    }
    if (filter?.sectionId) {
      list = list.filter((s) => s.current_enrollment?.section_id === filter.sectionId);
    }
    if (filter?.search) {
      const q = filter.search.toLowerCase();
      list = list.filter(
        (s) =>
          s.first_name.toLowerCase().includes(q) ||
          s.last_name.toLowerCase().includes(q) ||
          s.registration_number.toLowerCase().includes(q) ||
          s.current_enrollment?.roll_number?.toLowerCase().includes(q) ||
          s.guardian?.primary_phone?.includes(q)
      );
    }

    return list;
  },

  async getStudentById(id: string): Promise<Student | null> {
    if (!id || !id.trim()) return null;
    const cleanId = id.trim().replace(/^usr-/, '');
    const list = storageService.getItem<Student[]>(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS);
    let target = list.find((s) => s.id === cleanId || s.registration_number.toLowerCase() === cleanId.toLowerCase());

    try {
      if (typeof window !== 'undefined') {
        const directRes = await fetch(`/api/students/${encodeURIComponent(cleanId)}`);
        if (directRes.ok) {
          const directJson = await directRes.json();
          if (directJson.success && directJson.data) {
            target = directJson.data;
          }
        }
        if (!target) {
          const students = await fetch('/api/students').then(async (res) => {
            if (!res.ok) return [];
            const json = await res.json();
            return json.success && Array.isArray(json.data) ? (json.data as Student[]) : [];
          });
          target =
            students.find(
              (s) =>
                s.id === cleanId ||
                s.registration_number.toLowerCase() === cleanId.toLowerCase()
            ) || target;
        }
        if (target) {
          const idx = list.findIndex(
            (s) =>
              s.id === target!.id ||
              s.registration_number.toLowerCase() === target!.registration_number.toLowerCase()
          );
          if (idx !== -1) list[idx] = target;
          else list.push(target);
          storageService.setItem(STORAGE_KEYS.STUDENTS, list);
        }
      }
    } catch (e) {
      console.warn(`API student detail fallback for ${id}:`, e);
    }

    if (!target) return null;

    if (target.sibling_student_ids && target.sibling_student_ids.length > 0) {
      const siblingStudents = list.filter((s) => target!.sibling_student_ids?.includes(s.id));
      target.siblings = siblingStudents.map((sib) => ({
        id: sib.id,
        first_name: sib.first_name,
        last_name: sib.last_name,
        registration_number: sib.registration_number,
        date_of_birth: sib.date_of_birth,
        gender: sib.gender,
        class_name: sib.current_enrollment?.class_name,
        section_name: sib.current_enrollment?.section_name,
        roll_number: sib.current_enrollment?.roll_number,
        photo_url: sib.photo_url,
        status: sib.status,
        guardian: sib.guardian,
      }));
    } else {
      target.siblings = [];
    }

    return target;
  },

  async getStudentSiblings(studentId: string, schoolId: string): Promise<Student[]> {
    if (!studentId || !studentId.trim()) return [];
    const cleanId = studentId.trim().replace(/^usr-/, '');
    const list = storageService.getItem<Student[]>(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS).filter((s) => s.school_id === schoolId);
    let student = list.find((s) => s.id === cleanId || s.registration_number.toLowerCase() === cleanId.toLowerCase());
    if (!student && typeof window !== 'undefined') {
      try {
        const fetched = await this.getStudentById(cleanId);
        if (fetched) student = fetched;
      } catch {}
    }
    if (!student || !student.sibling_student_ids || student.sibling_student_ids.length === 0) {
      return [];
    }
    return list.filter((s) => student!.sibling_student_ids?.includes(s.id));
  },

  async registerStudent(studentData: RegisterStudentInput): Promise<Student> {
    const students = storageService.getItem<Student[]>(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS);
    const registrationNumber = await schoolIdentifierService.nextStudentNumber(studentData.school_id, studentData.school_code);

    // Uniqueness validation
    const regConflict = students.find(
      (s) => s.school_id === studentData.school_id && s.registration_number.toUpperCase() === registrationNumber.toUpperCase()
    );
    if (regConflict) {
      throw new Error(`Student registration number "${registrationNumber}" is already registered.`);
    }

    const emailToVerify = studentData.guardian_email || studentData.guardian?.email;
    if (emailToVerify && emailToVerify.trim()) {
      const emailCheck = await emailValidationService.verifyEmailAvailability(emailToVerify.trim(), {
        targetSchoolId: studentData.school_id,
        targetRole: 'parent',
      });
      if (!emailCheck.isValid || !emailCheck.isAvailable) {
        throw new Error(emailCheck.error || `Invalid or duplicate email "${emailToVerify}".`);
      }
    }

    const classes = storageService.getItem<SchoolClass[]>(STORAGE_KEYS.CLASSES, INITIAL_CLASSES);
    const sections = storageService.getItem<Section[]>(STORAGE_KEYS.SECTIONS, INITIAL_SECTIONS);
    const targetClass = classes.find((c) => c.id === studentData.class_id);
    const targetSection = sections.find((s) => s.id === studentData.section_id);

    const newStudentId = `std-${Date.now().toString().slice(-4)}`;
    const guardianInfo: StudentGuardian = studentData.guardian || {
      father_name: studentData.guardian_name,
      guardian_name: studentData.guardian_name,
      primary_phone: studentData.primary_phone || '',
      email: studentData.guardian_email,
      address: studentData.address,
    };

    // Calculate Sibling IDs (transitive closure: include selected sibling and any siblings they have)
    const siblingIdSet = new Set<string>();
    if (studentData.selected_sibling_id) {
      siblingIdSet.add(studentData.selected_sibling_id);
      const existingSibling = students.find((s) => s.id === studentData.selected_sibling_id);
      if (existingSibling?.sibling_student_ids) {
        existingSibling.sibling_student_ids.forEach((sibId) => siblingIdSet.add(sibId));
      }
    }
    if (studentData.sibling_student_ids) {
      studentData.sibling_student_ids.forEach((id) => siblingIdSet.add(id));
    }
    siblingIdSet.delete(newStudentId);
    const calculatedSiblingIds = Array.from(siblingIdSet);

    const newStudent: Student = {
      id: newStudentId,
      school_id: studentData.school_id,
      first_name: studentData.first_name,
      last_name: studentData.last_name || '',
      registration_number: registrationNumber,
      date_of_birth: studentData.date_of_birth,
      gender: studentData.gender,
      joining_date: studentData.joining_date || new Date().toISOString().split('T')[0],
      photo_url: studentData.photo_url,
      status: 'active',
      created_at: new Date().toISOString(),
      uses_class_monthly_fee: studentData.use_class_monthly_fee ?? true,
      monthly_fee_amount: studentData.use_class_monthly_fee !== false ? targetClass?.common_monthly_fee : studentData.monthly_fee_override,
      apply_new_student_charges: studentData.apply_new_student_charges ?? true,
      guardian: guardianInfo,
      emergency_info: studentData.emergency_info,
      is_transferred_student: studentData.is_transferred_student ?? false,
      transfer_info: studentData.is_transferred_student ? studentData.transfer_info : undefined,
      sibling_student_ids: calculatedSiblingIds.length > 0 ? calculatedSiblingIds : undefined,
      current_enrollment: {
        id: `enr-${Date.now().toString().slice(-4)}`,
        school_id: studentData.school_id,
        student_id: newStudentId,
        academic_year_id: studentData.academic_year_id,
        class_id: studentData.class_id,
        section_id: studentData.section_id,
        roll_number: studentData.roll_number,
        joined_at: studentData.joining_date || new Date().toISOString().split('T')[0],
        status: 'active',
        class_name: targetClass?.name,
        section_name: targetSection?.name,
        academic_year_name: studentData.academic_year_name,
        created_at: new Date().toISOString(),
      },
    };

    // Update all existing siblings in the group to include this new student (vice-versa linking)
    if (calculatedSiblingIds.length > 0) {
      for (const sibId of calculatedSiblingIds) {
        const sibIndex = students.findIndex((s) => s.id === sibId);
        if (sibIndex !== -1) {
          const currentSiblings = new Set(students[sibIndex].sibling_student_ids || []);
          currentSiblings.add(newStudentId);
          // Also link other siblings in the group
          for (const otherSibId of calculatedSiblingIds) {
            if (otherSibId !== sibId) currentSiblings.add(otherSibId);
          }
          students[sibIndex] = {
            ...students[sibIndex],
            sibling_student_ids: Array.from(currentSiblings),
          };
        }
      }
    }

    try {
      if (typeof window !== 'undefined') {
        const res = await fetch('/api/students', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...newStudent, school_id: studentData.school_id }),
        });
        const json = await res.json();
        if (!res.ok || !json.success || !json.data) {
          throw new Error(json.error || 'Could not save student to database.');
        }
        const saved = this.mergeStudentRecord(json.data, [newStudent]);
        Object.assign(newStudent, saved);
        if (newStudent.current_enrollment) newStudent.current_enrollment.student_id = newStudent.id;
      }
    } catch (e) {
      throw e instanceof Error ? e : new Error('Could not save student to database.');
    }

    students.push(newStudent);
    storageService.setItem(STORAGE_KEYS.STUDENTS, students);

    // Initialize default password for student
    const passwords = storageService.getItem<Record<string, string>>(STORAGE_KEYS.USER_PASSWORDS, {});
    const studentUserKey = `usr-${newStudent.id}`;
    const studentLoginKey = registrationNumber.toLowerCase();
    if (!passwords[studentUserKey]) passwords[studentUserKey] = 'student123';
    if (!passwords[studentLoginKey]) passwords[studentLoginKey] = 'student123';
    storageService.setItem(STORAGE_KEYS.USER_PASSWORDS, passwords);

    // A guardian email is the parent portal identity. Reuse an existing parent
    // in this school so one account can switch between multiple linked children.
    const parentEmail = guardianInfo.email?.trim().toLowerCase();
    if (parentEmail) {
      const parents = storageService.getItem<ParentProfile[]>(STORAGE_KEYS.PARENTS, []);
      let parent = parents.find(
        (item) => item.school_id === studentData.school_id && item.email.toLowerCase() === parentEmail
      );
      if (!parent) {
        const guardianName = guardianInfo.guardian_name || guardianInfo.father_name || guardianInfo.mother_name || 'Parent / Guardian';
        parent = {
          id: `prt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          school_id: studentData.school_id,
          father_name: guardianInfo.father_name,
          mother_name: guardianInfo.mother_name,
          guardian_name: guardianName,
          primary_phone: guardianInfo.primary_phone,
          secondary_phone: guardianInfo.secondary_phone,
          email: parentEmail,
          address: guardianInfo.address,
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        parents.push(parent);
        storageService.setItem(STORAGE_KEYS.PARENTS, parents);
      }

      const links = storageService.getItem<ParentStudentLink[]>(STORAGE_KEYS.PARENT_STUDENT_LINKS, []);
      if (!links.some((item) => item.parent_id === parent!.id && item.student_id === newStudent.id)) {
        links.push({
          id: `psl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          school_id: studentData.school_id,
          parent_id: parent.id,
          student_id: newStudent.id,
          relationship: guardianInfo.guardian_name ? 'guardian' : guardianInfo.father_name ? 'father' : 'mother',
          is_primary_guardian: true,
          status: 'active',
          created_by: 'school_admin',
          created_at: new Date().toISOString(),
        });
        storageService.setItem(STORAGE_KEYS.PARENT_STUDENT_LINKS, links);
      }
    }

    const enrollmentCharges = studentData.selected_new_student_charges ??
      (studentData.apply_new_student_charges !== false ? targetClass?.new_student_charges?.filter((item) => item.status === 'active').map((item) => ({ definition_id: item.id, name: item.name, amount: item.amount })) : []);
    if (enrollmentCharges?.length) {
      const charges = storageService.getItem<StudentCharge[]>(STORAGE_KEYS.STUDENT_CHARGES, INITIAL_STUDENT_CHARGES);
      const now = new Date().toISOString();
      enrollmentCharges.filter((item) => item.amount > 0).forEach((item, index) => {
        charges.unshift({ id: `chg-${Date.now()}-${index}`, school_id: studentData.school_id, student_id: newStudent.id,
          academic_year_id: studentData.academic_year_id, charge_name: item.name, amount: item.amount, paid_amount: 0,
          remaining_amount: item.amount, charge_date: studentData.joining_date || now.split('T')[0], status: 'pending',
          student_name: `${studentData.first_name} ${studentData.last_name}`, registration_number: registrationNumber,
          created_at: now, updated_at: now });
      });
      storageService.setItem(STORAGE_KEYS.STUDENT_CHARGES, charges);
    }
    return newStudent;
  },

  async updateStudent(
    id: string,
    updates: Partial<Student> & {
      guardian?: Partial<StudentGuardian>;
      current_enrollment?: Partial<StudentEnrollment>;
      transport_assignment?: Partial<StudentTransportAssignment>;
    },
    actorId?: string,
    actorName?: string
  ): Promise<Student> {
    const list = storageService.getItem<Student[]>(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS);
    const index = list.findIndex((s) => s.id === id);
    if (index === -1) throw new Error('Student not found');

    const existing = list[index];
    const updatedStudent: Student = {
      ...existing,
      ...updates,
      guardian: {
        ...existing.guardian,
        ...updates.guardian,
        primary_phone: updates.guardian?.primary_phone || existing.guardian?.primary_phone || '',
      },
      current_enrollment: updates.current_enrollment
        ? {
            ...(existing.current_enrollment || {
              id: `enr-${Date.now().toString().slice(-4)}`,
              school_id: existing.school_id,
              student_id: existing.id,
              status: 'active',
              created_at: new Date().toISOString(),
            }),
            ...updates.current_enrollment,
          }
        : existing.current_enrollment,
      transport_assignment: updates.transport_assignment
        ? ({ ...existing.transport_assignment, ...updates.transport_assignment } as StudentTransportAssignment)
        : existing.transport_assignment,
    };

    try {
      if (typeof window !== 'undefined') {
        const res = await fetch(`/api/students/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        });
        const json = await res.json();
        if (!res.ok || !json.success || !json.data) {
          throw new Error(json.error || 'Could not update student in database.');
        }
        Object.assign(updatedStudent, this.mergeStudentRecord(json.data, [updatedStudent]));
      }
    } catch (e) {
      throw e instanceof Error ? e : new Error('Could not update student in database.');
    }

    list[index] = updatedStudent;
    storageService.setItem(STORAGE_KEYS.STUDENTS, list);

    authLogService.logEvent({
      school_id: updatedStudent.school_id,
      user_id: id,
      event_type: 'student_updated',
      success: true,
      role: 'school_admin',
      user_name: actorName || 'School Administrator',
      details: { studentName: `${updatedStudent.first_name} ${updatedStudent.last_name}`, changes: Object.keys(updates) },
    });

    return updatedStudent;
  },

  async updateStudentStatus(id: string, status: Student['status'], actorName?: string): Promise<Student> {
    return this.updateStudent(id, { status }, undefined, actorName);
  },

  async createStudent(studentData: RegisterStudentInput): Promise<Student> {
    return this.registerStudent(studentData);
  },

  async deleteStudent(id: string, actorName: string = 'School Administrator', actorRole: UserRole = 'school_admin'): Promise<void> {
    let list = storageService.getItem<Student[]>(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS);
    const target = list.find((s) => s.id === id);
    if (!target) return;

    // School Admins can only DEACTIVATE, not delete
    if (actorRole !== 'super_admin') {
      await this.updateStudentStatus(id, 'inactive', actorName);
      authLogService.logEvent({
        school_id: target.school_id,
        event_type: 'student_updated',
        success: true,
        role: actorRole,
        user_name: actorName,
        details: {
          action: 'deactivate_student',
          reason: 'School Admins can only deactivate student profiles to preserve academic & financial records.',
          studentId: id,
          studentName: `${target.first_name} ${target.last_name}`,
        },
      });
      return;
    }

    // Super Admin: Move to 30-Day Recycle Bin
    try {
      if (typeof window !== 'undefined') {
        await fetch(`/api/students/${id}`, { method: 'DELETE' });
      }
    } catch (e) {}

    await recycleBinService.moveToBin({
      schoolId: target.school_id,
      entityType: 'student',
      entityId: target.id,
      entityName: `${target.first_name} ${target.last_name}`,
      entityDetails: `Reg #${target.registration_number || target.id} • ${target.current_enrollment?.class_name || 'Student'}`,
      originalData: target,
      deletedByName: actorName,
      deletedByRole: actorRole,
    });
    list = list.filter((s) => s.id !== id);
    storageService.setItem(STORAGE_KEYS.STUDENTS, list);

    const schools = storageService.getItem<School[]>(STORAGE_KEYS.SCHOOLS, []);
    const schIdx = schools.findIndex((s) => s.id === target.school_id);
    if (schIdx !== -1) {
      schools[schIdx].student_count = Math.max(0, (schools[schIdx].student_count || 1) - 1);
      storageService.setItem(STORAGE_KEYS.SCHOOLS, schools);
    }
  },
};

// ============================================================================
// 9. TEACHER SERVICE (Full Edit, Salary Increment History, Assignments)
// ============================================================================

export const teacherService = {
  async getTeachers(
    schoolId: string,
    filter?: { status?: Teacher['status']; search?: string }
  ): Promise<Teacher[]> {
    try {
      if (typeof window !== 'undefined') {
        const res = await fetch(`/api/teachers?schoolId=${schoolId}`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data) && json.data.length > 0) {
            storageService.setItem(STORAGE_KEYS.TEACHERS, json.data);
            let serverList: Teacher[] = json.data;
            if (filter?.status) serverList = serverList.filter((t) => t.status === filter.status);
            if (filter?.search) {
              const q = filter.search.toLowerCase();
              serverList = serverList.filter(
                (t) =>
                  `${t.first_name} ${t.last_name}`.toLowerCase().includes(q) ||
                  t.email.toLowerCase().includes(q) ||
                  t.employee_number.toLowerCase().includes(q) ||
                  t.phone.includes(q)
              );
            }
            return serverList;
          }
        }
      }
    } catch (e) {
      console.warn('API teachers fetch fallback:', e);
    }

    let list = storageService.getItem<Teacher[]>(STORAGE_KEYS.TEACHERS, INITIAL_TEACHERS).filter((t) => t.school_id === schoolId);

    if (filter?.status) list = list.filter((t) => t.status === filter.status);
    if (filter?.search) {
      const q = filter.search.toLowerCase();
      list = list.filter(
        (t) =>
          `${t.first_name} ${t.last_name}`.toLowerCase().includes(q) ||
          t.email.toLowerCase().includes(q) ||
          t.employee_number.toLowerCase().includes(q) ||
          t.phone.includes(q)
      );
    }

    return list;
  },

  async getTeacherById(id: string): Promise<Teacher | null> {
    const list = storageService.getItem<Teacher[]>(STORAGE_KEYS.TEACHERS, INITIAL_TEACHERS);
    return list.find((t) => t.id === id) || null;
  },

  async getTeacherForUser(user: UserPersona | null | undefined, schoolId?: string): Promise<Teacher | null> {
    if (!user) return null;
    const normalizedEmail = user.email?.trim().toLowerCase();
    const normalizedLoginId = user.login_id?.trim().toUpperCase();

    // Fetch from server first so we always get fresh data (getTeachers caches to localStorage)
    const list = schoolId
      ? await this.getTeachers(schoolId, { status: 'active' })
      : storageService.getItem<Teacher[]>(STORAGE_KEYS.TEACHERS, INITIAL_TEACHERS).filter((t) => t.status === 'active');

    return (
      (user.teacher_id ? list.find((teacher) => teacher.id === user.teacher_id) : undefined) ||
      (normalizedEmail ? list.find((teacher) => teacher.email.trim().toLowerCase() === normalizedEmail) : undefined) ||
      (normalizedLoginId ? list.find((teacher) => teacher.employee_number?.trim().toUpperCase() === normalizedLoginId) : undefined) ||
      null
    );
  },

  async createTeacher(
    schoolId: string,
    teacherData: Omit<Teacher, 'id' | 'school_id' | 'created_at' | 'status'> & {
      status?: Teacher['status'];
    },
    schoolCode?: string
  ): Promise<Teacher> {
    const list = storageService.getItem<Teacher[]>(STORAGE_KEYS.TEACHERS, INITIAL_TEACHERS);
    const employeeNumber = await schoolIdentifierService.nextTeacherNumber(schoolId, schoolCode);
    // Centralized email and domain validation
    const emailCheck = await emailValidationService.verifyEmailAvailability(teacherData.email, {
      targetSchoolId: schoolId,
      targetRole: 'teacher',
    });
    if (!emailCheck.isValid || !emailCheck.isAvailable) {
      throw new Error(emailCheck.error || `Invalid or duplicate email "${teacherData.email}".`);
    }

    if (list.some((teacher) => teacher.school_id === schoolId && teacher.employee_number.toUpperCase() === employeeNumber.toUpperCase())) {
      throw new Error(`Teacher employee ID "${employeeNumber}" already exists.`);
    }
    const newTeacherId = `tch-${Date.now().toString().slice(-4)}`;
    const newTeacher: Teacher = {
      ...teacherData,
      employee_number: employeeNumber,
      id: newTeacherId,
      school_id: schoolId,
      status: teacherData.status || 'active',
      created_at: new Date().toISOString(),
    };

    try {
      if (typeof window !== 'undefined') {
        const res = await fetch('/api/teachers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...newTeacher, school_id: schoolId }),
        });
        const json = await res.json();
        if (!res.ok || !json.success || !json.data) {
          throw new Error(json.error || 'Could not save teacher to database.');
        }
        Object.assign(newTeacher, json.data);
      }
    } catch (e) {
      throw e instanceof Error ? e : new Error('Could not save teacher to database.');
    }

    list.push(newTeacher);
    storageService.setItem(STORAGE_KEYS.TEACHERS, list);

    if (teacherData.monthly_salary && teacherData.monthly_salary > 0) {
      const salHist = storageService.getItem<EmployeeSalaryHistory[]>(
        STORAGE_KEYS.EMPLOYEE_SALARY_HISTORY,
        INITIAL_EMPLOYEE_SALARY_HISTORY
      );
      salHist.push({
        id: `sal-${Date.now().toString().slice(-4)}`,
        school_id: schoolId,
        employee_id: newTeacher.id,
        employee_type: 'teacher',
        amount: teacherData.monthly_salary,
        effective_from: teacherData.joining_date || new Date().toISOString().split('T')[0],
        effective_to: null,
        reason: 'Initial teacher salary appointment',
        created_at: new Date().toISOString(),
      });
      storageService.setItem(STORAGE_KEYS.EMPLOYEE_SALARY_HISTORY, salHist);
    }

    return newTeacher;
  },

  async updateTeacher(
    id: string,
    updates: Partial<Teacher>,
    actorId?: string,
    actorName?: string
  ): Promise<Teacher> {
    const list = storageService.getItem<Teacher[]>(STORAGE_KEYS.TEACHERS, INITIAL_TEACHERS);
    const index = list.findIndex((t) => t.id === id);
    if (index === -1) throw new Error('Teacher not found');

    list[index] = {
      ...list[index],
      ...updates,
    };

    try {
      if (typeof window !== 'undefined') {
        const res = await fetch(`/api/teachers/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        });
        const json = await res.json();
        if (!res.ok || !json.success || !json.data) {
          throw new Error(json.error || 'Could not update teacher in database.');
        }
        list[index] = { ...list[index], ...json.data };
      }
    } catch (e) {
      throw e instanceof Error ? e : new Error('Could not update teacher in database.');
    }

    storageService.setItem(STORAGE_KEYS.TEACHERS, list);

    authLogService.logEvent({
      school_id: list[index].school_id,
      user_id: id,
      event_type: 'teacher_updated',
      success: true,
      role: 'school_admin',
      user_name: actorName || 'School Administrator',
      details: { teacherName: `${list[index].first_name} ${list[index].last_name}`, changes: Object.keys(updates) },
    });

    return list[index];
  },

  async updateTeacherSalary(
    teacherId: string,
    newSalary: number,
    effectiveFrom: string,
    reason = 'Annual Increment',
    actorId?: string,
    actorName?: string
  ): Promise<Teacher> {
    const list = storageService.getItem<Teacher[]>(STORAGE_KEYS.TEACHERS, INITIAL_TEACHERS);
    const index = list.findIndex((t) => t.id === teacherId);
    if (index === -1) throw new Error('Teacher not found');

    const salHist = storageService.getItem<EmployeeSalaryHistory[]>(
      STORAGE_KEYS.EMPLOYEE_SALARY_HISTORY,
      INITIAL_EMPLOYEE_SALARY_HISTORY
    );

    // Close any previous open salary record
    const lastOpenIndex = salHist.findIndex((h) => h.employee_id === teacherId && !h.effective_to);
    if (lastOpenIndex !== -1) {
      salHist[lastOpenIndex].effective_to = effectiveFrom;
    }

    salHist.push({
      id: `sal-${Date.now().toString().slice(-4)}`,
      school_id: list[index].school_id,
      employee_id: teacherId,
      employee_type: 'teacher',
      amount: newSalary,
      effective_from: effectiveFrom,
      effective_to: null,
      reason,
      created_by: actorId,
      created_at: new Date().toISOString(),
    });
    storageService.setItem(STORAGE_KEYS.EMPLOYEE_SALARY_HISTORY, salHist);

    list[index].monthly_salary = newSalary;
    storageService.setItem(STORAGE_KEYS.TEACHERS, list);

    authLogService.logEvent({
      school_id: list[index].school_id,
      user_id: teacherId,
      event_type: 'teacher_salary_changed',
      success: true,
      role: 'school_admin',
      user_name: actorName || 'School Administrator',
      details: { teacherName: `${list[index].first_name} ${list[index].last_name}`, newSalary, effectiveFrom, reason },
    });

    return list[index];
  },

  async getTeacherSalaryHistory(teacherId: string): Promise<EmployeeSalaryHistory[]> {
    const list = storageService.getItem<EmployeeSalaryHistory[]>(
      STORAGE_KEYS.EMPLOYEE_SALARY_HISTORY,
      INITIAL_EMPLOYEE_SALARY_HISTORY
    );
    return list
      .filter((h) => h.employee_id === teacherId)
      .sort((a, b) => b.effective_from.localeCompare(a.effective_from));
  },

  async getAssignments(schoolId: string, teacherId?: string): Promise<TeacherAssignment[]> {
    try {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams({ schoolId });
        if (teacherId) params.set('teacherId', teacherId);
        const res = await fetch(`/api/teacher-assignments?${params.toString()}`, { cache: 'no-store' });
        const json = await res.json();
        if (res.ok && json.success && Array.isArray(json.data) && json.data.length > 0) {
          const [classes, sections, subjects] = await Promise.all([
            academicService.getClasses(schoolId),
            academicService.getSections(schoolId),
            subjectService.getSubjects(schoolId),
          ]);
          return json.data.map((asg: TeacherAssignment) => {
            const cls = classes.find((c) => c.id === asg.class_id);
            const sec = sections.find((s) => s.id === asg.section_id);
            const sub = subjects.find((s) => s.id === asg.subject_id);
            return {
              ...asg,
              class_name: asg.class_name || cls?.name,
              section_name: asg.section_name || sec?.name,
              subject_name: asg.subject_name || sub?.name,
              room_number: asg.room_number || sec?.room_number,
            };
          });
        }
      }
    } catch (e) {
      console.warn('API teacher assignments fetch fallback:', e);
    }

    const [teachers, classes, sections] = await Promise.all([
      this.getTeachers(schoolId),
      academicService.getClasses(schoolId),
      academicService.getSections(schoolId),
    ]);
    const assignments: TeacherAssignment[] = [];
    const seenKeys = new Set<string>();

    teachers.forEach((t) => {
      if (t.assignments) {
        t.assignments.forEach((asg) => {
          if (!teacherId || asg.teacher_id === teacherId) {
            const key = `${asg.class_id}-${asg.section_id || ''}-${asg.subject_id || ''}`;
            if (!seenKeys.has(key)) {
              seenKeys.add(key);
              assignments.push(asg);
            }
          }
        });
      }
    });

    classes.forEach((c) => {
      if (c.class_teacher_id && (!teacherId || c.class_teacher_id === teacherId)) {
        const key = `${c.id}--class-teacher`;
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          assignments.push({
            id: `asg-ct-cls-${c.id}`,
            school_id: schoolId,
            academic_year_id: 'ay-current',
            teacher_id: c.class_teacher_id,
            class_id: c.id,
            class_name: c.name,
            section_id: '',
            subject_id: 'general',
            subject_name: 'Class Teacher',
            created_at: c.created_at || new Date().toISOString(),
          });
        }
      }
    });

    sections.forEach((s) => {
      if (s.class_teacher_id && (!teacherId || s.class_teacher_id === teacherId)) {
        const key = `${s.class_id}-${s.id}-section-teacher`;
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          const parentClass = classes.find((c) => c.id === s.class_id);
          assignments.push({
            id: `asg-ct-sec-${s.id}`,
            school_id: schoolId,
            academic_year_id: 'ay-current',
            teacher_id: s.class_teacher_id,
            class_id: s.class_id,
            class_name: parentClass?.name || s.class_name || 'Class',
            section_id: s.id,
            section_name: s.name,
            subject_id: 'general',
            subject_name: `Class Teacher (Sec ${s.name})`,
            created_at: s.created_at || new Date().toISOString(),
          });
        }
      }
    });

    return assignments;
  },

  async assignSubject(
    schoolId: string,
    assignment: Omit<TeacherAssignment, 'id' | 'created_at'> & { id?: string; created_at?: string }
  ): Promise<TeacherAssignment> {
    const teachers = storageService.getItem<Teacher[]>(STORAGE_KEYS.TEACHERS, INITIAL_TEACHERS);
    const index = teachers.findIndex((t) => t.id === assignment.teacher_id);
    if (index === -1) throw new Error('Teacher not found');

    const asgId = assignment.id || `asg-${Date.now().toString().slice(-4)}`;
    const fullAsg: TeacherAssignment = {
      ...assignment,
      id: asgId,
      created_at: assignment.created_at || new Date().toISOString(),
    };

    teachers[index].assignments = teachers[index].assignments || [];
    const existingIndex = teachers[index].assignments.findIndex(
      (a) =>
        a.class_id === assignment.class_id &&
        (a.section_id || null) === (assignment.section_id || null) &&
        a.subject_id === assignment.subject_id
    );
    if (existingIndex !== -1) {
      teachers[index].assignments[existingIndex] = {
        ...teachers[index].assignments[existingIndex],
        ...fullAsg,
        id: teachers[index].assignments[existingIndex].id,
      };
    } else {
      teachers[index].assignments.push(fullAsg);
    }

    try {
      if (typeof window !== 'undefined') {
        const res = await fetch('/api/teacher-assignments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(fullAsg),
        });
        const json = await res.json();
        if (res.ok && json.success && json.data) {
          Object.assign(fullAsg, json.data);
        } else if (!res.ok) {
          console.warn('Teacher assignment backend sync warning:', json?.error);
        }
      }
    } catch (e) {
      console.warn('Teacher assignment backend sync error:', e);
    }

    storageService.setItem(STORAGE_KEYS.TEACHERS, teachers);

    authLogService.logEvent({
      school_id: schoolId,
      user_id: assignment.teacher_id,
      event_type: 'teacher_updated',
      success: true,
      role: 'school_admin',
      details: {
        action: 'assignment_added',
        teacherName: `${teachers[index].first_name} ${teachers[index].last_name}`,
        className: assignment.class_name,
        sectionName: assignment.section_name,
        subjectName: assignment.subject_name,
      },
    });

    return fullAsg;
  },

  async removeAssignment(schoolId: string, teacherId: string, assignmentId: string): Promise<void> {
    const teachers = storageService.getItem<Teacher[]>(STORAGE_KEYS.TEACHERS, INITIAL_TEACHERS);
    const index = teachers.findIndex((t) => t.id === teacherId);
    if (index === -1) throw new Error('Teacher not found');

    const removedAsg = (teachers[index].assignments || []).find((a) => a.id === assignmentId);
    teachers[index].assignments = (teachers[index].assignments || []).filter((a) => a.id !== assignmentId);
    if (typeof window !== 'undefined' && removedAsg) {
      const res = await fetch(`/api/teacher-assignments/${assignmentId}`, { method: 'DELETE' });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json.success === false) throw new Error(json.error || 'Could not remove assignment from database.');
    }
    storageService.setItem(STORAGE_KEYS.TEACHERS, teachers);

    authLogService.logEvent({
      school_id: schoolId,
      user_id: teacherId,
      event_type: 'teacher_updated',
      success: true,
      role: 'school_admin',
      details: {
        action: 'assignment_removed',
        teacherName: `${teachers[index].first_name} ${teachers[index].last_name}`,
        className: removedAsg?.class_name,
        sectionName: removedAsg?.section_name,
        subjectName: removedAsg?.subject_name,
      },
    });
  },

  async deleteTeacher(id: string, actorName: string = 'School Administrator', actorRole: UserRole = 'school_admin'): Promise<void> {
    let list = storageService.getItem<Teacher[]>(STORAGE_KEYS.TEACHERS, INITIAL_TEACHERS);
    const target = list.find((t) => t.id === id);
    if (!target) return;

    // School Admins can only DEACTIVATE, not delete
    if (actorRole !== 'super_admin') {
      await this.updateTeacher(id, { status: 'inactive' }, undefined, actorName);
      authLogService.logEvent({
        school_id: target.school_id,
        event_type: 'teacher_updated',
        success: true,
        role: actorRole,
        user_name: actorName,
        details: {
          action: 'deactivate_teacher',
          reason: 'School Admins can only deactivate teacher profiles to preserve class assignments & salary history.',
          teacherId: id,
          teacherName: `${target.first_name} ${target.last_name}`,
        },
      });
      return;
    }

    // Super Admin: Move to 30-Day Recycle Bin
    try {
      if (typeof window !== 'undefined') {
        await fetch(`/api/teachers/${id}`, { method: 'DELETE' });
      }
    } catch (e) {}

    await recycleBinService.moveToBin({
      schoolId: target.school_id,
      entityType: 'teacher',
      entityId: target.id,
      entityName: `${target.first_name} ${target.last_name}`,
      entityDetails: `Employee #${target.employee_number} • ${target.designation || 'Teacher'} (${target.subjects?.join(', ') || 'General'})`,
      originalData: target,
      deletedByName: actorName,
      deletedByRole: actorRole,
    });
    list = list.filter((t) => t.id !== id);
    storageService.setItem(STORAGE_KEYS.TEACHERS, list);

    const schools = storageService.getItem<School[]>(STORAGE_KEYS.SCHOOLS, []);
    const schIdx = schools.findIndex((s) => s.id === target.school_id);
    if (schIdx !== -1) {
      schools[schIdx].teacher_count = Math.max(0, (schools[schIdx].teacher_count || 1) - 1);
      storageService.setItem(STORAGE_KEYS.SCHOOLS, schools);
    }
  },
};

// ============================================================================
// 10. ACADEMICS & CURRICULUM SERVICE (Classes, Sections, Rooms, Subjects)
// ============================================================================

export const academicService = {
  async getClasses(schoolId: string): Promise<SchoolClass[]> {
    let classes = storageService.getItem<SchoolClass[]>(STORAGE_KEYS.CLASSES, INITIAL_CLASSES).filter((c) => c.school_id === schoolId);
    try {
      if (typeof window !== 'undefined') {
        const res = await fetch(`/api/classes?schoolId=${encodeURIComponent(schoolId)}`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data) && json.data.length > 0) {
            const all = storageService.getItem<SchoolClass[]>(STORAGE_KEYS.CLASSES, INITIAL_CLASSES);
            const other = all.filter((c) => c.school_id !== schoolId);
            storageService.setItem(STORAGE_KEYS.CLASSES, [...other, ...json.data]);
            classes = json.data;
          }
        }
      }
    } catch {}

    const sections = await this.getSections(schoolId);
    const rooms = storageService.getItem<SchoolRoom[]>(STORAGE_KEYS.ROOMS, INITIAL_ROOMS);
    const teachers = storageService.getItem<Teacher[]>(STORAGE_KEYS.TEACHERS, INITIAL_TEACHERS);

    return classes
      .map((c) => {
        const rm = c.room_id ? rooms.find((r) => r.id === c.room_id) : undefined;
        const ct = c.class_teacher_id ? teachers.find((t) => t.id === c.class_teacher_id) : undefined;
        return {
          ...c,
          room_name: rm?.name || c.room_name,
          default_room_number: rm?.room_number || c.default_room_number,
          class_teacher_name: ct ? `${ct.first_name} ${ct.last_name}` : c.class_teacher_name,
          sections: sections.filter((s) => s.class_id === c.id),
        };
      })
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  },

  async getClassById(id: string): Promise<SchoolClass | null> {
    const classes = await this.getClasses('sch-001');
    return classes.find((c) => c.id === id) || null;
  },

  async createClass(schoolId: string, name: string, sortOrder: number, commonMonthlyFee?: number, generationDay = 1, dueDay = 10): Promise<SchoolClass> {
    let newClass: SchoolClass = {
      id: `cls-${Date.now().toString().slice(-4)}`,
      school_id: schoolId,
      name,
      sort_order: sortOrder,
      status: 'active',
      created_at: new Date().toISOString(),
      common_monthly_fee: commonMonthlyFee && commonMonthlyFee > 0 ? commonMonthlyFee : undefined,
      monthly_fee_generation_day: generationDay,
      monthly_fee_due_day: dueDay,
      new_student_charges: [],
    };

    try {
      if (typeof window !== 'undefined') {
        const res = await fetch('/api/classes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newClass),
        });
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            newClass = { ...newClass, ...json.data };
          }
        }
      }
    } catch {}

    const classes = storageService.getItem<SchoolClass[]>(STORAGE_KEYS.CLASSES, INITIAL_CLASSES);
    classes.push(newClass);
    storageService.setItem(STORAGE_KEYS.CLASSES, classes);
    return newClass;
  },

  async updateClass(id: string, data: Partial<SchoolClass>): Promise<SchoolClass> {
    try {
      if (typeof window !== 'undefined') {
        await fetch(`/api/classes/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
      }
    } catch {}

    const classes = storageService.getItem<SchoolClass[]>(STORAGE_KEYS.CLASSES, INITIAL_CLASSES);
    const index = classes.findIndex((item) => item.id === id);
    if (index === -1) throw new Error('Class not found');
    const rooms = storageService.getItem<SchoolRoom[]>(STORAGE_KEYS.ROOMS, INITIAL_ROOMS);
    const teachers = storageService.getItem<Teacher[]>(STORAGE_KEYS.TEACHERS, INITIAL_TEACHERS);
    const room = data.room_id ? rooms.find((item) => item.id === data.room_id) : undefined;
    const teacher = data.class_teacher_id ? teachers.find((item) => item.id === data.class_teacher_id) : undefined;
    classes[index] = {
      ...classes[index],
      ...data,
      room_name: room?.name ?? classes[index].room_name,
      default_room_number: room?.room_number ?? classes[index].default_room_number,
      class_teacher_name: teacher ? `${teacher.first_name} ${teacher.last_name}` : classes[index].class_teacher_name,
    };
    storageService.setItem(STORAGE_KEYS.CLASSES, classes);
    return classes[index];
  },

  async getSections(schoolId: string, classId?: string): Promise<Section[]> {
    let sections = storageService.getItem<Section[]>(STORAGE_KEYS.SECTIONS, INITIAL_SECTIONS).filter((s) => s.school_id === schoolId);
    try {
      if (typeof window !== 'undefined') {
        const res = await fetch(`/api/sections?schoolId=${encodeURIComponent(schoolId)}`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data) && json.data.length > 0) {
            const allSec = storageService.getItem<Section[]>(STORAGE_KEYS.SECTIONS, INITIAL_SECTIONS);
            const otherSec = allSec.filter((s) => s.school_id !== schoolId);
            storageService.setItem(STORAGE_KEYS.SECTIONS, [...otherSec, ...json.data]);
            sections = json.data;
          }
        }
      }
    } catch {}

    if (classId) sections = sections.filter((s) => s.class_id === classId);

    const classes = storageService.getItem<SchoolClass[]>(STORAGE_KEYS.CLASSES, INITIAL_CLASSES);
    const rooms = storageService.getItem<SchoolRoom[]>(STORAGE_KEYS.ROOMS, INITIAL_ROOMS);
    const teachers = storageService.getItem<Teacher[]>(STORAGE_KEYS.TEACHERS, INITIAL_TEACHERS);

    return sections.map((s) => {
      const cls = classes.find((c) => c.id === s.class_id);
      const rm = rooms.find((r) => r.id === s.room_id);
      const ct = teachers.find((t) => t.id === s.class_teacher_id);
      return {
        ...s,
        class_name: cls?.name || s.class_name,
        room_name: rm?.name || s.room_name,
        room_number: rm?.room_number || s.room_number,
        class_teacher_name: ct ? `${ct.first_name} ${ct.last_name}` : s.class_teacher_name,
      };
    });
  },

  async createSection(
    schoolId: string,
    classId: string,
    name: string,
    roomId?: string,
    classTeacherId?: string
  ): Promise<Section> {
    const rooms = storageService.getItem<SchoolRoom[]>(STORAGE_KEYS.ROOMS, INITIAL_ROOMS);
    const teachers = storageService.getItem<Teacher[]>(STORAGE_KEYS.TEACHERS, INITIAL_TEACHERS);

    const targetRoom = rooms.find((r) => r.id === roomId);
    const targetTeacher = teachers.find((t) => t.id === classTeacherId);

    let newSection: Section = {
      id: `sec-${Date.now().toString().slice(-4)}`,
      school_id: schoolId,
      class_id: classId,
      name,
      room_id: roomId,
      room_number: targetRoom?.room_number,
      room_name: targetRoom?.name,
      class_teacher_id: classTeacherId,
      class_teacher_name: targetTeacher ? `${targetTeacher.first_name} ${targetTeacher.last_name}` : undefined,
      status: 'active',
      created_at: new Date().toISOString(),
    };

    try {
      if (typeof window !== 'undefined') {
        const res = await fetch('/api/sections', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newSection),
        });
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            newSection = { ...newSection, ...json.data };
          }
        }
      }
    } catch {}

    const sections = storageService.getItem<Section[]>(STORAGE_KEYS.SECTIONS, INITIAL_SECTIONS);
    sections.push(newSection);
    storageService.setItem(STORAGE_KEYS.SECTIONS, sections);
    return newSection;
  },

  async updateSection(id: string, data: Partial<Section>): Promise<Section> {
    try {
      if (typeof window !== 'undefined') {
        await fetch(`/api/sections/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
      }
    } catch {}

    const sections = storageService.getItem<Section[]>(STORAGE_KEYS.SECTIONS, INITIAL_SECTIONS);
    const index = sections.findIndex((s) => s.id === id);
    if (index === -1) throw new Error('Section not found');

    const rooms = storageService.getItem<SchoolRoom[]>(STORAGE_KEYS.ROOMS, INITIAL_ROOMS);
    const teachers = storageService.getItem<Teacher[]>(STORAGE_KEYS.TEACHERS, INITIAL_TEACHERS);

    const targetRoom = data.room_id ? rooms.find((r) => r.id === data.room_id) : undefined;
    const targetTeacher = data.class_teacher_id ? teachers.find((t) => t.id === data.class_teacher_id) : undefined;

    sections[index] = {
      ...sections[index],
      ...data,
      room_number: targetRoom ? targetRoom.room_number : sections[index].room_number,
      room_name: targetRoom ? targetRoom.name : sections[index].room_name,
      class_teacher_name: targetTeacher ? `${targetTeacher.first_name} ${targetTeacher.last_name}` : sections[index].class_teacher_name,
    };

    storageService.setItem(STORAGE_KEYS.SECTIONS, sections);
    return sections[index];
  },

  async deleteSection(id: string): Promise<void> {
    try {
      if (typeof window !== 'undefined') {
        await fetch(`/api/sections/${id}`, { method: 'DELETE' });
      }
    } catch {}
    const sections = storageService.getItem<Section[]>(STORAGE_KEYS.SECTIONS, INITIAL_SECTIONS);
    storageService.setItem(STORAGE_KEYS.SECTIONS, sections.filter((s) => s.id !== id));
  },

  async getSubjects(schoolId: string): Promise<Subject[]> {
    return storageService.getItem<Subject[]>(STORAGE_KEYS.SUBJECTS, INITIAL_SUBJECTS).filter((s) => s.school_id === schoolId);
  },

  async createSubject(schoolId: string, name: string, code?: string): Promise<Subject> {
    const subjects = storageService.getItem<Subject[]>(STORAGE_KEYS.SUBJECTS, INITIAL_SUBJECTS);
    const newSubject: Subject = {
      id: `sub-${Date.now().toString().slice(-4)}`,
      school_id: schoolId,
      name,
      code,
      status: 'active',
      created_at: new Date().toISOString(),
    };
    subjects.push(newSubject);
    storageService.setItem(STORAGE_KEYS.SUBJECTS, subjects);
    return newSubject;
  },

  async getAcademicYears(schoolId: string): Promise<AcademicYear[]> {
    return storageService.getItem<AcademicYear[]>(STORAGE_KEYS.ACADEMIC_YEARS, INITIAL_ACADEMIC_YEARS).filter((ay) => ay.school_id === schoolId);
  },

  async getCurrentAcademicYear(schoolId: string): Promise<AcademicYear | null> {
    const list = await this.getAcademicYears(schoolId);
    return list.find((ay) => ay.is_current) || list[0] || null;
  },

  async createYear(
    schoolId: string,
    name: string,
    startDate: string,
    endDate: string,
    isCurrent?: boolean
  ): Promise<AcademicYear> {
    const list = storageService.getItem<AcademicYear[]>(STORAGE_KEYS.ACADEMIC_YEARS, INITIAL_ACADEMIC_YEARS);
    if (new Date(startDate) > new Date(endDate)) throw new Error('Session start date must be before its end date.');
    if (list.some((ay) => ay.school_id === schoolId && ay.name.toLowerCase() === name.toLowerCase())) {
      throw new Error(`Academic session "${name}" already exists.`);
    }
    if (isCurrent) {
      list.forEach((ay) => {
        if (ay.school_id === schoolId) ay.is_current = false;
      });
    }
    const newYear: AcademicYear = {
      id: `ay-${Date.now().toString().slice(-4)}`,
      school_id: schoolId,
      name,
      start_date: startDate,
      end_date: endDate,
      is_current: !!isCurrent,
      status: 'active',
      created_at: new Date().toISOString(),
    };
    list.push(newYear);
    storageService.setItem(STORAGE_KEYS.ACADEMIC_YEARS, list);
    return newYear;
  },

  async updateYear(
    schoolId: string,
    yearId: string,
    updates: Pick<AcademicYear, 'name' | 'start_date' | 'end_date'>
  ): Promise<AcademicYear> {
    if (new Date(updates.start_date) > new Date(updates.end_date)) {
      throw new Error('Session start date must be before its end date.');
    }
    const list = storageService.getItem<AcademicYear[]>(STORAGE_KEYS.ACADEMIC_YEARS, INITIAL_ACADEMIC_YEARS);
    const index = list.findIndex((year) => year.id === yearId && year.school_id === schoolId);
    if (index === -1) throw new Error('Academic session not found.');
    if (list.some((year) => year.school_id === schoolId && year.id !== yearId && year.name.toLowerCase() === updates.name.toLowerCase())) {
      throw new Error(`Academic session "${updates.name}" already exists.`);
    }
    list[index] = { ...list[index], ...updates };
    storageService.setItem(STORAGE_KEYS.ACADEMIC_YEARS, list);
    return list[index];
  },

  async setCurrentYear(schoolId: string, yearId: string): Promise<AcademicYear> {
    const list = storageService.getItem<AcademicYear[]>(STORAGE_KEYS.ACADEMIC_YEARS, INITIAL_ACADEMIC_YEARS);
    const target = list.find((year) => year.id === yearId && year.school_id === schoolId);
    if (!target) throw new Error('Academic session not found.');
    list.forEach((year) => {
      if (year.school_id !== schoolId) return;
      year.is_current = year.id === yearId;
      year.status = year.id === yearId ? 'active' : year.status === 'draft' ? 'draft' : 'closed';
    });
    storageService.setItem(STORAGE_KEYS.ACADEMIC_YEARS, list);
    return target;
  },

  async ensureCurrentYear(schoolId: string, today = new Date()): Promise<{ years: AcademicYear[]; current: AcademicYear }> {
    const date = today.toISOString().slice(0, 10);
    let schoolYears = await this.getAcademicYears(schoolId);

    if (schoolYears.length === 0) {
      const calendarYear = today.getUTCFullYear();
      const startsThisYear = today.getUTCMonth() >= 3;
      const startYear = startsThisYear ? calendarYear : calendarYear - 1;
      const created = await this.createYear(
        schoolId,
        `${startYear}-${String(startYear + 1).slice(-2)}`,
        `${startYear}-04-01`,
        `${startYear + 1}-03-31`,
        true
      );
      return { years: [created], current: created };
    }

    let current = schoolYears.find((year) => year.is_current && year.end_date >= date)
      || schoolYears.find((year) => year.start_date <= date && year.end_date >= date)
      || schoolYears.sort((a, b) => b.start_date.localeCompare(a.start_date))[0];

    let safety = 0;
    while (current.end_date < date && safety < 10) {
      const priorEnd = new Date(`${current.end_date}T00:00:00Z`);
      const nextStart = new Date(priorEnd);
      nextStart.setUTCDate(nextStart.getUTCDate() + 1);
      const nextEnd = new Date(nextStart);
      nextEnd.setUTCFullYear(nextEnd.getUTCFullYear() + 1);
      nextEnd.setUTCDate(nextEnd.getUTCDate() - 1);
      const startYear = nextStart.getUTCFullYear();
      const name = `${startYear}-${String(nextEnd.getUTCFullYear()).slice(-2)}`;
      const existing = schoolYears.find((year) => year.start_date === nextStart.toISOString().slice(0, 10));
      current = existing || await this.createYear(
        schoolId,
        name,
        nextStart.toISOString().slice(0, 10),
        nextEnd.toISOString().slice(0, 10),
        false
      );
      schoolYears = await this.getAcademicYears(schoolId);
      safety += 1;
    }

    const active = await this.setCurrentYear(schoolId, current.id);
    schoolYears = await this.getAcademicYears(schoolId);
    return { years: schoolYears.sort((a, b) => b.start_date.localeCompare(a.start_date)), current: active };
  },
};

export const classService = academicService;

export const academicYearService = {
  async getAcademicYears(schoolId: string): Promise<AcademicYear[]> {
    return academicService.getAcademicYears(schoolId);
  },
  async getYears(schoolId: string): Promise<AcademicYear[]> {
    return academicService.getAcademicYears(schoolId);
  },
  async getCurrentAcademicYear(schoolId: string): Promise<AcademicYear | null> {
    return academicService.getCurrentAcademicYear(schoolId);
  },
  async createYear(
    schoolId: string,
    name: string,
    startDate: string,
    endDate: string,
    isCurrent?: boolean
  ): Promise<AcademicYear> {
    return academicService.createYear(schoolId, name, startDate, endDate, isCurrent);
  },
  async updateYear(schoolId: string, yearId: string, updates: Pick<AcademicYear, 'name' | 'start_date' | 'end_date'>): Promise<AcademicYear> {
    return academicService.updateYear(schoolId, yearId, updates);
  },
  async setCurrentYear(schoolId: string, yearId: string): Promise<AcademicYear> {
    return academicService.setCurrentYear(schoolId, yearId);
  },
  async ensureCurrentYear(schoolId: string, today?: Date): Promise<{ years: AcademicYear[]; current: AcademicYear }> {
    return academicService.ensureCurrentYear(schoolId, today);
  },
};

export const subjectService = {
  async getSubjects(schoolId: string): Promise<Subject[]> {
    return academicService.getSubjects(schoolId);
  },
  async createSubject(schoolId: string, name: string, code?: string): Promise<Subject> {
    return academicService.createSubject(schoolId, name, code);
  },
};

export const schoolService = {
  async getSchools(): Promise<School[]> {
    let list: School[] = [];
    if (typeof window !== 'undefined') {
      try {
        const res = await fetch('/api/schools');
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data) && json.data.length > 0) {
            list = json.data;
          }
        }
      } catch (e) {
        console.warn('Failed to fetch schools from server API:', e);
      }
    }

    if (list.length === 0) {
      list = storageService.getItem<School[]>(STORAGE_KEYS.SCHOOLS, INITIAL_SCHOOLS);
    }

    // Accurately reflect real students and teachers created by school admins
    if (typeof window !== 'undefined') {
      const allStudents = storageService.getItem<Student[]>(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS);
      const allTeachers = storageService.getItem<Teacher[]>(STORAGE_KEYS.TEACHERS, INITIAL_TEACHERS);

      list = list.map((school) => {
        const schoolStudents = allStudents.filter((s) => s.school_id === school.id);
        const schoolTeachers = allTeachers.filter(
          (t) => t.school_id === school.id && t.status === 'active'
        );

        return {
          ...school,
          student_count: Math.max(school.student_count || 0, schoolStudents.length),
          teacher_count: Math.max(school.teacher_count || 0, schoolTeachers.length),
        };
      });
    }

    return list;
  },

  async getSchoolById(id: string): Promise<School | null> {
    const list = await this.getSchools();
    return list.find((s) => s.id === id) || null;
  },

  async getSchoolByCode(code: string): Promise<School | null> {
    const list = await this.getSchools();
    const clean = (code || '').trim().toUpperCase();
    return list.find((s) => s.code.toUpperCase() === clean) || null;
  },

  async checkCodeAvailability(
    code: string,
    excludeId?: string
  ): Promise<{
    available: boolean;
    valid: boolean;
    error?: string;
    message?: string;
    existingSchool?: { name: string; code: string };
  }> {
    const sanitized = sanitizeSchoolCode(code);
    const validation = validateSchoolCodeFormat(sanitized);

    if (!validation.isValid) {
      return {
        available: false,
        valid: false,
        error: validation.error,
      };
    }

    if (typeof window !== 'undefined') {
      try {
        const queryParams = new URLSearchParams({ code: sanitized });
        if (excludeId) queryParams.set('excludeId', excludeId);

        const res = await fetch(`/api/schools/check-code?${queryParams.toString()}`);
        if (res.ok) {
          const json = await res.json();
          if (json.success) {
            return {
              available: json.available,
              valid: json.valid,
              error: json.error,
              message: json.message,
              existingSchool: json.existingSchool,
            };
          }
        }
      } catch (e) {
        console.warn('Backend code check failed, checking local storage:', e);
      }
    }

    // Local check fallback
    const list = storageService.getItem<School[]>(STORAGE_KEYS.SCHOOLS, INITIAL_SCHOOLS);
    const existing = list.find(
      (s) => s.code.toUpperCase() === sanitized && (!excludeId || s.id !== excludeId)
    );

    if (existing) {
      return {
        available: false,
        valid: true,
        error: `School code "${sanitized}" is already registered by ${existing.name}.`,
        existingSchool: { name: existing.name, code: existing.code },
      };
    }

    return {
      available: true,
      valid: true,
      message: `School code "${sanitized}" is available!`,
    };
  },

  async createSchool(
    data: {
      name: string;
      code: string;
      email: string;
      phone: string;
      address?: string;
      logo_url?: string;
      profile_photo_max_mb?: number;
      timezone?: string;
      status?: School['status'];
      adminName?: string;
      adminEmail?: string;
      adminPin?: string;
      securityQuestion?: string;
      securityAnswer?: string;
      enabled_features?: SchoolFeatureKey[];
    }
  ): Promise<School> {
    const sanitizedCode = sanitizeSchoolCode(data.code);
    const validation = validateSchoolCodeFormat(sanitizedCode);
    if (!validation.isValid) {
      throw new Error(validation.error || 'Invalid school code format');
    }

    const { adminName, adminEmail, adminPin, securityQuestion, securityAnswer, ...schoolFields } = data;
    const newSchool: School = {
      status: 'active',
      timezone: 'Asia/Kolkata',
      ...schoolFields,
      code: sanitizedCode,
      admin_name: adminName,
      admin_email: adminEmail,
      admin_pin: adminPin || generateSecurePin(),
      admin_pin_failed_attempts: 0,
      is_admin_pin_locked: false,
      security_question: securityQuestion,
      security_answer: securityAnswer,
      id: `sch-${Date.now().toString().slice(-4)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // 1. Post to Server Backend API
    if (typeof window !== 'undefined') {
      try {
        const res = await fetch('/api/schools', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newSchool),
        });
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            const list = storageService.getItem<School[]>(STORAGE_KEYS.SCHOOLS, INITIAL_SCHOOLS);
            const idx = list.findIndex((s) => s.id === json.data.id);
            if (idx !== -1) list[idx] = json.data;
            else list.unshift(json.data);
            storageService.setItem(STORAGE_KEYS.SCHOOLS, list);
            return json.data;
          }
        }
        const failure = await res.json().catch(() => null);
        throw new Error(failure?.error || 'Failed to create school in database');
      } catch (e) {
        throw e instanceof Error ? e : new Error('Failed to create school in database');
      }
    }

    const list = storageService.getItem<School[]>(STORAGE_KEYS.SCHOOLS, INITIAL_SCHOOLS);
    list.unshift(newSchool);
    storageService.setItem(STORAGE_KEYS.SCHOOLS, list);
    return newSchool;
  },

  async updateSchool(id: string, data: Partial<School>): Promise<School> {
    const payload = { ...data };
    if (payload.code) {
      payload.code = sanitizeSchoolCode(payload.code);
      const validation = validateSchoolCodeFormat(payload.code);
      if (!validation.isValid) {
        throw new Error(validation.error || 'Invalid school code format');
      }
    }

    if (typeof window !== 'undefined') {
      try {
        const res = await fetch(`/api/schools/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            const list = storageService.getItem<School[]>(STORAGE_KEYS.SCHOOLS, INITIAL_SCHOOLS);
            const idx = list.findIndex((s) => s.id === id);
            if (idx !== -1) {
              list[idx] = json.data;
            } else {
              list.unshift(json.data);
            }
            storageService.setItem(STORAGE_KEYS.SCHOOLS, list);
            return json.data;
          }
        }
        const failure = await res.json().catch(() => null);
        throw new Error(failure?.error || 'Failed to update school in database');
      } catch (e) {
        throw e instanceof Error ? e : new Error('Failed to update school');
      }
    }

    const list = storageService.getItem<School[]>(STORAGE_KEYS.SCHOOLS, INITIAL_SCHOOLS);
    const index = list.findIndex((s) => s.id === id);
    if (index === -1) {
      if (list.length > 0) {
        list[0] = { ...list[0], ...data, updated_at: new Date().toISOString() };
        storageService.setItem(STORAGE_KEYS.SCHOOLS, list);
        return list[0];
      }
      const newSchool: School = {
        id,
        name: data.name || 'Delhi Public Academy',
        code: data.code || 'JDPS0123Q',
        address: data.address || '',
        phone: data.phone || '+91 98765 43210',
        email: data.email || 'contact@delhipublic.edu.in',
        timezone: data.timezone || 'Asia/Kolkata',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...data,
      };
      list.push(newSchool);
      storageService.setItem(STORAGE_KEYS.SCHOOLS, list);
      return newSchool;
    }
    list[index] = { ...list[index], ...data, updated_at: new Date().toISOString() };
    storageService.setItem(STORAGE_KEYS.SCHOOLS, list);
    return list[index];
  },

  async updateSchoolProfile(id: string, data: Partial<School>): Promise<School> {
    return this.updateSchool(id, data);
  },

  async updateSchoolStatus(id: string, status: School['status']): Promise<School> {
    return this.updateSchool(id, { status });
  },
};

export const teacherPaymentService = {
  async getTeacherPayments(
    schoolId: string,
    filterOrTeacherId?: string | { teacherId?: string; billingMonth?: string }
  ): Promise<TeacherPayment[]> {
    let list = storageService.getItem<TeacherPayment[]>(STORAGE_KEYS.TEACHER_PAYMENTS, INITIAL_TEACHER_PAYMENTS).filter(
      (p) => p.school_id === schoolId
    );
    if (typeof filterOrTeacherId === 'string') {
      list = list.filter((p) => p.teacher_id === filterOrTeacherId);
    } else if (filterOrTeacherId) {
      if (filterOrTeacherId.teacherId) list = list.filter((p) => p.teacher_id === filterOrTeacherId.teacherId);
      if (filterOrTeacherId.billingMonth) list = list.filter((p) => p.billing_month === filterOrTeacherId.billingMonth);
    }
    return list;
  },

  async getPayments(
    schoolId: string,
    filter?: { teacherId?: string; billingMonth?: string }
  ): Promise<TeacherPayment[]> {
    return this.getTeacherPayments(schoolId, filter);
  },

  async getPaymentSummary(schoolId: string, billingMonth?: string): Promise<{
    totalPayable: number;
    totalBudget: number;
    totalPaid: number;
    totalPending: number;
    paidCount: number;
    pendingCount: number;
  }> {
    const teachers = storageService.getItem<Teacher[]>(STORAGE_KEYS.TEACHERS, INITIAL_TEACHERS).filter((t) => t.school_id === schoolId && t.status === 'active');
    const payments = await this.getPayments(schoolId, { billingMonth });

    const totalBudget = teachers.reduce((sum, t) => sum + (t.salary || 0), 0);
    const paidPayments = payments.filter((p) => p.status === 'paid');
    const totalPaid = paidPayments.reduce((sum, p) => sum + p.amount, 0);
    const totalPending = Math.max(0, totalBudget - totalPaid);

    return {
      totalPayable: totalBudget,
      totalBudget,
      totalPaid,
      totalPending,
      paidCount: paidPayments.length,
      pendingCount: Math.max(0, teachers.length - paidPayments.length),
    };
  },

  async recordTeacherPayment(
    payment: Omit<TeacherPayment, 'id' | 'created_at'>
  ): Promise<TeacherPayment> {
    const list = storageService.getItem<TeacherPayment[]>(STORAGE_KEYS.TEACHER_PAYMENTS, INITIAL_TEACHER_PAYMENTS);
    const newPayment: TeacherPayment = {
      ...payment,
      id: `tch-pmt-${Date.now().toString().slice(-4)}`,
      created_at: new Date().toISOString(),
    };
    list.unshift(newPayment);
    storageService.setItem(STORAGE_KEYS.TEACHER_PAYMENTS, list);
    return newPayment;
  },

  async recordPayment(
    payment: Omit<TeacherPayment, 'id' | 'created_at'>
  ): Promise<TeacherPayment> {
    return this.recordTeacherPayment(payment);
  },
};

// ============================================================================
// 11. ATTENDANCE & LEAVE SERVICE (Daily marked_at, marked_by teacher)
// ============================================================================

export const attendanceService = {
  async getAttendance(
    schoolId: string,
    filter?: { classId?: string; sectionId?: string; date?: string; studentId?: string }
  ): Promise<StudentAttendance[]> {
    try {
      if (typeof window !== 'undefined') {
        const queryParams = new URLSearchParams();
        if (filter?.classId) queryParams.set('classId', filter.classId);
        if (filter?.sectionId) queryParams.set('sectionId', filter.sectionId);
        if (filter?.date) queryParams.set('date', filter.date);
        if (filter?.studentId) queryParams.set('studentId', filter.studentId);
        const res = await fetch(`/api/attendance/students?${queryParams.toString()}`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data) && json.data.length > 0) {
            return json.data.sort((a: any, b: any) => b.attendance_date.localeCompare(a.attendance_date));
          }
        }
      }
    } catch {}

    const storedAttendance = storageService.getItem<StudentAttendance[]>(STORAGE_KEYS.ATTENDANCE, []);
    const allAttendance = storedAttendance.filter((record) => !record.id.startsWith('att-today-'));
    if (allAttendance.length !== storedAttendance.length) {
      storageService.setItem(STORAGE_KEYS.ATTENDANCE, allAttendance);
    }
    let list = allAttendance.filter((a) => a.school_id === schoolId);

    if (filter?.classId) list = list.filter((a) => a.class_id === filter.classId);
    if (filter?.sectionId) list = list.filter((a) => a.section_id === filter.sectionId);
    if (filter?.date) list = list.filter((a) => a.attendance_date === filter.date);
    if (filter?.studentId) list = list.filter((a) => a.student_id === filter.studentId);

    const students = storageService.getItem<Student[]>(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS);
    const classes = storageService.getItem<SchoolClass[]>(STORAGE_KEYS.CLASSES, INITIAL_CLASSES);

    return list
      .map((rec) => {
        const student = students.find((s) => s.id === rec.student_id);
        const cls = classes.find((c) => c.id === rec.class_id);
        return {
          ...rec,
          student_name: rec.student_name || (student ? `${student.first_name} ${student.last_name}` : undefined),
          registration_number: rec.registration_number || student?.registration_number,
          roll_number: rec.roll_number || student?.current_enrollment?.roll_number,
          class_name: rec.class_name || cls?.name,
          section_name: rec.section_name || student?.current_enrollment?.section_name,
        };
      })
      .sort((a, b) => b.attendance_date.localeCompare(a.attendance_date));
  },

  async markAttendance(
    schoolId: string,
    attendanceRecords: {
      student_id: string;
      class_id: string;
      section_id: string;
      attendance_date: string;
      status: AttendanceStatus;
      remarks?: string;
      marked_by?: string;
      marked_by_name?: string;
    }[]
  ): Promise<void> {
    let allAttendance = storageService.getItem<StudentAttendance[]>(STORAGE_KEYS.ATTENDANCE, []);
    const nowIso = new Date().toISOString();

    attendanceRecords.forEach((rec) => {
      // Remove previous entry for same student & date
      allAttendance = allAttendance.filter(
        (a) => !(a.student_id === rec.student_id && a.attendance_date === rec.attendance_date)
      );

      allAttendance.push({
        id: `att-${Date.now().toString().slice(-4)}-${Math.random().toString(36).substring(2, 5)}`,
        school_id: schoolId,
        student_id: rec.student_id,
        class_id: rec.class_id,
        section_id: rec.section_id,
        attendance_date: rec.attendance_date,
        status: rec.status,
        remarks: rec.remarks,
        marked_at: nowIso,
        marked_by: rec.marked_by,
        marked_by_name: rec.marked_by_name,
        recorded_by: rec.marked_by,
        created_at: nowIso,
      });
    });

    storageService.setItem(STORAGE_KEYS.ATTENDANCE, allAttendance);
  },

  async saveClassAttendance(
    schoolId: string,
    academicYearId: string,
    classId: string,
    sectionId: string,
    attendanceDate: string,
    records: { student_id: string; status: AttendanceStatus; remarks?: string }[],
    markedById?: string,
    markedByName?: string
  ): Promise<void> {
    return this.markAttendance(
      schoolId,
      records.map((r) => ({
        student_id: r.student_id,
        class_id: classId,
        section_id: sectionId,
        attendance_date: attendanceDate,
        status: r.status,
        remarks: r.remarks,
        marked_by: markedById,
        marked_by_name: markedByName,
      }))
    );
  },

  async correctAttendance(
    id: string,
    status: AttendanceStatus,
    remarks?: string,
    correctedBy?: string,
    correctedByName?: string
  ): Promise<StudentAttendance> {
    const allAttendance = storageService.getItem<StudentAttendance[]>(STORAGE_KEYS.ATTENDANCE, []);
    const index = allAttendance.findIndex((a) => a.id === id);
    if (index === -1) throw new Error('Attendance record not found');

    allAttendance[index].status = status;
    allAttendance[index].remarks = remarks;
    allAttendance[index].marked_by_name = correctedByName || allAttendance[index].marked_by_name;
    storageService.setItem(STORAGE_KEYS.ATTENDANCE, allAttendance);
    return allAttendance[index];
  },

  async getTodayAttendanceSummary(schoolId: string, date?: string): Promise<{
    totalPresent: number;
    totalAbsent: number;
    totalLeave: number;
    totalPartial: number;
    totalStudents: number;
    attendancePercentage: number;
    byClass: { class_name: string; total: number; present: number; absent: number; leave: number }[];
  }> {
    const todayStr = date || new Date().toISOString().split('T')[0];
    const attendance = await this.getAttendance(schoolId, { date: todayStr });
    const students = storageService.getItem<Student[]>(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS).filter((s) => s.school_id === schoolId && s.status === 'active');
    const classes = storageService.getItem<SchoolClass[]>(STORAGE_KEYS.CLASSES, INITIAL_CLASSES).filter((c) => c.school_id === schoolId);

    const totalPresent = attendance.filter((a) => a.status === 'present').length;
    const totalAbsent = attendance.filter((a) => a.status === 'absent').length;
    const totalLeave = attendance.filter((a) => a.status === 'leave').length;
    const totalPartial = attendance.filter((a) => a.status === 'partial').length;
    const totalStudents = students.length;
    const attendancePercentage = totalStudents > 0 ? (totalPresent / totalStudents) * 100 : 0;

    const byClass = classes.map((cls) => {
      const clsStudents = students.filter((s) => s.current_enrollment?.class_id === cls.id);
      const clsAtt = attendance.filter((a) => a.class_id === cls.id);
      return {
        class_name: cls.name,
        total: clsStudents.length,
        present: clsAtt.filter((a) => a.status === 'present').length,
        absent: clsAtt.filter((a) => a.status === 'absent').length,
        leave: clsAtt.filter((a) => a.status === 'leave').length,
      };
    });

    return {
      totalPresent,
      totalAbsent,
      totalLeave,
      totalPartial,
      totalStudents,
      attendancePercentage,
      byClass,
    };
  },
};

export const leaveService = {
  async getLeaves(
    schoolId: string,
    filter?: { studentId?: string; status?: StudentLeave['status']; activeOnDate?: string }
  ): Promise<StudentLeave[]> {
    let list = storageService.getItem<StudentLeave[]>(STORAGE_KEYS.STUDENT_LEAVES, INITIAL_STUDENT_LEAVES).filter(
      (l) => l.school_id === schoolId
    );
    if (filter?.studentId) list = list.filter((l) => l.student_id === filter.studentId);
    if (filter?.status) list = list.filter((l) => l.status === filter.status);
    if (filter?.activeOnDate) {
      list = list.filter((l) => l.start_date <= filter.activeOnDate! && l.end_date >= filter.activeOnDate!);
    }

    return list.sort((a, b) => b.start_date.localeCompare(a.start_date));
  },

  async applyLeave(
    data: Omit<StudentLeave, 'id' | 'created_at' | 'status'> & { status?: StudentLeave['status'] }
  ): Promise<StudentLeave> {
    const list = storageService.getItem<StudentLeave[]>(STORAGE_KEYS.STUDENT_LEAVES, INITIAL_STUDENT_LEAVES);
    const newLeave: StudentLeave = {
      ...data,
      id: `lev-${Date.now().toString().slice(-4)}`,
      status: data.status || 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    list.unshift(newLeave);
    storageService.setItem(STORAGE_KEYS.STUDENT_LEAVES, list);

    // If student submitted and parent confirmation is required, create a notification for parents
    if (data.requested_by_type === 'student' && data.parent_confirmation_required) {
      try {
        const links = storageService.getItem<ParentStudentLink[]>(
          STORAGE_KEYS.PARENT_STUDENT_LINKS,
          INITIAL_PARENT_STUDENT_LINKS
        );
        const parentLinks = links.filter((l) => l.student_id === data.student_id && l.status === 'active');
        parentLinks.forEach((pl) => {
          notificationService.createNotification({
            school_id: data.school_id,
            recipient_user_id: pl.parent_id,
            type: 'leave_parent_confirmation_required',
            title: 'Leave Request Awaiting Parent Confirmation',
            message: `${data.student_name || 'Your child'} submitted a leave request for ${data.start_date}${data.end_date !== data.start_date ? ` to ${data.end_date}` : ''}. Please confirm or reject.`,
            entity_type: 'leave',
            entity_id: newLeave.id,
          });
        });
      } catch {}
    }

    return newLeave;
  },

  async createLeave(
    data: Omit<StudentLeave, 'id' | 'created_at' | 'status'> & { status?: StudentLeave['status'] }
  ): Promise<StudentLeave> {
    return this.applyLeave(data);
  },

  async parentConfirmLeave(leaveId: string, parentId: string, parentName: string): Promise<StudentLeave> {
    const list = storageService.getItem<StudentLeave[]>(STORAGE_KEYS.STUDENT_LEAVES, INITIAL_STUDENT_LEAVES);
    const index = list.findIndex((l) => l.id === leaveId);
    if (index === -1) throw new Error('Leave record not found');

    list[index] = {
      ...list[index],
      parent_confirmed_at: new Date().toISOString(),
      parent_confirmed_by: parentName,
      updated_at: new Date().toISOString(),
    };
    storageService.setItem(STORAGE_KEYS.STUDENT_LEAVES, list);
    return list[index];
  },

  async reviewLeave(
    id: string,
    status: 'approved' | 'rejected',
    reason?: string,
    approverId: string = 'usr-admin-01',
    approverName: string = 'Class Teacher'
  ): Promise<StudentLeave> {
    const list = storageService.getItem<StudentLeave[]>(STORAGE_KEYS.STUDENT_LEAVES, INITIAL_STUDENT_LEAVES);
    const index = list.findIndex((l) => l.id === id);
    if (index === -1) throw new Error('Leave record not found');

    list[index] = {
      ...list[index],
      status,
      approved_by: status === 'approved' ? approverId : undefined,
      approved_by_name: status === 'approved' ? approverName : undefined,
      approved_at: status === 'approved' ? new Date().toISOString() : undefined,
      rejection_reason: status === 'rejected' ? reason : undefined,
      updated_at: new Date().toISOString(),
    };
    storageService.setItem(STORAGE_KEYS.STUDENT_LEAVES, list);

    // Notify parents & student
    try {
      const leave = list[index];
      const links = storageService.getItem<ParentStudentLink[]>(
        STORAGE_KEYS.PARENT_STUDENT_LINKS,
        INITIAL_PARENT_STUDENT_LINKS
      );
      const parentLinks = links.filter((l) => l.student_id === leave.student_id && l.status === 'active');
      parentLinks.forEach((pl) => {
        notificationService.createNotification({
          school_id: leave.school_id,
          recipient_user_id: pl.parent_id,
          type: status === 'approved' ? 'leave_approved' : 'leave_rejected',
          title: `Leave Request ${status === 'approved' ? 'Approved' : 'Rejected'}`,
          message: `${leave.student_name || 'Your child'}'s leave for ${leave.start_date} has been ${status}${reason ? `. Reason: ${reason}` : ''}.`,
          entity_type: 'leave',
          entity_id: leave.id,
        });
      });
    } catch {}

    return list[index];
  },

  async grantDirectLeave(data: {
    school_id: string;
    student_id: string;
    leave_type: LeaveType;
    start_date: string;
    end_date: string;
    partial_start_time?: string;
    partial_end_time?: string;
    reason: string;
    granterId: string;
    granterName: string;
    granterRole: 'teacher' | 'school_admin';
    student_name?: string;
    class_name?: string;
    section_name?: string;
  }): Promise<StudentLeave> {
    const list = storageService.getItem<StudentLeave[]>(STORAGE_KEYS.STUDENT_LEAVES, INITIAL_STUDENT_LEAVES);
    const newLeave: StudentLeave = {
      ...data,
      id: `lev-${Date.now().toString().slice(-4)}`,
      requested_by_type: data.granterRole,
      requested_by_user_id: data.granterId,
      requested_by_name: data.granterName,
      parent_confirmation_required: false,
      status: 'approved',
      approved_by: data.granterId,
      approved_by_name: data.granterName,
      approved_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    list.unshift(newLeave);
    storageService.setItem(STORAGE_KEYS.STUDENT_LEAVES, list);

    // Notify linked parents immediately
    try {
      const links = storageService.getItem<ParentStudentLink[]>(
        STORAGE_KEYS.PARENT_STUDENT_LINKS,
        INITIAL_PARENT_STUDENT_LINKS
      );
      const parentLinks = links.filter((l) => l.student_id === data.student_id && l.status === 'active');
      parentLinks.forEach((pl) => {
        notificationService.createNotification({
          school_id: data.school_id,
          recipient_user_id: pl.parent_id,
          type: 'leave_created_by_teacher',
          title: 'Student Leave Granted by School',
          message: `${data.student_name || 'Your child'} was marked on approved ${data.leave_type === 'partial_day' ? 'partial' : 'full-day'} leave today by ${data.granterName}. Reason: ${data.reason}.`,
          entity_type: 'leave',
          entity_id: newLeave.id,
        });
      });
    } catch {}

    return newLeave;
  },

  async getActiveLeaveForStudent(studentId: string, date: string): Promise<StudentLeave | null> {
    const list = storageService.getItem<StudentLeave[]>(STORAGE_KEYS.STUDENT_LEAVES, INITIAL_STUDENT_LEAVES);
    return (
      list.find(
        (l) => l.student_id === studentId && l.status === 'approved' && l.start_date <= date && l.end_date >= date
      ) || null
    );
  },
};

export const teacherWorkforceService = {
  async getAttendance(schoolId: string, filter?: { teacherId?: string; date?: string }): Promise<TeacherAttendance[]> {
    let list = storageService.getItem<TeacherAttendance[]>(STORAGE_KEYS.TEACHER_ATTENDANCE, []).filter((item) => item.school_id === schoolId);
    if (filter?.teacherId) list = list.filter((item) => item.teacher_id === filter.teacherId);
    if (filter?.date) list = list.filter((item) => item.attendance_date === filter.date);
    return list.sort((a, b) => b.attendance_date.localeCompare(a.attendance_date));
  },

  async saveAttendance(schoolId: string, date: string, records: Array<{ teacher: Teacher; status: AttendanceStatus; remarks?: string }>, actor?: UserPersona): Promise<void> {
    let list = storageService.getItem<TeacherAttendance[]>(STORAGE_KEYS.TEACHER_ATTENDANCE, []);
    const now = new Date().toISOString();
    for (const record of records) {
      list = list.filter((item) => !(item.school_id === schoolId && item.teacher_id === record.teacher.id && item.attendance_date === date));
      list.push({
        id: `tatt-${Date.now()}-${record.teacher.id}`,
        school_id: schoolId,
        teacher_id: record.teacher.id,
        attendance_date: date,
        status: record.status,
        remarks: record.remarks,
        marked_by: actor?.id,
        marked_by_name: actor?.name,
        teacher_name: `${record.teacher.first_name} ${record.teacher.last_name}`,
        employee_number: record.teacher.employee_number,
        created_at: now,
        updated_at: now,
      });
    }
    storageService.setItem(STORAGE_KEYS.TEACHER_ATTENDANCE, list);
  },

  async getLeaves(schoolId: string, filter?: { teacherId?: string; status?: TeacherLeave['status'] }): Promise<TeacherLeave[]> {
    let list = storageService.getItem<TeacherLeave[]>(STORAGE_KEYS.TEACHER_LEAVES, []).filter((item) => item.school_id === schoolId);
    if (filter?.teacherId) list = list.filter((item) => item.teacher_id === filter.teacherId);
    if (filter?.status) list = list.filter((item) => item.status === filter.status);
    return list.sort((a, b) => b.requested_at.localeCompare(a.requested_at));
  },

  async requestLeave(data: Omit<TeacherLeave, 'id' | 'status' | 'requested_at'>): Promise<TeacherLeave> {
    const list = storageService.getItem<TeacherLeave[]>(STORAGE_KEYS.TEACHER_LEAVES, []);
    const leave: TeacherLeave = { ...data, id: `tlev-${Date.now()}`, status: 'pending', requested_at: new Date().toISOString() };
    list.unshift(leave);
    storageService.setItem(STORAGE_KEYS.TEACHER_LEAVES, list);
    return leave;
  },

  async reviewLeave(id: string, updates: { status: 'approved' | 'rejected'; start_date?: string; end_date?: string; return_date?: string; admin_notes?: string }, actor?: UserPersona): Promise<TeacherLeave> {
    const list = storageService.getItem<TeacherLeave[]>(STORAGE_KEYS.TEACHER_LEAVES, []);
    const index = list.findIndex((item) => item.id === id);
    if (index < 0) throw new Error('Teacher leave request not found');
    list[index] = { ...list[index], ...updates, reviewed_at: new Date().toISOString(), reviewed_by: actor?.id, reviewed_by_name: actor?.name };
    storageService.setItem(STORAGE_KEYS.TEACHER_LEAVES, list);
    return list[index];
  },
};

export const staffWorkforceService = {
  async getAttendance(schoolId: string, filter?: { staffId?: string; date?: string }): Promise<StaffAttendance[]> {
    let list = storageService.getItem<StaffAttendance[]>(STORAGE_KEYS.STAFF_ATTENDANCE, []).filter((item) => item.school_id === schoolId);
    if (filter?.staffId) list = list.filter((item) => item.staff_id === filter.staffId);
    if (filter?.date) list = list.filter((item) => item.attendance_date === filter.date);
    return list.sort((a, b) => b.attendance_date.localeCompare(a.attendance_date));
  },

  async saveAttendance(schoolId: string, date: string, records: Array<{ staff: Staff; status: AttendanceStatus; remarks?: string }>, actor?: UserPersona): Promise<void> {
    let list = storageService.getItem<StaffAttendance[]>(STORAGE_KEYS.STAFF_ATTENDANCE, []);
    const now = new Date().toISOString();
    for (const record of records) {
      list = list.filter((item) => !(item.school_id === schoolId && item.staff_id === record.staff.id && item.attendance_date === date));
      list.push({
        id: `satt-${Date.now()}-${record.staff.id}`,
        school_id: schoolId,
        staff_id: record.staff.id,
        attendance_date: date,
        status: record.status,
        remarks: record.remarks,
        marked_by: actor?.id,
        marked_by_name: actor?.name,
        staff_name: `${record.staff.first_name} ${record.staff.last_name}`,
        staff_type: record.staff.staff_type,
        employee_number: record.staff.employee_number,
        created_at: now,
        updated_at: now,
      });
    }
    storageService.setItem(STORAGE_KEYS.STAFF_ATTENDANCE, list);
  },

  async getLeaves(schoolId: string, filter?: { staffId?: string; status?: StaffLeave['status'] }): Promise<StaffLeave[]> {
    let list = storageService.getItem<StaffLeave[]>(STORAGE_KEYS.STAFF_LEAVES, []).filter((item) => item.school_id === schoolId);
    if (filter?.staffId) list = list.filter((item) => item.staff_id === filter.staffId);
    if (filter?.status) list = list.filter((item) => item.status === filter.status);
    return list.sort((a, b) => b.requested_at.localeCompare(a.requested_at));
  },

  async requestLeave(data: Omit<StaffLeave, 'id' | 'status' | 'requested_at'>): Promise<StaffLeave> {
    const list = storageService.getItem<StaffLeave[]>(STORAGE_KEYS.STAFF_LEAVES, []);
    const leave: StaffLeave = { ...data, id: `slev-${Date.now()}`, status: 'pending', requested_at: new Date().toISOString() };
    list.unshift(leave);
    storageService.setItem(STORAGE_KEYS.STAFF_LEAVES, list);
    return leave;
  },

  async reviewLeave(id: string, updates: { status: 'approved' | 'rejected'; start_date?: string; end_date?: string; return_date?: string; admin_notes?: string }, actor?: UserPersona): Promise<StaffLeave> {
    const list = storageService.getItem<StaffLeave[]>(STORAGE_KEYS.STAFF_LEAVES, []);
    const index = list.findIndex((item) => item.id === id);
    if (index < 0) throw new Error('Staff leave request not found');
    list[index] = { ...list[index], ...updates, reviewed_at: new Date().toISOString(), reviewed_by: actor?.id, reviewed_by_name: actor?.name };
    storageService.setItem(STORAGE_KEYS.STAFF_LEAVES, list);
    return list[index];
  },
};

export const STANDARD_INDIAN_HOLIDAYS = [
  { name: 'Makar Sankranti / Pongal', start_date: '2026-01-14', end_date: '2026-01-14', reason: 'Harvest Festival' },
  { name: 'Republic Day', start_date: '2026-01-26', end_date: '2026-01-26', reason: 'National Gazetted Holiday' },
  { name: 'Maha Shivratri', start_date: '2026-02-16', end_date: '2026-02-16', reason: 'Religious Gazetted Holiday' },
  { name: 'Holi (Festival of Colours)', start_date: '2026-03-03', end_date: '2026-03-04', reason: 'National Gazetted Holiday' },
  { name: 'Id-ul-Fitr (Eid)', start_date: '2026-03-21', end_date: '2026-03-21', reason: 'National Gazetted Holiday' },
  { name: 'Ram Navami', start_date: '2026-03-28', end_date: '2026-03-28', reason: 'Religious Gazetted Holiday' },
  { name: 'Mahavir Jayanti', start_date: '2026-03-31', end_date: '2026-03-31', reason: 'Gazetted Holiday' },
  { name: 'Good Friday', start_date: '2026-04-03', end_date: '2026-04-03', reason: 'National Gazetted Holiday' },
  { name: 'Dr. B.R. Ambedkar Jayanti', start_date: '2026-04-14', end_date: '2026-04-14', reason: 'National Gazetted Holiday' },
  { name: 'Buddha Purnima', start_date: '2026-05-01', end_date: '2026-05-01', reason: 'Gazetted Holiday' },
  { name: 'Summer Vacation Break', start_date: '2026-05-18', end_date: '2026-06-30', reason: 'Annual Summer Vacation' },
  { name: 'Muharram', start_date: '2026-06-26', end_date: '2026-06-26', reason: 'Gazetted Holiday' },
  { name: 'Independence Day', start_date: '2026-08-15', end_date: '2026-08-15', reason: 'National Gazetted Holiday' },
  { name: 'Raksha Bandhan', start_date: '2026-08-28', end_date: '2026-08-28', reason: 'Festival Observance' },
  { name: 'Janmashtami (Krishna Jayanti)', start_date: '2026-09-04', end_date: '2026-09-04', reason: 'Gazetted Holiday' },
  { name: 'Milad-un-Nabi (Id-e-Milad)', start_date: '2026-09-05', end_date: '2026-09-05', reason: 'Gazetted Holiday' },
  { name: 'Mahatma Gandhi Jayanti', start_date: '2026-10-02', end_date: '2026-10-02', reason: 'National Gazetted Holiday' },
  { name: 'Dussehra (Maha Navami / Vijayadashami)', start_date: '2026-10-19', end_date: '2026-10-20', reason: 'National Gazetted Holiday' },
  { name: 'Diwali (Deepavali Break)', start_date: '2026-11-08', end_date: '2026-11-12', reason: 'National Festival Break' },
  { name: 'Guru Nanak Jayanti', start_date: '2026-11-24', end_date: '2026-11-24', reason: 'Gazetted Holiday' },
  { name: 'Christmas & Winter Vacation', start_date: '2026-12-25', end_date: '2027-01-02', reason: 'Winter Vacation Break' },
];

async function holidayApi<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, { ...init, headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) } });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.success === false) throw new Error(json.error || 'Holiday request failed');
  return json.data as T;
}

const byStartDate = (a: SchoolHoliday, b: SchoolHoliday) => a.start_date.localeCompare(b.start_date);

export const holidayService = {
  async getHolidays(schoolId: string): Promise<SchoolHoliday[]> {
    if (!isDemoEnvironment()) {
      return (await holidayApi<SchoolHoliday[]>('/api/holidays')).sort(byStartDate);
    }
    let all = storageService.getItem<SchoolHoliday[]>(STORAGE_KEYS.HOLIDAYS, INITIAL_HOLIDAYS);
    let schoolHols = all.filter((h) => h.school_id === schoolId);

    // If school has no holidays declared, initialize with standard Indian Academic Holidays
    if (schoolHols.length === 0) {
      const seeded: SchoolHoliday[] = STANDARD_INDIAN_HOLIDAYS.map((std, idx) => ({
        id: `hol-${Date.now().toString().slice(-4)}-${idx}`,
        school_id: schoolId,
        academic_year_id: 'ay-2026',
        name: std.name,
        start_date: std.start_date,
        end_date: std.end_date,
        reason: std.reason,
        created_at: new Date().toISOString(),
      }));
      all = [...all, ...seeded];
      storageService.setItem(STORAGE_KEYS.HOLIDAYS, all);
      schoolHols = seeded;
    }

    return schoolHols.sort((a, b) => a.start_date.localeCompare(b.start_date));
  },

  async createHoliday(data: Omit<SchoolHoliday, 'id' | 'created_at'>): Promise<SchoolHoliday> {
    if (!isDemoEnvironment()) {
      return holidayApi<SchoolHoliday>('/api/holidays', { method: 'POST', body: JSON.stringify(data) });
    }
    const list = storageService.getItem<SchoolHoliday[]>(STORAGE_KEYS.HOLIDAYS, INITIAL_HOLIDAYS);
    const newHol: SchoolHoliday = {
      ...data,
      id: `hol-${Date.now().toString().slice(-4)}`,
      created_at: new Date().toISOString(),
    };
    list.push(newHol);
    storageService.setItem(STORAGE_KEYS.HOLIDAYS, list);
    return newHol;
  },

  async updateHoliday(id: string, data: Partial<SchoolHoliday>): Promise<SchoolHoliday> {
    if (!isDemoEnvironment()) {
      return holidayApi<SchoolHoliday>(`/api/holidays/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(data) });
    }
    const list = storageService.getItem<SchoolHoliday[]>(STORAGE_KEYS.HOLIDAYS, INITIAL_HOLIDAYS);
    const index = list.findIndex((h) => h.id === id);
    if (index === -1) throw new Error('Holiday not found');

    list[index] = { ...list[index], ...data };
    storageService.setItem(STORAGE_KEYS.HOLIDAYS, list);
    return list[index];
  },

  async loadStandardIndianHolidays(schoolId: string, academicYearId = 'ay-2026'): Promise<SchoolHoliday[]> {
    if (!isDemoEnvironment()) {
      const existing = await this.getHolidays(schoolId);
      for (const h of existing) {
        await holidayApi(`/api/holidays/${encodeURIComponent(h.id)}`, { method: 'DELETE' });
      }
      const created: SchoolHoliday[] = [];
      for (const std of STANDARD_INDIAN_HOLIDAYS) {
        created.push(await this.createHoliday({
          school_id: schoolId,
          academic_year_id: academicYearId,
          name: std.name,
          start_date: std.start_date,
          end_date: std.end_date,
          reason: std.reason,
        }));
      }
      return created.sort(byStartDate);
    }
    let all = storageService.getItem<SchoolHoliday[]>(STORAGE_KEYS.HOLIDAYS, INITIAL_HOLIDAYS);
    // Remove existing holidays for this school and replace with standard set
    all = all.filter((h) => h.school_id !== schoolId);

    const newHols: SchoolHoliday[] = STANDARD_INDIAN_HOLIDAYS.map((std, idx) => ({
      id: `hol-${Date.now().toString().slice(-4)}-${idx}`,
      school_id: schoolId,
      academic_year_id: academicYearId,
      name: std.name,
      start_date: std.start_date,
      end_date: std.end_date,
      reason: std.reason,
      created_at: new Date().toISOString(),
    }));

    all = [...all, ...newHols];
    storageService.setItem(STORAGE_KEYS.HOLIDAYS, all);
    return newHols.sort((a, b) => a.start_date.localeCompare(b.start_date));
  },

  async deleteHoliday(id: string, actorName = 'School Administrator', actorRole: UserRole = 'school_admin'): Promise<void> {
    if (!isDemoEnvironment()) {
      await holidayApi(`/api/holidays/${encodeURIComponent(id)}`, { method: 'DELETE' });
      return;
    }
    let list = storageService.getItem<SchoolHoliday[]>(STORAGE_KEYS.HOLIDAYS, INITIAL_HOLIDAYS);
    const target = list.find((h) => h.id === id);
    if (target) {
      await recycleBinService.moveToBin({
        schoolId: target.school_id,
        entityType: 'holiday',
        entityId: target.id,
        entityName: target.name,
        entityDetails: `Holiday (${target.start_date} to ${target.end_date || target.start_date})${target.reason ? ' • ' + target.reason : ''}`,
        originalData: target,
        deletedByName: actorName,
        deletedByRole: actorRole,
      });
      list = list.filter((h) => h.id !== id);
      storageService.setItem(STORAGE_KEYS.HOLIDAYS, list);
    }
  },

  async isHoliday(schoolId: string, date: string): Promise<{ isHoliday: boolean; holiday?: SchoolHoliday }> {
    const holidays = await this.getHolidays(schoolId);
    const found = holidays.find((h) => {
      const start = h.start_date;
      const end = h.end_date || h.start_date;
      return date >= start && date <= end;
    });
    return { isHoliday: !!found, holiday: found };
  },

  async checkDayStatus(schoolId: string, date: string): Promise<{
    isOpen: boolean;
    reasonType: 'regular' | 'holiday' | 'weekly_off' | 'emergency';
    title: string;
    description: string;
    holiday?: SchoolHoliday;
  }> {
    // 1. Check declared calendar holidays
    const holCheck = await this.isHoliday(schoolId, date);
    if (holCheck.isHoliday && holCheck.holiday) {
      return {
        isOpen: false,
        reasonType: 'holiday',
        title: `School Holiday: ${holCheck.holiday.name}`,
        description: `${holCheck.holiday.start_date} to ${holCheck.holiday.end_date || holCheck.holiday.start_date}${
          holCheck.holiday.reason ? ' — ' + holCheck.holiday.reason : ''
        }`,
        holiday: holCheck.holiday,
      };
    }

    // 2. Check weekly timings from School Profile
    const schools = storageService.getItem<School[]>(STORAGE_KEYS.SCHOOLS, INITIAL_SCHOOLS);
    const school = schools.find((s) => s.id === schoolId);

    // Parse date day of week (0 = Sun, 1 = Mon, ... 6 = Sat)
    const dateObj = new Date(date + 'T00:00:00');
    const dayOfWeek = dateObj.getDay();
    const dayMap = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayKey = dayMap[dayOfWeek];

    const weeklyTimings = school?.weekly_timings || {
      monday: { is_open: true, open_time: '08:00', close_time: '15:00' },
      tuesday: { is_open: true, open_time: '08:00', close_time: '15:00' },
      wednesday: { is_open: true, open_time: '08:00', close_time: '15:00' },
      thursday: { is_open: true, open_time: '08:00', close_time: '15:00' },
      friday: { is_open: true, open_time: '08:00', close_time: '15:00' },
      saturday: { is_open: true, open_time: '08:00', close_time: '13:00' },
      sunday: { is_open: false, open_time: '08:00', close_time: '15:00' },
    };

    const dayConfig = (weeklyTimings as Record<string, any>)[dayKey];
    if (dayConfig && !dayConfig.is_open) {
      const dayName = dayKey.charAt(0).toUpperCase() + dayKey.slice(1);
      return {
        isOpen: false,
        reasonType: 'weekly_off',
        title: `School Closed: Weekly Off (${dayName})`,
        description: `School is scheduled closed every ${dayName} as per weekly school timing.`,
      };
    }

    return {
      isOpen: true,
      reasonType: 'regular',
      title: 'School Open',
      description: 'Regular school working day.',
    };
  },
};

// ============================================================================
// 12. NOTICES, FEES, EXAMS, TIMETABLE & SECURITY
// ============================================================================

export const noticeService = {
  async getNotices(
    schoolId: string,
    filter?: { audience?: Notice['audience']; includeExpired?: boolean }
  ): Promise<Notice[]> {
    let list = storageService.getItem<Notice[]>(STORAGE_KEYS.NOTICES, INITIAL_NOTICES).filter((n) => n.school_id === schoolId);
    const today = new Date().toISOString().split('T')[0];

    if (!filter?.includeExpired) {
      list = list.filter((n) => !n.expires_at || n.expires_at >= today);
    }
    if (filter?.audience && filter.audience !== 'everyone') {
      list = list.filter((n) => n.audience === 'everyone' || n.audience === filter.audience);
    }

    return list.sort((a, b) => b.starts_at.localeCompare(a.starts_at));
  },

  async createNotice(noticeData: Omit<Notice, 'id' | 'created_at' | 'status'>): Promise<Notice> {
    const list = storageService.getItem<Notice[]>(STORAGE_KEYS.NOTICES, INITIAL_NOTICES);
    const newNotice: Notice = {
      ...noticeData,
      id: `ntc-${Date.now().toString().slice(-4)}`,
      status: 'active',
      created_at: new Date().toISOString(),
    };
    list.unshift(newNotice);
    storageService.setItem(STORAGE_KEYS.NOTICES, list);
    return newNotice;
  },

  async deleteNotice(id: string, actorName = 'School Administrator', actorRole: UserRole = 'school_admin'): Promise<void> {
    let list = storageService.getItem<Notice[]>(STORAGE_KEYS.NOTICES, INITIAL_NOTICES);
    const target = list.find((n) => n.id === id);
    if (target) {
      await recycleBinService.moveToBin({
        schoolId: target.school_id,
        entityType: 'notice',
        entityId: target.id,
        entityName: target.title,
        entityDetails: `Audience: ${target.audience?.toUpperCase() || 'EVERYONE'} (Published: ${target.starts_at?.split('T')[0] || 'Notice'})`,
        originalData: target,
        deletedByName: actorName,
        deletedByRole: actorRole,
      });
      list = list.filter((n) => n.id !== id);
      storageService.setItem(STORAGE_KEYS.NOTICES, list);
    }
  },
};

export const feeService = {
  async getFeeStructures(schoolId: string): Promise<FeeStructure[]> {
    return storageService.getItem<FeeStructure[]>(STORAGE_KEYS.FEE_STRUCTURES, INITIAL_FEE_STRUCTURES).filter((f) => f.school_id === schoolId);
  },

  async createFeeStructure(
    data: Omit<FeeStructure, 'id' | 'created_at' | 'status'> & { status?: FeeStructure['status'] }
  ): Promise<FeeStructure> {
    const list = storageService.getItem<FeeStructure[]>(STORAGE_KEYS.FEE_STRUCTURES, INITIAL_FEE_STRUCTURES);
    const newFs: FeeStructure = {
      ...data,
      id: `fs-${Date.now().toString().slice(-4)}`,
      status: data.status || 'active',
      created_at: new Date().toISOString(),
    };
    list.push(newFs);
    storageService.setItem(STORAGE_KEYS.FEE_STRUCTURES, list);
    return newFs;
  },

  async getInvoices(
    schoolId: string,
    filter?: { studentId?: string; status?: StudentFeeInvoice['status']; month?: string; billingMonth?: string }
  ): Promise<StudentFeeInvoice[]> {
    if (typeof window !== 'undefined') {
      try {
        const queryParams = new URLSearchParams();
        if (filter?.studentId) queryParams.set('studentId', filter.studentId);
        const res = await fetch(`/api/fee-invoices?${queryParams.toString()}`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data)) {
            const serverInvoices = json.data as StudentFeeInvoice[];
            const localInvoices = storageService.getItem<StudentFeeInvoice[]>(STORAGE_KEYS.FEE_INVOICES, INITIAL_FEE_INVOICES);
            serverInvoices.forEach((sInv) => {
              const idx = localInvoices.findIndex((l) => l.id === sInv.id);
              if (idx !== -1) {
                if ((localInvoices[idx].paid_amount || 0) > (sInv.paid_amount || 0)) {
                  fetch(`/api/fee-invoices/${localInvoices[idx].id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(localInvoices[idx]),
                  }).catch(() => {});
                } else {
                  localInvoices[idx] = sInv;
                }
              } else {
                localInvoices.unshift(sInv);
              }
            });
            localInvoices.forEach((lInv) => {
              if (lInv.school_id === schoolId && !serverInvoices.some((s) => s.id === lInv.id)) {
                fetch('/api/fee-invoices', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(lInv),
                }).catch(() => {});
              }
            });
            storageService.setItem(STORAGE_KEYS.FEE_INVOICES, localInvoices);
          }
        }
      } catch (e) {
        console.warn('API fee-invoices sync fallback to local cache:', e);
      }
    }

    let list = storageService.getItem<StudentFeeInvoice[]>(STORAGE_KEYS.FEE_INVOICES, INITIAL_FEE_INVOICES).filter(
      (inv) => inv.school_id === schoolId
    );

    const targetMonth = filter?.billingMonth || filter?.month;
    if (filter?.studentId) {
      const target = filter.studentId.trim().toLowerCase();
      const clean = target.replace(/^usr-/, '');
      list = list.filter((inv) => {
        const sId = String(inv.student_id || '').toLowerCase();
        const sReg = String(inv.registration_number || '').toLowerCase();
        return sId === target || sId === clean || sReg === target || sReg === clean;
      });
    }
    if (filter?.status) list = list.filter((inv) => inv.status === filter.status);
    if (targetMonth) list = list.filter((inv) => inv.billing_month === targetMonth);

    // Auto-generate invoices for school's active students if none exist for this month
    if (list.length === 0 && targetMonth) {
      const allInvoices = storageService.getItem<StudentFeeInvoice[]>(STORAGE_KEYS.FEE_INVOICES, INITIAL_FEE_INVOICES);
      const students = storageService.getItem<Student[]>(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS).filter(
        (s) => s.school_id === schoolId && s.status === 'active'
      );
      const feeStructures = storageService.getItem<FeeStructure[]>(STORAGE_KEYS.FEE_STRUCTURES, INITIAL_FEE_STRUCTURES).filter(
        (fs) => fs.school_id === schoolId && fs.status === 'active'
      );
      const classes = storageService.getItem<SchoolClass[]>(STORAGE_KEYS.CLASSES, INITIAL_CLASSES).filter(
        (c) => c.school_id === schoolId
      );

      let generated = false;
      for (const student of students) {
        const classId = student.current_enrollment?.class_id;
        const studentClass = classes.find((c) => c.id === classId);
        const matchingStructure =
          feeStructures[0] || { id: 'fs-default', name: 'Monthly Tuition Fee', amount: 2000 };

        const baseAmount = student.monthly_fee_amount || matchingStructure.amount || 2000;
        const finalAmount = baseAmount;
        const studentFullName = `${student.first_name} ${student.last_name}`.trim();

        const newInvoice: StudentFeeInvoice = {
          id: `inv-${targetMonth.replace('-', '')}-${student.id.slice(-4)}-${Math.floor(Math.random() * 900 + 100)}`,
          school_id: schoolId,
          student_id: student.id,
          academic_year_id: student.current_enrollment?.academic_year_id || 'ay-2026',
          fee_structure_id: matchingStructure.id,
          fee_structure_name: matchingStructure.name,
          billing_month: targetMonth,
          base_amount: baseAmount,
          discount_amount: 0,
          fine_amount: 0,
          final_amount: finalAmount,
          paid_amount: 0,
          remaining_amount: finalAmount,
          due_date: `${targetMonth}-10`,
          status: 'pending',
          student_name: studentFullName,
          registration_number: student.registration_number,
          class_name: studentClass?.name || 'Class 10',
          section_name: student.current_enrollment?.section_name || 'A',
          created_at: new Date().toISOString(),
          payments: [],
        };
        allInvoices.unshift(newInvoice);
        list.push(newInvoice);
        generated = true;
        if (typeof window !== 'undefined') {
          fetch('/api/fee-invoices', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newInvoice),
          }).catch(() => {});
        }
      }

      if (generated) {
        storageService.setItem(STORAGE_KEYS.FEE_INVOICES, allInvoices);
      }
    }

    return list;
  },

  async generateMonthlyInvoices(
    schoolId: string,
    billingMonth: string = '2026-08'
  ): Promise<{ generated: number; total: number }> {
    const list = storageService.getItem<StudentFeeInvoice[]>(STORAGE_KEYS.FEE_INVOICES, INITIAL_FEE_INVOICES);
    const students = storageService.getItem<Student[]>(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS).filter(
      (s) => s.school_id === schoolId && s.status === 'active'
    );
    const feeStructures = storageService.getItem<FeeStructure[]>(STORAGE_KEYS.FEE_STRUCTURES, INITIAL_FEE_STRUCTURES).filter(
      (fs) => fs.school_id === schoolId && fs.status === 'active'
    );
    const classes = storageService.getItem<SchoolClass[]>(STORAGE_KEYS.CLASSES, INITIAL_CLASSES).filter(
      (c) => c.school_id === schoolId
    );

    let generatedCount = 0;
    for (const student of students) {
      const existing = list.find(
        (inv) => inv.school_id === schoolId && inv.student_id === student.id && inv.billing_month === billingMonth
      );
      if (!existing) {
        const classId = student.current_enrollment?.class_id;
        const studentClass = classes.find((c) => c.id === classId);
        const matchingStructure =
          feeStructures[0] || { id: 'fs-default', name: 'Monthly Tuition Fee', amount: 2000 };

        const baseAmount = student.monthly_fee_amount || matchingStructure.amount || 2000;
        const finalAmount = baseAmount;
        const studentFullName = `${student.first_name} ${student.last_name}`.trim();

        const newInvoice: StudentFeeInvoice = {
          id: `inv-${billingMonth.replace('-', '')}-${student.id.slice(-4)}-${Math.floor(Math.random() * 900 + 100)}`,
          school_id: schoolId,
          student_id: student.id,
          academic_year_id: student.current_enrollment?.academic_year_id || 'ay-2026',
          fee_structure_id: matchingStructure.id,
          fee_structure_name: matchingStructure.name,
          billing_month: billingMonth,
          base_amount: baseAmount,
          discount_amount: 0,
          fine_amount: 0,
          final_amount: finalAmount,
          paid_amount: 0,
          remaining_amount: finalAmount,
          due_date: `${billingMonth}-10`,
          status: 'pending',
          student_name: studentFullName,
          registration_number: student.registration_number,
          class_name: studentClass?.name || 'Class 10',
          section_name: student.current_enrollment?.section_name || 'A',
          created_at: new Date().toISOString(),
          payments: [],
        };
        list.unshift(newInvoice);
        generatedCount++;
      }
    }

    if (generatedCount > 0) {
      storageService.setItem(STORAGE_KEYS.FEE_INVOICES, list);
    }

    const schoolInvoices = list.filter((inv) => inv.school_id === schoolId && inv.billing_month === billingMonth);
    return { generated: generatedCount, total: schoolInvoices.length };
  },

  async getFeeSummary(schoolId: string, month?: string): Promise<{
    expected: number;
    collected: number;
    pending: number;
    overdue: number;
    overdueCount: number;
    totalInvoices: number;
    totalExpected: number;
    totalCollected: number;
    totalPending: number;
    collectionRate: number;
  }> {
    const invoices = await this.getInvoices(schoolId, { billingMonth: month });
    const expected = invoices.reduce((sum, inv) => sum + inv.final_amount, 0);
    const collected = invoices.reduce((sum, inv) => sum + inv.paid_amount, 0);
    const pending = invoices.reduce((sum, inv) => sum + (inv.remaining_amount || 0), 0);
    const overdueInvs = invoices.filter((inv) => inv.status === 'overdue');
    const overdue = overdueInvs.reduce((sum, inv) => sum + (inv.remaining_amount || inv.final_amount), 0);
    const collectionRate = expected > 0 ? (collected / expected) * 100 : 0;

    return {
      expected,
      collected,
      pending,
      overdue,
      overdueCount: overdueInvs.length,
      totalInvoices: invoices.length,
      totalExpected: expected,
      totalCollected: collected,
      totalPending: pending,
      collectionRate,
    };
  },

  async recordPayment(
    invoiceIdOrData: string | (Omit<StudentPayment, 'id' | 'created_at'> & { invoice_id: string }),
    paymentData?: Omit<StudentPayment, 'id' | 'invoice_id' | 'created_at'>
  ): Promise<StudentFeeInvoice> {
    let invoiceId: string;
    let payment: Omit<StudentPayment, 'id' | 'invoice_id' | 'created_at'>;

    if (typeof invoiceIdOrData === 'object' && invoiceIdOrData !== null) {
      invoiceId = invoiceIdOrData.invoice_id;
      payment = invoiceIdOrData;
    } else {
      invoiceId = invoiceIdOrData;
      payment = paymentData!;
    }

    const list = storageService.getItem<StudentFeeInvoice[]>(STORAGE_KEYS.FEE_INVOICES, INITIAL_FEE_INVOICES);
    const index = list.findIndex((inv) => inv.id === invoiceId);
    if (index === -1) throw new Error('Invoice not found');

    const inv = list[index];
    const newPayment: StudentPayment = {
      ...payment,
      id: `pmt-${Date.now().toString().slice(-4)}`,
      invoice_id: invoiceId,
      created_at: new Date().toISOString(),
    };

    inv.payments = inv.payments || [];
    inv.payments.push(newPayment);
    inv.paid_amount += payment.amount;
    inv.remaining_amount = Math.max(0, inv.final_amount - inv.paid_amount);

    if (inv.paid_amount >= inv.final_amount) {
      inv.status = 'paid';
    } else if (inv.paid_amount > 0) {
      inv.status = 'partial';
    }

    storageService.setItem(STORAGE_KEYS.FEE_INVOICES, list);
    return inv;
  },

  async recordComprehensivePayment(params: {
    schoolId: string;
    studentId: string;
    invoiceId?: string;
    chargeIds?: string[];
    discountAmount?: number;
    discountReason?: string;
    amountPaid: number;
    paymentMethod: PaymentMethod;
    paymentDate?: string;
    referenceNumber?: string;
    receivedByName: string;
    receivedById?: string;
    notes?: string;
  }): Promise<{ invoice?: StudentFeeInvoice; receipt: PaymentReceipt; payment: StudentPayment }> {
    const students = storageService.getItem<Student[]>(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS);
    const student = students.find((s) => s.id === params.studentId);
    const schools = storageService.getItem<School[]>(STORAGE_KEYS.SCHOOLS, INITIAL_SCHOOLS);
    const school = schools.find((sc) => sc.id === params.schoolId);

    const invoices = storageService.getItem<StudentFeeInvoice[]>(STORAGE_KEYS.FEE_INVOICES, INITIAL_FEE_INVOICES);
    const charges = storageService.getItem<StudentCharge[]>(STORAGE_KEYS.STUDENT_CHARGES, INITIAL_STUDENT_CHARGES);

    let targetInvoice = params.invoiceId ? invoices.find((i) => i.id === params.invoiceId) : undefined;
    const selectedCharges = (params.chargeIds || [])
      .map((cId) => charges.find((c) => c.id === cId))
      .filter((c): c is StudentCharge => !!c);

    // Build receipt item breakdown
    const receiptItems: Omit<PaymentReceiptItem, 'id' | 'receipt_id' | 'created_at'>[] = [];
    let calculatedSubtotal = 0;

    if (targetInvoice) {
      const tuitionAmt = targetInvoice.remaining_amount || targetInvoice.final_amount;
      calculatedSubtotal += tuitionAmt;
      receiptItems.push({
        item_type: 'tuition',
        item_reference_id: targetInvoice.id,
        description: targetInvoice.fee_structure_name || `Monthly Tuition (${targetInvoice.billing_month})`,
        amount: tuitionAmt,
      });
    }

    selectedCharges.forEach((chg) => {
      calculatedSubtotal += chg.remaining_amount;
      receiptItems.push({
        item_type: chg.charge_name.toLowerCase().includes('transport')
          ? 'transport'
          : chg.charge_name.toLowerCase().includes('exam')
          ? 'exam'
          : 'charge',
        item_reference_id: chg.id,
        description: chg.charge_name,
        amount: chg.remaining_amount,
      });
    });

    const discount = params.discountAmount || 0;
    if (discount > 0) {
      receiptItems.push({
        item_type: 'discount',
        description: params.discountReason || 'Fee Concession / Discount',
        amount: -discount,
      });
    }

    const netTotal = Math.max(0, calculatedSubtotal - discount);
    const paymentDateStr = params.paymentDate || new Date().toISOString().split('T')[0];
    const nowTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const paymentId = `pmt-${Date.now().toString().slice(-4)}`;

    const balanceAfter = Math.max(0, netTotal - params.amountPaid);

    // Create receipt snapshot
    const receipt = await receiptService.createReceipt({
      school_id: params.schoolId,
      student_id: params.studentId,
      payment_id: paymentId,
      student_name_snapshot: student ? `${student.first_name} ${student.last_name}` : 'Student',
      registration_number_snapshot: student?.registration_number || '2026-00000',
      class_snapshot: student?.current_enrollment?.class_name || '—',
      section_snapshot: student?.current_enrollment?.section_name || '—',
      roll_number_snapshot: student?.current_enrollment?.roll_number || '01',
      academic_year_snapshot: student?.current_enrollment?.academic_year_name || '2026-27',
      school_name_snapshot: school?.name || 'School ERP',
      school_address_snapshot: school?.address || 'Patna, Bihar - 800001',
      school_phone_snapshot: school?.phone || '+91 98765 43210',
      school_email_snapshot: school?.receipt_email || undefined,
      school_logo_url_snapshot: school?.logo_url,
      subtotal: calculatedSubtotal,
      discount,
      total_amount: netTotal,
      amount_paid: params.amountPaid,
      balance_after_payment: balanceAfter,
      payment_method: params.paymentMethod,
      payment_date: paymentDateStr,
      payment_time: nowTime,
      reference_number: params.referenceNumber,
      received_by_name_snapshot: params.receivedByName,
      received_by_id: params.receivedById,
      items: receiptItems as any,
    });

    const newPayment: StudentPayment = {
      id: paymentId,
      school_id: params.schoolId,
      student_id: params.studentId,
      invoice_id: targetInvoice?.id || 'inv-general',
      receipt_id: receipt.id,
      receipt_number: receipt.receipt_number,
      amount: params.amountPaid,
      payment_method: params.paymentMethod,
      payment_date: paymentDateStr,
      reference_number: params.referenceNumber,
      received_by: params.receivedById,
      received_by_name: params.receivedByName,
      notes: params.notes,
      created_at: new Date().toISOString(),
    };

    // Allocate payment across invoice and charges
    let remPay = params.amountPaid;

    if (targetInvoice && remPay > 0) {
      const invDue = targetInvoice.remaining_amount || targetInvoice.final_amount;
      const alloc = Math.min(remPay, invDue);
      targetInvoice.paid_amount += alloc;
      targetInvoice.remaining_amount = Math.max(0, targetInvoice.final_amount - targetInvoice.paid_amount);
      targetInvoice.status = targetInvoice.paid_amount >= targetInvoice.final_amount ? 'paid' : 'partial';
      targetInvoice.payments = targetInvoice.payments || [];
      targetInvoice.payments.push(newPayment);
      remPay -= alloc;
      storageService.setItem(STORAGE_KEYS.FEE_INVOICES, invoices);

      if (typeof window !== 'undefined') {
        try {
          const res = await fetch(`/api/fee-invoices/${targetInvoice.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(targetInvoice),
          });
          if (!res.ok) {
            await fetch('/api/fee-invoices', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(targetInvoice),
            });
          }
        } catch (e) {
          console.warn('Could not sync updated invoice to server:', e);
        }
      }
    }

    selectedCharges.forEach((chg) => {
      if (remPay > 0) {
        const alloc = Math.min(remPay, chg.remaining_amount);
        chg.paid_amount += alloc;
        chg.remaining_amount = Math.max(0, chg.amount - chg.paid_amount);
        chg.status = chg.paid_amount >= chg.amount ? 'paid' : 'partial';
        chg.updated_at = new Date().toISOString();
        remPay -= alloc;
        if (typeof window !== 'undefined') {
          fetch(`/api/student-charges/${chg.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(chg),
          }).catch(() => {});
        }
      }
    });
    storageService.setItem(STORAGE_KEYS.STUDENT_CHARGES, charges);

    return { invoice: targetInvoice, receipt, payment: newPayment };
  },
};

// ============================================================================
// 12. STUDENT CHARGES SERVICE
// ============================================================================

export const chargeService = {
  async getStudentCharges(
    schoolId: string,
    filter?: { studentId?: string; status?: StudentChargeStatus }
  ): Promise<StudentCharge[]> {
    if (typeof window !== 'undefined') {
      try {
        const queryParams = new URLSearchParams();
        if (filter?.studentId) queryParams.set('studentId', filter.studentId);
        const res = await fetch(`/api/student-charges?${queryParams.toString()}`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data)) {
            const serverCharges = json.data as StudentCharge[];
            const localCharges = storageService.getItem<StudentCharge[]>(STORAGE_KEYS.STUDENT_CHARGES, INITIAL_STUDENT_CHARGES);
            serverCharges.forEach((sChg) => {
              const idx = localCharges.findIndex((l) => l.id === sChg.id);
              if (idx !== -1) {
                localCharges[idx] = sChg;
              } else {
                localCharges.unshift(sChg);
              }
            });
            storageService.setItem(STORAGE_KEYS.STUDENT_CHARGES, localCharges);
          }
        }
      } catch (e) {
        console.warn('API student-charges sync fallback to local cache:', e);
      }
    }

    let list = storageService.getItem<StudentCharge[]>(STORAGE_KEYS.STUDENT_CHARGES, INITIAL_STUDENT_CHARGES).filter(
      (c) => c.school_id === schoolId
    );

    if (filter?.studentId) {
      const target = filter.studentId.trim().toLowerCase();
      const clean = target.replace(/^usr-/, '');
      list = list.filter((c) => {
        const sId = String(c.student_id || '').toLowerCase();
        return sId === target || sId === clean;
      });
    }
    if (filter?.status) list = list.filter((c) => c.status === filter.status);

    return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  async createStudentCharge(data: {
    school_id: string;
    student_id: string;
    academic_year_id?: string;
    charge_name: string;
    amount: number;
    charge_date?: string;
    due_date?: string;
    description?: string;
    created_by?: string;
    created_by_name?: string;
    student_name?: string;
    registration_number?: string;
  }): Promise<StudentCharge> {
    const list = storageService.getItem<StudentCharge[]>(STORAGE_KEYS.STUDENT_CHARGES, INITIAL_STUDENT_CHARGES);
    const students = storageService.getItem<Student[]>(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS);
    const student = students.find((s) => s.id === data.student_id);

    const newCharge: StudentCharge = {
      id: `chg-${Date.now().toString().slice(-4)}`,
      school_id: data.school_id,
      student_id: data.student_id,
      academic_year_id: data.academic_year_id || 'ay-2026',
      charge_name: data.charge_name.trim(),
      description: data.description?.trim() || undefined,
      amount: data.amount,
      paid_amount: 0,
      remaining_amount: data.amount,
      charge_date: data.charge_date || new Date().toISOString().split('T')[0],
      due_date: data.due_date || undefined,
      status: 'pending',
      created_by: data.created_by,
      created_by_name: data.created_by_name || 'School Admin',
      student_name: data.student_name || (student ? `${student.first_name} ${student.last_name}` : 'Student'),
      registration_number: data.registration_number || student?.registration_number,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    list.unshift(newCharge);
    storageService.setItem(STORAGE_KEYS.STUDENT_CHARGES, list);

    if (typeof window !== 'undefined') {
      try {
        await fetch('/api/student-charges', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newCharge),
        });
      } catch (e) {
        console.warn('Could not sync charge to server:', e);
      }
    }

    try {
      authLogService.logEvent({
        school_id: data.school_id,
        user_name: data.created_by_name || 'School Admin',
        event_type: 'student_charge_added',
        success: true,
        role: 'school_admin',
        details: {
          action: 'charge_created',
          charge_id: newCharge.id,
          charge_name: newCharge.charge_name,
          amount: newCharge.amount,
          student_id: data.student_id,
        },
      });
    } catch {}

    return newCharge;
  },

  async updateStudentCharge(
    id: string,
    data: Partial<StudentCharge>,
    actorName: string = 'School Admin'
  ): Promise<StudentCharge> {
    const list = storageService.getItem<StudentCharge[]>(STORAGE_KEYS.STUDENT_CHARGES, INITIAL_STUDENT_CHARGES);
    const index = list.findIndex((c) => c.id === id);
    if (index === -1) throw new Error('Charge not found');

    const updated = {
      ...list[index],
      ...data,
      updated_at: new Date().toISOString(),
    };
    list[index] = updated;
    storageService.setItem(STORAGE_KEYS.STUDENT_CHARGES, list);

    try {
      authLogService.logEvent({
        school_id: updated.school_id,
        user_name: actorName,
        event_type: 'student_updated',
        success: true,
        role: 'school_admin',
        details: { action: 'charge_changed', charge_id: id, updates: data },
      });
    } catch {}

    return updated;
  },

  async waiveOrCancelCharge(
    id: string,
    action: 'waived' | 'cancelled',
    reason: string,
    actorId: string = 'admin',
    actorName: string = 'School Admin'
  ): Promise<StudentCharge> {
    const list = storageService.getItem<StudentCharge[]>(STORAGE_KEYS.STUDENT_CHARGES, INITIAL_STUDENT_CHARGES);
    const index = list.findIndex((c) => c.id === id);
    if (index === -1) throw new Error('Charge not found');

    list[index] = {
      ...list[index],
      status: action,
      waive_reason: reason,
      remaining_amount: 0,
      updated_at: new Date().toISOString(),
    };
    storageService.setItem(STORAGE_KEYS.STUDENT_CHARGES, list);

    try {
      authLogService.logEvent({
        school_id: list[index].school_id,
        user_name: actorName,
        event_type: 'student_charge_added',
        success: true,
        role: 'school_admin',
        details: { action: 'charge_cancelled', charge_id: id, status: action, reason },
      });
    } catch {}

    return list[index];
  },
};

// ============================================================================
// 13. PAYMENT RECEIPT SERVICE (1/4 A4 Snapshots, Sequential Numbers, Reversals)
// ============================================================================

export const receiptService = {
  getNextReceiptNumber(schoolId: string): string {
    const receipts = storageService.getItem<PaymentReceipt[]>(STORAGE_KEYS.PAYMENT_RECEIPTS, INITIAL_PAYMENT_RECEIPTS).filter(
      (r) => r.school_id === schoolId
    );

    const year = new Date().getFullYear();
    const prefix = `FEE-${year}-`;
    let maxSeq = 0;

    receipts.forEach((r) => {
      if (r.receipt_number && r.receipt_number.startsWith(prefix)) {
        const numPart = parseInt(r.receipt_number.slice(prefix.length), 10);
        if (!isNaN(numPart) && numPart > maxSeq) {
          maxSeq = numPart;
        }
      }
    });

    const nextSeq = (maxSeq + 1).toString().padStart(6, '0');
    return `${prefix}${nextSeq}`;
  },

  async getReceipts(
    schoolId: string,
    filter?: { studentId?: string; receiptNumber?: string }
  ): Promise<PaymentReceipt[]> {
    if (typeof window !== 'undefined') {
      try {
        const queryParams = new URLSearchParams();
        if (filter?.studentId) queryParams.set('studentId', filter.studentId);
        const res = await fetch(`/api/payment-receipts?${queryParams.toString()}`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data)) {
            const serverReceipts = json.data as PaymentReceipt[];
            const localReceipts = storageService.getItem<PaymentReceipt[]>(STORAGE_KEYS.PAYMENT_RECEIPTS, INITIAL_PAYMENT_RECEIPTS);
            serverReceipts.forEach((sRcp) => {
              const idx = localReceipts.findIndex((l) => l.id === sRcp.id || l.receipt_number === sRcp.receipt_number);
              if (idx !== -1) {
                localReceipts[idx] = sRcp;
              } else {
                localReceipts.unshift(sRcp);
              }
            });
            localReceipts.forEach((lRcp) => {
              if (lRcp.school_id === schoolId && !serverReceipts.some((s) => s.id === lRcp.id || s.receipt_number === lRcp.receipt_number)) {
                fetch('/api/payment-receipts', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(lRcp),
                }).catch(() => {});
              }
            });
            storageService.setItem(STORAGE_KEYS.PAYMENT_RECEIPTS, localReceipts);
          }
        }
      } catch (e) {
        console.warn('API payment-receipts sync fallback to local cache:', e);
      }
    }

    let list = storageService.getItem<PaymentReceipt[]>(STORAGE_KEYS.PAYMENT_RECEIPTS, INITIAL_PAYMENT_RECEIPTS).filter(
      (r) => r.school_id === schoolId
    );

    if (filter?.studentId) {
      const target = filter.studentId.trim().toLowerCase();
      const clean = target.replace(/^usr-/, '');
      list = list.filter((r) => {
        const sId = String(r.student_id || '').toLowerCase();
        const sReg = String(r.registration_number_snapshot || '').toLowerCase();
        return sId === target || sId === clean || sReg === target || sReg === clean;
      });
    }
    if (filter?.receiptNumber) list = list.filter((r) => r.receipt_number === filter.receiptNumber);

    return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  async getReceiptById(id: string): Promise<PaymentReceipt | null> {
    const list = storageService.getItem<PaymentReceipt[]>(STORAGE_KEYS.PAYMENT_RECEIPTS, INITIAL_PAYMENT_RECEIPTS);
    return list.find((r) => r.id === id) || null;
  },

  async getReceiptByPaymentId(paymentId: string): Promise<PaymentReceipt | null> {
    const list = storageService.getItem<PaymentReceipt[]>(STORAGE_KEYS.PAYMENT_RECEIPTS, INITIAL_PAYMENT_RECEIPTS);
    return list.find((r) => r.payment_id === paymentId) || null;
  },

  async createReceipt(data: Omit<PaymentReceipt, 'id' | 'receipt_number' | 'created_at'>): Promise<PaymentReceipt> {
    const list = storageService.getItem<PaymentReceipt[]>(STORAGE_KEYS.PAYMENT_RECEIPTS, INITIAL_PAYMENT_RECEIPTS);
    const receiptNumber = this.getNextReceiptNumber(data.school_id);
    const receiptId = `rcp-${Date.now().toString().slice(-4)}`;

    const newReceipt: PaymentReceipt = {
      ...data,
      id: receiptId,
      receipt_number: receiptNumber,
      items: (data.items || []).map((it, idx) => ({
        ...it,
        id: it.id || `item-${Date.now().toString().slice(-4)}-${idx}`,
        receipt_id: receiptId,
        created_at: new Date().toISOString(),
      })),
      created_at: new Date().toISOString(),
    };

    list.unshift(newReceipt);
    storageService.setItem(STORAGE_KEYS.PAYMENT_RECEIPTS, list);

    if (typeof window !== 'undefined') {
      try {
        await fetch('/api/payment-receipts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newReceipt),
        });
      } catch (e) {
        console.warn('Could not sync receipt to server:', e);
      }
    }

    try {
      authLogService.logEvent({
        school_id: data.school_id,
        user_name: data.received_by_name_snapshot,
        event_type: 'fee_payment_recorded',
        success: true,
        role: 'school_admin',
        details: {
          action: 'receipt_created',
          receipt_id: newReceipt.id,
          receipt_number: newReceipt.receipt_number,
          total_amount: newReceipt.total_amount,
          amount_paid: newReceipt.amount_paid,
          student_id: data.student_id,
        },
      });
    } catch {}

    return newReceipt;
  },

  async reversePayment(
    paymentId: string,
    receiptId: string,
    reason: string,
    actorId: string = 'admin',
    actorName: string = 'School Admin'
  ): Promise<{ receipt: PaymentReceipt; payment: StudentPayment }> {
    const receipts = storageService.getItem<PaymentReceipt[]>(STORAGE_KEYS.PAYMENT_RECEIPTS, INITIAL_PAYMENT_RECEIPTS);
    const rIndex = receipts.findIndex((r) => r.id === receiptId || r.payment_id === paymentId);
    if (rIndex === -1) throw new Error('Receipt not found');

    const receipt = receipts[rIndex];
    receipt.is_reversed = true;
    receipt.reversal_reason = reason.trim();
    receipt.reversed_at = new Date().toISOString();
    receipt.reversed_by_name = actorName;
    receipts[rIndex] = receipt;
    storageService.setItem(STORAGE_KEYS.PAYMENT_RECEIPTS, receipts);

    // Update invoice & payments
    const invoices = storageService.getItem<StudentFeeInvoice[]>(STORAGE_KEYS.FEE_INVOICES, INITIAL_FEE_INVOICES);
    let targetPayment: StudentPayment | null = null;

    invoices.forEach((inv) => {
      if (inv.payments) {
        inv.payments.forEach((pmt) => {
          if (pmt.id === paymentId || pmt.receipt_id === receiptId) {
            pmt.is_reversed = true;
            pmt.reversal_reason = reason.trim();
            targetPayment = pmt;
            inv.paid_amount = Math.max(0, inv.paid_amount - pmt.amount);
            inv.remaining_amount = Math.max(0, inv.final_amount - inv.paid_amount);
            inv.status = inv.paid_amount === 0 ? 'pending' : 'partial';
          }
        });
      }
    });
    storageService.setItem(STORAGE_KEYS.FEE_INVOICES, invoices);

    try {
      authLogService.logEvent({
        school_id: receipt.school_id,
        user_name: actorName,
        event_type: 'fee_payment_reversed',
        success: true,
        role: 'school_admin',
        details: {
          action: 'payment_reversed',
          payment_id: paymentId,
          receipt_id: receiptId,
          receipt_number: receipt.receipt_number,
          reason,
        },
      });
    } catch {}

    return { receipt, payment: targetPayment || ({} as any) };
  },
};

export const examService = {
  async getExams(
    schoolId: string,
    filter?: { classId?: string; sectionId?: string; subjectId?: string; teacherId?: string; status?: Exam['status'] }
  ): Promise<Exam[]> {
    let list = storageService.getItem<Exam[]>(STORAGE_KEYS.EXAMS, INITIAL_EXAMS).filter((e) => e.school_id === schoolId);

    if (filter?.classId) list = list.filter((e) => e.class_id === filter.classId);
    if (filter?.sectionId) list = list.filter((e) => e.section_id === filter.sectionId);
    if (filter?.subjectId) list = list.filter((e) => e.subject_id === filter.subjectId);
    if (filter?.teacherId) list = list.filter((e) => e.teacher_id === filter.teacherId);
    if (filter?.status) list = list.filter((e) => e.status === filter.status);

    return list.sort((a, b) => b.exam_date.localeCompare(a.exam_date));
  },

  async getExamById(id: string): Promise<Exam | null> {
    const list = storageService.getItem<Exam[]>(STORAGE_KEYS.EXAMS, INITIAL_EXAMS);
    return list.find((e) => e.id === id) || null;
  },

  async createExam(examData: Omit<Exam, 'id' | 'created_at' | 'status'>): Promise<Exam> {
    const list = storageService.getItem<Exam[]>(STORAGE_KEYS.EXAMS, INITIAL_EXAMS);
    const newExam: Exam = {
      ...examData,
      id: `ex-${Date.now().toString().slice(-4)}`,
      status: 'draft',
      created_at: new Date().toISOString(),
    };
    list.push(newExam);
    storageService.setItem(STORAGE_KEYS.EXAMS, list);
    return newExam;
  },

  async getExamResults(examId: string): Promise<ExamResult[]> {
    return storageService.getItem<ExamResult[]>(STORAGE_KEYS.EXAM_RESULTS, INITIAL_EXAM_RESULTS).filter((r) => r.exam_id === examId);
  },

  async getPublishedResultsForStudent(studentId: string): Promise<{ exam: Exam; result: ExamResult }[]> {
    const exams = storageService.getItem<Exam[]>(STORAGE_KEYS.EXAMS, INITIAL_EXAMS).filter((e) => e.status === 'published');
    const results = storageService.getItem<ExamResult[]>(STORAGE_KEYS.EXAM_RESULTS, INITIAL_EXAM_RESULTS).filter(
      (r) => r.student_id === studentId
    );

    return results
      .map((r) => {
        const exam = exams.find((e) => e.id === r.exam_id);
        return exam ? { exam, result: r } : null;
      })
      .filter((item): item is { exam: Exam; result: ExamResult } => item !== null);
  },

  async saveExamMarks(
    examIdOrSchoolId: string,
    marksOrExamId: string | { student_id: string; marks_obtained?: number; absent: boolean; remarks?: string }[],
    publishOrMarks?: boolean | { student_id: string; marks_obtained?: number; absent: boolean; remarks?: string }[],
    publishFinal?: boolean
  ): Promise<void> {
    let examId: string;
    let marks: { student_id: string; marks_obtained?: number; absent: boolean; remarks?: string }[];
    let shouldPublish = false;

    if (Array.isArray(marksOrExamId)) {
      examId = examIdOrSchoolId;
      marks = marksOrExamId;
      shouldPublish = typeof publishOrMarks === 'boolean' ? publishOrMarks : false;
    } else {
      examId = marksOrExamId;
      marks = (publishOrMarks as { student_id: string; marks_obtained?: number; absent: boolean; remarks?: string }[]) || [];
      shouldPublish = !!publishFinal;
    }

    let allResults = storageService.getItem<ExamResult[]>(STORAGE_KEYS.EXAM_RESULTS, INITIAL_EXAM_RESULTS);
    allResults = allResults.filter((r) => r.exam_id !== examId);

    marks.forEach((m) => {
      allResults.push({
        id: `res-${Date.now().toString().slice(-4)}-${Math.random().toString(36).substring(2, 5)}`,
        school_id: 'sch-001',
        exam_id: examId,
        student_id: m.student_id,
        marks_obtained: m.marks_obtained,
        absent: m.absent,
        remarks: m.remarks,
        created_at: new Date().toISOString(),
      });
    });

    storageService.setItem(STORAGE_KEYS.EXAM_RESULTS, allResults);

    if (shouldPublish) {
      await this.publishExam(examId);
    }
  },

  async publishExam(examId: string): Promise<Exam> {
    const list = storageService.getItem<Exam[]>(STORAGE_KEYS.EXAMS, INITIAL_EXAMS);
    const index = list.findIndex((e) => e.id === examId);
    if (index === -1) throw new Error('Exam not found');
    list[index].status = 'published';
    storageService.setItem(STORAGE_KEYS.EXAMS, list);
    return list[index];
  },
};

export const timetableService = {
  async getTimetable(
    schoolId: string,
    filter?: { classId?: string; sectionId?: string; teacherId?: string; dayOfWeek?: number }
  ): Promise<TimetableEntry[]> {
    let list = storageService.getItem<TimetableEntry[]>(STORAGE_KEYS.TIMETABLE, INITIAL_TIMETABLE).filter((t) => t.school_id === schoolId);

    if (filter?.classId) list = list.filter((t) => t.class_id === filter.classId);
    if (filter?.sectionId) list = list.filter((t) => t.section_id === filter.sectionId);
    if (filter?.teacherId) list = list.filter((t) => t.teacher_id === filter.teacherId);
    if (filter?.dayOfWeek) list = list.filter((t) => t.day_of_week === filter.dayOfWeek);

    return list.sort((a, b) => a.start_time.localeCompare(b.start_time));
  },

  async createTimetableEntry(entryData: Omit<TimetableEntry, 'id'>): Promise<TimetableEntry> {
    const list = storageService.getItem<TimetableEntry[]>(STORAGE_KEYS.TIMETABLE, INITIAL_TIMETABLE);
    const newEntry: TimetableEntry = {
      ...entryData,
      id: `tt-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(2, 5)}`,
    };
    list.push(newEntry);
    storageService.setItem(STORAGE_KEYS.TIMETABLE, list);
    return newEntry;
  },

  async updateTimetableEntry(id: string, updates: Partial<TimetableEntry>): Promise<TimetableEntry> {
    const list = storageService.getItem<TimetableEntry[]>(STORAGE_KEYS.TIMETABLE, INITIAL_TIMETABLE);
    const idx = list.findIndex((t) => t.id === id);
    if (idx === -1) throw new Error('Schedule period not found');
    list[idx] = { ...list[idx], ...updates };
    storageService.setItem(STORAGE_KEYS.TIMETABLE, list);
    return list[idx];
  },

  async deleteTimetableEntry(id: string): Promise<void> {
    let list = storageService.getItem<TimetableEntry[]>(STORAGE_KEYS.TIMETABLE, INITIAL_TIMETABLE);
    list = list.filter((t) => t.id !== id);
    storageService.setItem(STORAGE_KEYS.TIMETABLE, list);
  },

  async generateDefaultClassSchedule(params: {
    schoolId: string;
    academicYearId: string;
    classId: string;
    className: string;
    sectionId: string;
    sectionName: string;
    teachers: { id: string; name: string }[];
    subjects: { id: string; name: string }[];
  }): Promise<TimetableEntry[]> {
    const { schoolId, academicYearId, classId, className, sectionId, sectionName, teachers, subjects } = params;
    let list = storageService.getItem<TimetableEntry[]>(STORAGE_KEYS.TIMETABLE, INITIAL_TIMETABLE);

    // Remove any existing entries for this section to prevent duplicates
    list = list.filter((t) => !(t.school_id === schoolId && t.class_id === classId && t.section_id === sectionId));

    const defaultSlots = [
      { period_number: 1, period_name: 'Period 1', start_time: '08:30', end_time: '09:15', slot_type: 'subject' as const, room: `Room ${className}` },
      { period_number: 2, period_name: 'Period 2', start_time: '09:15', end_time: '10:00', slot_type: 'subject' as const, room: `Room ${className}` },
      { period_number: 3, period_name: 'Period 3', start_time: '10:15', end_time: '11:00', slot_type: 'subject' as const, room: `Room ${className}` },
      { period_number: 4, period_name: 'Period 4', start_time: '11:00', end_time: '11:45', slot_type: 'subject' as const, room: `Room ${className}` },
      { period_number: 5, period_name: 'Lunch Break', start_time: '11:45', end_time: '12:30', slot_type: 'break' as const, room: 'Dining Hall' },
      { period_number: 6, period_name: 'Period 5', start_time: '12:30', end_time: '01:15', slot_type: 'subject' as const, room: `Room ${className}` },
      { period_number: 7, period_name: 'Period 6', start_time: '01:15', end_time: '02:00', slot_type: 'subject' as const, room: `Room ${className}` },
      { period_number: 8, period_name: 'Games Period', start_time: '02:00', end_time: '02:45', slot_type: 'games' as const, room: 'Sports Ground' },
    ];

    const newEntries: TimetableEntry[] = [];
    const days = [1, 2, 3, 4, 5, 6]; // Mon to Sat

    days.forEach((dayNum) => {
      defaultSlots.forEach((slot, sIdx) => {
        let subId: string | undefined;
        let subName: string | undefined;
        let tchId: string | undefined;
        let tchName: string | undefined;

        if (slot.slot_type === 'subject') {
          const sub = subjects.length > 0 ? subjects[(dayNum + sIdx) % subjects.length] : undefined;
          const tch = teachers.length > 0 ? teachers[(dayNum + sIdx) % teachers.length] : undefined;
          subId = sub?.id;
          subName = sub?.name || 'General Subject';
          tchId = tch?.id;
          tchName = tch?.name || 'Class Faculty';
        } else if (slot.slot_type === 'break') {
          subName = 'Lunch Break';
        } else if (slot.slot_type === 'games') {
          subName = 'Physical Education & Sports';
          const tch = teachers[0];
          tchId = tch?.id;
          tchName = tch?.name || 'Sports Instructor';
        }

        const entry: TimetableEntry = {
          id: `tt-${Date.now().toString().slice(-4)}-${dayNum}-${sIdx}-${Math.random().toString(36).substring(2, 5)}`,
          school_id: schoolId,
          academic_year_id: academicYearId,
          class_id: classId,
          class_name: className,
          section_id: sectionId,
          section_name: sectionName,
          day_of_week: dayNum,
          start_time: slot.start_time,
          end_time: slot.end_time,
          room: slot.room,
          period_number: slot.period_number,
          period_name: slot.period_name,
          slot_type: slot.slot_type,
          subject_id: subId,
          subject_name: subName,
          teacher_id: tchId,
          teacher_name: tchName,
        };
        newEntries.push(entry);
      });
    });

    list.push(...newEntries);
    storageService.setItem(STORAGE_KEYS.TIMETABLE, list);
    return newEntries;
  },
};

export const securityService = {
  async resetUserPassword(
    paramsOrSchoolId:
      | string
      | {
          schoolId?: string;
          targetRole: 'school_admin' | 'teacher' | 'student' | 'staff' | string;
          targetId: string;
          targetName?: string;
          targetLoginId?: string;
          newPassword: string;
          requireChangeOnNextLogin?: boolean;
          actorUserId?: string;
          actorRole?: string;
          actorName?: string;
        },
    targetUserId?: string,
    targetRole?: 'school_admin' | 'teacher' | 'student' | 'staff',
    newPassword?: string,
    requirePasswordChange = true,
    actorId?: string,
    actorRole?: string
  ): Promise<{ success: boolean; message: string }> {
    let pwd = '';
    let sId: string | undefined;
    let tUserId = '';
    let tLoginId = '';
    let tRole = 'student';
    let reqChange = true;

    if (typeof paramsOrSchoolId === 'object') {
      pwd = paramsOrSchoolId.newPassword;
      sId = paramsOrSchoolId.schoolId;
      tUserId = paramsOrSchoolId.targetId;
      tLoginId = paramsOrSchoolId.targetLoginId || '';
      tRole = paramsOrSchoolId.targetRole;
      reqChange = paramsOrSchoolId.requireChangeOnNextLogin ?? true;
    } else {
      pwd = newPassword || '';
      sId = paramsOrSchoolId;
      tUserId = targetUserId || '';
      tLoginId = targetUserId || '';
      tRole = targetRole || 'student';
      reqChange = requirePasswordChange;
    }

    const strength = validatePasswordStrength(pwd);
    if (!strength.isValid) {
      throw new Error(strength.message);
    }

    const user: UserPersona = {
      id: tUserId,
      name: typeof paramsOrSchoolId === 'object' ? paramsOrSchoolId.targetName || tUserId : tUserId,
      role: tRole as UserRole,
      school_id: sId,
      login_id: tLoginId || tUserId,
    };
    const saved = await userPasswordService.setUserPassword(user, pwd);
    if (!saved.success) {
      throw new Error(saved.error || 'Failed to save reset password');
    }
    if (typeof window !== 'undefined') {
      const verify = await fetch('/api/auth/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify',
          identifier: tLoginId || tUserId,
          userId: tUserId,
          loginId: tLoginId,
          role: tRole,
          password: pwd,
        }),
      });
      const verified = verify.ok ? await verify.json().catch(() => ({})) : {};
      if (verified.valid !== true) {
        throw new Error('Password was not saved for login. Please try reset again.');
      }
    }

    authLogService.logEvent({
      school_id: sId,
      user_id: tUserId,
      event_type: 'password_reset',
      success: true,
      role: tRole as any,
      details: { actorId, actorRole, requirePasswordChange: reqChange },
    });

    return {
      success: true,
      message: 'Password reset successfully. User will be required to change it on next login.',
    };
  },
};

export const deletionService = {
  async requestAccountDeletion(
    user: UserPersona,
    reason?: string
  ): Promise<AccountDeletionRequest> {
    const requests = storageService.getItem<AccountDeletionRequest[]>(
      STORAGE_KEYS.DELETION_REQUESTS,
      INITIAL_DELETION_REQUESTS
    );

    const newReq: AccountDeletionRequest = {
      id: `del-req-${Date.now().toString().slice(-4)}`,
      school_id: user.school_id,
      school_name: user.school_name,
      user_id: user.id,
      user_role: user.role,
      user_name: user.name,
      user_email: user.email,
      requested_by: user.id,
      request_reason: reason,
      status: 'pending',
      requested_at: new Date().toISOString(),
    };

    requests.unshift(newReq);
    storageService.setItem(STORAGE_KEYS.DELETION_REQUESTS, requests);

    authLogService.logEvent({
      school_id: user.school_id,
      user_id: user.id,
      event_type: 'user_deletion_attempt',
      success: true,
      role: user.role,
      user_name: user.name,
      details: { reason },
    });

    return newReq;
  },

  async getDeletionRequests(schoolId?: string): Promise<AccountDeletionRequest[]> {
    const list = storageService.getItem<AccountDeletionRequest[]>(
      STORAGE_KEYS.DELETION_REQUESTS,
      INITIAL_DELETION_REQUESTS
    );
    if (schoolId) return list.filter((r) => r.school_id === schoolId);
    return list;
  },

  async reviewDeletionRequest(
    requestId: string,
    decision: 'approved' | 'rejected',
    reviewerOrReason?: UserPersona | string,
    reviewReasonOrId?: string,
    reviewerIdOrName?: string,
    reviewerNameParam?: string
  ): Promise<AccountDeletionRequest> {
    const list = storageService.getItem<AccountDeletionRequest[]>(
      STORAGE_KEYS.DELETION_REQUESTS,
      INITIAL_DELETION_REQUESTS
    );
    const index = list.findIndex((r) => r.id === requestId);
    if (index === -1) throw new Error('Deletion request not found');

    let revReason = '';
    let revId = 'admin';
    let revName = 'School Administrator';

    if (typeof reviewerOrReason === 'object' && reviewerOrReason !== null) {
      revId = reviewerOrReason.id;
      revName = reviewerOrReason.name;
      revReason = reviewReasonOrId || '';
    } else if (typeof reviewerOrReason === 'string') {
      revReason = reviewerOrReason;
      revId = reviewReasonOrId || 'admin';
      revName = reviewerIdOrName || 'School Administrator';
    }

    if (decision === 'rejected' && !revReason?.trim()) {
      throw new Error('A mandatory reason is required when rejecting an account deletion request.');
    }

    list[index].status = decision;
    list[index].reviewed_by = revId;
    list[index].reviewed_by_name = revName;
    list[index].review_reason = revReason;
    list[index].reviewed_at = new Date().toISOString();

    if (decision === 'approved') {
      list[index].status = 'completed';
      list[index].completed_at = new Date().toISOString();
    }

    storageService.setItem(STORAGE_KEYS.DELETION_REQUESTS, list);
    return list[index];
  },
};

export const safetyService = {
  async suspendSchool(
    schoolId: string,
    typedSchoolCode: string,
    superAdminPasswordOrReason?: string,
    superAdminId?: string,
    superAdminName?: string
  ): Promise<School> {
    const schools = storageService.getItem<School[]>(STORAGE_KEYS.SCHOOLS, INITIAL_SCHOOLS);
    const index = schools.findIndex((s) => s.id === schoolId);
    if (index === -1) throw new Error('School not found');

    if (typedSchoolCode.trim().toUpperCase() !== schools[index].code.toUpperCase()) {
      throw new Error(`School code confirmation mismatch. Expected ${schools[index].code}`);
    }

    schools[index].status = 'suspended';
    schools[index].updated_at = new Date().toISOString();
    storageService.setItem(STORAGE_KEYS.SCHOOLS, schools);

    authLogService.logEvent({
      school_id: schoolId,
      school_name: schools[index].name,
      event_type: 'school_suspension_attempt',
      success: true,
      role: 'super_admin',
      user_name: superAdminName,
    });

    return schools[index];
  },

  async restoreSchool(schoolId: string, superAdminName: string): Promise<School> {
    const schools = storageService.getItem<School[]>(STORAGE_KEYS.SCHOOLS, INITIAL_SCHOOLS);
    const index = schools.findIndex((s) => s.id === schoolId);
    if (index === -1) throw new Error('School not found');

    schools[index].status = 'active';
    schools[index].pending_deletion_until = undefined;
    schools[index].updated_at = new Date().toISOString();
    storageService.setItem(STORAGE_KEYS.SCHOOLS, schools);

    return schools[index];
  },

  async scheduleSchoolDeletion(
    schoolId: string,
    typedDeleteText: string,
    superAdminPassword: string,
    gracePeriodDays: number,
    reason: string,
    superAdminId: string,
    superAdminName: string
  ): Promise<SchoolDeletionRequest> {
    const schools = storageService.getItem<School[]>(STORAGE_KEYS.SCHOOLS, INITIAL_SCHOOLS);
    const index = schools.findIndex((s) => s.id === schoolId);
    if (index === -1) throw new Error('School not found');

    if (typedDeleteText.trim() !== 'DELETE SCHOOL') {
      throw new Error('You must type "DELETE SCHOOL" to confirm.');
    }

    const scheduledDate = new Date();
    scheduledDate.setDate(scheduledDate.getDate() + gracePeriodDays);

    schools[index].status = 'pending_deletion';
    schools[index].pending_deletion_until = scheduledDate.toISOString();
    storageService.setItem(STORAGE_KEYS.SCHOOLS, schools);

    const requests = storageService.getItem<SchoolDeletionRequest[]>(
      STORAGE_KEYS.SCHOOL_DELETION_REQUESTS,
      INITIAL_SCHOOL_DELETION_REQUESTS
    );

    const newReq: SchoolDeletionRequest = {
      id: `sch-del-${Date.now().toString().slice(-4)}`,
      school_id: schoolId,
      school_name: schools[index].name,
      requested_by: superAdminId,
      requested_by_name: superAdminName,
      reason,
      grace_period_days: gracePeriodDays,
      scheduled_deletion_date: scheduledDate.toISOString(),
      status: 'pending_deletion',
      created_at: new Date().toISOString(),
    };

    requests.unshift(newReq);
    storageService.setItem(STORAGE_KEYS.SCHOOL_DELETION_REQUESTS, requests);

    authLogService.logEvent({
      school_id: schoolId,
      school_name: schools[index].name,
      event_type: 'school_deletion_attempt',
      success: true,
      role: 'super_admin',
      user_name: superAdminName,
      details: { reason, gracePeriodDays },
    });

    return newReq;
  },

  async cancelSchoolDeletion(
    schoolId: string,
    superAdminName: string,
    cancellationReason: string
  ): Promise<void> {
    const schools = storageService.getItem<School[]>(STORAGE_KEYS.SCHOOLS, INITIAL_SCHOOLS);
    const index = schools.findIndex((s) => s.id === schoolId);
    if (index !== -1) {
      schools[index].status = 'active';
      schools[index].pending_deletion_until = undefined;
      storageService.setItem(STORAGE_KEYS.SCHOOLS, schools);
    }

    const requests = storageService.getItem<SchoolDeletionRequest[]>(
      STORAGE_KEYS.SCHOOL_DELETION_REQUESTS,
      INITIAL_SCHOOL_DELETION_REQUESTS
    );
    const req = requests.find((r) => r.school_id === schoolId && r.status === 'pending_deletion');
    if (req) {
      req.status = 'cancelled';
      req.cancelled_by = superAdminName;
      req.cancellation_reason = cancellationReason;
      req.cancelled_at = new Date().toISOString();
      storageService.setItem(STORAGE_KEYS.SCHOOL_DELETION_REQUESTS, requests);
    }
  },
};

export const storageUploadService = {
  async uploadProfilePhoto(
    file: File,
    schoolIdOrMaxMb: string | number = 'sch-001',
    targetRole = 'student',
    targetId = 'temp',
    maxMbLimit = 2
  ): Promise<{ success: boolean; url?: string; error?: string }> {
    const limit = typeof schoolIdOrMaxMb === 'number' ? schoolIdOrMaxMb : maxMbLimit;
    const schoolId = typeof schoolIdOrMaxMb === 'string' ? schoolIdOrMaxMb : 'sch-001';
    const validation = await validateImageFileContent(file, limit);
    if (!validation.isValid) {
      return { success: false, error: validation.error };
    }

    const safePath = generateSafeStoragePath(`${schoolId}/avatars/${targetRole}`, file.name);

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve({
          success: true,
          url: reader.result as string,
        });
      };
      reader.onerror = () => {
        resolve({ success: false, error: 'Failed to read image data' });
      };
      reader.readAsDataURL(file);
    });
  },

  async uploadSchoolLogo(
    file: File,
    schoolId: string
  ): Promise<{ success: boolean; url?: string; error?: string }> {
    const validation = await validateImageFileContent(file, 2);
    if (!validation.isValid) {
      return { success: false, error: validation.error };
    }

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve({
          success: true,
          url: reader.result as string,
        });
      };
      reader.onerror = () => {
        resolve({ success: false, error: 'Failed to read image data' });
      };
      reader.readAsDataURL(file);
    });
  },
};

// ============================================================================
// 14. FEE COLLECTIONS ANALYTICS SERVICE
// ============================================================================

export const collectionService = {
  async getCollectionsSummary(
    schoolId: string,
    period: 'today' | 'yesterday' | 'this_week' | 'this_month' | 'academic_year' | 'custom' = 'today',
    customRange?: { startDate: string; endDate: string },
    cashierId?: string,
    cashierName?: string
  ): Promise<FeeCollectionSummary> {
    const receipts = storageService.getItem<PaymentReceipt[]>(
      STORAGE_KEYS.PAYMENT_RECEIPTS,
      INITIAL_PAYMENT_RECEIPTS
    ).filter((r) => r.school_id === schoolId && !r.is_reversed);

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    let startDate = todayStr;
    let endDate = todayStr;
    let periodLabel = 'Today';

    if (period === 'yesterday') {
      const y = new Date();
      y.setDate(y.getDate() - 1);
      startDate = y.toISOString().split('T')[0];
      endDate = startDate;
      periodLabel = 'Yesterday';
    } else if (period === 'this_week') {
      const w = new Date();
      w.setDate(w.getDate() - 6);
      startDate = w.toISOString().split('T')[0];
      endDate = todayStr;
      periodLabel = 'This Week';
    } else if (period === 'this_month') {
      startDate = `${todayStr.slice(0, 7)}-01`;
      endDate = todayStr;
      periodLabel = 'This Month';
    } else if (period === 'academic_year') {
      startDate = '2026-04-01';
      endDate = todayStr;
      periodLabel = 'Academic Year 2026-27';
    } else if (period === 'custom' && customRange) {
      startDate = customRange.startDate;
      endDate = customRange.endDate;
      periodLabel = `${startDate} to ${endDate}`;
    }

    // Filter receipts by date range
    let filtered = receipts.filter((r) => {
      const pDate = r.payment_date || r.created_at.split('T')[0];
      return pDate >= startDate && pDate <= endDate;
    });

    // If restricted to specific cashier / accountant
    if (cashierId) {
      filtered = filtered.filter(
        (r) => r.received_by_id === cashierId || (cashierName && r.received_by_name_snapshot?.toLowerCase().includes(cashierName.toLowerCase()))
      );
    }

    // Standard method buckets
    const methodMap: Record<string, { label: string; total: number; count: number }> = {
      cash: { label: 'Cash', total: 0, count: 0 },
      upi: { label: 'UPI', total: 0, count: 0 },
      card: { label: 'Card', total: 0, count: 0 },
      bank_transfer: { label: 'Bank Transfer', total: 0, count: 0 },
      cheque: { label: 'Cheque', total: 0, count: 0 },
      other: { label: 'Other', total: 0, count: 0 },
    };

    const employeeMap: Record<
      string,
      { employee_name: string; employee_role: string; employee_id?: string; total: number; by_method: Record<string, number>; count: number }
    > = {};

    let totalCollected = 0;

    filtered.forEach((r) => {
      const amt = r.amount_paid || 0;
      totalCollected += amt;

      // Normalize method
      let normMethod: PaymentMethod = 'other';
      const rawMethod = (r.payment_method || '').toLowerCase();
      if (rawMethod.includes('cash')) normMethod = 'cash';
      else if (rawMethod.includes('upi') || rawMethod.includes('gpay') || rawMethod.includes('phonepe') || rawMethod.includes('paytm'))
        normMethod = 'upi';
      else if (rawMethod.includes('card') || rawMethod.includes('pos')) normMethod = 'card';
      else if (rawMethod.includes('bank') || rawMethod.includes('neft') || rawMethod.includes('rtgs') || rawMethod.includes('imps') || rawMethod.includes('transfer'))
        normMethod = 'bank_transfer';
      else if (rawMethod.includes('cheque') || rawMethod.includes('check')) normMethod = 'cheque';
      else normMethod = 'other';

      if (methodMap[normMethod]) {
        methodMap[normMethod].total += amt;
        methodMap[normMethod].count += 1;
      }

      // Group by employee
      const empName = r.received_by_name_snapshot || 'Finance Desk';
      if (!employeeMap[empName]) {
        employeeMap[empName] = {
          employee_name: empName,
          employee_role: empName.toLowerCase().includes('admin') ? 'School Admin' : 'Accountant',
          employee_id: r.received_by_id,
          total: 0,
          by_method: { cash: 0, upi: 0, card: 0, bank_transfer: 0, cheque: 0, other: 0 },
          count: 0,
        };
      }
      employeeMap[empName].total += amt;
      employeeMap[empName].count += 1;
      employeeMap[empName].by_method[normMethod] = (employeeMap[empName].by_method[normMethod] || 0) + amt;
    });

    const byMethod: MethodCollectionSummary[] = Object.entries(methodMap).map(([k, v]) => ({
      method: k as PaymentMethod,
      label: v.label,
      total: v.total,
      count: v.count,
    }));

    const byEmployee: EmployeeCollectionSummary[] = Object.values(employeeMap).sort((a, b) => b.total - a.total);

    return {
      period,
      period_label: periodLabel,
      total_collected: totalCollected,
      total_transactions: filtered.length,
      by_method: byMethod,
      by_employee: byEmployee,
    };
  },

  async getCollectionTransactions(
    schoolId: string,
    filter?: {
      period?: 'today' | 'yesterday' | 'this_week' | 'this_month' | 'academic_year' | 'custom';
      customRange?: { startDate: string; endDate: string };
      method?: string;
      cashierId?: string;
      cashierName?: string;
    }
  ): Promise<PaymentReceipt[]> {
    const receipts = storageService.getItem<PaymentReceipt[]>(
      STORAGE_KEYS.PAYMENT_RECEIPTS,
      INITIAL_PAYMENT_RECEIPTS
    ).filter((r) => r.school_id === schoolId && !r.is_reversed);

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    let startDate = todayStr;
    let endDate = todayStr;

    if (filter?.period === 'yesterday') {
      const y = new Date();
      y.setDate(y.getDate() - 1);
      startDate = y.toISOString().split('T')[0];
      endDate = startDate;
    } else if (filter?.period === 'this_week') {
      const w = new Date();
      w.setDate(w.getDate() - 6);
      startDate = w.toISOString().split('T')[0];
      endDate = todayStr;
    } else if (filter?.period === 'this_month') {
      startDate = `${todayStr.slice(0, 7)}-01`;
      endDate = todayStr;
    } else if (filter?.period === 'academic_year') {
      startDate = '2026-04-01';
      endDate = todayStr;
    } else if (filter?.period === 'custom' && filter.customRange) {
      startDate = filter.customRange.startDate;
      endDate = filter.customRange.endDate;
    }

    let result = receipts.filter((r) => {
      const pDate = r.payment_date || r.created_at.split('T')[0];
      return pDate >= startDate && pDate <= endDate;
    });

    if (filter?.method && filter.method !== 'all') {
      result = result.filter((r) => {
        const raw = (r.payment_method || '').toLowerCase();
        if (filter.method === 'cash') return raw.includes('cash');
        if (filter.method === 'upi') return raw.includes('upi') || raw.includes('gpay') || raw.includes('phonepe');
        if (filter.method === 'card') return raw.includes('card');
        if (filter.method === 'bank_transfer' || filter.method === 'bank') return raw.includes('bank') || raw.includes('transfer');
        if (filter.method === 'cheque') return raw.includes('cheque');
        return true;
      });
    }

    if (filter?.cashierId) {
      result = result.filter(
        (r) => r.received_by_id === filter.cashierId || (filter.cashierName && r.received_by_name_snapshot?.toLowerCase().includes(filter.cashierName.toLowerCase()))
      );
    }

    return result.sort((a, b) => b.created_at.localeCompare(a.created_at));
  },
};

// ============================================================================
// 15. ADMISSION ENQUIRIES & PROSPECTIVE LEADS SERVICE
// ============================================================================

export const enquiryService = {
  async getEnquiries(
    schoolId: string,
    filter?: { status?: EnquiryStatus; search?: string }
  ): Promise<AdmissionEnquiry[]> {
    let list = storageService.getItem<AdmissionEnquiry[]>(
      STORAGE_KEYS.ADMISSION_ENQUIRIES,
      INITIAL_ADMISSION_ENQUIRIES
    ).filter((e) => e.school_id === schoolId);

    if (filter?.status) {
      list = list.filter((e) => e.status === filter.status);
    }

    if (filter?.search) {
      const q = filter.search.toLowerCase();
      list = list.filter(
        (e) =>
          e.student_name.toLowerCase().includes(q) ||
          e.parent_name.toLowerCase().includes(q) ||
          e.primary_phone.includes(q) ||
          e.interested_class.toLowerCase().includes(q)
      );
    }

    return list.sort((a, b) => b.created_at.localeCompare(a.created_at));
  },

  async createEnquiry(
    data: Omit<AdmissionEnquiry, 'id' | 'created_at' | 'updated_at'>
  ): Promise<AdmissionEnquiry> {
    const list = storageService.getItem<AdmissionEnquiry[]>(
      STORAGE_KEYS.ADMISSION_ENQUIRIES,
      INITIAL_ADMISSION_ENQUIRIES
    );
    const newEnq: AdmissionEnquiry = {
      ...data,
      id: `enq-${Date.now().toString().slice(-4)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    list.unshift(newEnq);
    storageService.setItem(STORAGE_KEYS.ADMISSION_ENQUIRIES, list);
    return newEnq;
  },

  async updateEnquiry(
    id: string,
    updates: Partial<AdmissionEnquiry>,
    actorName: string = 'Receptionist'
  ): Promise<AdmissionEnquiry> {
    const list = storageService.getItem<AdmissionEnquiry[]>(
      STORAGE_KEYS.ADMISSION_ENQUIRIES,
      INITIAL_ADMISSION_ENQUIRIES
    );
    const index = list.findIndex((e) => e.id === id);
    if (index === -1) throw new Error('Enquiry not found');

    const updated = {
      ...list[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    list[index] = updated;
    storageService.setItem(STORAGE_KEYS.ADMISSION_ENQUIRIES, list);
    return updated;
  },

  async convertEnquiryToStudent(
    enquiryId: string,
    studentData: Partial<Student> & { first_name: string; last_name: string; class_id: string; section_id: string; school_code?: string },
    actorName: string = 'Receptionist / Admin'
  ): Promise<{ student: Student; enquiry: AdmissionEnquiry }> {
    const list = storageService.getItem<AdmissionEnquiry[]>(
      STORAGE_KEYS.ADMISSION_ENQUIRIES,
      INITIAL_ADMISSION_ENQUIRIES
    );
    const index = list.findIndex((e) => e.id === enquiryId);
    if (index === -1) throw new Error('Enquiry not found');

    const enquiry = list[index];

    // Create the student
    const createdStudent = await studentService.createStudent({
      school_id: enquiry.school_id,
      school_code: studentData.school_code,
      academic_year_id: 'ay-2026',
      first_name: studentData.first_name || enquiry.student_name.split(' ')[0],
      last_name: studentData.last_name || enquiry.student_name.split(' ').slice(1).join(' ') || 'Student',
      registration_number: studentData.registration_number || '',
      joining_date: new Date().toISOString().split('T')[0],
      roll_number: '1',
      guardian: {
        guardian_name: enquiry.parent_name,
        primary_phone: enquiry.primary_phone,
        secondary_phone: enquiry.secondary_phone,
        email: enquiry.email,
      },
      class_id: studentData.class_id || 'cls-08',
      section_id: studentData.section_id || 'sec-8a',
    });

    // Update enquiry status to admitted
    enquiry.status = 'admitted';
    enquiry.notes = `${enquiry.notes || ''}\n[Admitted] Converted to student ${createdStudent.first_name} ${createdStudent.last_name} (${createdStudent.registration_number}) on ${new Date().toLocaleDateString()}`;
    enquiry.updated_at = new Date().toISOString();
    list[index] = enquiry;
    storageService.setItem(STORAGE_KEYS.ADMISSION_ENQUIRIES, list);

    return { student: createdStudent, enquiry };
  },
};

// ============================================================================
// 16. PARENT MANAGEMENT & PORTAL SERVICE
// ============================================================================

export const parentService = {
  async getParents(
    schoolId: string,
    filter?: { search?: string; status?: GeneralStatus }
  ): Promise<ParentProfile[]> {
    try {
      if (typeof window !== 'undefined') {
        const qs = new URLSearchParams();
        if (filter?.search) qs.set('search', filter.search);
        if (filter?.status) qs.set('status', filter.status);
        const res = await fetch(`/api/parents${qs.toString() ? `?${qs}` : ''}`);
        const json = await res.json();
        if (res.ok && json.success && Array.isArray(json.data)) {
          storageService.setItem(STORAGE_KEYS.PARENTS, json.data);
          return json.data;
        }
      }
    } catch (e) {
      console.warn('API parents fetch fallback:', e);
    }

    let list = storageService.getItem<ParentProfile[]>(STORAGE_KEYS.PARENTS, INITIAL_PARENTS).filter(
      (p) => p.school_id === schoolId
    );

    if (filter?.status) list = list.filter((p) => p.status === filter.status);

    if (filter?.search) {
      const q = filter.search.toLowerCase();
      list = list.filter(
        (p) =>
          p.guardian_name.toLowerCase().includes(q) ||
          p.father_name?.toLowerCase().includes(q) ||
          p.mother_name?.toLowerCase().includes(q) ||
          p.email.toLowerCase().includes(q) ||
          p.primary_phone.includes(q)
      );
    }

    return list;
  },

  async getParentById(id: string): Promise<ParentProfile | null> {
    const list = storageService.getItem<ParentProfile[]>(STORAGE_KEYS.PARENTS, INITIAL_PARENTS);
    return list.find((p) => p.id === id) || null;
  },

  async createParent(
    data: Omit<ParentProfile, 'id' | 'created_at' | 'updated_at'>
  ): Promise<ParentProfile> {
    const list = storageService.getItem<ParentProfile[]>(STORAGE_KEYS.PARENTS, INITIAL_PARENTS);
    const newParent: ParentProfile = {
      ...data,
      id: `prt-${Date.now().toString().slice(-4)}`,
      status: data.status || 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    try {
      if (typeof window !== 'undefined') {
        const res = await fetch('/api/parents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newParent),
        });
        const json = await res.json();
        if (!res.ok || !json.success || !json.data) throw new Error(json.error || 'Could not save parent to database.');
        Object.assign(newParent, json.data);
      }
    } catch (e) {
      throw e instanceof Error ? e : new Error('Could not save parent to database.');
    }
    list.push(newParent);
    storageService.setItem(STORAGE_KEYS.PARENTS, list);
    return newParent;
  },

  async updateParent(id: string, data: Partial<ParentProfile>): Promise<ParentProfile> {
    const list = storageService.getItem<ParentProfile[]>(STORAGE_KEYS.PARENTS, INITIAL_PARENTS);
    const index = list.findIndex((p) => p.id === id);
    if (index === -1) throw new Error('Parent not found');

    const updated = {
      ...list[index],
      ...data,
      updated_at: new Date().toISOString(),
    };
    try {
      if (typeof window !== 'undefined') {
        const res = await fetch(`/api/parents/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        const json = await res.json();
        if (!res.ok || !json.success || !json.data) throw new Error(json.error || 'Could not update parent in database.');
        Object.assign(updated, json.data);
      }
    } catch (e) {
      throw e instanceof Error ? e : new Error('Could not update parent in database.');
    }
    list[index] = updated;
    storageService.setItem(STORAGE_KEYS.PARENTS, list);
    return updated;
  },

  async getParentStudentLinks(
    schoolId: string,
    filter?: { parentId?: string; studentId?: string }
  ): Promise<ParentStudentLink[]> {
    try {
      if (typeof window !== 'undefined') {
        const qs = new URLSearchParams();
        if (filter?.parentId) qs.set('parentId', filter.parentId);
        if (filter?.studentId) qs.set('studentId', filter.studentId);
        const res = await fetch(`/api/parent-links${qs.toString() ? `?${qs}` : ''}`);
        const json = await res.json();
        if (res.ok && json.success && Array.isArray(json.data)) {
          storageService.setItem(STORAGE_KEYS.PARENT_STUDENT_LINKS, json.data);
        }
      }
    } catch (e) {
      console.warn('API parent links fetch fallback:', e);
    }

    let list = storageService.getItem<ParentStudentLink[]>(
      STORAGE_KEYS.PARENT_STUDENT_LINKS,
      INITIAL_PARENT_STUDENT_LINKS
    ).filter((l) => l.school_id === schoolId);

    if (filter?.parentId) list = list.filter((l) => l.parent_id === filter.parentId);
    if (filter?.studentId) list = list.filter((l) => l.student_id === filter.studentId);

    // Attach student & parent objects
    const allStudents = storageService.getItem<Student[]>(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS);
    const allParents = storageService.getItem<ParentProfile[]>(STORAGE_KEYS.PARENTS, INITIAL_PARENTS);

    return list.map((l) => ({
      ...l,
      student: allStudents.find((s) => s.id === l.student_id),
      parent: allParents.find((p) => p.id === l.parent_id),
    }));
  },

  async linkParentToStudent(
    schoolId: string,
    parentId: string,
    studentId: string,
    relationship: 'father' | 'mother' | 'guardian' | 'other' = 'guardian',
    isPrimary: boolean = true,
    actorId: string = 'admin'
  ): Promise<ParentStudentLink> {
    const list = storageService.getItem<ParentStudentLink[]>(
      STORAGE_KEYS.PARENT_STUDENT_LINKS,
      INITIAL_PARENT_STUDENT_LINKS
    );

    const existing = list.find((l) => l.parent_id === parentId && l.student_id === studentId);
    if (existing) {
      if (
        existing.status === 'active' &&
        existing.relationship === relationship &&
        existing.is_primary_guardian === isPrimary
      ) {
        return existing;
      }
      throw new Error('Updating an existing parent link requires the database update endpoint.');
    }

    const newLink: ParentStudentLink = {
      id: `psl-${Date.now().toString().slice(-4)}`,
      school_id: schoolId,
      parent_id: parentId,
      student_id: studentId,
      relationship,
      is_primary_guardian: isPrimary,
      status: 'active',
      created_by: actorId,
      created_at: new Date().toISOString(),
    };

    try {
      if (typeof window !== 'undefined') {
        const res = await fetch('/api/parent-links', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newLink),
        });
        const json = await res.json();
        if (!res.ok || !json.success || !json.data) throw new Error(json.error || 'Could not save parent link to database.');
        Object.assign(newLink, json.data);
      }
    } catch (e) {
      throw e instanceof Error ? e : new Error('Could not save parent link to database.');
    }
    list.push(newLink);
    storageService.setItem(STORAGE_KEYS.PARENT_STUDENT_LINKS, list);
    return newLink;
  },

  async unlinkParentFromStudent(linkId: string): Promise<void> {
    let list = storageService.getItem<ParentStudentLink[]>(
      STORAGE_KEYS.PARENT_STUDENT_LINKS,
      INITIAL_PARENT_STUDENT_LINKS
    );
    const index = list.findIndex((l) => l.id === linkId);
    if (index !== -1) {
      list[index].status = 'inactive';
      storageService.setItem(STORAGE_KEYS.PARENT_STUDENT_LINKS, list);
    }
  },

  async getParentChildren(parentId: string, schoolId: string, parentEmail?: string): Promise<Student[]> {
    try {
      const res = await fetch(`/api/parents/children?schoolId=${encodeURIComponent(schoolId)}`, {
        cache: 'no-store',
        credentials: 'include',
      });
      if (res.ok) {
        const result = await res.json();
        if (result.success && Array.isArray(result.data) && result.data.length > 0) {
          const currentStudents = storageService.getItem<Student[]>(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS);
          let updated = false;
          for (const s of result.data) {
            if (!currentStudents.some((c) => c.id === s.id || c.registration_number === s.registration_number)) {
              currentStudents.push(s);
              updated = true;
            }
          }
          if (updated) {
            storageService.setItem(STORAGE_KEYS.STUDENTS, currentStudents);
          }
          return result.data;
        }
      }
    } catch (e) {
      console.warn('API getParentChildren notice:', e);
    }

    // Fallback: Check local storage by parent_student_links AND guardian email
    const links = storageService.getItem<ParentStudentLink[]>(
      STORAGE_KEYS.PARENT_STUDENT_LINKS,
      INITIAL_PARENT_STUDENT_LINKS
    ).filter((l) => (l.parent_id === parentId || l.parent_id === 'parent-001') && l.status === 'active' && (!schoolId || l.school_id === schoolId));

    const studentIds = new Set(links.map((l) => l.student_id));
    const allStudents = storageService.getItem<Student[]>(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS);

    return allStudents.filter((s) => {
      if (schoolId && s.school_id !== schoolId) return false;
      if (studentIds.has(s.id)) return true;
      if (parentEmail && s.guardian?.email?.toLowerCase().trim() === parentEmail.toLowerCase().trim()) return true;
      return false;
    });
  },
};

// ============================================================================
// 17. NOTIFICATION SERVICE (In-App Alerts for Transport, Leaves, Fees)
// ============================================================================

export const notificationService = {
  async getNotifications(recipientUserId: string): Promise<AppNotification[]> {
    const list = storageService.getItem<AppNotification[]>(
      STORAGE_KEYS.NOTIFICATIONS,
      INITIAL_NOTIFICATIONS
    );
    return list.filter((n) => n.recipient_user_id === recipientUserId).sort((a, b) => b.created_at.localeCompare(a.created_at));
  },

  async markAsRead(notificationId: string): Promise<void> {
    const list = storageService.getItem<AppNotification[]>(
      STORAGE_KEYS.NOTIFICATIONS,
      INITIAL_NOTIFICATIONS
    );
    const index = list.findIndex((n) => n.id === notificationId);
    if (index !== -1) {
      list[index].read_at = new Date().toISOString();
      storageService.setItem(STORAGE_KEYS.NOTIFICATIONS, list);
    }
  },

  async markAllAsRead(recipientUserId: string): Promise<void> {
    const list = storageService.getItem<AppNotification[]>(
      STORAGE_KEYS.NOTIFICATIONS,
      INITIAL_NOTIFICATIONS
    );
    list.forEach((n) => {
      if (n.recipient_user_id === recipientUserId && !n.read_at) {
        n.read_at = new Date().toISOString();
      }
    });
    storageService.setItem(STORAGE_KEYS.NOTIFICATIONS, list);
  },

  async createNotification(
    data: Omit<AppNotification, 'id' | 'created_at'>
  ): Promise<AppNotification> {
    const list = storageService.getItem<AppNotification[]>(
      STORAGE_KEYS.NOTIFICATIONS,
      INITIAL_NOTIFICATIONS
    );
    const newNotif: AppNotification = {
      ...data,
      id: `notif-${Date.now().toString().slice(-4)}`,
      read_at: null,
      created_at: new Date().toISOString(),
    };
    list.unshift(newNotif);
    storageService.setItem(STORAGE_KEYS.NOTIFICATIONS, list);
    return newNotif;
  },
};

// ============================================================================
// 18. FEE VERSION & BULK CLASS FEE MANAGEMENT SERVICE
// ============================================================================

export const feeVersionService = {
  async getFeeStructureVersions(schoolId: string, feeStructureId?: string): Promise<FeeStructureVersion[]> {
    let list = storageService.getItem<FeeStructureVersion[]>(
      STORAGE_KEYS.FEE_STRUCTURE_VERSIONS,
      INITIAL_FEE_STRUCTURE_VERSIONS
    ).filter((v) => v.school_id === schoolId);

    if (feeStructureId) {
      list = list.filter((v) => v.fee_structure_id === feeStructureId);
    }
    return list.sort((a, b) => b.effective_from.localeCompare(a.effective_from));
  },

  async updateClassFeeStructure(data: {
    school_id: string;
    fee_structure_id: string;
    class_id: string;
    class_name?: string;
    new_amount: number;
    effective_from: string; // e.g. '2026-09-01'
    reason: string;
    actorId?: string;
    actorName?: string;
  }): Promise<{ version: FeeStructureVersion; affectedStudentsCount: number }> {
    const structures = storageService.getItem<FeeStructure[]>(
      STORAGE_KEYS.FEE_STRUCTURES,
      INITIAL_FEE_STRUCTURES
    );
    const structIndex = structures.findIndex((s) => s.id === data.fee_structure_id);
    if (structIndex === -1) throw new Error('Fee structure not found');

    const oldAmount = structures[structIndex].amount;

    // 1. Close previous version if exists
    const versions = storageService.getItem<FeeStructureVersion[]>(
      STORAGE_KEYS.FEE_STRUCTURE_VERSIONS,
      INITIAL_FEE_STRUCTURE_VERSIONS
    );
    const lastVersionIndex = versions.findIndex(
      (v) => v.fee_structure_id === data.fee_structure_id && !v.effective_to
    );
    if (lastVersionIndex !== -1) {
      versions[lastVersionIndex].effective_to = data.effective_from;
    }

    // 2. Add new version entry
    const newVersion: FeeStructureVersion = {
      id: `fsv-${Date.now().toString().slice(-4)}`,
      school_id: data.school_id,
      fee_structure_id: data.fee_structure_id,
      amount: data.new_amount,
      effective_from: data.effective_from,
      created_by: data.actorId,
      created_by_name: data.actorName || 'School Administrator',
      reason: data.reason,
      created_at: new Date().toISOString(),
    };
    versions.unshift(newVersion);
    storageService.setItem(STORAGE_KEYS.FEE_STRUCTURE_VERSIONS, versions);

    // 3. Update structure amount
    structures[structIndex].amount = data.new_amount;
    storageService.setItem(STORAGE_KEYS.FEE_STRUCTURES, structures);

    // 4. Count affected students
    const students = storageService.getItem<Student[]>(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS).filter(
      (st) => st.school_id === data.school_id && (data.class_id === 'all' || st.current_enrollment?.class_id === data.class_id)
    );

    // 5. Audit log
    authLogService.logEvent({
      school_id: data.school_id,
      user_id: data.actorId || 'usr-admin-01',
      event_type: 'fee_structure_changed',
      success: true,
      role: 'school_admin',
      user_name: data.actorName || 'School Administrator',
      details: {
        structureName: structures[structIndex].name,
        className: data.class_name || 'Class',
        oldAmount,
        newAmount: data.new_amount,
        effectiveFrom: data.effective_from,
        reason: data.reason,
        affectedStudents: students.length,
      },
    });

    return { version: newVersion, affectedStudentsCount: students.length };
  },
};

// ============================================================================
// 19. ONE-TIME BULK CHARGES SERVICE
// ============================================================================

export const bulkChargeService = {
  async getBulkChargeBatches(schoolId: string): Promise<BulkChargeBatch[]> {
    const list = storageService.getItem<BulkChargeBatch[]>(
      STORAGE_KEYS.BULK_CHARGE_BATCHES,
      INITIAL_BULK_CHARGE_BATCHES
    );
    return list.filter((b) => b.school_id === schoolId).sort((a, b) => b.created_at.localeCompare(a.created_at));
  },

  async createBulkChargeBatch(data: {
    school_id: string;
    academic_year_id: string;
    name: string;
    amount: number;
    target_type: BulkChargeBatch['target_type'];
    target_label: string;
    target_class_id?: string;
    target_section_id?: string;
    charge_date?: string;
    due_date?: string;
    description?: string;
    target_student_ids: string[];
    actorId?: string;
    actorName?: string;
  }): Promise<{ batch: BulkChargeBatch; chargesCreated: number }> {
    const batches = storageService.getItem<BulkChargeBatch[]>(
      STORAGE_KEYS.BULK_CHARGE_BATCHES,
      INITIAL_BULK_CHARGE_BATCHES
    );
    const charges = storageService.getItem<StudentCharge[]>(
      STORAGE_KEYS.STUDENT_CHARGES,
      INITIAL_STUDENT_CHARGES
    );
    const allStudents = storageService.getItem<Student[]>(
      STORAGE_KEYS.STUDENTS,
      INITIAL_STUDENTS
    );

    const batchId = `bcb-${Date.now().toString().slice(-4)}`;
    const nowIso = new Date().toISOString();
    const chargeDate = data.charge_date || nowIso.split('T')[0];

    const eligibleStudents = allStudents.filter(
      (s) => s.school_id === data.school_id && data.target_student_ids.includes(s.id)
    );

    // Create individual student charges
    const newStudentCharges: StudentCharge[] = eligibleStudents.map((std, idx) => ({
      id: `chg-${Date.now().toString().slice(-4)}-${idx + 1}`,
      school_id: data.school_id,
      student_id: std.id,
      academic_year_id: data.academic_year_id,
      charge_name: data.name.trim(),
      description: data.description?.trim() || undefined,
      amount: data.amount,
      paid_amount: 0,
      remaining_amount: data.amount,
      charge_date: chargeDate,
      due_date: data.due_date || undefined,
      status: 'pending',
      created_by: data.actorId,
      created_by_name: data.actorName || 'School Administrator',
      student_name: `${std.first_name} ${std.last_name}`,
      registration_number: std.registration_number,
      bulk_charge_batch_id: batchId,
      created_at: nowIso,
      updated_at: nowIso,
    }));

    charges.unshift(...newStudentCharges);
    storageService.setItem(STORAGE_KEYS.STUDENT_CHARGES, charges);

    const totalAmount = data.amount * eligibleStudents.length;

    const newBatch: BulkChargeBatch = {
      id: batchId,
      school_id: data.school_id,
      academic_year_id: data.academic_year_id,
      name: data.name.trim(),
      amount: data.amount,
      target_type: data.target_type,
      target_label: data.target_label,
      target_class_id: data.target_class_id,
      target_section_id: data.target_section_id,
      charge_date: chargeDate,
      due_date: data.due_date,
      description: data.description,
      total_students: eligibleStudents.length,
      total_amount: totalAmount,
      status: 'active',
      created_by: data.actorId,
      created_by_name: data.actorName || 'School Administrator',
      created_at: nowIso,
    };

    batches.unshift(newBatch);
    storageService.setItem(STORAGE_KEYS.BULK_CHARGE_BATCHES, batches);

    // Audit log
    authLogService.logEvent({
      school_id: data.school_id,
      user_id: data.actorId || 'usr-admin-01',
      event_type: 'bulk_charge_created',
      success: true,
      role: 'school_admin',
      user_name: data.actorName || 'School Administrator',
      details: {
        batchId,
        chargeName: data.name,
        amount: data.amount,
        target: data.target_label,
        studentsCount: eligibleStudents.length,
        totalAmount,
      },
    });

    return { batch: newBatch, chargesCreated: newStudentCharges.length };
  },

  async cancelBulkChargeBatch(
    batchId: string,
    actorId?: string,
    actorName?: string
  ): Promise<{ success: boolean; cancelledChargesCount: number }> {
    const batches = storageService.getItem<BulkChargeBatch[]>(
      STORAGE_KEYS.BULK_CHARGE_BATCHES,
      INITIAL_BULK_CHARGE_BATCHES
    );
    const batchIndex = batches.findIndex((b) => b.id === batchId);
    if (batchIndex === -1) throw new Error('Bulk charge batch not found');

    const charges = storageService.getItem<StudentCharge[]>(
      STORAGE_KEYS.STUDENT_CHARGES,
      INITIAL_STUDENT_CHARGES
    );
    const batchCharges = charges.filter((c) => c.bulk_charge_batch_id === batchId);

    // Safety guard: If any payment has been received against these charges, block cancellation
    const paidCount = batchCharges.filter((c) => c.paid_amount > 0).length;
    if (paidCount > 0) {
      throw new Error(
        `Cannot cancel batch: ${paidCount} students have already made payments against this charge. Please refund or adjust individual receipts first.`
      );
    }

    // Cancel all linked charges
    charges.forEach((c) => {
      if (c.bulk_charge_batch_id === batchId) {
        c.status = 'cancelled';
        c.waive_reason = 'Bulk charge batch cancelled by administrator';
        c.updated_at = new Date().toISOString();
      }
    });
    storageService.setItem(STORAGE_KEYS.STUDENT_CHARGES, charges);

    // Cancel batch
    batches[batchIndex].status = 'cancelled';
    batches[batchIndex].cancelled_at = new Date().toISOString();
    batches[batchIndex].cancelled_by = actorName || 'School Administrator';
    storageService.setItem(STORAGE_KEYS.BULK_CHARGE_BATCHES, batches);

    // Audit log
    authLogService.logEvent({
      school_id: batches[batchIndex].school_id,
      user_id: actorId || 'usr-admin-01',
      event_type: 'bulk_charge_cancelled',
      success: true,
      role: 'school_admin',
      user_name: actorName || 'School Administrator',
      details: {
        batchId,
        chargeName: batches[batchIndex].name,
        cancelledCharges: batchCharges.length,
      },
    });

    return { success: true, cancelledChargesCount: batchCharges.length };
  },
};

// ============================================================================
// 20. STUDENT FOLLOW-UP SERVICE
// ============================================================================

export const followUpService = {
  async getStudentFollowUps(schoolId: string, studentId?: string): Promise<StudentFollowUp[]> {
    let list = storageService.getItem<StudentFollowUp[]>(
      STORAGE_KEYS.STUDENT_FOLLOWUPS,
      INITIAL_STUDENT_FOLLOWUPS
    ).filter((f) => f.school_id === schoolId);

    if (studentId) {
      list = list.filter((f) => f.student_id === studentId);
    }
    return list.sort((a, b) => b.created_at.localeCompare(a.created_at));
  },

  async createFollowUp(
    data: Omit<StudentFollowUp, 'id' | 'created_at'>
  ): Promise<StudentFollowUp> {
    const list = storageService.getItem<StudentFollowUp[]>(
      STORAGE_KEYS.STUDENT_FOLLOWUPS,
      INITIAL_STUDENT_FOLLOWUPS
    );
    const newFollowUp: StudentFollowUp = {
      ...data,
      id: `sfu-${Date.now().toString().slice(-4)}`,
      created_at: new Date().toISOString(),
    };
    list.unshift(newFollowUp);
    storageService.setItem(STORAGE_KEYS.STUDENT_FOLLOWUPS, list);
    return newFollowUp;
  },
};

// ============================================================================
// 21. CLASS INSIGHTS & ATTENDANCE CONCERNS SERVICE
// ============================================================================

export const insightService = {
  async getClassAcademicInsights(
    schoolId: string,
    classId: string,
    sectionId?: string,
    period: 'academic_year' | 'term' | 'month' | 'exam' = 'academic_year'
  ): Promise<ClassAcademicInsights> {
    const [allStudents, exams, results, classes, sections] = await Promise.all([
      studentService.getStudents(schoolId, { classId, sectionId }),
      examService.getExams(schoolId),
      storageService.getItem<ExamResult[]>(STORAGE_KEYS.EXAM_RESULTS, INITIAL_EXAM_RESULTS),
      academicService.getClasses(schoolId),
      academicService.getSections(schoolId),
    ]);

    const targetClass = classes.find((c) => c.id === classId);
    const targetSection = sections.find((s) => s.id === sectionId);

    // Strictly published exams
    const publishedExams = exams.filter((e) => e.status === 'published' && (!classId || e.class_id === classId));

    const studentPctMap: Record<string, { totalPct: number; examCount: number }> = {};
    const subjectPctMap: Record<string, { totalPct: number; resultCount: number; subject_name: string }> = {};

    allStudents.forEach((st) => {
      studentPctMap[st.id] = { totalPct: 0, examCount: 0 };
    });

    publishedExams.forEach((exam) => {
      const examResults = results.filter((r) => r.exam_id === exam.id && !r.absent);
      examResults.forEach((r) => {
        if (studentPctMap[r.student_id]) {
          const maxMarks = exam.max_marks || 100;
          const marks = r.marks_obtained || 0;
          const normalizedPct = (marks / maxMarks) * 100;
          studentPctMap[r.student_id].totalPct += normalizedPct;
          studentPctMap[r.student_id].examCount += 1;

          if (!subjectPctMap[exam.subject_id]) {
            subjectPctMap[exam.subject_id] = { totalPct: 0, resultCount: 0, subject_name: exam.subject_name || 'General Subject' };
          }
          subjectPctMap[exam.subject_id].totalPct += normalizedPct;
          subjectPctMap[exam.subject_id].resultCount += 1;
        }
      });
    });

    // Compute student averages
    const scoredStudents: { student: Student; averagePct: number; examsCount: number }[] = [];
    allStudents.forEach((st) => {
      const score = studentPctMap[st.id];
      const avg = score && score.examCount > 0 ? Math.round((score.totalPct / score.examCount) * 10) / 10 : 0;
      scoredStudents.push({ student: st, averagePct: avg, examsCount: score?.examCount || 0 });
    });

    // Sort descending by average
    scoredStudents.sort((a, b) => b.averagePct - a.averagePct);

    // Class average
    const validScores = scoredStudents.filter((s) => s.examsCount > 0);
    const classAvg =
      validScores.length > 0
        ? Math.round(validScores.reduce((sum, s) => sum + s.averagePct, 0) / validScores.length * 10) / 10
        : 0;

    // Compute Toppers with joint handling
    const toppers: ClassTopper[] = [];
    if (scoredStudents.length > 0 && scoredStudents[0].averagePct > 0) {
      const highestScore = scoredStudents[0].averagePct;
      const topTied = scoredStudents.filter((s) => s.averagePct === highestScore);
      const isJoint = topTied.length > 1;

      topTied.forEach((s) => {
        toppers.push({
          student_id: s.student.id,
          student_name: `${s.student.first_name} ${s.student.last_name}`,
          roll_number: s.student.current_enrollment?.roll_number,
          photo_url: s.student.photo_url,
          average_percentage: s.averagePct,
          rank: 1,
          is_joint: isJoint,
          total_exams_evaluated: s.examsCount,
        });
      });
    }

    const subjectAverages: SubjectAverage[] = Object.entries(subjectPctMap).map(([id, data]) => ({
      subject_id: id,
      subject_name: data.subject_name,
      average_pct: data.resultCount > 0 ? Math.round((data.totalPct / data.resultCount) * 10) / 10 : 0,
    }));

    return {
      class_id: classId,
      section_id: sectionId,
      class_name: targetClass?.name || 'Class',
      section_name: targetSection?.name || 'A',
      period,
      class_average_pct: classAvg,
      toppers,
      subject_averages: subjectAverages,
    };
  },

  async getClassAttendanceInsights(
    schoolId: string,
    classId: string,
    sectionId?: string
  ): Promise<ClassAttendanceInsights> {
    const [allStudents, allAttendance, classes, sections] = await Promise.all([
      studentService.getStudents(schoolId, { classId, sectionId }),
      attendanceService.getAttendance(schoolId, { classId, sectionId }),
      academicService.getClasses(schoolId),
      academicService.getSections(schoolId),
    ]);

    const targetClass = classes.find((c) => c.id === classId);
    const targetSection = sections.find((s) => s.id === sectionId);

    const todayStr = new Date().toISOString().split('T')[0];
    const todayAtt = allAttendance.filter((a) => a.attendance_date === todayStr);

    const todayPresent = todayAtt.filter((a) => a.status === 'present').length;
    const todayAbsent = todayAtt.filter((a) => a.status === 'absent').length;
    const todayLeave = todayAtt.filter((a) => a.status === 'leave').length;

    // Student attendance stats
    const perfectAttendance: { student_id: string; student_name: string; roll_number?: string }[] = [];
    const needsAttention: ClassAttendanceInsights['needs_attention_students'] = [];

    allStudents.forEach((st) => {
      const records = allAttendance.filter((a) => a.student_id === st.id);
      const totalDays = records.length;
      const presentDays = records.filter((a) => a.status === 'present').length;
      const absentDays = records.filter((a) => a.status === 'absent').length;
      const pct = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

      if (pct === 100 && totalDays > 0) {
        perfectAttendance.push({
          student_id: st.id,
          student_name: `${st.first_name} ${st.last_name}`,
          roll_number: st.current_enrollment?.roll_number,
        });
      }

      if (totalDays > 0 && (pct < 75 || absentDays >= 3)) {
        needsAttention.push({
          student_id: st.id,
          student_name: `${st.first_name} ${st.last_name}`,
          roll_number: st.current_enrollment?.roll_number,
          attendance_pct: pct,
          absent_days: absentDays,
          consecutive_absent_days: absentDays,
        });
      }
    });

    needsAttention.sort((a, b) => a.attendance_pct - b.attendance_pct);

    return {
      class_id: classId,
      section_id: sectionId,
      class_name: targetClass?.name || 'Class',
      section_name: targetSection?.name || 'A',
      today_present: todayPresent,
      today_absent: todayAbsent,
      today_leave: todayLeave,
      total_enrolled: allStudents.length,
      monthly_average_pct: allStudents.length > 0 ? Math.round((todayPresent / allStudents.length) * 100) : 0,
      perfect_attendance_students: perfectAttendance,
      needs_attention_students: needsAttention,
    };
  },

  async getAttendanceConcerns(
    schoolId: string,
    filter?: { classId?: string; teacherId?: string; minConsecutiveDays?: number }
  ): Promise<AttendanceConcern[]> {
    const [allStudents, allAttendance, holidays, leaves, followups] = await Promise.all([
      studentService.getStudents(schoolId, { classId: filter?.classId }),
      attendanceService.getAttendance(schoolId, { classId: filter?.classId }),
      holidayService.getHolidays(schoolId),
      leaveService.getLeaves(schoolId, { status: 'approved' }),
      followUpService.getStudentFollowUps(schoolId),
    ]);

    const holidayDates = new Set(holidays.map((h) => h.start_date));
    const concerns: AttendanceConcern[] = [];

    allStudents.forEach((st) => {
      const records = allAttendance
        .filter((a) => a.student_id === st.id)
        .sort((a, b) => b.attendance_date.localeCompare(a.attendance_date));

      let consecutiveAbsences = 0;
      let lastPresentDate = '07 Aug 2026';
      let foundPresent = false;

      for (const rec of records) {
        if (holidayDates.has(rec.attendance_date)) continue; // Skip holidays
        const isApprovedLeave = leaves.some(
          (l) => l.student_id === st.id && l.start_date <= rec.attendance_date && l.end_date >= rec.attendance_date
        );
        if (isApprovedLeave) continue; // Approved leaves do not count as consecutive absence

        if (rec.status === 'absent') {
          if (!foundPresent) consecutiveAbsences += 1;
        } else if (rec.status === 'present') {
          foundPresent = true;
          lastPresentDate = rec.attendance_date;
          break;
        }
      }

      if (records.length === 0) return;

      const totalDays = records.length;
      const presentDays = records.filter((a) => a.status === 'present').length;
      const monthlyPct = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

      const latestFollowUp = followups.find((f) => f.student_id === st.id && f.type === 'attendance');

      if (consecutiveAbsences >= 3 || (totalDays > 0 && monthlyPct < 75)) {
        const level: AttendanceConcern['level'] =
          consecutiveAbsences >= 10 ? 'critical' : consecutiveAbsences >= 5 ? 'concern' : 'watch';

        concerns.push({
          student_id: st.id,
          student_name: `${st.first_name} ${st.last_name}`,
          registration_number: st.registration_number,
          class_name: st.current_enrollment?.class_name || 'Class',
          section_name: st.current_enrollment?.section_name || 'A',
          consecutive_absent_days: consecutiveAbsences,
          last_present_date: lastPresentDate,
          level,
          monthly_attendance_pct: monthlyPct,
          parent_name: st.guardian?.guardian_name || 'Guardian',
          parent_phone: st.guardian?.primary_phone || '',
          is_resolved: false,
          latest_follow_up: latestFollowUp,
        });
      }
    });

    return concerns.sort((a, b) => b.consecutive_absent_days - a.consecutive_absent_days);
  },
};

// ----------------------------------------------------------------------------
// Academic Year Transition & Student Progression Service (Move to New Session)
// ----------------------------------------------------------------------------

export const sessionTransitionService = {
  async getTransitionSuggestions(
    schoolId: string,
    sourceYearId: string,
    targetYearId: string
  ): Promise<{
    items: StudentTransitionItem[];
    summary: TransitionSummaryBreakdown;
    sourceYear: AcademicYear | null;
    targetYear: AcademicYear | null;
  }> {
    const students = storageService.getItem<Student[]>(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS).filter((s) => s.school_id === schoolId);
    const classes = storageService.getItem<SchoolClass[]>(STORAGE_KEYS.CLASSES, INITIAL_CLASSES).filter((c) => c.school_id === schoolId);
    const sections = storageService.getItem<Section[]>(STORAGE_KEYS.SECTIONS, INITIAL_SECTIONS).filter((s) => s.school_id === schoolId);
    const academicYears = storageService.getItem<AcademicYear[]>(STORAGE_KEYS.ACADEMIC_YEARS, INITIAL_ACADEMIC_YEARS).filter((y) => y.school_id === schoolId);

    const sourceYear = academicYears.find((y) => y.id === sourceYearId) || academicYears[0] || null;
    const targetYear = academicYears.find((y) => y.id === targetYearId) || academicYears.find((y) => y.id !== sourceYearId) || null;

    const items: StudentTransitionItem[] = students.map((st) => {
      const enr = st.current_enrollment;
      const currentClass = classes.find((c) => c.id === enr?.class_id);
      const currentSection = sections.find((s) => s.id === enr?.section_id);

      let suggestedDecision: TransitionDecisionType = 'promote';
      let targetClassId: string | undefined = currentClass?.next_class_id;
      let targetClassName: string | undefined = currentClass?.next_class_name;
      let targetSectionId: string | undefined = enr?.section_id;
      let targetSectionName: string | undefined = enr?.section_name;
      let notes: string | undefined = st.academic_status_note;
      let isException = false;
      let requiresResolution = false;

      // 1. Check explicit progression status and student operational status
      if (st.progression_status === 'repeat') {
        suggestedDecision = 'repeat';
        targetClassId = enr?.class_id;
        targetClassName = enr?.class_name;
        isException = true;
      } else if (st.progression_status === 'left_school' || st.status === 'inactive') {
        suggestedDecision = 'left_school';
        targetClassId = undefined;
        targetClassName = undefined;
        targetSectionId = undefined;
        targetSectionName = undefined;
        isException = true;
      } else if (st.progression_status === 'transferred') {
        suggestedDecision = 'transfer_out';
        targetClassId = undefined;
        targetClassName = undefined;
        targetSectionId = undefined;
        targetSectionName = undefined;
        isException = true;
      } else if (
        st.progression_status === 'graduated' ||
        (!currentClass?.next_class_id && (currentClass?.sort_order === 10 || currentClass?.name?.includes('10')))
      ) {
        suggestedDecision = 'graduate';
        targetClassId = undefined;
        targetClassName = undefined;
        targetSectionId = undefined;
        targetSectionName = undefined;
        isException = true;
      } else if (st.progression_status === 'pending') {
        suggestedDecision = 'pending';
        isException = true;
        requiresResolution = true;
      } else {
        // Normal active student promotion
        if (currentClass?.next_class_id) {
          suggestedDecision = 'promote';
          targetClassId = currentClass.next_class_id;
          const nextCls = classes.find((c) => c.id === currentClass.next_class_id);
          targetClassName = nextCls?.name || currentClass.next_class_name || 'Next Class';
        } else {
          suggestedDecision = 'graduate';
          targetClassId = undefined;
          targetClassName = undefined;
          isException = true;
        }
      }

      return {
        student_id: st.id,
        student_name: `${st.first_name} ${st.last_name}`,
        registration_number: st.registration_number,
        roll_number: enr?.roll_number,
        photo_url: st.photo_url,
        current_class_id: enr?.class_id || '',
        current_class_name: enr?.class_name || '—',
        current_section_id: enr?.section_id || '',
        current_section_name: enr?.section_name || '—',
        current_status: st.status,
        progression_status: st.progression_status || 'ready',
        suggested_decision: suggestedDecision,
        selected_decision: suggestedDecision,
        target_class_id: targetClassId,
        target_class_name: targetClassName,
        target_section_id: targetSectionId,
        target_section_name: targetSectionName,
        notes,
        is_exception: isException,
        requires_resolution: requiresResolution,
      };
    });

    const summary: TransitionSummaryBreakdown = {
      total: items.length,
      promote: items.filter((i) => i.selected_decision === 'promote').length,
      repeat: items.filter((i) => i.selected_decision === 'repeat').length,
      no_new_enrollment: items.filter(
        (i) => i.selected_decision === 'transfer_out' || i.selected_decision === 'left_school'
      ).length,
      graduate: items.filter((i) => i.selected_decision === 'graduate').length,
      pending: items.filter((i) => i.selected_decision === 'pending').length,
    };

    return { items, summary, sourceYear, targetYear };
  },

  async executeAcademicYearTransition(
    schoolId: string,
    params: {
      sourceYearId: string;
      targetYearId: string;
      items: StudentTransitionItem[];
      actorName: string;
      actorId?: string;
    }
  ): Promise<AcademicYearTransitionBatch> {
    const pendingItems = params.items.filter((i) => i.selected_decision === 'pending');
    if (pendingItems.length > 0) {
      throw new Error(
        `Cannot execute transition with ${pendingItems.length} student(s) still in Pending Decision status. Please resolve all pending decisions first.`
      );
    }

    const students = storageService.getItem<Student[]>(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS);
    const academicYears = storageService.getItem<AcademicYear[]>(STORAGE_KEYS.ACADEMIC_YEARS, INITIAL_ACADEMIC_YEARS);
    const classes = storageService.getItem<SchoolClass[]>(STORAGE_KEYS.CLASSES, INITIAL_CLASSES);
    const batches = storageService.getItem<AcademicYearTransitionBatch[]>(
      STORAGE_KEYS.TRANSITION_BATCHES,
      INITIAL_TRANSITION_BATCHES
    );

    const sourceYear = academicYears.find((y) => y.id === params.sourceYearId);
    const targetYear = academicYears.find((y) => y.id === params.targetYearId);

    const batchId = `trb-${Date.now().toString().slice(-4)}`;
    const decisionsRecord: AcademicYearTransitionBatch['decisions'] = [];

    let promotedCount = 0;
    let repeatedCount = 0;
    let leftCount = 0;
    let graduatedCount = 0;

    for (const item of params.items) {
      const studentIndex = students.findIndex((s) => s.id === item.student_id);
      if (studentIndex === -1) continue;

      const student = { ...students[studentIndex] };
      const previousEnrollment = student.current_enrollment;
      const prevEnrollmentId = previousEnrollment?.id || `enr-prev-${item.student_id}`;

      let newEnrollmentId: string | undefined = undefined;

      if (item.selected_decision === 'promote') {
        promotedCount += 1;
        newEnrollmentId = `enr-${Date.now().toString().slice(-4)}-${student.id.slice(-3)}`;
        const targetCls = classes.find((c) => c.id === item.target_class_id);
        const newEnrollment: StudentEnrollment = {
          id: newEnrollmentId,
          school_id: schoolId,
          student_id: student.id,
          academic_year_id: params.targetYearId,
          class_id: item.target_class_id || item.current_class_id,
          section_id: item.target_section_id || item.current_section_id,
          roll_number: item.roll_number,
          joined_at: targetYear?.start_date || '2027-04-01',
          status: 'active',
          class_name: targetCls?.name || item.target_class_name || 'Next Class',
          section_name: item.target_section_name || 'A',
          academic_year_name: targetYear?.name || '2027-28',
          created_at: new Date().toISOString(),
        };

        student.enrollments = student.enrollments ? [...student.enrollments] : [];
        if (previousEnrollment && !student.enrollments.some((e) => e.id === previousEnrollment.id)) {
          student.enrollments.push(previousEnrollment);
        }
        student.enrollments.push(newEnrollment);
        student.current_enrollment = newEnrollment;
        student.status = 'active';
      } else if (item.selected_decision === 'repeat') {
        repeatedCount += 1;
        newEnrollmentId = `enr-${Date.now().toString().slice(-4)}-${student.id.slice(-3)}`;
        const newEnrollment: StudentEnrollment = {
          id: newEnrollmentId,
          school_id: schoolId,
          student_id: student.id,
          academic_year_id: params.targetYearId,
          class_id: item.current_class_id,
          section_id: item.current_section_id,
          roll_number: item.roll_number,
          joined_at: targetYear?.start_date || '2027-04-01',
          status: 'active',
          class_name: item.current_class_name,
          section_name: item.current_section_name,
          academic_year_name: targetYear?.name || '2027-28',
          created_at: new Date().toISOString(),
        };

        student.enrollments = student.enrollments ? [...student.enrollments] : [];
        if (previousEnrollment && !student.enrollments.some((e) => e.id === previousEnrollment.id)) {
          student.enrollments.push(previousEnrollment);
        }
        student.enrollments.push(newEnrollment);
        student.current_enrollment = newEnrollment;
        student.status = 'active';
      } else if (item.selected_decision === 'left_school' || item.selected_decision === 'transfer_out') {
        leftCount += 1;
        student.status = 'inactive';
      } else if (item.selected_decision === 'graduate') {
        graduatedCount += 1;
        student.status = 'inactive';
      }

      decisionsRecord.push({
        student_id: student.id,
        student_name: `${student.first_name} ${student.last_name}`,
        decision: item.selected_decision,
        previous_enrollment_id: prevEnrollmentId,
        new_enrollment_id: newEnrollmentId,
        target_class_name: item.target_class_name,
        target_section_name: item.target_section_name,
      });

      students[studentIndex] = student;
    }

    storageService.setItem(STORAGE_KEYS.STUDENTS, students);

    const batch: AcademicYearTransitionBatch = {
      id: batchId,
      school_id: schoolId,
      source_academic_year_id: params.sourceYearId,
      source_academic_year_name: sourceYear?.name || '2026-27',
      target_academic_year_id: params.targetYearId,
      target_academic_year_name: targetYear?.name || '2027-28',
      total_students: params.items.length,
      promoted_count: promotedCount,
      repeated_count: repeatedCount,
      left_count: leftCount,
      graduated_count: graduatedCount,
      decisions: decisionsRecord,
      status: 'completed',
      created_at: new Date().toISOString(),
      created_by_name: params.actorName,
      created_by_id: params.actorId,
    };

    batches.unshift(batch);
    storageService.setItem(STORAGE_KEYS.TRANSITION_BATCHES, batches);

    try {
      authLogService.logEvent({
        school_id: schoolId,
        user_name: params.actorName,
        event_type: 'academic_session_transition_completed',
        success: true,
        role: 'school_admin',
        details: {
          batch_id: batchId,
          source_year: sourceYear?.name,
          target_year: targetYear?.name,
          total_students: params.items.length,
          promoted_count: promotedCount,
          repeated_count: repeatedCount,
        },
      });
    } catch {}

    return batch;
  },

  async canReverseTransition(
    schoolId: string,
    targetYearId: string
  ): Promise<{
    canReverse: boolean;
    reason?: string;
    details: {
      attendanceRecords: number;
      paidInvoices: number;
      publishedExams: number;
    };
  }> {
    const attendance = storageService.getItem<StudentAttendance[]>(STORAGE_KEYS.ATTENDANCE, []);
    const invoices = storageService.getItem<StudentFeeInvoice[]>(STORAGE_KEYS.FEE_INVOICES, INITIAL_FEE_INVOICES);
    const exams = storageService.getItem<Exam[]>(STORAGE_KEYS.EXAMS, INITIAL_EXAMS);

    const targetAttendance = attendance.filter((a) => a.school_id === schoolId && a.academic_year_id === targetYearId);
    const targetPaidInvoices = invoices.filter(
      (i) => i.school_id === schoolId && i.academic_year_id === targetYearId && i.paid_amount > 0
    );
    const targetExams = exams.filter(
      (e) => e.school_id === schoolId && e.academic_year_id === targetYearId && e.status === 'published'
    );

    const details = {
      attendanceRecords: targetAttendance.length,
      paidInvoices: targetPaidInvoices.length,
      publishedExams: targetExams.length,
    };

    if (details.attendanceRecords > 0 || details.paidInvoices > 0 || details.publishedExams > 0) {
      const blockers: string[] = [];
      if (details.attendanceRecords > 0) blockers.push(`${details.attendanceRecords} attendance records marked`);
      if (details.paidInvoices > 0) blockers.push(`${details.paidInvoices} fee invoices paid/collected`);
      if (details.publishedExams > 0) blockers.push(`${details.publishedExams} published exam results`);

      return {
        canReverse: false,
        reason: `Transition cannot be reversed because operational records already exist in the target session (${blockers.join(
          ', '
        )}). Individual adjustments should be made directly on student profiles.`,
        details,
      };
    }

    return {
      canReverse: true,
      details,
    };
  },

  async reverseAcademicYearTransition(
    schoolId: string,
    batchId: string,
    actorName: string = 'School Admin',
    actorId?: string
  ): Promise<AcademicYearTransitionBatch> {
    const batches = storageService.getItem<AcademicYearTransitionBatch[]>(
      STORAGE_KEYS.TRANSITION_BATCHES,
      INITIAL_TRANSITION_BATCHES
    );
    const batchIndex = batches.findIndex((b) => b.id === batchId && b.school_id === schoolId);
    if (batchIndex === -1) throw new Error('Transition batch not found');

    const batch = batches[batchIndex];
    if (batch.status === 'reversed') throw new Error('This transition has already been reversed.');

    const check = await this.canReverseTransition(schoolId, batch.target_academic_year_id);
    if (!check.canReverse) {
      throw new Error(check.reason || 'Operational records exist. Cannot reverse transition.');
    }

    const students = storageService.getItem<Student[]>(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS);

    for (const d of batch.decisions) {
      const studentIndex = students.findIndex((s) => s.id === d.student_id);
      if (studentIndex === -1) continue;

      const student = { ...students[studentIndex] };
      // Remove newly created enrollment
      if (d.new_enrollment_id) {
        student.enrollments = (student.enrollments || []).filter((e) => e.id !== d.new_enrollment_id);
      }
      // Revert current_enrollment to previous
      if (student.enrollments && student.enrollments.length > 0) {
        const prev =
          student.enrollments.find((e) => e.id === d.previous_enrollment_id) ||
          student.enrollments[student.enrollments.length - 1];
        student.current_enrollment = prev;
      }
      student.status = 'active';
      students[studentIndex] = student;
    }

    storageService.setItem(STORAGE_KEYS.STUDENTS, students);

    batch.status = 'reversed';
    batch.reversed_at = new Date().toISOString();
    batch.reversed_by_name = actorName;
    batches[batchIndex] = batch;
    storageService.setItem(STORAGE_KEYS.TRANSITION_BATCHES, batches);

    try {
      authLogService.logEvent({
        school_id: schoolId,
        user_name: actorName,
        event_type: 'academic_session_transition_reversed',
        success: true,
        role: 'school_admin',
        details: {
          batch_id: batch.id,
          target_year: batch.target_academic_year_name,
          reversed_by: actorName,
        },
      });
    } catch {}

    return batch;
  },

  async getTransitionBatches(schoolId: string): Promise<AcademicYearTransitionBatch[]> {
    return storageService
      .getItem<AcademicYearTransitionBatch[]>(STORAGE_KEYS.TRANSITION_BATCHES, INITIAL_TRANSITION_BATCHES)
      .filter((b) => b.school_id === schoolId);
  },
};

// ============================================================================
// Access & Join Requests Service (Multi-Tenant Isolated)
// ============================================================================
export const accessRequestService = {
  async getAccessRequests(schoolId: string): Promise<SchoolAccessRequest[]> {
    const response = await fetch('/api/access-requests', { cache: 'no-store' });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Failed to load access requests');
    return (result.data || []).filter((r: any) => r.school_id === schoolId).map(mapBackendAccessRequest);
  },

  async getUserPendingRequest(email: string): Promise<SchoolAccessRequest | null> {
    const response = await fetch('/api/access-requests', { cache: 'no-store' });
    if (!response.ok) return null;
    const result = await response.json();
    const item = (result.data || []).find((r: any) => r.status === 'pending');
    return item ? mapBackendAccessRequest(item) : null;
  },

  async createAccessRequest(data: {
    userEmail: string;
    userName: string;
    schoolCode: string;
    phone: string;
    applicantNotes?: string;
  }): Promise<SchoolAccessRequest> {
    const schools = storageService.getItem<School[]>(STORAGE_KEYS.SCHOOLS, []);
    const targetSchool = schools.find((s) => s.code.toUpperCase() === data.schoolCode.trim().toUpperCase());
    if (!targetSchool) {
      throw new Error(`No school found with code "${data.schoolCode}". Please verify the code with your school.`);
    }

    const list = storageService.getItem<SchoolAccessRequest[]>(STORAGE_KEYS.ACCESS_REQUESTS, []);
    const cleanEmail = data.userEmail.toLowerCase().trim();

    // Check existing pending request
    const existing = list.find((r) => r.user_email.toLowerCase() === cleanEmail && r.status === 'pending');
    if (existing) {
      throw new Error('You already have a pending join request for a school. Please wait for the Principal to approve.');
    }

    const newReq: SchoolAccessRequest = {
      id: `req-${Date.now().toString().slice(-4)}`,
      user_email: cleanEmail,
      user_name: data.userName,
      school_id: targetSchool.id,
      school_name: targetSchool.name,
      school_code: targetSchool.code,
      phone: data.phone,
      applicant_notes: data.applicantNotes,
      status: 'pending',
      created_at: new Date().toISOString(),
    };

    list.unshift(newReq);
    storageService.setItem(STORAGE_KEYS.ACCESS_REQUESTS, list);
    return newReq;
  },

  async approveAccessRequest(
    requestId: string,
    assignedRole: 'teacher' | 'staff' | 'driver' | 'parent' | 'student',
    options?: {
      department?: string;
      designation?: string;
      staffType?: StaffType;
      permissions?: StaffPermission[];
      assignedPin?: string;
    },
    reviewedBy: string = 'School Admin'
  ): Promise<void> {
    const request = await fetch('/api/access-requests', { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'approve', requestId, role: assignedRole, designation: options?.designation, department: options?.department }) });
    const result = await request.json();
    if (!request.ok) throw new Error(result.error || 'Failed to approve request');
    return;
    /* Legacy offline demo implementation retained below but unreachable. */
    const list = storageService.getItem<SchoolAccessRequest[]>(STORAGE_KEYS.ACCESS_REQUESTS, []);
    const index = list.findIndex((r) => r.id === requestId);
    if (index === -1) throw new Error('Access request not found');

    const pinToSet = options?.assignedPin?.trim() || generateSecurePin();

    const req = list[index];
    req.status = 'approved';
    req.assigned_role = assignedRole;
    req.assigned_department = options?.department;
    req.assigned_designation = options?.designation;
    req.assigned_pin = pinToSet;
    req.reviewed_at = new Date().toISOString();
    req.reviewed_by = reviewedBy;
    list[index] = req;
    storageService.setItem(STORAGE_KEYS.ACCESS_REQUESTS, list);

    // Onboard into school records according to role assigned by Principal
    if (assignedRole === 'teacher') {
      const teachers = storageService.getItem<Teacher[]>(STORAGE_KEYS.TEACHERS, []);
      const teacherEmployeeNumber = await schoolIdentifierService.nextTeacherNumber(req.school_id, req.school_code);
      const newTeacher: Teacher = {
        id: `tch-${Date.now().toString().slice(-4)}`,
        school_id: req.school_id,
        first_name: req.user_name.split(' ')[0] || req.user_name,
        last_name: req.user_name.split(' ').slice(1).join(' ') || '',
        email: req.user_email,
        phone: req.phone || '',
        status: 'active',
        security_pin: pinToSet,
        pin_failed_attempts: 0,
        is_pin_locked: false,
        employee_number: teacherEmployeeNumber,
        joining_date: new Date().toISOString(),
        subjects: options?.department ? [options!.department!] : ['General'],
        designation: options?.designation || 'Teacher',
        created_at: new Date().toISOString(),
      };
      teachers.push(newTeacher);
      storageService.setItem(STORAGE_KEYS.TEACHERS, teachers);

      const schools = storageService.getItem<School[]>(STORAGE_KEYS.SCHOOLS, []);
      const schIdx = schools.findIndex((s) => s.id === req.school_id);
      if (schIdx !== -1) {
        schools[schIdx].teacher_count = (schools[schIdx].teacher_count || 0) + 1;
        storageService.setItem(STORAGE_KEYS.SCHOOLS, schools);
      }
    } else if (assignedRole === 'staff' || assignedRole === 'driver') {
      const staffList = storageService.getItem<Staff[]>(STORAGE_KEYS.STAFF, []);
      const staffEmployeeNumber = await schoolIdentifierService.nextStaffNumber(req.school_id, req.school_code);
      const newStaff: Staff = {
        id: `stf-${Date.now().toString().slice(-4)}`,
        school_id: req.school_id,
        first_name: req.user_name.split(' ')[0] || req.user_name,
        last_name: req.user_name.split(' ').slice(1).join(' ') || '',
        email: req.user_email,
        phone: req.phone || '',
        employee_number: staffEmployeeNumber,
        joining_date: new Date().toISOString(),
        staff_type: assignedRole === 'driver' ? 'driver' : options?.staffType || 'office_staff',
        status: 'active',
        security_pin: pinToSet,
        pin_failed_attempts: 0,
        is_pin_locked: false,
        portal_access: true,
        permissions:
          assignedRole === 'driver'
            ? ['record_pickup', 'manage_transport']
            : options?.permissions || ['view_students', 'view_fees'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      staffList.push(newStaff);
      storageService.setItem(STORAGE_KEYS.STAFF, staffList);

      const schools = storageService.getItem<School[]>(STORAGE_KEYS.SCHOOLS, []);
      const schIdx = schools.findIndex((s) => s.id === req.school_id);
      if (schIdx !== -1) {
        schools[schIdx].staff_count = (schools[schIdx].staff_count || 0) + 1;
        storageService.setItem(STORAGE_KEYS.SCHOOLS, schools);
      }
    }

    // Also insert a Profile for this user
    const profiles = storageService.getItem<Profile[]>(STORAGE_KEYS.PROFILES, []);
    profiles.push({
      id: `prof-${Date.now().toString().slice(-4)}`,
      school_id: req.school_id,
      role: assignedRole,
      display_name: req.user_name,
      email: req.user_email,
      phone: req.phone,
      security_pin: pinToSet,
      pin_failed_attempts: 0,
      is_pin_locked: false,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    storageService.setItem(STORAGE_KEYS.PROFILES, profiles);
  },

  async rejectAccessRequest(
    requestId: string,
    reason: string,
    reviewedBy: string = 'School Admin'
  ): Promise<void> {
    const response = await fetch('/api/access-requests', { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: reason === 'Cancelled by applicant' ? 'cancel' : 'reject', requestId, reason }) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Failed to update request');
    return;
    /* Legacy offline demo implementation retained below but unreachable. */
    const list = storageService.getItem<SchoolAccessRequest[]>(STORAGE_KEYS.ACCESS_REQUESTS, []);
    const index = list.findIndex((r) => r.id === requestId);
    if (index === -1) throw new Error('Access request not found');
    list[index].status = 'rejected';
    list[index].rejection_reason = reason;
    list[index].reviewed_at = new Date().toISOString();
    list[index].reviewed_by = reviewedBy;
    storageService.setItem(STORAGE_KEYS.ACCESS_REQUESTS, list);
  },
};

function mapBackendAccessRequest(r: any): SchoolAccessRequest {
  return { id: r.id, user_email: r.profiles?.email || '', user_name: r.applicant_name || r.profiles?.display_name || '', school_id: r.school_id, school_name: r.schools?.name || '', school_code: r.schools?.code || '', phone: r.phone, applicant_notes: r.applicant_notes, assigned_role: r.assigned_role, assigned_designation: r.assigned_designation, assigned_department: r.assigned_department, status: r.status, rejection_reason: r.rejection_reason, created_at: r.requested_at, reviewed_at: r.reviewed_at, reviewed_by: r.reviewed_by };
}

// ============================================================================
// Universal 30-Day Recycle Bin & Grace Period Service (No Force Delete)
// ============================================================================
export const recycleBinService = {
  async getBinItems(schoolId?: string): Promise<RecycleBinItem[]> {
    let list = storageService.getItem<RecycleBinItem[]>(STORAGE_KEYS.RECYCLE_BIN, []);
    const now = new Date();

    // Auto-purge any items strictly after 30 days
    let hasPurges = false;
    list = list.map((item) => {
      if (item.status === 'in_bin' && new Date(item.permanent_purge_at) <= now) {
        hasPurges = true;
        return { ...item, status: 'purged' as const };
      }
      return item;
    });

    if (hasPurges) {
      storageService.setItem(STORAGE_KEYS.RECYCLE_BIN, list);
    }

    const activeInBin = list.filter((item) => item.status === 'in_bin');
    if (!schoolId) return activeInBin;
    return activeInBin.filter((item) => item.school_id === schoolId || !item.school_id);
  },

  async moveToBin(params: {
    schoolId?: string;
    schoolName?: string;
    entityType: RecycleBinItem['entity_type'];
    entityId: string;
    entityName: string;
    entityDetails: string;
    originalData: any;
    deletedByName: string;
    deletedByRole: UserRole;
  }): Promise<RecycleBinItem> {
    const list = storageService.getItem<RecycleBinItem[]>(STORAGE_KEYS.RECYCLE_BIN, []);
    const deletedAt = new Date();
    const purgeAt = new Date(deletedAt.getTime() + 30 * 24 * 60 * 60 * 1000); // Mandatory 30 days

    const binItem: RecycleBinItem = {
      id: `bin-${Date.now().toString().slice(-4)}`,
      school_id: params.schoolId,
      school_name: params.schoolName,
      entity_type: params.entityType,
      entity_id: params.entityId,
      entity_name: params.entityName,
      entity_details: params.entityDetails,
      original_data: params.originalData,
      deleted_by_name: params.deletedByName,
      deleted_by_role: params.deletedByRole,
      deleted_at: deletedAt.toISOString(),
      permanent_purge_at: purgeAt.toISOString(),
      status: 'in_bin',
    };

    list.unshift(binItem);
    storageService.setItem(STORAGE_KEYS.RECYCLE_BIN, list);

    try {
      authLogService.logEvent({
        school_id: params.schoolId,
        school_name: params.schoolName,
        event_type: 'entity_moved_to_recycle_bin',
        success: true,
        role: params.deletedByRole,
        user_name: params.deletedByName,
        details: {
          entity_type: params.entityType,
          entity_name: params.entityName,
          permanent_purge_at: purgeAt.toISOString(),
        },
      });
    } catch {}

    return binItem;
  },

  async restoreItem(binItemId: string, restoredByName: string): Promise<RecycleBinItem> {
    const list = storageService.getItem<RecycleBinItem[]>(STORAGE_KEYS.RECYCLE_BIN, []);
    const index = list.findIndex((i) => i.id === binItemId);
    if (index === -1) throw new Error('Recycle Bin item not found');

    const item = list[index];
    if (item.status !== 'in_bin') {
      throw new Error(`This item is already ${item.status}.`);
    }

    item.status = 'restored';
    item.restored_at = new Date().toISOString();
    item.restored_by = restoredByName;
    list[index] = item;
    storageService.setItem(STORAGE_KEYS.RECYCLE_BIN, list);

    // Restore to original storage table
    const data = item.original_data;
    if (item.entity_type === 'teacher') {
      const teachers = storageService.getItem<Teacher[]>(STORAGE_KEYS.TEACHERS, INITIAL_TEACHERS);
      if (!teachers.some((t) => t.id === data.id)) {
        teachers.push({ ...data, status: 'active' });
        storageService.setItem(STORAGE_KEYS.TEACHERS, teachers);
      }
    } else if (item.entity_type === 'student') {
      const students = storageService.getItem<Student[]>(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS);
      if (!students.some((s) => s.id === data.id)) {
        students.push({ ...data, status: 'active' });
        storageService.setItem(STORAGE_KEYS.STUDENTS, students);
      }
    } else if (item.entity_type === 'staff') {
      const staffList = storageService.getItem<Staff[]>(STORAGE_KEYS.STAFF, INITIAL_STAFF);
      if (!staffList.some((s) => s.id === data.id)) {
        staffList.push({ ...data, status: 'active' });
        storageService.setItem(STORAGE_KEYS.STAFF, staffList);
      }
    } else if (item.entity_type === 'school') {
      const schools = storageService.getItem<School[]>(STORAGE_KEYS.SCHOOLS, []);
      const schIdx = schools.findIndex((s) => s.id === data.id);
      if (schIdx !== -1) {
        schools[schIdx].status = 'active';
        schools[schIdx].pending_deletion_until = undefined;
        storageService.setItem(STORAGE_KEYS.SCHOOLS, schools);
      }
    } else if (item.entity_type === 'room') {
      const rooms = storageService.getItem<SchoolRoom[]>(STORAGE_KEYS.ROOMS, []);
      if (!rooms.some((r) => r.id === data.id)) {
        rooms.push(data);
        storageService.setItem(STORAGE_KEYS.ROOMS, rooms);
      }
    } else if (item.entity_type === 'vehicle') {
      const vehicles = storageService.getItem<Vehicle[]>(STORAGE_KEYS.VEHICLES, []);
      if (!vehicles.some((v) => v.id === data.id)) {
        vehicles.push(data);
        storageService.setItem(STORAGE_KEYS.VEHICLES, vehicles);
      }
    } else if (item.entity_type === 'route') {
      const routes = storageService.getItem<TransportRoute[]>(STORAGE_KEYS.TRANSPORT_ROUTES, []);
      if (!routes.some((r) => r.id === data.id)) {
        routes.push(data);
        storageService.setItem(STORAGE_KEYS.TRANSPORT_ROUTES, routes);
      }
    } else if (item.entity_type === 'notice') {
      const notices = storageService.getItem<Notice[]>(STORAGE_KEYS.NOTICES, []);
      if (!notices.some((n) => n.id === data.id)) {
        notices.push(data);
        storageService.setItem(STORAGE_KEYS.NOTICES, notices);
      }
    } else if (item.entity_type === 'holiday') {
      const holidays = storageService.getItem<SchoolHoliday[]>(STORAGE_KEYS.HOLIDAYS, []);
      if (!holidays.some((h) => h.id === data.id)) {
        holidays.push(data);
        storageService.setItem(STORAGE_KEYS.HOLIDAYS, holidays);
      }
    }

    try {
      authLogService.logEvent({
        school_id: item.school_id,
        school_name: item.school_name,
        event_type: 'entity_restored_from_recycle_bin',
        success: true,
        user_name: restoredByName,
        details: {
          entity_type: item.entity_type,
          entity_name: item.entity_name,
        },
      });
    } catch {}

    return item;
  },
};

// ============================================================================
// 23. 5-DIGIT SECURITY PIN & ZERO-BYPASS LOCKOUT SERVICE
// ============================================================================

export const pinSecurityService = {
  /**
   * Retrieves the configured 5-digit PIN and lockout status for a given user persona
   */
  async getUserPinStatus(user: UserPersona): Promise<{
    hasPin: boolean;
    isLocked: boolean;
    failedAttempts: number;
    maxAttempts: number;
    pin?: string;
  }> {
    const maxAttempts = 5;

    // 0. Query Server API first
    if (typeof window !== 'undefined') {
      try {
        const res = await fetch('/api/auth/pin/status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user }),
        });
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            return json.data;
          }
        }
      } catch (e) {
        console.warn('Fallback to local PIN status:', e);
      }
    }

    // 1. Super Admin NEVER needs a PIN
    if (user.role === 'super_admin') {
      return { hasPin: false, isLocked: false, failedAttempts: 0, maxAttempts, pin: undefined };
    }

    // 2. School Admin (Principal) - PIN is configured on School entity by Super Admin (Optional/Required per school)
    if (user.role === 'school_admin' && user.school_id) {
      const schools = storageService.getItem<School[]>(STORAGE_KEYS.SCHOOLS, INITIAL_SCHOOLS);
      const school = schools.find((s) => s.id === user.school_id);
      const rawPin = school?.admin_pin?.trim();
      const hasPin = Boolean(rawPin && rawPin.length === 5);
      const failed = school?.admin_pin_failed_attempts || 0;
      const isLocked = school?.is_admin_pin_locked || false;
      return { hasPin, isLocked, failedAttempts: failed, maxAttempts, pin: hasPin ? rawPin : undefined };
    }

    // 3. Teacher - PIN is completely optional, configured by School Admin
    if (user.role === 'teacher' && (user.teacher_id || user.id)) {
      const teachers = storageService.getItem<Teacher[]>(STORAGE_KEYS.TEACHERS, INITIAL_TEACHERS);
      const tch = teachers.find((t) => t.id === user.teacher_id || t.id === user.id || t.email === user.email);
      const rawPin = tch?.security_pin?.trim();
      const hasPin = Boolean(rawPin && rawPin.length === 5);
      const failed = tch?.pin_failed_attempts || 0;
      const isLocked = tch?.is_pin_locked || false;
      return { hasPin, isLocked, failedAttempts: failed, maxAttempts, pin: hasPin ? rawPin : undefined };
    }

    // 4. Staff / Driver / Receptionist - PIN is completely optional, configured by School Admin
    if (['staff', 'driver'].includes(user.role)) {
      const staffList = storageService.getItem<Staff[]>(STORAGE_KEYS.STAFF, INITIAL_STAFF);
      const stf = staffList.find((s) => s.id === user.staff_id || s.id === user.id || s.email === user.email);
      const rawPin = stf?.security_pin?.trim();
      const hasPin = Boolean(rawPin && rawPin.length === 5);
      const failed = stf?.pin_failed_attempts || 0;
      const isLocked = stf?.is_pin_locked || false;
      return { hasPin, isLocked, failedAttempts: failed, maxAttempts, pin: hasPin ? rawPin : undefined };
    }

    // 5. Default profile lookup (Optional)
    const profiles = storageService.getItem<Profile[]>(STORAGE_KEYS.PROFILES, []);
    const prof = profiles.find((p) => p.email === user.email || p.id === user.id);
    const rawPin = prof?.security_pin?.trim();
    const hasPin = Boolean(rawPin && rawPin.length === 5);
    const failed = prof?.pin_failed_attempts || 0;
    const isLocked = prof?.is_pin_locked || false;
    return { hasPin, isLocked, failedAttempts: failed, maxAttempts, pin: hasPin ? rawPin : undefined };
  },

  /**
   * Verifies 5-digit PIN. Tracks failed attempts and locks out account on 5th failure.
   */
  async verifyPin(
    user: UserPersona,
    enteredPin: string
  ): Promise<{
    success: boolean;
    isLocked: boolean;
    remainingAttempts: number;
    error?: string;
  }> {
    // 0. Query Server API first
    if (typeof window !== 'undefined') {
      try {
        const res = await fetch('/api/auth/pin/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user, pin: enteredPin }),
        });
        if (res.ok) {
          const json = await res.json();
          return json;
        }
      } catch (e) {
        console.warn('Fallback to local PIN verify:', e);
      }
    }

    const status = await this.getUserPinStatus(user);
    const maxAttempts = 5;

    // If user has no PIN configured (e.g. Super Admin or optional PIN not set), auto-succeed
    if (!status.hasPin) {
      return { success: true, isLocked: false, remainingAttempts: maxAttempts };
    }

    if (status.isLocked) {
      return {
        success: false,
        isLocked: true,
        remainingAttempts: 0,
        error:
          user.role === 'school_admin'
            ? 'Account Locked: 5 failed PIN attempts exceeded. Please contact Super Admin to unlock your institution account.'
            : 'Account Locked: 5 failed PIN attempts exceeded. Please contact your School Principal to unlock your portal.',
      };
    }

    // Clean comparison
    const targetPin = status.pin || '';
    const isMatch = enteredPin.trim() === targetPin.trim();

    if (isMatch) {
      // Reset failed attempts upon successful entry
      await this.resetFailedAttempts(user);
      try {
        authLogService.logEvent({
          school_id: user.school_id,
          school_name: user.school_name,
          event_type: 'pin_verification_success',
          success: true,
          role: user.role,
          user_name: user.name,
        });
      } catch {}
      return { success: true, isLocked: false, remainingAttempts: maxAttempts };
    }

    // Increment failed attempts
    const newFailedCount = status.failedAttempts + 1;
    const shouldLock = newFailedCount >= maxAttempts;

    await this.setFailedAttempts(user, newFailedCount, shouldLock);

    try {
      authLogService.logEvent({
        school_id: user.school_id,
        school_name: user.school_name,
        event_type: shouldLock ? 'pin_account_locked' : 'pin_verification_failed',
        success: false,
        role: user.role,
        user_name: user.name,
        details: { attempt: newFailedCount, maxAttempts, locked: shouldLock },
      });
    } catch {}

    if (shouldLock) {
      return {
        success: false,
        isLocked: true,
        remainingAttempts: 0,
        error:
          user.role === 'school_admin'
            ? 'Security Lockout: 5 failed attempts reached. Please contact Super Admin (pay.laxmikant@gmail.com) to unlock your account.'
            : 'Security Lockout: 5 failed attempts reached. Please contact your School Principal to unlock your account.',
      };
    }

    const remaining = maxAttempts - newFailedCount;
    return {
      success: false,
      isLocked: false,
      remainingAttempts: remaining,
      error: `Incorrect 5-digit PIN. ${remaining} attempt${remaining > 1 ? 's' : ''} remaining before security lockout.`,
    };
  },

  /**
   * Unlocks account and resets or clears PIN (Called by Super Admin for Principal, or Principal for Teachers/Staff)
   */
  async unlockAndResetPin(params: {
    targetType: 'school_admin' | 'teacher' | 'staff' | 'profile';
    targetId: string;
    newPin?: string; // Empty keeps the current PIN and only unlocks
    removePin?: boolean;
    unlockedByName?: string;
  }): Promise<void> {
    const pinToSet = params.newPin?.trim() || undefined;

    if (pinToSet && !/^\d{5}$/.test(pinToSet)) {
      throw new Error('Security PIN must be exactly 5 numeric digits (0-9).');
    }

    // 0. Post to Server API first
    if (typeof window !== 'undefined') {
      let res: Response | null = null;
      try {
        res = await fetch('/api/auth/pin/reset', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...params, newPin: pinToSet }),
        });
      } catch (e) {
        console.warn('Fallback to local PIN reset:', e);
      }
      if (res && [400, 401, 403].includes(res.status)) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || 'You are not allowed to change this PIN.');
      }
    }

    const changesPin = Boolean(params.removePin || pinToSet);
    const localPin = params.removePin ? undefined : pinToSet;

    if (params.targetType === 'school_admin') {
      const schools = storageService.getItem<School[]>(STORAGE_KEYS.SCHOOLS, INITIAL_SCHOOLS);
      const idx = schools.findIndex((s) => s.id === params.targetId);
      if (idx !== -1) {
        if (changesPin) schools[idx].admin_pin = localPin;
        schools[idx].admin_pin_failed_attempts = 0;
        schools[idx].is_admin_pin_locked = false;
        storageService.setItem(STORAGE_KEYS.SCHOOLS, schools);
      }
    } else if (params.targetType === 'teacher') {
      const teachers = storageService.getItem<Teacher[]>(STORAGE_KEYS.TEACHERS, INITIAL_TEACHERS);
      const idx = teachers.findIndex((t) => t.id === params.targetId);
      if (idx !== -1) {
        if (changesPin) teachers[idx].security_pin = localPin;
        teachers[idx].pin_failed_attempts = 0;
        teachers[idx].is_pin_locked = false;
        storageService.setItem(STORAGE_KEYS.TEACHERS, teachers);
      }
    } else if (params.targetType === 'staff') {
      const staffList = storageService.getItem<Staff[]>(STORAGE_KEYS.STAFF, INITIAL_STAFF);
      const idx = staffList.findIndex((s) => s.id === params.targetId);
      if (idx !== -1) {
        if (changesPin) staffList[idx].security_pin = localPin;
        staffList[idx].pin_failed_attempts = 0;
        staffList[idx].is_pin_locked = false;
        storageService.setItem(STORAGE_KEYS.STAFF, staffList);
      }
    }

    // Also update profile record
    const profiles = storageService.getItem<Profile[]>(STORAGE_KEYS.PROFILES, []);
    const pIdx = profiles.findIndex((p) => p.id === params.targetId || p.email === params.targetId);
    if (pIdx !== -1) {
      if (changesPin) profiles[pIdx].security_pin = localPin;
      profiles[pIdx].pin_failed_attempts = 0;
      profiles[pIdx].is_pin_locked = false;
      storageService.setItem(STORAGE_KEYS.PROFILES, profiles);
    }

    try {
      authLogService.logEvent({
        event_type: 'pin_account_unlocked',
        success: true,
        user_name: params.unlockedByName || 'Administrator',
        details: { targetType: params.targetType, targetId: params.targetId },
      });
    } catch {}
  },

  async resetFailedAttempts(user: UserPersona): Promise<void> {
    if (user.role === 'super_admin') {
      storageService.setItem('super_admin_pin_failed', 0);
      storageService.setItem('super_admin_pin_locked', false);
    } else if (user.role === 'school_admin' && user.school_id) {
      const schools = storageService.getItem<School[]>(STORAGE_KEYS.SCHOOLS, INITIAL_SCHOOLS);
      const idx = schools.findIndex((s) => s.id === user.school_id);
      if (idx !== -1) {
        schools[idx].admin_pin_failed_attempts = 0;
        schools[idx].is_admin_pin_locked = false;
        storageService.setItem(STORAGE_KEYS.SCHOOLS, schools);
      }
    } else if (user.role === 'teacher') {
      const teachers = storageService.getItem<Teacher[]>(STORAGE_KEYS.TEACHERS, INITIAL_TEACHERS);
      const idx = teachers.findIndex((t) => t.id === user.teacher_id || t.email === user.email);
      if (idx !== -1) {
        teachers[idx].pin_failed_attempts = 0;
        teachers[idx].is_pin_locked = false;
        storageService.setItem(STORAGE_KEYS.TEACHERS, teachers);
      }
    } else if (['staff', 'driver'].includes(user.role)) {
      const staffList = storageService.getItem<Staff[]>(STORAGE_KEYS.STAFF, INITIAL_STAFF);
      const idx = staffList.findIndex((s) => s.id === user.staff_id || s.email === user.email);
      if (idx !== -1) {
        staffList[idx].pin_failed_attempts = 0;
        staffList[idx].is_pin_locked = false;
        storageService.setItem(STORAGE_KEYS.STAFF, staffList);
      }
    }
  },

  async setFailedAttempts(user: UserPersona, count: number, isLocked: boolean): Promise<void> {
    if (user.role === 'super_admin') {
      storageService.setItem('super_admin_pin_failed', count);
      storageService.setItem('super_admin_pin_locked', isLocked);
    } else if (user.role === 'school_admin' && user.school_id) {
      const schools = storageService.getItem<School[]>(STORAGE_KEYS.SCHOOLS, INITIAL_SCHOOLS);
      const idx = schools.findIndex((s) => s.id === user.school_id);
      if (idx !== -1) {
        schools[idx].admin_pin_failed_attempts = count;
        schools[idx].is_admin_pin_locked = isLocked;
        storageService.setItem(STORAGE_KEYS.SCHOOLS, schools);
      }
    } else if (user.role === 'teacher') {
      const teachers = storageService.getItem<Teacher[]>(STORAGE_KEYS.TEACHERS, INITIAL_TEACHERS);
      const idx = teachers.findIndex((t) => t.id === user.teacher_id || t.email === user.email);
      if (idx !== -1) {
        teachers[idx].pin_failed_attempts = count;
        teachers[idx].is_pin_locked = isLocked;
        storageService.setItem(STORAGE_KEYS.TEACHERS, teachers);
      }
    } else if (['staff', 'driver'].includes(user.role)) {
      const staffList = storageService.getItem<Staff[]>(STORAGE_KEYS.STAFF, INITIAL_STAFF);
      const idx = staffList.findIndex((s) => s.id === user.staff_id || s.email === user.email);
      if (idx !== -1) {
        staffList[idx].pin_failed_attempts = count;
        staffList[idx].is_pin_locked = isLocked;
        storageService.setItem(STORAGE_KEYS.STAFF, staffList);
      }
    }
  },
};

// ============================================================================
// 24. USER PASSWORD MANAGEMENT SERVICE
// ============================================================================

export const userPasswordService = {
  /**
   * Get storage map of all custom user passwords: Record<string, string>
   * Key can be user ID or user email/login_id
   */
  getPasswordsMap(): Record<string, string> {
    return storageService.getItem<Record<string, string>>(STORAGE_KEYS.USER_PASSWORDS, {});
  },

  /**
   * Check if a user currently has a password assigned
   */
  async getUserPasswordStatus(user: UserPersona): Promise<{ hasPassword: boolean }> {
    if (!user) return { hasPassword: false };
    const map = this.getPasswordsMap();
    const userKey = user.id || '';
    const emailKey = user.email?.toLowerCase() || '';
    const loginKey = user.login_id?.toLowerCase() || '';

    const storedPass = map[userKey] || (emailKey && map[emailKey]) || (loginKey && map[loginKey]);
    if (storedPass) {
      return { hasPassword: true };
    }

    // Default seeded platform demo accounts with predefined passwords
    const isSeededDemoUser =
      emailKey === 'superadmin@platform.erp' ||
      emailKey === 'superadmin@schoolerp.com' ||
      emailKey === 'admin@delhipublic.edu.in' ||
      loginKey === 'jdps-103' ||
      loginKey === 'jdps-101';

    if (isSeededDemoUser) {
      return { hasPassword: true };
    }

    // New Google OAuth users and accounts without custom passwords
    return { hasPassword: false };
  },

  /**
   * Set a new password for a user who does not have one yet
   */
  async setUserPassword(user: UserPersona, newPassword: string): Promise<{ success: boolean; error?: string }> {
    if (!user) return { success: false, error: 'User session not found.' };
    const cleanPass = newPassword.trim();
    if (cleanPass.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters long.' };
    }

    const map = this.getPasswordsMap();
    if (user.id) map[user.id] = cleanPass;
    const alternateUserId = user.id?.startsWith('usr-') ? user.id.slice(4) : user.id ? `usr-${user.id}` : '';
    if (alternateUserId) map[alternateUserId] = cleanPass;
    if (user.email) map[user.email.toLowerCase()] = cleanPass;
    if (user.login_id) map[user.login_id.toLowerCase()] = cleanPass;

    const isSuper =
      user.role === 'super_admin' ||
      user.email?.toLowerCase() === 'pay.laxmikant@gmail.com' ||
      user.email?.toLowerCase() === 'superadmin@platform.erp' ||
      user.email?.toLowerCase() === 'superadmin@schoolerp.com';

    if (isSuper) {
      map['superadmin'] = cleanPass;
      map['admin'] = cleanPass;
      map['usr-super-01'] = cleanPass;
      map['pay.laxmikant@gmail.com'] = cleanPass;
      map['superadmin@platform.erp'] = cleanPass;
      map['superadmin@schoolerp.com'] = cleanPass;
    }

    if (isDemoEnvironment()) storageService.setItem(STORAGE_KEYS.USER_PASSWORDS, map);

    // Sync to server-side persistent store (.data/passwords.json)
    try {
      if (typeof window !== 'undefined') {
        const res = await fetch('/api/auth/password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            identifier: alternateUserId,
            email: user.email,
            loginId: user.login_id,
            role: user.role,
            password: cleanPass,
            isSuperAdmin: isSuper,
          }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          return { success: false, error: data.error || 'Could not save your password. Please try again.' };
        }
      }
    } catch (e) {
      console.warn('Server password synchronization notice:', e);
      if (!isDemoEnvironment()) return { success: false, error: 'Could not reach the server to save your password.' };
    }

    return { success: true };
  },

  /**
   * Change existing password by verifying current password first
   */
  async changeUserPassword(
    user: UserPersona,
    currentPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> {
    if (!user) return { success: false, error: 'User session not found.' };

    const isCurrentValid = await this.verifyUserPassword(user, currentPassword);
    if (!isCurrentValid) {
      return { success: false, error: 'Current password is incorrect. Please try again.' };
    }

    const cleanNewPass = newPassword.trim();
    if (cleanNewPass.length < 6) {
      return { success: false, error: 'New password must be at least 6 characters long.' };
    }

    if (currentPassword === cleanNewPass) {
      return { success: false, error: 'New password must be different from your current password.' };
    }

    return this.setUserPassword(user, cleanNewPass);
  },

  /**
   * Verify password for authentication or password changes
   */
  async verifyUserPassword(user: UserPersona | string, passwordAttempt: string): Promise<boolean> {
    const attempt = String(passwordAttempt || '').trim();
    if (!attempt) return false;

    const map = this.getPasswordsMap();
    let userKey = '';
    let emailKey = '';
    let loginKey = '';

    if (typeof user === 'string') {
      userKey = user;
      emailKey = user.toLowerCase();
      loginKey = user.toLowerCase();
    } else {
      userKey = user.id || '';
      emailKey = user.email?.toLowerCase() || '';
      loginKey = user.login_id?.toLowerCase() || '';
    }

    const demo = isDemoEnvironment();

    // 1. Local browser store (demo mode only; production verifies on the server)
    const customPass = demo ? map[userKey] || (emailKey && map[emailKey]) || (loginKey && map[loginKey]) : undefined;
    if (customPass && customPass === attempt) return true;
    if (customPass) return false;

    // 2. Check server-side password API
    try {
      if (typeof window !== 'undefined') {
        const res = await fetch('/api/auth/password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'verify',
            identifier: userKey || loginKey || emailKey,
            userId: userKey,
            email: emailKey,
            loginId: loginKey,
            role: typeof user === 'string' ? undefined : user.role,
            password: attempt,
          }),
        });
        if (res.status === 429) {
          const data = await res.json().catch(() => ({}));
          throw new RateLimitError(data.error || 'Too many attempts. Please try again later.');
        }
        if (res.ok) {
          const data = await res.json();
          if (data.valid) return true;
        }
      }
    } catch (e) {
      if (e instanceof RateLimitError) throw e;
      console.warn('Server password verification check warning:', e);
    }

    // 3. Default student fallback password for newly registered or demo students
    const isStudent = typeof user !== 'string' && user.role === 'student';
    if (demo && isStudent && (attempt === 'student123' || attempt === 'Student@123' || attempt === 'password' || attempt === '123456')) {
      return true;
    }

    // 4. Default seeded platform demo accounts with predefined fallback passwords
    const isSeededDemoUser =
      emailKey === 'superadmin@platform.erp' ||
      emailKey === 'superadmin@schoolerp.com' ||
      emailKey === 'pay.laxmikant@gmail.com' ||
      emailKey === 'admin@delhipublic.edu.in' ||
      loginKey === 'superadmin' ||
      loginKey === 'admin' ||
      loginKey === 'jdps-103' ||
      loginKey === 'jdps-101';

    if (demo && isSeededDemoUser) {
      if (attempt === 'password' || attempt === 'admin123' || attempt === 'student123' || attempt === 'demo' || attempt === '123456') {
        return true;
      }
    }

    return false;
  },
};

// ============================================================================
// 25. PASSKEY & WEBAUTHN FIDO2 BIOMETRIC AUTHENTICATION SERVICE
// ============================================================================

export interface RegisteredPasskey {
  id: string;
  rawId: string;
  name: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  userLoginId?: string;
  schoolId?: string;
  schoolName?: string;
  schoolCode?: string;
  role: string;
  created_at: string;
  last_used_at?: string;
}

export const passkeyService = {
  isSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return Boolean(
      window.PublicKeyCredential &&
      navigator.credentials &&
      typeof navigator.credentials.create === 'function' &&
      typeof navigator.credentials.get === 'function'
    );
  },

  getPasskeys(): RegisteredPasskey[] {
    return storageService.getItem<RegisteredPasskey[]>(STORAGE_KEYS.PASSKEYS, []);
  },

  getUserPasskeys(userId: string): RegisteredPasskey[] {
    const list = this.getPasskeys();
    return list.filter((p) => p.userId === userId);
  },

  async registerPasskey(user: UserPersona, deviceName?: string): Promise<{ success: boolean; passkey?: RegisteredPasskey; error?: string }> {
    if (!this.isSupported()) {
      return { success: false, error: 'Passkeys and WebAuthn are not supported on this browser or device.' };
    }

    try {
      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);
      const userIdBytes = new TextEncoder().encode(user.id);

      const credential = (await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: {
            name: 'GI Campus',
            id: window.location.hostname === 'localhost' ? 'localhost' : window.location.hostname,
          },
          user: {
            id: userIdBytes,
            name: user.email || user.login_id || user.id,
            displayName: user.name,
          },
          pubKeyCredParams: [
            { type: 'public-key', alg: -7 },
            { type: 'public-key', alg: -257 },
          ],
          authenticatorSelection: {
            userVerification: 'preferred',
            residentKey: 'preferred',
          },
          timeout: 60000,
        },
      })) as PublicKeyCredential | null;

      if (!credential) {
        return { success: false, error: 'Passkey registration was cancelled.' };
      }

      const passkeyId = credential.id;
      const passkeyName =
        deviceName ||
        (navigator.userAgent.includes('Mac')
          ? 'MacBook Touch ID'
          : navigator.userAgent.includes('iPhone') || navigator.userAgent.includes('iPad')
          ? 'Apple Face / Touch ID'
          : navigator.userAgent.includes('Windows')
          ? 'Windows Hello'
          : navigator.userAgent.includes('Android')
          ? 'Android Biometrics'
          : 'Security Key / Biometrics');

      const newPasskey: RegisteredPasskey = {
        id: passkeyId,
        rawId: passkeyId,
        name: passkeyName,
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        userLoginId: user.login_id,
        schoolId: user.school_id,
        schoolName: user.school_name,
        schoolCode: user.school_code,
        role: user.role,
        created_at: new Date().toISOString(),
      };

      const existing = this.getPasskeys();
      const updated = [newPasskey, ...existing.filter((p) => p.id !== passkeyId)];
      storageService.setItem(STORAGE_KEYS.PASSKEYS, updated);

      return { success: true, passkey: newPasskey };
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        return { success: false, error: 'Passkey registration was cancelled.' };
      }
      return { success: false, error: err?.message || 'Failed to create passkey.' };
    }
  },

  async authenticateWithPasskey(options?: {
    signal?: AbortSignal;
    mediation?: CredentialMediationRequirement;
  }): Promise<{ success: boolean; user?: UserPersona; redirectUrl?: string; error?: string }> {
    if (!this.isSupported()) {
      return { success: false, error: 'Passkeys and WebAuthn are not supported on this browser or device.' };
    }

    try {
      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);

      const passkeys = this.getPasskeys();

      const getOptions: CredentialRequestOptions = {
        publicKey: {
          challenge,
          timeout: 60000,
          userVerification: 'preferred',
          rpId: window.location.hostname === 'localhost' ? 'localhost' : window.location.hostname,
        },
      };

      if (options?.mediation) {
        getOptions.mediation = options.mediation;
      }
      if (options?.signal) {
        getOptions.signal = options.signal;
      }

      const assertion = (await navigator.credentials.get(getOptions)) as PublicKeyCredential | null;

      if (!assertion) {
        return { success: false, error: 'Passkey verification was cancelled.' };
      }

      // Match credential against stored registered passkeys
      const matched = passkeys.find((p) => p.id === assertion.id) || passkeys[0];
      const schools = storageService.getItem<School[]>(STORAGE_KEYS.SCHOOLS, INITIAL_SCHOOLS);
      const fallbackSchool = schools[0];

      if (matched) {
        matched.last_used_at = new Date().toISOString();
        storageService.setItem(STORAGE_KEYS.PASSKEYS, passkeys);

        const authenticatedUser: UserPersona = {
          id: matched.userId || `usr-passkey-${assertion.id.slice(0, 8)}`,
          name: matched.userName || (matched.role === 'super_admin' ? 'Super Admin' : 'School Administrator'),
          email: matched.userEmail || (matched.role === 'super_admin' ? 'pay.laxmikant@gmail.com' : 'admin@school.edu.in'),
          role: (matched.role || 'school_admin') as any,
          school_id: matched.schoolId || fallbackSchool?.id,
          school_name: matched.schoolName || fallbackSchool?.name,
          school_code: matched.schoolCode || fallbackSchool?.code,
          login_id: matched.userLoginId,
        };

        const redirectUrl =
          authenticatedUser.role === 'super_admin'
            ? '/super-admin'
            : authenticatedUser.role === 'teacher'
            ? '/teacher'
            : authenticatedUser.role === 'student'
            ? '/student'
            : authenticatedUser.role === 'parent'
            ? '/parent'
            : authenticatedUser.role === 'driver'
            ? '/driver'
            : authenticatedUser.role === 'staff'
            ? '/staff'
            : '/admin';

        return {
          success: true,
          user: authenticatedUser,
          redirectUrl,
        };
      }

      // Fallback if no matching record found in storage
      const fallbackUser: UserPersona = {
        id: `usr-passkey-${assertion.id.slice(0, 8)}`,
        name: 'School Administrator',
        email: 'admin@delhipublic.edu.in',
        role: 'school_admin',
        school_id: fallbackSchool?.id,
        school_name: fallbackSchool?.name,
        school_code: fallbackSchool?.code,
      };

      return {
        success: true,
        user: fallbackUser,
        redirectUrl: '/admin',
      };
    } catch (err: any) {
      if (err.name === 'NotAllowedError' || err.name === 'AbortError') {
        return { success: false, error: 'Passkey verification was cancelled.' };
      }
      return { success: false, error: err?.message || 'Passkey verification failed.' };
    }
  },

  deletePasskey(passkeyId: string): void {
    const list = this.getPasskeys();
    storageService.setItem(STORAGE_KEYS.PASSKEYS, list.filter((p) => p.id !== passkeyId));
  },
};

// ============================================================================
// CENTRALIZED EMAIL & SINGLE-ROLE IDENTITY VALIDATION SERVICE
// ============================================================================
export const emailValidationService = {
  validateGmailFormat(email: string): { isValid: boolean; error?: string } {
    if (!email || !email.trim()) {
      return { isValid: false, error: 'Email address is required.' };
    }
    const clean = email.trim().toLowerCase();
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(clean)) {
      return { isValid: false, error: 'Please enter a valid email format.' };
    }
    if (!clean.endsWith('@gmail.com')) {
      return {
        isValid: false,
        error: 'Only Google accounts ending with @gmail.com are permitted.',
      };
    }
    return { isValid: true };
  },

  async verifyEmailAvailability(
    email: string,
    options?: {
      excludeUserId?: string;
      excludeEmail?: string;
      excludeSchoolId?: string;
      targetSchoolId?: string;
      targetRole?: string;
    }
  ): Promise<{ isValid: boolean; isAvailable: boolean; error?: string }> {
    const formatCheck = this.validateGmailFormat(email);
    if (!formatCheck.isValid) {
      return { isValid: false, isAvailable: false, error: formatCheck.error };
    }

    const clean = email.trim().toLowerCase();

    // 0. Super Admin check
    if (['superadmin@platform.erp', 'superadmin@schoolerp.com', 'pay.laxmikant@gmail.com'].includes(clean)) {
      return {
        isValid: true,
        isAvailable: false,
        error: 'This email is reserved as Platform Super Administrator.',
      };
    }

    // 1. Check local storage conflicts
    const schools = storageService.getItem<School[]>(STORAGE_KEYS.SCHOOLS, INITIAL_SCHOOLS);
    const matchedSchool = schools.find(
      (s) =>
        (s.admin_email || '')
          .split(',')
          .map((e) => e.trim().toLowerCase())
          .includes(clean) && s.id !== options?.excludeSchoolId
    );
    if (matchedSchool) {
      return {
        isValid: true,
        isAvailable: false,
        error: 'Email already in use',
      };
    }

    const teachers = storageService.getItem<Teacher[]>(STORAGE_KEYS.TEACHERS, INITIAL_TEACHERS);
    const matchedTeacher = teachers.find(
      (t) => t.email.trim().toLowerCase() === clean && t.id !== options?.excludeUserId
    );
    if (matchedTeacher) {
      return {
        isValid: true,
        isAvailable: false,
        error: 'Email already in use',
      };
    }

    const staffList = storageService.getItem<Staff[]>(STORAGE_KEYS.STAFF, INITIAL_STAFF);
    const matchedStaff = staffList.find(
      (s) => s.email.trim().toLowerCase() === clean && s.id !== options?.excludeUserId
    );
    if (matchedStaff) {
      return {
        isValid: true,
        isAvailable: false,
        error: 'Email already in use',
      };
    }

    // 2. Call backend centralized email registry
    try {
      const response = await fetch('/api/auth/check-email', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          email: clean,
          excludeUserId: options?.excludeUserId,
          excludeEmail: options?.excludeEmail,
          excludeSchoolId: options?.excludeSchoolId,
          targetSchoolId: options?.targetSchoolId,
          targetRole: options?.targetRole,
        }),
      });
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          return {
            isValid: result.valid,
            isAvailable: result.available,
            error: result.error,
          };
        }
      }
    } catch {}

    return { isValid: true, isAvailable: true };
  },
};

// ============================================================================
// 41. FULL INSTITUTIONAL DATA BACKUP & EXPORT SERVICE
// ============================================================================

export interface SchoolBackupArchive {
  metadata: {
    export_version: string;
    exported_at: string;
    exported_by?: string;
    school_id: string;
    school_name: string;
    school_code: string;
    total_records_count: number;
    modules_included: string[];
  };
  school: School | null;
  academic_years: AcademicYear[];
  classes: SchoolClass[];
  sections: Section[];
  subjects: Subject[];
  rooms: SchoolRoom[];
  timetable: TimetableEntry[];
  students: Student[];
  teachers: Teacher[];
  staff: Staff[];
  transport_routes: TransportRoute[];
  transport_vehicles: Vehicle[];
  fee_structures: FeeStructure[];
  fee_invoices: StudentFeeInvoice[];
  payment_receipts: PaymentReceipt[];
  attendance_concerns: AttendanceConcern[];
  student_leaves: StudentLeave[];
  exams: Exam[];
  exam_results: ExamResult[];
  notices: Notice[];
  reception_visitors: any[];
  reception_inquiries: AdmissionEnquiry[];
  holidays: SchoolHoliday[];
  recycle_bin_items: RecycleBinItem[];
  auth_security_logs: AuthEvent[];
}

export const schoolExportService = {
  async exportFullSchoolData(schoolId: string, exportedBy = 'Administrator'): Promise<SchoolBackupArchive> {
    const school = (await schoolService.getSchoolById(schoolId)) || null;

    // Safely collect all data points across all modules
    const [
      academicYears,
      classes,
      sections,
      subjects,
      rooms,
      timetable,
      students,
      teachers,
      staffList,
      routes,
      vehicles,
      feeStructures,
      invoices,
      payments,
      concerns,
      leaves,
      exams,
      results,
      notices,
      visitors,
      inquiries,
      holidays,
      binItems,
      authEvents,
    ] = await Promise.all([
      academicYearService.getYears(schoolId).catch(() => []),
      academicService.getClasses(schoolId).catch(() => []),
      storageService.getItem<Section[]>(STORAGE_KEYS.SECTIONS, INITIAL_SECTIONS).filter((s) => s.school_id === schoolId),
      subjectService.getSubjects(schoolId).catch(() => []),
      roomService.getRooms(schoolId).catch(() => []),
      timetableService.getTimetable(schoolId).catch(() => []),
      studentService.getStudents(schoolId).catch(() => []),
      teacherService.getTeachers(schoolId).catch(() => []),
      staffService.getStaff(schoolId).catch(() => []),
      transportService.getRoutes(schoolId).catch(() => []),
      transportService.getVehicles(schoolId).catch(() => []),
      feeService.getFeeStructures(schoolId).catch(() => []),
      feeService.getInvoices(schoolId).catch(() => []),
      receiptService.getReceipts(schoolId).catch(() => []),
      insightService.getAttendanceConcerns(schoolId).catch(() => []),
      leaveService.getLeaves(schoolId).catch(() => []),
      examService.getExams(schoolId).catch(() => []),
      Promise.resolve(
        storageService.getItem<ExamResult[]>(STORAGE_KEYS.EXAM_RESULTS, INITIAL_EXAM_RESULTS)
      ),
      noticeService.getNotices(schoolId, { includeExpired: true }).catch(() => []),
      Promise.resolve([]),
      enquiryService.getEnquiries(schoolId).catch(() => []),
      holidayService.getHolidays(schoolId).catch(() => []),
      recycleBinService.getBinItems(schoolId).catch(() => []),
      authLogService.getEvents ? authLogService.getEvents({ schoolId }).catch(() => []) : [],
    ]);

    const totalCount =
      (students?.length || 0) +
      (teachers?.length || 0) +
      (staffList?.length || 0) +
      (classes?.length || 0) +
      (subjects?.length || 0) +
      (invoices?.length || 0) +
      (payments?.length || 0) +
      (exams?.length || 0) +
      (results?.length || 0) +
      (notices?.length || 0) +
      (visitors?.length || 0) +
      (inquiries?.length || 0) +
      (timetable?.length || 0);

    const archive: SchoolBackupArchive = {
      metadata: {
        export_version: '2.0-Enterprise',
        exported_at: new Date().toISOString(),
        exported_by: exportedBy,
        school_id: schoolId,
        school_name: school?.name || 'School',
        school_code: school?.code || 'SCH',
        total_records_count: totalCount,
        modules_included: [
          'Identity & School Config',
          'Academic Years & Classes',
          'Subjects & Timetable',
          'Students & Guardians',
          'Teachers & Staff',
          'Fee Structures & Invoices',
          'Payment Receipts',
          'Attendance & Leaves',
          'Exams & Marks Results',
          'Notices & Announcements',
          'Reception & Visitors',
          'Transport Routes & Vehicles',
          'Recycle Bin & Security Logs',
        ],
      },
      school,
      academic_years: academicYears || [],
      classes: classes || [],
      sections: sections || [],
      subjects: subjects || [],
      rooms: rooms || [],
      timetable: timetable || [],
      students: students || [],
      teachers: teachers || [],
      staff: staffList || [],
      transport_routes: routes || [],
      transport_vehicles: vehicles || [],
      fee_structures: feeStructures || [],
      fee_invoices: invoices || [],
      payment_receipts: payments || [],
      attendance_concerns: concerns || [],
      student_leaves: leaves || [],
      exams: exams || [],
      exam_results: results || [],
      notices: notices || [],
      reception_visitors: visitors || [],
      reception_inquiries: inquiries || [],
      holidays: holidays || [],
      recycle_bin_items: binItems || [],
      auth_security_logs: authEvents || [],
    };

    return archive;
  },

  async downloadSchoolBackup(
    schoolId: string,
    schoolName?: string,
    schoolCode?: string,
    exportedBy = 'Administrator'
  ): Promise<{ filename: string; totalRecords: number }> {
    const archive = await this.exportFullSchoolData(schoolId, exportedBy);
    const jsonString = JSON.stringify(archive, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });

    const code = (schoolCode || archive.metadata.school_code || 'SCH').toUpperCase();
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `SchoolBackup_${code}_${dateStr}.json`;

    if (typeof window !== 'undefined') {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }

    return {
      filename,
      totalRecords: archive.metadata.total_records_count,
    };
  },
};
