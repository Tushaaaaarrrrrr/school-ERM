import { feeInvoiceRow, displayFeeInvoice } from '@/lib/utils/fee-invoices';
import { reconcileChargePayments } from '@/lib/utils/charge-payments';
// ============================================================================
// Server Database Engine (Supabase PostgreSQL + Central Enterprise Store)
// ============================================================================

import { resolveTeacherAssignments, resolveEnrollmentClass } from '@/lib/utils/class-assignments';
import { escapeLikePattern } from '@/lib/utils/security';
import {
  School,
  Teacher,
  TeacherAssignment,
  Staff,
  Student,
  Profile,
  SchoolAccessRequest,
  SchoolHoliday,
  UserPersona,
  SchoolClass,
  Section,
  Subject,
  TimetableEntry,
  StudentAttendance,
  StudentFeeInvoice,
  TeacherPayment,
  EmployeePayment,
  RecycleBinItem,
  AuthEvent,
  TemporaryAssignment,
  EmployeeSalaryAdjustment,
  ParentProfile,
  ParentStudentLink,
  PaymentReceipt,
  StudentCharge,
  FeeStructure,
  FeeStructureVersion,
  BulkChargeBatch,
  AcademicYearTransitionBatch,
  StudentTransitionItem,
  TransitionSummaryBreakdown,
  AccountDeletionRequest,
  SchoolDeletionRequest,
} from '@/lib/types';
import {
  INITIAL_SCHOOLS,
  INITIAL_TEACHERS,
  INITIAL_STAFF,
  INITIAL_STUDENTS,
  INITIAL_CLASSES,
  INITIAL_SECTIONS,
  INITIAL_SUBJECTS,
  INITIAL_TIMETABLE,
  INITIAL_HOLIDAYS,
  INITIAL_ACADEMIC_YEARS,
  INITIAL_FEE_INVOICES,
  INITIAL_TEACHER_PAYMENTS,
  INITIAL_EMPLOYEE_PAYMENTS,
  INITIAL_TEMPORARY_ASSIGNMENTS,
  INITIAL_EMPLOYEE_SALARY_ADJUSTMENTS,
  INITIAL_PAYMENT_RECEIPTS,
  INITIAL_STUDENT_CHARGES,
  INITIAL_FEE_STRUCTURES,
  INITIAL_FEE_STRUCTURE_VERSIONS,
  INITIAL_BULK_CHARGE_BATCHES,
  INITIAL_TRANSITION_BATCHES,
  INITIAL_DELETION_REQUESTS,
  INITIAL_SCHOOL_DELETION_REQUESTS,
} from '@/lib/services/mock-data';
import { validateSchoolCodeFormat } from '@/lib/utils/school-code';
import { isSuperAdminEmail } from '@/lib/server/super-admin';
import { hashIfPlain, hashSecret, hasConfiguredPin, isHashedSecret, verifySecret } from '@/lib/server/secrets';
import { createClient } from '@supabase/supabase-js';

// Global singleton for server-side state persistence across all requests & instances
declare global {
  // eslint-disable-next-line no-var
  var __SERVER_DB__: {
    schools: School[];
    teachers: Teacher[];
    staff: Staff[];
    students: Student[];
    profiles: Profile[];
    classes: SchoolClass[];
    sections: Section[];
    subjects: Subject[];
    timetable: TimetableEntry[];
    attendance: StudentAttendance[];
    feeInvoices: StudentFeeInvoice[];
    paymentReceipts: PaymentReceipt[];
    studentCharges: StudentCharge[];
    teacherPayments: TeacherPayment[];
    employeePayments: EmployeePayment[];
    accessRequests: SchoolAccessRequest[];
    holidays: SchoolHoliday[];
    recycleBin: RecycleBinItem[];
    authEvents: AuthEvent[];
    temporaryAssignments: TemporaryAssignment[];
    salaryAdjustments: EmployeeSalaryAdjustment[];
    parents: ParentProfile[];
    parentLinks: ParentStudentLink[];
    feeStructures: FeeStructure[];
    feeStructureVersions: FeeStructureVersion[];
    bulkChargeBatches: BulkChargeBatch[];
    transitionBatches: AcademicYearTransitionBatch[];
    accountDeletionRequests: AccountDeletionRequest[];
    schoolDeletionRequests: SchoolDeletionRequest[];
    exams?: any[];
    examResults?: any[];
    notices?: any[];
  } | undefined;
}

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (
    supabaseUrl &&
    supabaseKey &&
    !supabaseUrl.includes('demo.supabase.co') &&
    !supabaseUrl.includes('your-project-id')
  ) {
    return createClient(supabaseUrl, supabaseKey);
  }
  return null;
}

function cleanAdminEmailsString(val?: string): string {
  if (!val) return '';
  return val
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
    .join(', ');
}

function withPinFlag<T>(record: T): T {
  if (!record || typeof record !== 'object') return record;
  const { security_pin, ...rest } = record as Record<string, any>;
  return { ...rest, has_pin: hasConfiguredPin(security_pin) } as T;
}

async function preparePinInput<T>(input: T): Promise<T> {
  const { has_pin: _hasPin, ...rest } = input as Record<string, any>;
  if (typeof rest.security_pin === 'string') {
    const clean = rest.security_pin.trim();
    rest.security_pin = clean ? await hashIfPlain(clean) : null;
  }
  return rest as T;
}

async function prepareSchoolSecretsInput<T>(input: T): Promise<T> {
  const { has_admin_pin: _hasPin, ...rest } = input as Record<string, any>;
  if (typeof rest.admin_pin === 'string') {
    const clean = rest.admin_pin.trim();
    rest.admin_pin = clean ? await hashIfPlain(clean) : null;
  }
  return rest as T;
}

function schoolDatabaseFields(school: Partial<School>) {
  return {
    ...(school.name !== undefined && { name: school.name }),
    ...(school.code !== undefined && { code: school.code.trim().toUpperCase() }),
    ...(school.email !== undefined && { email: school.email }),
    ...(school.admin_email !== undefined && { admin_email: cleanAdminEmailsString(school.admin_email) }),
    ...(school.admin_name !== undefined && { admin_name: school.admin_name }),
    ...(school.admin_pin !== undefined && { admin_pin: school.admin_pin }),
    ...(school.admin_pin_failed_attempts !== undefined && { admin_pin_failed_attempts: school.admin_pin_failed_attempts }),
    ...(school.is_admin_pin_locked !== undefined && { is_admin_pin_locked: school.is_admin_pin_locked }),
    ...(school.phone !== undefined && { phone: school.phone }),
    ...(school.school_contact_phone !== undefined && { school_contact_phone: school.school_contact_phone }),
    ...(school.school_contact_alternate !== undefined && { school_contact_alternate: school.school_contact_alternate }),
    ...(school.receipt_email !== undefined && { receipt_email: school.receipt_email }),
    ...(school.website !== undefined && { website: school.website }),
    ...(school.address !== undefined && { address: school.address }),
    ...(school.logo_url !== undefined && { logo_url: school.logo_url }),
    ...(school.timezone !== undefined && { timezone: school.timezone }),
    ...(school.school_hours !== undefined && { school_hours: school.school_hours }),
    ...(school.enabled_features !== undefined && { enabled_features: school.enabled_features }),
    ...(school.security_question !== undefined && { security_question: school.security_question }),
    ...(school.security_answer !== undefined && { security_answer: school.security_answer }),
    ...(school.status !== undefined && ['active', 'suspended', 'inactive'].includes(school.status) && { status: school.status }),
    updated_at: new Date().toISOString(),
  };
}

import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), '.data');
const SCHOOLS_FILE = path.join(DATA_DIR, 'schools.json');
const STUDENTS_FILE = path.join(DATA_DIR, 'students.json');
const FEE_INVOICES_FILE = path.join(DATA_DIR, 'fee_invoices.json');
const PAYMENT_RECEIPTS_FILE = path.join(DATA_DIR, 'payment_receipts.json');
const STUDENT_CHARGES_FILE = path.join(DATA_DIR, 'student_charges.json');

function saveSchoolsToFile(schools: School[]) {
  if (getSupabaseAdmin()) return;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(SCHOOLS_FILE, JSON.stringify(schools, null, 2), 'utf-8');
  } catch (e) {
    console.warn('Could not write to schools.json:', e);
  }
}

function loadSchoolsFromFile(): School[] | null {
  try {
    if (fs.existsSync(SCHOOLS_FILE)) {
      const data = fs.readFileSync(SCHOOLS_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Could not read from schools.json:', e);
  }
  return null;
}

function saveStudentsToFile(students: Student[]) {
  if (getSupabaseAdmin()) return;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(STUDENTS_FILE, JSON.stringify(students, null, 2), 'utf-8');
  } catch (e) {
    console.warn('Could not write to students.json:', e);
  }
}

function loadStudentsFromFile(): Student[] | null {
  try {
    if (fs.existsSync(STUDENTS_FILE)) {
      const data = fs.readFileSync(STUDENTS_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Could not read from students.json:', e);
  }
  return null;
}

function saveFeeInvoicesToFile(invoices: StudentFeeInvoice[]) {
  if (getSupabaseAdmin()) return;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(FEE_INVOICES_FILE, JSON.stringify(invoices, null, 2), 'utf-8');
  } catch (e) {
    console.warn('Could not write to fee_invoices.json:', e);
  }
}

function loadFeeInvoicesFromFile(): StudentFeeInvoice[] | null {
  try {
    if (fs.existsSync(FEE_INVOICES_FILE)) {
      const data = fs.readFileSync(FEE_INVOICES_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Could not read from fee_invoices.json:', e);
  }
  return null;
}

function savePaymentReceiptsToFile(receipts: PaymentReceipt[]) {
  if (getSupabaseAdmin()) return;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(PAYMENT_RECEIPTS_FILE, JSON.stringify(receipts, null, 2), 'utf-8');
  } catch (e) {
    console.warn('Could not write to payment_receipts.json:', e);
  }
}

function loadPaymentReceiptsFromFile(): PaymentReceipt[] | null {
  try {
    if (fs.existsSync(PAYMENT_RECEIPTS_FILE)) {
      const data = fs.readFileSync(PAYMENT_RECEIPTS_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Could not read from payment_receipts.json:', e);
  }
  return null;
}

function saveStudentChargesToFile(charges: StudentCharge[]) {
  if (getSupabaseAdmin()) return;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(STUDENT_CHARGES_FILE, JSON.stringify(charges, null, 2), 'utf-8');
  } catch (e) {
    console.warn('Could not write to student_charges.json:', e);
  }
}

function loadStudentChargesFromFile(): StudentCharge[] | null {
  try {
    if (fs.existsSync(STUDENT_CHARGES_FILE)) {
      const data = fs.readFileSync(STUDENT_CHARGES_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Could not read from student_charges.json:', e);
  }
  return null;
}

// With a real database attached, memory is only a scratch fallback: never seed it with demo data or files.
function emptyServerDb(): NonNullable<typeof globalThis.__SERVER_DB__> {
  return {
    schools: [], teachers: [], staff: [], students: [], profiles: [], classes: [], sections: [],
    subjects: [], timetable: [], attendance: [], feeInvoices: [], paymentReceipts: [], studentCharges: [], teacherPayments: [],
    employeePayments: [], accessRequests: [], holidays: [], recycleBin: [], authEvents: [],
    temporaryAssignments: [], salaryAdjustments: [], parents: [], parentLinks: [],
    feeStructures: [], feeStructureVersions: [], bulkChargeBatches: [], transitionBatches: [],
    accountDeletionRequests: [], schoolDeletionRequests: [],
  };
}

function initServerDb() {
  if (!globalThis.__SERVER_DB__) {
    const fileSchools = loadSchoolsFromFile();
    const mergedSchools = fileSchools ? [...fileSchools] : [...INITIAL_SCHOOLS];

    // Ensure INITIAL_SCHOOLS are present
    INITIAL_SCHOOLS.forEach((initS) => {
      if (!mergedSchools.some((s) => s.id === initS.id || s.code.toUpperCase() === initS.code.toUpperCase())) {
        mergedSchools.push(initS);
      }
    });

    const fileStudents = loadStudentsFromFile();
    const mergedStudents = fileStudents ? [...fileStudents] : [...INITIAL_STUDENTS];
    INITIAL_STUDENTS.forEach((initSt) => {
      if (!mergedStudents.some((s) => s.id === initSt.id || s.registration_number === initSt.registration_number)) {
        mergedStudents.push(initSt);
      }
    });

    const fileFeeInvoices = loadFeeInvoicesFromFile();
    const mergedFeeInvoices = fileFeeInvoices ? [...fileFeeInvoices] : [...INITIAL_FEE_INVOICES];
    INITIAL_FEE_INVOICES.forEach((initI) => {
      if (!mergedFeeInvoices.some((i) => i.id === initI.id)) {
        mergedFeeInvoices.push(initI);
      }
    });

    const fileReceipts = loadPaymentReceiptsFromFile();
    const mergedReceipts = fileReceipts ? [...fileReceipts] : [...INITIAL_PAYMENT_RECEIPTS];
    INITIAL_PAYMENT_RECEIPTS.forEach((initR) => {
      if (!mergedReceipts.some((r) => r.id === initR.id || r.receipt_number === initR.receipt_number)) {
        mergedReceipts.push(initR);
      }
    });

    const fileCharges = loadStudentChargesFromFile();
    const mergedCharges = fileCharges ? [...fileCharges] : [...INITIAL_STUDENT_CHARGES];
    INITIAL_STUDENT_CHARGES.forEach((initC) => {
      if (!mergedCharges.some((c) => c.id === initC.id)) {
        mergedCharges.push(initC);
      }
    });

    globalThis.__SERVER_DB__ = {
      schools: mergedSchools,
      teachers: [...INITIAL_TEACHERS],
      staff: [...INITIAL_STAFF],
      students: mergedStudents,
      profiles: [],
      classes: [...INITIAL_CLASSES],
      sections: [...INITIAL_SECTIONS],
      subjects: [...INITIAL_SUBJECTS],
      timetable: [...INITIAL_TIMETABLE],
      attendance: [],
      feeInvoices: mergedFeeInvoices,
      paymentReceipts: mergedReceipts,
      studentCharges: mergedCharges,
      teacherPayments: [...INITIAL_TEACHER_PAYMENTS],
      employeePayments: [...INITIAL_EMPLOYEE_PAYMENTS],
      accessRequests: [],
      holidays: [...INITIAL_HOLIDAYS],
      recycleBin: [],
      authEvents: [],
      temporaryAssignments: [...INITIAL_TEMPORARY_ASSIGNMENTS],
      salaryAdjustments: [...INITIAL_EMPLOYEE_SALARY_ADJUSTMENTS],
      parents: [],
      parentLinks: [],
      feeStructures: [...INITIAL_FEE_STRUCTURES],
      feeStructureVersions: [...INITIAL_FEE_STRUCTURE_VERSIONS],
      bulkChargeBatches: [...INITIAL_BULK_CHARGE_BATCHES],
      transitionBatches: [...INITIAL_TRANSITION_BATCHES],
      accountDeletionRequests: [...INITIAL_DELETION_REQUESTS],
      schoolDeletionRequests: [...INITIAL_SCHOOL_DELETION_REQUESTS],
      exams: [],
      examResults: [],
      notices: [],
    };
  }
  return globalThis.__SERVER_DB__!;
}

export function isUuidString(val: any): boolean {
  return typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
}

export function sanitizeSupabasePayload(data: any): any {
  if (!data || typeof data !== 'object') return data;
  const payload: any = { ...data };
  const uuidFields = [
    'id', 'school_id', 'driver_id', 'vehicle_id', 'assigned_vehicle_id',
    'route_id', 'stop_id', 'student_id', 'teacher_id', 'staff_id',
    'class_id', 'section_id', 'subject_id', 'academic_year_id', 'room_id', 'item_reference_id',
    'class_teacher_id', 'parent_id', 'receipt_id', 'fee_structure_id',
    'exam_id', 'batch_id', 'bulk_charge_batch_id', 'enrollment_id',
    'auth_user_id', 'marked_by', 'reviewed_by', 'created_by', 'assigned_to',
    'target_class_id', 'target_section_id', 'contacted_parent_id', 'next_class_id',
    'helper_id', 'payment_id', 'received_by_id', 'cancelled_by',
    'source_academic_year_id', 'target_academic_year_id'
  ];
  for (const field of uuidFields) {
    if (field in payload) {
      if (payload[field] === '' || (payload[field] && !isUuidString(payload[field]))) {
        delete payload[field];
      }
    }
  }
  return payload;
}

export function formatTimeTo24h(timeStr: any): string {
  if (!timeStr || typeof timeStr !== 'string') return '07:30:00';
  const str = timeStr.trim();
  if (/^\d{2}:\d{2}:\d{2}$/.test(str)) return str;
  if (/^\d{1,2}:\d{2}$/.test(str)) {
    const [h, m] = str.split(':');
    return `${h.padStart(2, '0')}:${m}:00`;
  }
  const match = str.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)$/i);
  if (match) {
    let hours = parseInt(match[1], 10);
    const minutes = match[2];
    const seconds = match[3] || '00';
    const meridiem = match[4].toUpperCase();
    if (meridiem === 'PM' && hours < 12) hours += 12;
    if (meridiem === 'AM' && hours === 12) hours = 0;
    return `${String(hours).padStart(2, '0')}:${minutes}:${seconds}`;
  }
  return '07:30:00';
}

export const serverDb = {
  // --------------------------------------------------------------------------
  // SCHOOLS (TENANTS)
  // --------------------------------------------------------------------------
  async getSchools(): Promise<School[]> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const [schoolsResult, membershipsResult] = await Promise.all([
        supabase.from('schools').select('*').order('created_at', { ascending: false }),
        supabase.from('school_memberships').select('school_id, role, status'),
      ]);

      if (!schoolsResult.error && schoolsResult.data) {
        const db = initServerDb();
        const memberships = membershipsResult.data || [];
        const supaSchools = schoolsResult.data.map((school: any) => {
          const cached = db.schools.find((s) => s.id === school.id);
          const schoolMemberships = memberships.filter(
            (m: any) => m.school_id === school.id && m.status === 'active'
          );
          const teacherCount = schoolMemberships.filter((m: any) => m.role === 'teacher').length;
          const studentCount = schoolMemberships.filter(
            (m: any) => m.role === 'student' || m.role === 'parent'
          ).length;

          const schoolHours = (school.school_hours && typeof school.school_hours === 'object' && Object.keys(school.school_hours).length > 0)
            ? school.school_hours
            : cached?.school_hours;

          const enabledFeatures = (school.enabled_features && Array.isArray(school.enabled_features) && school.enabled_features.length > 0)
            ? school.enabled_features
            : (cached?.enabled_features && cached.enabled_features.length > 0 ? cached.enabled_features : undefined);

          return {
            ...(cached || {}),
            ...school,
            school_hours: schoolHours,
            enabled_features: enabledFeatures,
            school_contact_phone: school.school_contact_phone || cached?.school_contact_phone,
            school_contact_alternate: school.school_contact_alternate || cached?.school_contact_alternate,
            profile_photo_max_mb: school.profile_photo_max_mb || cached?.profile_photo_max_mb,
            teacher_count: school.teacher_count || teacherCount,
            student_count: school.student_count || studentCount,
          } as School;
        });

        const supaIds = new Set(supaSchools.map((s: any) => s.id));
        const extraSchools = db.schools.filter((s) => !supaIds.has(s.id)).map((school) => {
          const teachers = (db.teachers || []).filter(
            (t) => t.school_id === school.id && t.status === 'active'
          ).length;
          return {
            ...school,
            teacher_count: school.teacher_count || teachers,
            student_count: school.student_count || 0,
          };
        });
        return [...supaSchools, ...extraSchools];
      }
    }
    const db = initServerDb();
    return db.schools.map((school) => {
      const teachers = db.teachers.filter(
        (t) => t.school_id === school.id && t.status === 'active'
      ).length;
      return {
        ...school,
        teacher_count: school.teacher_count || teachers,
        student_count: school.student_count || 0,
      };
    });
  },

  async getSchoolById(id: string): Promise<School | null> {
    const list = await this.getSchools();
    return list.find((s) => s.id === id) || null;
  },

  async getSchoolByCode(code: string): Promise<School | null> {
    const list = await this.getSchools();
    const cleanCode = (code || '').trim().toUpperCase();
    return list.find((s) => s.code.toUpperCase() === cleanCode) || null;
  },

  async isSchoolCodeAvailable(
    code: string,
    excludeId?: string
  ): Promise<{
    available: boolean;
    valid: boolean;
    error?: string;
    existingSchool?: { id: string; name: string; code: string };
  }> {
    const cleanCode = (code || '').trim().toUpperCase();
    const validation = validateSchoolCodeFormat(cleanCode);
    if (!validation.isValid) {
      return {
        available: false,
        valid: false,
        error: validation.error,
      };
    }

    const supabase = getSupabaseAdmin();
    if (supabase) {
      let query = supabase.from('schools').select('id, name, code').ilike('code', escapeLikePattern(cleanCode));
      if (excludeId) {
        query = query.neq('id', excludeId);
      }
      const { data, error } = await query;
      if (!error && data) {
        if (data.length > 0) {
          return {
            available: false,
            valid: true,
            error: `School code "${cleanCode}" is already registered.`,
            existingSchool: { id: data[0].id, name: data[0].name, code: data[0].code },
          };
        }
        return { available: true, valid: true };
      }
    }

    const db = initServerDb();
    const existing = db.schools.find(
      (s) => s.code.toUpperCase() === cleanCode && (!excludeId || s.id !== excludeId)
    );
    if (existing) {
      return {
        available: false,
        valid: true,
        error: `School code "${cleanCode}" is already registered.`,
        existingSchool: { id: existing.id, name: existing.name, code: existing.code },
      };
    }

    return {
      available: true,
      valid: true,
    };
  },

  async createSchool(school: School): Promise<School> {
    school = await prepareSchoolSecretsInput(school);
    const validation = validateSchoolCodeFormat(school.code);
    if (!validation.isValid) {
      throw new Error(validation.error || 'Invalid school code format');
    }

    const availability = await this.isSchoolCodeAvailable(school.code);
    if (!availability.available) {
      throw new Error(`School code "${school.code.toUpperCase()}" is already registered. Please choose a unique code.`);
    }

    const cleanSchool: School = {
      ...school,
      code: validation.code,
    };

    const db = initServerDb();
    db.schools.unshift(cleanSchool);
    saveSchoolsToFile(db.schools);

    const supabase = getSupabaseAdmin();
    if (supabase) {
      let payload: Record<string, any> = schoolDatabaseFields(cleanSchool);
      let attempts = 0;
      while (attempts < 6) {
        attempts++;
        const { data, error } = await supabase.from('schools').insert(payload).select().single();
        if (!error && data) {
          if (cleanSchool.admin_email) {
            try {
              const adminEmails = cleanSchool.admin_email
                .split(',')
                .map((e) => e.trim().toLowerCase())
                .filter(Boolean);

              for (const cleanAdminEmail of adminEmails) {
                let { data: adminProf } = await supabase
                  .from('profiles')
                  .select('id')
                  .ilike('email', escapeLikePattern(cleanAdminEmail))
                  .maybeSingle();

                if (!adminProf?.id) {
                  const { data: newProf } = await supabase
                    .from('profiles')
                    .insert({
                      email: cleanAdminEmail,
                      display_name: cleanSchool.admin_name || `${cleanSchool.name} Administrator`,
                      role: 'school_admin',
                      school_id: data.id,
                      status: 'active',
                    })
                    .select('id')
                    .maybeSingle();
                  adminProf = newProf;
                }

                if (adminProf?.id) {
                  await supabase.from('school_memberships').update({
                    status: 'revoked',
                    revoked_at: new Date().toISOString(),
                  }).eq('user_id', adminProf.id).eq('status', 'active');

                  await supabase.from('school_memberships').upsert({
                    user_id: adminProf.id,
                    school_id: data.id,
                    role: 'school_admin',
                    status: 'active',
                    updated_at: new Date().toISOString(),
                    revoked_at: null,
                  }, { onConflict: 'user_id,school_id' });

                  await supabase.from('profiles').update({
                    role: 'school_admin',
                    school_id: data.id,
                    updated_at: new Date().toISOString(),
                  }).eq('id', adminProf.id);
                }
              }
            } catch (linkErr) {
              console.warn('Could not auto-link admin membership upon school creation:', linkErr);
            }
          }

          return {
            ...cleanSchool,
            ...data,
            school_hours: cleanSchool.school_hours,
            school_contact_phone: cleanSchool.school_contact_phone,
            school_contact_alternate: cleanSchool.school_contact_alternate,
            profile_photo_max_mb: cleanSchool.profile_photo_max_mb,
          };
        }
        if (error) {
          if (error.code === '23505' || error.message?.includes('duplicate key') || error.message?.includes('unique constraint')) {
            throw new Error(`School code "${cleanSchool.code}" is already registered. School codes must be unique.`);
          }
          if (error.message?.includes('schema cache') && (error.message?.includes('column of \'schools\'') || error.message?.includes('Could not find the'))) {
            const match = error.message.match(/Could not find the '([^']+)' column/);
            if (match && match[1] && payload[match[1]] !== undefined) {
              delete payload[match[1]];
              continue;
            }
          }
          throw new Error(`Database school insert failed: ${error.message}`);
        }
      }
    }

    return cleanSchool;
  },

  async updateSchool(id: string, updates: Partial<School>): Promise<School> {
    updates = await prepareSchoolSecretsInput(updates);
    if (updates.code) {
      const validation = validateSchoolCodeFormat(updates.code);
      if (!validation.isValid) {
        throw new Error(validation.error || 'Invalid school code format');
      }
      const availability = await this.isSchoolCodeAvailable(updates.code, id);
      if (!availability.available) {
        throw new Error(`School code "${updates.code.toUpperCase()}" is already registered by another school.`);
      }
      updates.code = validation.code;
    }

    const db = initServerDb();
    const idx = db.schools.findIndex((s) => s.id === id);
    const existingSchool = idx !== -1 ? db.schools[idx] : null;
    const fullUpdatedSchool: School = {
      ...(existingSchool || { id, code: updates.code || 'SCH', name: updates.name || 'School' }),
      ...updates,
      updated_at: new Date().toISOString(),
    } as School;

    if (idx !== -1) {
      db.schools[idx] = fullUpdatedSchool;
    } else {
      db.schools.push(fullUpdatedSchool);
    }
    saveSchoolsToFile(db.schools);

    const supabase = getSupabaseAdmin();
    if (supabase) {
      let payload: Record<string, any> = schoolDatabaseFields(updates);
      let attempts = 0;
      while (attempts < 6) {
        attempts++;
        const { data, error } = await supabase.from('schools').update(payload).eq('id', id).select().single();
        if (!error && data) {
          if (updates.admin_email) {
            try {
              const adminEmails = updates.admin_email
                .split(',')
                .map((e) => e.trim().toLowerCase())
                .filter(Boolean);

              for (const cleanAdminEmail of adminEmails) {
                let { data: adminProf } = await supabase
                  .from('profiles')
                  .select('id')
                  .ilike('email', escapeLikePattern(cleanAdminEmail))
                  .maybeSingle();

                if (!adminProf?.id) {
                  const { data: newProf } = await supabase
                    .from('profiles')
                    .insert({
                      email: cleanAdminEmail,
                      display_name: fullUpdatedSchool.admin_name || `${fullUpdatedSchool.name} Administrator`,
                      role: 'school_admin',
                      school_id: id,
                      status: 'active',
                    })
                    .select('id')
                    .maybeSingle();
                  adminProf = newProf;
                }

                if (adminProf?.id) {
                  await supabase.from('school_memberships').upsert({
                    user_id: adminProf.id,
                    school_id: id,
                    role: 'school_admin',
                    status: 'active',
                    updated_at: new Date().toISOString(),
                  }, { onConflict: 'user_id,school_id' });

                  await supabase.from('profiles').update({
                    role: 'school_admin',
                    school_id: id,
                    updated_at: new Date().toISOString(),
                  }).eq('id', adminProf.id);
                }
              }
            } catch (linkErr) {
              console.warn('Could not auto-link admin membership upon school update:', linkErr);
            }
          }

          return {
            ...fullUpdatedSchool,
            ...data,
            school_hours: fullUpdatedSchool.school_hours,
            school_contact_phone: fullUpdatedSchool.school_contact_phone,
            school_contact_alternate: fullUpdatedSchool.school_contact_alternate,
            profile_photo_max_mb: fullUpdatedSchool.profile_photo_max_mb,
          };
        }
        if (error) {
          if (error.code === '23505' || error.message?.includes('duplicate key') || error.message?.includes('unique constraint')) {
            throw new Error(`School code "${updates.code}" is already registered by another school.`);
          }
          // If a column is not found in schema cache, strip it from payload and retry
          if (error.message?.includes('schema cache') && (error.message?.includes('column of \'schools\'') || error.message?.includes('Could not find the'))) {
            const match = error.message.match(/Could not find the '([^']+)' column/);
            if (match && match[1] && payload[match[1]] !== undefined) {
              delete payload[match[1]];
              continue;
            }
          }
          throw new Error(`Database school update failed: ${error.message}`);
        }
      }
      return fullUpdatedSchool;
    }

    return fullUpdatedSchool;
  },

  // --------------------------------------------------------------------------
  // AUTHENTICATION & LOGIN (SERVER-SIDE VERIFICATION)
  // --------------------------------------------------------------------------
  async authenticateGoogleUser(rawEmail: string): Promise<{
    success: boolean;
    user?: UserPersona;
    redirectUrl?: string;
    error?: string;
  }> {
    const email = rawEmail.trim().toLowerCase();

    // 1. Super Admin Match
    if (isSuperAdminEmail(email)) {
      return {
        success: true,
        user: {
          id: 'usr-super-01',
          name: 'Super Admin',
          email,
          role: 'super_admin',
        },
        redirectUrl: '/super-admin',
      };
    }

    // 2. Check All Schools for Authorized Admin Email
    const schools = await this.getSchools();
    const adminSchool = schools.find((s) => {
      const aEmails = (s.admin_email || '')
        .split(',')
        .map((e: string) => e.trim().toLowerCase())
        .filter(Boolean);
      return aEmails.includes(email);
    });

    if (adminSchool) {
      if (adminSchool.status === 'suspended') {
        return {
          success: false,
          error: 'Your school access is currently suspended. Please contact platform support.',
        };
      }

      return {
        success: true,
        user: {
          id: `usr-admin-${adminSchool.id}`,
          name: adminSchool.admin_name || `${adminSchool.name} Administrator`,
          email,
          role: 'school_admin',
          school_id: adminSchool.id,
          school_name: adminSchool.name,
          school_code: adminSchool.code,
        },
        redirectUrl: '/admin',
      };
    }

    // 3. Check Teachers
    const db = initServerDb();
    const teacher = db.teachers.find((t) => t.email.toLowerCase() === email && t.status === 'active');
    if (teacher) {
      const sch = schools.find((s) => s.id === teacher.school_id);
      if (sch?.status === 'suspended') {
        return { success: false, error: 'Your school access is currently suspended. Please contact your school administrator.' };
      }
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

    // 4. Check Staff & Drivers
    const staffMember = db.staff.find((s) => s.email.toLowerCase() === email && s.status === 'active');
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

    // 5. Unassigned -> Direct to /join
    return {
      success: true,
      user: {
        id: `usr-unassigned-${email}`,
        name: email.split('@')[0],
        email,
        role: 'unassigned',
      },
      redirectUrl: '/join',
    };
  },

  // --------------------------------------------------------------------------
  // SERVER-SIDE 5-DIGIT PIN SECURITY & LOCKOUT
  // --------------------------------------------------------------------------
  async findPinHolder(kind: 'teacher' | 'staff', user: UserPersona): Promise<any | null> {
    const directId = kind === 'teacher' ? user.teacher_id : user.staff_id;
    const email = user.email?.trim().toLowerCase();
    const matches = (r: any) =>
      (!user.school_id || r.school_id === user.school_id) &&
      (r.id === directId || r.id === user.id || (!!email && r.email?.trim().toLowerCase() === email));
    const supabase = getSupabaseAdmin();
    if (supabase && user.school_id) {
      const { data, error } = await supabase.from(kind === 'teacher' ? 'teachers' : 'staff').select('*').eq('school_id', user.school_id);
      const row = !error && data ? data.find(matches) : undefined;
      if (row) return row;
    }
    const db = initServerDb();
    return ((kind === 'teacher' ? db.teachers : db.staff) as any[]).find(matches) || null;
  },

  async savePinHolder(kind: 'teacher' | 'staff', id: string, fields: Record<string, unknown>): Promise<void> {
    try {
      if (kind === 'teacher') await this.updateTeacher(id, fields as Partial<Teacher>);
      else await this.updateStaff(id, fields as Partial<Staff>);
    } catch (err) {
      console.error(`PIN state: database update failed for ${kind} ${id}, keeping in-memory copy only`, err);
      const db = initServerDb();
      const list = (kind === 'teacher' ? db.teachers : db.staff) as any[];
      const idx = list.findIndex((r) => r.id === id);
      if (idx !== -1) list[idx] = { ...list[idx], ...fields };
    }
  },

  async getUserPinStatus(user: UserPersona): Promise<{
    hasPin: boolean;
    isLocked: boolean;
    failedAttempts: number;
    maxAttempts: number;
    pin?: string;
    holderId?: string;
  }> {
    const maxAttempts = 5;
    if (user.role === 'school_admin' && user.school_id) {
      const school = await this.getSchoolById(user.school_id);
      const pin = school?.admin_pin || undefined;
      return {
        hasPin: hasConfiguredPin(pin),
        isLocked: school?.is_admin_pin_locked || false,
        failedAttempts: school?.admin_pin_failed_attempts || 0,
        maxAttempts,
        pin,
      };
    }

    const kind = user.role === 'teacher' ? 'teacher' : ['staff', 'driver'].includes(user.role) ? 'staff' : null;
    if (kind) {
      const holder = await this.findPinHolder(kind, user);
      const pin = holder?.security_pin || undefined;
      return {
        hasPin: hasConfiguredPin(pin),
        isLocked: holder?.is_pin_locked || false,
        failedAttempts: holder?.pin_failed_attempts || 0,
        maxAttempts,
        pin,
        holderId: holder?.id,
      };
    }

    return { hasPin: false, isLocked: false, failedAttempts: 0, maxAttempts };
  },

  async recordPinState(
    user: UserPersona,
    holderId: string | undefined,
    state: { failedAttempts: number; locked: boolean; rehashedPin?: string }
  ): Promise<void> {
    if (user.role === 'school_admin' && user.school_id) {
      await this.updateSchool(user.school_id, {
        admin_pin_failed_attempts: state.failedAttempts,
        is_admin_pin_locked: state.locked,
        ...(state.rehashedPin && { admin_pin: state.rehashedPin }),
      });
      return;
    }
    const kind = user.role === 'teacher' ? 'teacher' : ['staff', 'driver'].includes(user.role) ? 'staff' : null;
    if (!kind || !holderId) return;
    await this.savePinHolder(kind, holderId, {
      pin_failed_attempts: state.failedAttempts,
      is_pin_locked: state.locked,
      ...(state.rehashedPin && { security_pin: state.rehashedPin }),
    });
  },

  async verifyPin(
    user: UserPersona,
    enteredPin: string
  ): Promise<{
    success: boolean;
    isLocked: boolean;
    remainingAttempts: number;
    error?: string;
  }> {
    const status = await this.getUserPinStatus(user);
    const maxAttempts = 5;

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
            ? 'Account Locked: 5 failed attempts exceeded. Please contact Super Admin to unlock.'
            : 'Account Locked: 5 failed attempts exceeded. Please contact your School Principal to unlock.',
      };
    }

    const cleanPin = enteredPin.trim();
    if (await verifySecret(cleanPin, status.pin)) {
      await this.recordPinState(user, status.holderId, {
        failedAttempts: 0,
        locked: false,
        rehashedPin: isHashedSecret(status.pin) ? undefined : await hashSecret(cleanPin),
      });
      return { success: true, isLocked: false, remainingAttempts: maxAttempts };
    }

    const newCount = status.failedAttempts + 1;
    const shouldLock = newCount >= maxAttempts;
    await this.recordPinState(user, status.holderId, { failedAttempts: newCount, locked: shouldLock });

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

    const remaining = maxAttempts - newCount;
    return {
      success: false,
      isLocked: false,
      remainingAttempts: remaining,
      error: `Incorrect 5-digit PIN. ${remaining} attempt${remaining > 1 ? 's' : ''} remaining before security lockout.`,
    };
  },

  /** No newPin and no removePin keeps the existing PIN and only unlocks the account. */
  async unlockAndResetPin(params: {
    targetType: 'school_admin' | 'teacher' | 'staff' | 'profile';
    targetId: string;
    newPin?: string;
    removePin?: boolean;
    unlockedByName?: string;
  }): Promise<void> {
    const cleanPin = params.newPin?.trim();
    const pin = params.removePin ? null : cleanPin ? await hashSecret(cleanPin) : undefined;

    if (params.targetType === 'school_admin') {
      await this.updateSchool(params.targetId, {
        ...(pin !== undefined && { admin_pin: pin }),
        admin_pin_failed_attempts: 0,
        is_admin_pin_locked: false,
      });
    } else if (params.targetType === 'teacher' || params.targetType === 'staff') {
      await this.savePinHolder(params.targetType, params.targetId, {
        ...(pin !== undefined && { security_pin: pin }),
        pin_failed_attempts: 0,
        is_pin_locked: false,
      });
    }
  },

  // --------------------------------------------------------------------------
  // TEACHERS
  // --------------------------------------------------------------------------

  // --- Teachers ---
  async getTeachers(schoolId: string, filters?: any): Promise<Teacher[]> {
    const supabase = getSupabaseAdmin();
    if (supabase && isUuidString(schoolId)) {
      let query = supabase.from('teachers').select('*').eq('school_id', schoolId);
      if (filters) {
        for (const key of Object.keys(filters)) {
          query = query.eq(key, filters[key]);
        }
      }
      const { data, error } = await query;
      if (!error && data) {
        const assignments = await this.getTeacherAssignments(schoolId);
        return (data || []).map((teacher: Teacher) => withPinFlag({
          ...teacher, assignments: assignments.filter((a) => a.teacher_id === teacher.id),
        }));
      }
    }
    const db = initServerDb();
    let res = (db.teachers || []).filter((item: any) => item.school_id === schoolId);
    if (filters) {
      for (const key of Object.keys(filters)) {
        res = res.filter((item: any) => item[key] === filters[key]);
      }
    }
    return (res as Teacher[]).map(withPinFlag);
  },

  async getTeacherAssignments(schoolId: string, teacherId?: string): Promise<TeacherAssignment[]> {
    const supabase = getSupabaseAdmin();
    if (!supabase || !isUuidString(schoolId)) return [];
    try {
      const results = await Promise.all([
        supabase.from('teacher_assignments').select('*').eq('school_id', schoolId),
        supabase.from('classes').select('*').eq('school_id', schoolId),
        supabase.from('sections').select('*').eq('school_id', schoolId),
        supabase.from('subjects').select('*').eq('school_id', schoolId),
        supabase.from('school_rooms').select('*').eq('school_id', schoolId),
      ]);
      for (const result of results) {
        if (result.error) return [];
      }
      return resolveTeacherAssignments(schoolId, results[0].data || [], results[1].data || [], results[2].data || [], results[3].data || [], results[4].data || [])
        .filter((a) => !teacherId || a.teacher_id === teacherId);
    } catch {
      return [];
    }
  },

  async createTeacher(data: Teacher): Promise<Teacher> {
    data = await preparePinInput(data);
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const payload: any = { ...data };
      const isUuid = (v: any) => typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
      if (payload.id && !isUuid(payload.id)) delete payload.id;
      const validCols = [
        'id', 'school_id', 'auth_user_id', 'employee_number', 'first_name', 'last_name',
        'phone', 'email', 'joining_date', 'status', 'photo_url', 'designation', 'subjects',
        'salary', 'security_pin', 'pin_failed_attempts', 'is_pin_locked'
      ];
      const filtered: any = {};
      for (const c of validCols) {
        if (payload[c] !== undefined) filtered[c] = payload[c];
      }
      try {
        const { data: inserted, error } = await supabase.from('teachers').insert(filtered).select().single();
        if (!error && inserted) data = { ...data, ...inserted };
        else if (error) throw new Error(`Database teacher insert failed: ${error.message}`);
      } catch (err) {
        throw err instanceof Error ? err : new Error('Database teacher insert failed');
      }
    }
    const db = initServerDb();
    if (!db.teachers) db.teachers = [];
    db.teachers.unshift(data);
    return withPinFlag(data);
  },

  async updateTeacher(id: string, updates: Partial<Teacher>): Promise<Teacher> {
    updates = await preparePinInput(updates);
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { data, error } = await supabase.from('teachers').update(updates).eq('id', id).select().single();
      if (error) throw new Error(`Database teacher update failed: ${error.message}`);
      if (data) return withPinFlag(data as Teacher);
    }
    const db = initServerDb();
    if (!db.teachers) db.teachers = [];
    const idx = db.teachers.findIndex((item: any) => item.id === id);
    if (idx !== -1) {
      db.teachers[idx] = { ...db.teachers[idx], ...updates };
      return withPinFlag(db.teachers[idx]);
    }
    return withPinFlag(updates as Teacher);
  },

  async deleteTeacher(id: string): Promise<boolean> {
    const supabase = getSupabaseAdmin();
    if (supabase && isUuidString(id)) {
      const { error } = await supabase.from('teachers').delete().eq('id', id);
      if (error) throw new Error(`Database teacher delete failed: ${error.message}`);
    }
    const db = initServerDb();
    if (!db.teachers) db.teachers = [];
    db.teachers = db.teachers.filter((item: any) => item.id !== id);
    return true;
  },

  // --------------------------------------------------------------------------
  // STAFF
  // --------------------------------------------------------------------------

  // --- Staff ---
  async getStaff(schoolId: string, filters?: any): Promise<Staff[]> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      let query = supabase.from('staff').select('*').eq('school_id', schoolId);
      if (filters) {
        for (const key of Object.keys(filters)) {
          query = query.eq(key, filters[key]);
        }
      }
      const { data, error } = await query;
      if (!error && data) return (data as Staff[]).map(withPinFlag);
    }
    const db = initServerDb();
    let res = (db.staff || []).filter((item: any) => item.school_id === schoolId);
    if (filters) {
      for (const key of Object.keys(filters)) {
        res = res.filter((item: any) => item[key] === filters[key]);
      }
    }
    return (res as Staff[]).map(withPinFlag);
  },

  async createStaff(data: Staff): Promise<Staff> {
    data = await preparePinInput(data);
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const payload: any = { ...data };
      const isUuid = (v: any) => typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
      if (payload.id && !isUuid(payload.id)) {
        delete payload.id;
      }
      const validCols = [
        'id', 'school_id', 'auth_user_id', 'first_name', 'last_name', 'email', 'phone',
        'staff_type', 'employee_number', 'joining_date', 'photo_url', 'status', 'permissions'
      ];
      const filtered: any = {};
      for (const c of validCols) {
        if (payload[c] !== undefined) filtered[c] = payload[c];
      }
      try {
        const { data: inserted, error } = await supabase.from('staff').insert(filtered).select().single();
        if (!error && inserted) {
          data = { ...data, ...inserted };
        } else if (error) {
          throw new Error(`Database staff insert failed: ${error.message}`);
        }
      } catch (err) {
        throw err instanceof Error ? err : new Error('Database staff insert failed');
      }
    }
    const db = initServerDb();
    if (!db.staff) db.staff = [];
    db.staff.unshift(data);
    return withPinFlag(data);
  },

  async updateStaff(id: string, updates: Partial<Staff>): Promise<Staff> {
    updates = await preparePinInput(updates);
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const isUuid = (v: any) => typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
      if (isUuid(id)) {
        const payload: any = { ...updates };
        delete payload.id;
        const { data, error } = await supabase.from('staff').update(payload).eq('id', id).select().single();
        if (error) throw new Error(`Database staff update failed: ${error.message}`);
        if (data) return withPinFlag(data as Staff);
      }
    }
    const db = initServerDb();
    if (!db.staff) db.staff = [];
    const idx = db.staff.findIndex((item: any) => item.id === id);
    if (idx !== -1) {
      db.staff[idx] = { ...db.staff[idx], ...updates };
      return withPinFlag(db.staff[idx]);
    }
    return withPinFlag(updates as Staff);
  },

  async deleteStaff(id: string): Promise<boolean> {
    const supabase = getSupabaseAdmin();
    if (supabase && isUuidString(id)) {
      const { error } = await supabase.from('staff').delete().eq('id', id);
      if (error) throw new Error(`Database staff delete failed: ${error.message}`);
    }
    const db = initServerDb();
    if (!db.staff) db.staff = [];
    db.staff = db.staff.filter((item: any) => item.id !== id);
    return true;
  },

  // --------------------------------------------------------------------------
  // STUDENTS
  // --------------------------------------------------------------------------
  async getStudents(schoolId: string, filters?: any): Promise<Student[]> {
    const db = initServerDb();
    const supabase = getSupabaseAdmin();
    if (supabase) {
      let query = supabase.from('students').select('*').eq('school_id', schoolId);
      if (filters?.status) query = query.eq('status', filters.status);
      const { data, error } = await query;
      if (!error && data) {
        if (data.length === 0) return [];
        const [classResult, sectionResult, teacherResult, roomResult] = await Promise.all([
          supabase.from('classes').select('*').eq('school_id', schoolId),
          supabase.from('sections').select('*').eq('school_id', schoolId),
          supabase.from('teachers').select('id, first_name, last_name').eq('school_id', schoolId),
          supabase.from('school_rooms').select('*').eq('school_id', schoolId),
        ]);
        for (const result of [classResult, sectionResult, teacherResult, roomResult]) {
          if (result.error) throw new Error(`Database enrollment read failed: ${result.error.message}`);
        }
        const enriched = (data as Student[]).map((st) => ({
          ...st,
          current_enrollment: st.current_enrollment
            ? resolveEnrollmentClass(st.current_enrollment, classResult.data || [], sectionResult.data || [], teacherResult.data || [], roomResult.data || [])
            : st.current_enrollment,
        }));
        return enriched;
      }
    }
    return db.students.filter((s) => s.school_id === schoolId);
  },

  async findStudentByRegistration(registrationNumber: string, schoolId?: string): Promise<Student | null> {
    const cleanReg = registrationNumber
      .trim()
      .replace(/[\u2010-\u2015\u2212\uFE58\uFE63\uFF0D]/g, '-')
      .toLowerCase();
    const db = initServerDb();
    const supabase = getSupabaseAdmin();
    if (supabase) {
      let query = supabase.from('students').select('*').ilike('registration_number', escapeLikePattern(cleanReg));
      if (schoolId) query = query.eq('school_id', schoolId);
      const { data } = await query.maybeSingle();
      if (data) return data as Student;
    }
    const student = db.students.find(
      (s) =>
        s.registration_number.replace(/[\u2010-\u2015\u2212\uFE58\uFE63\uFF0D]/g, '-').toLowerCase() === cleanReg &&
        (!schoolId || s.school_id === schoolId)
    );
    return student || null;
  },

  async createStudent(student: Student): Promise<Student> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const payload: any = { ...student };
      const isUuid = (v: any) => typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
      if (payload.id && !isUuid(payload.id)) delete payload.id;
      const validCols = [
        'id', 'school_id', 'auth_user_id', 'registration_number', 'first_name', 'last_name',
        'date_of_birth', 'gender', 'joining_date', 'status', 'photo_url', 'guardian',
        'emergency_info', 'transfer_info', 'uses_class_monthly_fee', 'monthly_fee_amount',
        'apply_new_student_charges', 'sibling_student_ids', 'current_enrollment',
        'created_at', 'updated_at'
      ];
      const filtered: any = {};
      for (const c of validCols) {
        if (payload[c] !== undefined) filtered[c] = payload[c];
      }
      try {
        let { data: inserted, error } = await supabase.from('students').insert(filtered).select().single();
        if (error && (error.message?.includes('current_enrollment') || (error as any).code === '42703')) {
          throw new Error('Database students.current_enrollment column is missing. Apply the student enrollment migration before creating students.');
        }
        if (!error && inserted) {
          student = { ...student, ...inserted };
          if (payload.guardian?.email) {
            const parentEmail = payload.guardian.email.trim().toLowerCase();
            const guardianName = payload.guardian.guardian_name || payload.guardian.father_name || payload.guardian.mother_name || 'Parent / Guardian';
            const primaryPhone = payload.guardian.primary_phone || '';
            const studentId = inserted.id;
            const schoolId = inserted.school_id;

            try {
              await supabase.from('guardians').upsert({
                school_id: schoolId,
                student_id: studentId,
                father_name: payload.guardian.father_name || null,
                mother_name: payload.guardian.mother_name || null,
                guardian_name: guardianName,
                primary_phone: primaryPhone,
                secondary_phone: payload.guardian.secondary_phone || null,
                email: parentEmail,
                address: payload.guardian.address || null,
                updated_at: new Date().toISOString(),
              }, { onConflict: 'student_id' });
            } catch (gErr) {
              console.warn('guardians upsert notice:', gErr);
            }

            try {
              const { data: parentProf } = await supabase.from('parent_profiles').upsert({
                school_id: schoolId,
                father_name: payload.guardian.father_name || null,
                mother_name: payload.guardian.mother_name || null,
                guardian_name: guardianName,
                primary_phone: primaryPhone,
                secondary_phone: payload.guardian.secondary_phone || null,
                email: parentEmail,
                address: payload.guardian.address || null,
                status: 'active',
                updated_at: new Date().toISOString(),
              }, { onConflict: 'school_id,email' }).select().maybeSingle();

              if (parentProf?.id) {
                await supabase.from('parent_student_links').upsert({
                  school_id: schoolId,
                  parent_id: parentProf.id,
                  student_id: studentId,
                  relationship: payload.guardian.guardian_name ? 'guardian' : payload.guardian.father_name ? 'father' : 'mother',
                  is_primary_guardian: true,
                  status: 'active',
                }, { onConflict: 'school_id,parent_id,student_id' });
              }
            } catch (pErr) {
              console.warn('parent_profiles upsert notice:', pErr);
            }
          }
        }
        else if (error) throw new Error(`Database student insert failed: ${error.message}`);
      } catch (err) {
        throw err instanceof Error ? err : new Error('Database student insert failed');
      }
    }
    const db = initServerDb();
    if (student.guardian?.email) {
      const parentEmail = student.guardian.email.trim().toLowerCase();
      const guardianName = student.guardian.guardian_name || student.guardian.father_name || student.guardian.mother_name || 'Parent / Guardian';
      if (!db.parents) db.parents = [];
      const existingParent = db.parents.find((p: any) => p.school_id === student.school_id && p.email?.toLowerCase() === parentEmail);
      if (!existingParent) {
        db.parents.unshift({
          id: `parent-${Date.now()}`,
          school_id: student.school_id,
          email: parentEmail,
          guardian_name: guardianName,
          primary_phone: student.guardian.primary_phone || '',
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
    }
    db.students.unshift(student);
    saveStudentsToFile(db.students);
    return student;
  },

  async updateStudent(id: string, updates: Partial<Student>): Promise<Student> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const isUuid = (v: any) => typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
      if (isUuid(id)) {
        const payload: any = { ...updates };
        delete payload.id;
        try {
          const { error } = await supabase.from('students').update(payload).eq('id', id);
          if (error && (error.message?.includes('current_enrollment') || (error as any).code === '42703')) {
            throw new Error('Database students.current_enrollment column is missing. Apply the student enrollment migration before updating students.');
          }
          if (error) throw new Error(`Database student update failed: ${error.message}`);
          if (updates.guardian?.email) {
            const parentEmail = updates.guardian.email.trim().toLowerCase();
            const guardianName = updates.guardian.guardian_name || updates.guardian.father_name || updates.guardian.mother_name || 'Parent / Guardian';
            try {
              const { data: parentProf } = await supabase.from('parent_profiles').upsert({
                school_id: updates.school_id,
                father_name: updates.guardian.father_name || null,
                mother_name: updates.guardian.mother_name || null,
                guardian_name: guardianName,
                primary_phone: updates.guardian.primary_phone || '',
                secondary_phone: updates.guardian.secondary_phone || null,
                email: parentEmail,
                address: updates.guardian.address || null,
                status: 'active',
                updated_at: new Date().toISOString(),
              }, { onConflict: 'school_id,email' }).select().maybeSingle();

              if (parentProf?.id) {
                await supabase.from('parent_student_links').upsert({
                  school_id: updates.school_id,
                  parent_id: parentProf.id,
                  student_id: id,
                  relationship: updates.guardian.guardian_name ? 'guardian' : updates.guardian.father_name ? 'father' : 'mother',
                  is_primary_guardian: true,
                  status: 'active',
                }, { onConflict: 'school_id,parent_id,student_id' });
              }
            } catch (pErr) {
              console.warn('parent update sync notice:', pErr);
            }
          }
        } catch (e) {
          throw e instanceof Error ? e : new Error('Database student update failed');
        }
      }
    }
    const db = initServerDb();
    const cleanId = id.replace(/^usr-/, '').toLowerCase();
    const idx = db.students.findIndex(
      (s) => s.id.toLowerCase() === cleanId || String(s.registration_number || '').toLowerCase() === cleanId
    );
    if (idx !== -1) {
      db.students[idx] = { ...db.students[idx], ...updates };
      saveStudentsToFile(db.students);
      return db.students[idx];
    }
    return updates as Student;
  },

  async deleteStudent(id: string): Promise<boolean> {
    const supabase = getSupabaseAdmin();
    if (supabase && isUuidString(id)) {
      const { error } = await supabase.from('students').delete().eq('id', id);
      if (error) throw new Error(`Database student delete failed: ${error.message}`);
    }
    const db = initServerDb();
    db.students = db.students.filter((s) => s.id !== id);
    saveStudentsToFile(db.students);
    return true;
  },

  // --------------------------------------------------------------------------
  // ACCESS REQUESTS (JOIN PORTAL)
  // --------------------------------------------------------------------------
  async getAccessRequests(schoolId?: string): Promise<SchoolAccessRequest[]> {
    const db = initServerDb();
    if (schoolId) {
      return db.accessRequests.filter((r) => r.school_id === schoolId);
    }
    return db.accessRequests;
  },

  async createAccessRequest(req: SchoolAccessRequest): Promise<SchoolAccessRequest> {
    const db = initServerDb();
    db.accessRequests.unshift(req);
    return req;
  },

  async updateAccessRequestStatus(
    id: string,
    status: SchoolAccessRequest['status'],
    reviewerName?: string
  ): Promise<void> {
    const db = initServerDb();
    const idx = db.accessRequests.findIndex((r) => r.id === id);
    if (idx !== -1) {
      db.accessRequests[idx].status = status;
      db.accessRequests[idx].reviewed_at = new Date().toISOString();
      db.accessRequests[idx].reviewed_by = reviewerName || 'School Admin';
    }
  },

  // --------------------------------------------------------------------------
  // HOLIDAYS
  // --------------------------------------------------------------------------
  async resolveAcademicYearId(schoolId: string, requestedId: string | undefined, onDate: string): Promise<string> {
    if (requestedId && isUuidString(requestedId)) return requestedId;
    const years = await this.getAcademicYears(schoolId);
    const match =
      years.find((y: any) => y.is_current) ||
      years.find((y: any) => y.start_date <= onDate && onDate <= y.end_date) ||
      [...years].sort((a: any, b: any) => String(b.start_date).localeCompare(String(a.start_date)))[0];
    if (!match) throw new Error('Create an academic year for this school before adding holidays.');
    return match.id;
  },

  holidayRow(holiday: Partial<SchoolHoliday>) {
    const { description, ...rest } = holiday;
    const row = sanitizeSupabasePayload({ ...rest, reason: rest.reason || description || null });
    for (const key of Object.keys(row)) {
      if (!['school_id', 'academic_year_id', 'name', 'start_date', 'end_date', 'reason', 'created_by'].includes(key)) delete row[key];
    }
    return row;
  },

  async getHolidays(schoolId: string): Promise<SchoolHoliday[]> {
    const supabase = getSupabaseAdmin();
    if (supabase && isUuidString(schoolId)) {
      const { data, error } = await supabase.from('school_holidays').select('*').eq('school_id', schoolId).order('start_date');
      if (!error && data) return data as SchoolHoliday[];
    }
    const db = initServerDb();
    return db.holidays.filter((h) => h.school_id === schoolId);
  },
  async createHoliday(holiday: SchoolHoliday): Promise<SchoolHoliday> {
    const supabase = getSupabaseAdmin();
    if (supabase && isUuidString(holiday.school_id)) {
      const academicYearId = await this.resolveAcademicYearId(holiday.school_id, holiday.academic_year_id, holiday.start_date);
      const row = this.holidayRow({ ...holiday, academic_year_id: academicYearId, end_date: holiday.end_date || holiday.start_date });
      const { data, error } = await supabase.from('school_holidays').insert(row).select().single();
      if (!error && data) return data as SchoolHoliday;
    }
    const db = initServerDb();
    const item: SchoolHoliday = {
      ...holiday,
      id: holiday.id || `hol-${Date.now().toString().slice(-6)}`,
      created_at: holiday.created_at || new Date().toISOString(),
    };
    db.holidays.unshift(item);
    return item;
  },
  async updateHoliday(id: string, schoolId: string, updates: Partial<SchoolHoliday>): Promise<SchoolHoliday> {
    const supabase = getSupabaseAdmin();
    if (supabase && isUuidString(schoolId) && isUuidString(id)) {
      const row = this.holidayRow(updates);
      delete row.school_id;
      if (updates.academic_year_id !== undefined) {
        row.academic_year_id = await this.resolveAcademicYearId(schoolId, updates.academic_year_id, updates.start_date || new Date().toISOString().slice(0, 10));
      }
      const { data, error } = await supabase.from('school_holidays').update(row).eq('id', id).eq('school_id', schoolId).select().maybeSingle();
      if (!error && data) return data as SchoolHoliday;
    }
    const db = initServerDb();
    const idx = db.holidays.findIndex((h) => h.id === id && h.school_id === schoolId);
    if (idx === -1) throw new Error('Holiday not found');
    db.holidays[idx] = { ...db.holidays[idx], ...updates, id, school_id: schoolId };
    return db.holidays[idx];
  },
  async deleteHoliday(id: string, schoolId: string): Promise<void> {
    const supabase = getSupabaseAdmin();
    if (supabase && isUuidString(schoolId) && isUuidString(id)) {
      await supabase.from('school_holidays').delete().eq('id', id).eq('school_id', schoolId);
      return;
    }
    const db = initServerDb();
    db.holidays = db.holidays.filter((h) => !(h.id === id && h.school_id === schoolId));
  },

  // --------------------------------------------------------------------------
  // TEMPORARY ASSIGNMENTS (LEAVE & WORK COVERAGE)
  // --------------------------------------------------------------------------
  async getTemporaryAssignments(
    schoolId: string,
    filter?: { absentEmployeeId?: string; replacementEmployeeId?: string; status?: string }
  ): Promise<TemporaryAssignment[]> {
    const supabase = getSupabaseAdmin();
    if (supabase && isUuidString(schoolId)) {
      let query = supabase
        .from('temporary_assignments')
        .select('*')
        .eq('school_id', schoolId)
        .order('created_at', { ascending: false });
      if (filter?.absentEmployeeId && isUuidString(filter.absentEmployeeId)) query = query.eq('absent_employee_id', filter.absentEmployeeId);
      if (filter?.replacementEmployeeId && isUuidString(filter.replacementEmployeeId)) query = query.eq('replacement_employee_id', filter.replacementEmployeeId);
      if (filter?.status) query = query.eq('status', filter.status);

      const { data, error } = await query;
      if (!error && data) return (data || []) as TemporaryAssignment[];
    }

    const db = initServerDb();
    let list = db.temporaryAssignments.filter((a) => a.school_id === schoolId);
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

  async createTemporaryAssignment(assignment: TemporaryAssignment): Promise<TemporaryAssignment> {
    const item: TemporaryAssignment = {
      ...assignment,
      id: assignment.id || `tmp-asg-${Date.now().toString().slice(-4)}`,
      status: assignment.status || 'active',
      created_at: assignment.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { data, error } = await supabase
        .from('temporary_assignments')
        .insert(sanitizeSupabasePayload(item))
        .select()
        .single();
      if (error) throw new Error(`Database temporary assignment insert failed: ${error.message}`);
      return data as TemporaryAssignment;
    }

    initServerDb().temporaryAssignments.unshift(item);
    return item;
  },

  async updateTemporaryAssignment(
    id: string,
    schoolId: string,
    updates: Partial<TemporaryAssignment>
  ): Promise<TemporaryAssignment> {
    const changes = { ...updates, updated_at: new Date().toISOString() };
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const payload = sanitizeSupabasePayload(changes);
      delete payload.id;
      const { data, error } = await supabase.from('temporary_assignments').update(payload).eq('id', id).eq('school_id', schoolId).select().maybeSingle();
      if (error) throw new Error(`Database temporary assignment update failed: ${error.message}`);
      if (!data) throw new Error('Temporary assignment not found');
      return data as TemporaryAssignment;
    }

    const db = initServerDb();
    const idx = db.temporaryAssignments.findIndex((a) => a.id === id && a.school_id === schoolId);
    if (idx === -1) throw new Error('Temporary assignment not found');
    db.temporaryAssignments[idx] = { ...db.temporaryAssignments[idx], ...changes };
    return db.temporaryAssignments[idx];
  },

  // --------------------------------------------------------------------------
  // EMPLOYEE SALARY ADJUSTMENTS (REIMBURSEMENTS & DEDUCTIONS)
  // --------------------------------------------------------------------------
  async getSalaryAdjustments(
    schoolId: string,
    filter?: { employeeId?: string; month?: string; type?: string; assignmentId?: string }
  ): Promise<EmployeeSalaryAdjustment[]> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      let query = supabase
        .from('employee_salary_adjustments')
        .select('*')
        .eq('school_id', schoolId)
        .order('effective_date', { ascending: false });
      if (filter?.employeeId) query = query.eq('employee_id', filter.employeeId);
      if (filter?.month) query = query.eq('billing_month', filter.month);
      if (filter?.type) query = query.eq('adjustment_type', filter.type);
      if (filter?.assignmentId) query = query.eq('temporary_assignment_id', filter.assignmentId);

      const { data, error } = await query;
      if (!error && data) {
        return data as EmployeeSalaryAdjustment[];
      }
    }

    const db = initServerDb();
    let list = db.salaryAdjustments.filter((a) => a.school_id === schoolId);
    if (filter?.employeeId) {
      list = list.filter((a) => a.employee_id === filter.employeeId);
    }
    if (filter?.month) {
      list = list.filter((a) => a.billing_month === filter.month);
    }
    if (filter?.type) {
      list = list.filter((a) => a.adjustment_type === filter.type);
    }
    if (filter?.assignmentId) {
      list = list.filter((a) => a.temporary_assignment_id === filter.assignmentId);
    }
    return list.sort((a, b) => b.effective_date.localeCompare(a.effective_date));
  },

  async createSalaryAdjustment(adjustment: EmployeeSalaryAdjustment): Promise<EmployeeSalaryAdjustment> {
    const item: EmployeeSalaryAdjustment = {
      ...adjustment,
      id: adjustment.id || `sal-adj-${Date.now().toString().slice(-4)}`,
      billing_month: adjustment.billing_month || adjustment.effective_date.slice(0, 7),
      created_at: adjustment.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const supabase = getSupabaseAdmin();
    if (supabase) {
      const payload = sanitizeSupabasePayload(item);
      if (payload.temporary_assignment_id && !isUuidString(payload.temporary_assignment_id)) delete payload.temporary_assignment_id;
      const { data, error } = await supabase.from('employee_salary_adjustments').insert(payload).select().single();
      if (error) throw new Error(`Database salary adjustment insert failed: ${error.message}`);
      return data as EmployeeSalaryAdjustment;
    }

    initServerDb().salaryAdjustments.unshift(item);
    return item;
  },

  async deleteSalaryAdjustment(id: string, schoolId: string): Promise<void> {
    const supabase = getSupabaseAdmin();
    if (supabase && isUuidString(id) && isUuidString(schoolId)) {
      const { error } = await supabase.from('employee_salary_adjustments').delete().eq('id', id).eq('school_id', schoolId);
      if (error) throw new Error(`Database salary adjustment delete failed: ${error.message}`);
    }
    const db = initServerDb();
    db.salaryAdjustments = db.salaryAdjustments.filter((a) => a.id !== id || a.school_id !== schoolId);
  },

  async getAcademicYears(schoolId: string): Promise<any[]> {
    const supabase = getSupabaseAdmin();
    if (supabase && isUuidString(schoolId)) {
      const { data, error } = await supabase.from('academic_years').select('*').eq('school_id', schoolId);
      if (!error && data?.length) return data;
    }
    return [
      { id: 'ay-2025-26', school_id: schoolId, name: '2025-2026', start_date: '2025-04-01', end_date: '2026-03-31', status: 'active', is_current: true },
      { id: 'ay-2024-25', school_id: schoolId, name: '2024-2025', start_date: '2024-04-01', end_date: '2025-03-31', status: 'closed', is_current: false }
    ];
  },

  async createAcademicYear(data: any): Promise<any> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const payload = sanitizeSupabasePayload(data);
      const { data: created, error } = await supabase.from('academic_years').insert(payload).select().single();
      if (!error && created) return created;
    }
    return data;
  },

  async updateAcademicYear(id: string, updates: any): Promise<any> {
    const supabase = getSupabaseAdmin();
    if (supabase && isUuidString(id)) {
      const payload = sanitizeSupabasePayload(updates);
      delete payload.id;
      const { data: updated, error } = await supabase.from('academic_years').update(payload).eq('id', id).select().single();
      if (!error && updated) return updated;
    }
    return { id, ...updates };
  },

  async deleteAcademicYear(id: string): Promise<void> {
    const supabase = getSupabaseAdmin();
    if (supabase && isUuidString(id)) {
      await supabase.from('academic_years').delete().eq('id', id);
    }
  },

  async getClasses(schoolId: string): Promise<any[]> {
    const supabase = getSupabaseAdmin();
    if (supabase && isUuidString(schoolId)) {
      const { data, error } = await supabase.from('classes').select('*').eq('school_id', schoolId).order('sort_order', { ascending: true });
      if (!error && data) return data;
    }
    const db = initServerDb();
    return db.classes.filter((c: any) => c.school_id === schoolId);
  },

  async createClass(data: any): Promise<any> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const payload = sanitizeSupabasePayload(data);
      const { data: created, error } = await supabase.from('classes').insert(payload).select().single();
      if (!error && created) return created;
    }
    return data;
  },

  async updateClass(id: string, updates: any): Promise<any> {
    const supabase = getSupabaseAdmin();
    if (supabase && isUuidString(id)) {
      const payload = sanitizeSupabasePayload(updates);
      delete payload.id;
      const { data: updated, error } = await supabase.from('classes').update(payload).eq('id', id).select().single();
      if (!error && updated) return updated;
    }
    return { id, ...updates };
  },

  async deleteClass(id: string): Promise<void> {
    const supabase = getSupabaseAdmin();
    if (supabase && isUuidString(id)) {
      await supabase.from('classes').delete().eq('id', id);
    }
  },

  async getSections(schoolId: string): Promise<any[]> {
    const supabase = getSupabaseAdmin();
    if (supabase && isUuidString(schoolId)) {
      const { data, error } = await supabase.from('sections').select('*').eq('school_id', schoolId);
      if (!error && data) return data;
    }
    const db = initServerDb();
    return db.sections.filter((s: any) => s.school_id === schoolId);
  },

  async createSection(data: any): Promise<any> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const payload = sanitizeSupabasePayload(data);
      const { data: created, error } = await supabase.from('sections').insert(payload).select().single();
      if (!error && created) return created;
    }
    return data;
  },

  async updateSection(id: string, updates: any): Promise<any> {
    const supabase = getSupabaseAdmin();
    if (supabase && isUuidString(id)) {
      const payload = sanitizeSupabasePayload(updates);
      delete payload.id;
      const { data: updated, error } = await supabase.from('sections').update(payload).eq('id', id).select().single();
      if (!error && updated) return updated;
    }
    return { id, ...updates };
  },

  async deleteSection(id: string): Promise<void> {
    const supabase = getSupabaseAdmin();
    if (supabase && isUuidString(id)) {
      await supabase.from('sections').delete().eq('id', id);
    }
  },

  async getSubjects(schoolId: string): Promise<any[]> {
    const supabase = getSupabaseAdmin();
    if (supabase && isUuidString(schoolId)) {
      const { data, error } = await supabase.from('subjects').select('*').eq('school_id', schoolId);
      if (!error && data) return data;
    }
    const db = initServerDb();
    return db.subjects.filter((s: any) => s.school_id === schoolId);
  },

  async createSubject(data: any): Promise<any> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const payload = sanitizeSupabasePayload(data);
      const { data: created, error } = await supabase.from('subjects').insert(payload).select().single();
      if (!error && created) return created;
    }
    return data;
  },

  async updateSubject(id: string, updates: any): Promise<any> {
    const supabase = getSupabaseAdmin();
    if (supabase && isUuidString(id)) {
      const payload = sanitizeSupabasePayload(updates);
      delete payload.id;
      const { data: updated, error } = await supabase.from('subjects').update(payload).eq('id', id).select().single();
      if (!error && updated) return updated;
    }
    return { id, ...updates };
  },

  async deleteSubject(id: string): Promise<void> {
    const supabase = getSupabaseAdmin();
    if (supabase && isUuidString(id)) {
      await supabase.from('subjects').delete().eq('id', id);
    }
  },

  async getRooms(schoolId: string): Promise<any[]> {
    const supabase = getSupabaseAdmin();
    if (supabase && isUuidString(schoolId)) {
      const { data, error } = await supabase.from('school_rooms').select('*').eq('school_id', schoolId);
      if (!error && data) return data;
    }
    return [];
  },

  async createRoom(data: any): Promise<any> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const payload = sanitizeSupabasePayload(data);
      const { data: created, error } = await supabase.from('school_rooms').insert(payload).select().single();
      if (!error && created) return created;
    }
    return data;
  },

  async updateRoom(id: string, updates: any): Promise<any> {
    const supabase = getSupabaseAdmin();
    if (supabase && isUuidString(id)) {
      const payload = sanitizeSupabasePayload(updates);
      delete payload.id;
      const { data: updated, error } = await supabase.from('school_rooms').update(payload).eq('id', id).select().single();
      if (!error && updated) return updated;
    }
    return { id, ...updates };
  },

  async deleteRoom(id: string): Promise<void> {
    const supabase = getSupabaseAdmin();
    if (supabase && isUuidString(id)) {
      await supabase.from('school_rooms').delete().eq('id', id);
    }
  },

  async getVehicles(schoolId: string): Promise<any[]> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const [vehiclesRes, staffRes] = await Promise.all([
        supabase.from('vehicles').select('*').eq('school_id', schoolId),
        supabase.from('staff').select('id, first_name, last_name, phone').eq('school_id', schoolId),
      ]);
      if (!vehiclesRes.error && vehiclesRes.data) {
        const staffList = staffRes.data || [];
        return vehiclesRes.data.map((row: any) => {
          const d = staffList.find((s: any) => s.id === row.driver_id);
          return {
            ...row,
            type: row.vehicle_type || row.type || 'bus',
            driver_name: d ? `${d.first_name} ${d.last_name}` : undefined,
            driver_phone: d?.phone || undefined,
          };
        });
      }
    }
    return [];
  },

  async createVehicle(data: any): Promise<any> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const payload: any = {
        school_id: data.school_id,
        vehicle_name: data.vehicle_name,
        vehicle_number: data.vehicle_number,
        vehicle_type: data.vehicle_type || data.type || 'bus',
        capacity: Number(data.capacity) || 40,
        status: data.status || 'active',
      };
      if (isUuidString(data.id)) payload.id = data.id;
      if (isUuidString(data.driver_id)) {
        payload.driver_id = data.driver_id;
        // Enforce 1 driver max per 1 vehicle across fleet: clear driver from any other vehicle
        await supabase.from('vehicles').update({ driver_id: null }).eq('driver_id', payload.driver_id);
      }
      if (isUuidString(data.helper_id)) payload.helper_id = data.helper_id;

      const { data: created, error } = await supabase.from('vehicles').insert(payload).select().single();
      if (!error && created) {
        return {
          ...created,
          type: created.vehicle_type || 'bus',
          driver_name: data.driver_name,
          driver_phone: data.driver_phone,
        };
      }
      if (error) throw new Error(`Database createVehicle failed: ${error.message}`);
    }
    return data;
  },

  async updateVehicle(id: string, updates: any): Promise<any> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const payload: any = {};
      if (updates.vehicle_name !== undefined) payload.vehicle_name = updates.vehicle_name;
      if (updates.vehicle_number !== undefined) payload.vehicle_number = updates.vehicle_number;
      if (updates.vehicle_type !== undefined || updates.type !== undefined) {
        payload.vehicle_type = updates.vehicle_type || updates.type;
      }
      if (updates.capacity !== undefined) payload.capacity = Number(updates.capacity) || 40;
      if (updates.status !== undefined) payload.status = updates.status;
      if (updates.driver_id !== undefined) {
        payload.driver_id = isUuidString(updates.driver_id) ? updates.driver_id : null;
      }
      if (updates.helper_id !== undefined) {
        payload.helper_id = isUuidString(updates.helper_id) ? updates.helper_id : null;
      }

      let targetId = id;
      if (!isUuidString(targetId) && updates.school_id) {
        const { data: vRow } = await supabase
          .from('vehicles')
          .select('id')
          .eq('school_id', updates.school_id)
          .eq('vehicle_number', updates.vehicle_number || updates.vehicleNumber)
          .maybeSingle();
        if (vRow?.id) targetId = vRow.id;
      }

      if (isUuidString(targetId)) {
        // Enforce 1 driver max per 1 vehicle: if driver is assigned, clear this driver from any other vehicle
        if (payload.driver_id) {
          await supabase.from('vehicles').update({ driver_id: null }).eq('driver_id', payload.driver_id).neq('id', targetId);
        }
        const { data: updated, error } = await supabase.from('vehicles').update(payload).eq('id', targetId).select().single();
        if (!error && updated) {
          return {
            ...updated,
            type: updated.vehicle_type || 'bus',
            driver_name: updates.driver_name,
            driver_phone: updates.driver_phone,
          };
        }
        if (error) throw new Error(`Database updateVehicle failed: ${error.message}`);
      } else if (updates.school_id) {
        return await this.createVehicle({ ...updates, school_id: updates.school_id });
      }
    }
    return { id, ...updates };
  },

  async deleteVehicle(id: string): Promise<void> {
    const supabase = getSupabaseAdmin();
    if (supabase && isUuidString(id)) {
      await supabase.from('vehicles').delete().eq('id', id);
    }
  },

  async getTransportRoutes(schoolId: string): Promise<any[]> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const [routesRes, stopsRes] = await Promise.all([
        supabase.from('transport_routes').select('*').eq('school_id', schoolId),
        supabase.from('transport_stops').select('*').eq('school_id', schoolId).order('stop_order', { ascending: true }),
      ]);
      if (!routesRes.error && routesRes.data) {
        const allStops = stopsRes.data || [];
        return routesRes.data.map((r: any) => ({
          ...r,
          stops: allStops.filter((s: any) => s.route_id === r.id).sort((a: any, b: any) => (a.stop_order || 0) - (b.stop_order || 0)),
        }));
      }
    }
    return [];
  },

  async createTransportRoute(data: any, stops?: any[]): Promise<any> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const payload: any = {
        school_id: data.school_id,
        route_name: data.route_name,
        route_code: data.route_code || `RT-${Math.floor(100 + Math.random() * 900)}`,
        description: data.description || null,
        city: data.city || data.city_zone || null,
        status: data.status || 'active',
      };
      if (isUuidString(data.id)) payload.id = data.id;
      if (isUuidString(data.assigned_vehicle_id)) payload.assigned_vehicle_id = data.assigned_vehicle_id;

      const { data: created, error } = await supabase.from('transport_routes').insert(payload).select().single();
      if (!error && created) {
        const routeStops = stops || data.stops || [];
        if (Array.isArray(routeStops) && routeStops.length > 0) {
          const stopInserts = routeStops.map((st: any, idx: number) => ({
            school_id: data.school_id,
            route_id: created.id,
            stop_name: st.stop_name || `Stop ${idx + 1}`,
            stop_order: Number(st.stop_order) || idx + 1,
            estimated_pickup_time: formatTimeTo24h(st.estimated_pickup_time || '07:30:00'),
            estimated_drop_time: st.estimated_drop_time ? formatTimeTo24h(st.estimated_drop_time) : null,
            address: st.address || null,
          }));
          const { data: insertedStops } = await supabase.from('transport_stops').insert(stopInserts).select();
          return { ...created, stops: insertedStops || stopInserts };
        }
        return { ...created, stops: [] };
      }
      if (error) throw new Error(`Database createTransportRoute failed: ${error.message}`);
    }
    return data;
  },

  async updateTransportRoute(id: string, updates: any, stops?: any[]): Promise<any> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const payload: any = {};
      if (updates.route_name !== undefined) payload.route_name = updates.route_name;
      if (updates.route_code !== undefined) payload.route_code = updates.route_code;
      if (updates.description !== undefined) payload.description = updates.description;
      if (updates.city !== undefined || updates.city_zone !== undefined) {
        payload.city = updates.city || updates.city_zone;
      }
      if (updates.status !== undefined) payload.status = updates.status;
      if (updates.assigned_vehicle_id !== undefined) {
        payload.assigned_vehicle_id = isUuidString(updates.assigned_vehicle_id) ? updates.assigned_vehicle_id : null;
      }

      let targetId = id;
      if (!isUuidString(targetId) && updates.school_id) {
        const { data: rRow } = await supabase
          .from('transport_routes')
          .select('id')
          .eq('school_id', updates.school_id)
          .eq('route_name', updates.route_name || updates.routeName)
          .maybeSingle();
        if (rRow?.id) targetId = rRow.id;
      }

      if (isUuidString(targetId)) {
        const { data: updated, error } = await supabase
          .from('transport_routes')
          .update(payload)
          .eq('id', targetId)
          .select()
          .single();

        const routeStops = stops || updates.stops;
        if (Array.isArray(routeStops)) {
          await supabase.from('transport_stops').delete().eq('route_id', targetId);
          if (routeStops.length > 0) {
            const stopInserts = routeStops.map((st: any, idx: number) => ({
              school_id: updates.school_id || updated?.school_id,
              route_id: targetId,
              stop_name: st.stop_name || `Stop ${idx + 1}`,
              stop_order: Number(st.stop_order) || idx + 1,
              estimated_pickup_time: formatTimeTo24h(st.estimated_pickup_time || '07:30:00'),
              estimated_drop_time: st.estimated_drop_time ? formatTimeTo24h(st.estimated_drop_time) : null,
              address: st.address || null,
            }));
            const { data: insertedStops } = await supabase.from('transport_stops').insert(stopInserts).select();
            return { ...(updated || { id: targetId, ...updates }), stops: insertedStops || stopInserts };
          }
        }

        if (!error && updated) return updated;
        if (error) throw new Error(`Database updateTransportRoute failed: ${error.message}`);
      } else if (updates.school_id) {
        return await this.createTransportRoute({ ...updates, school_id: updates.school_id }, stops);
      }
    }
    return { id, ...updates };
  },

  async deleteTransportRoute(id: string): Promise<void> {
    const supabase = getSupabaseAdmin();
    if (supabase && isUuidString(id)) {
      await supabase.from('transport_stops').delete().eq('route_id', id);
      await supabase.from('transport_routes').delete().eq('id', id);
    }
  },

  async getTransportStops(schoolId: string): Promise<any[]> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { data, error } = await supabase.from('transport_stops').select('*').eq('school_id', schoolId).order('stop_order', { ascending: true });
      if (!error && data) return data;
      if (error) throw new Error(`Database read failed: ${error.message}`);
    }
    return [];
  },

  async createTransportStop(data: any): Promise<any> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const payload: any = {
        school_id: data.school_id,
        stop_name: data.stop_name,
        stop_order: Number(data.stop_order) || 1,
        estimated_pickup_time: formatTimeTo24h(data.estimated_pickup_time || '07:30:00'),
        estimated_drop_time: data.estimated_drop_time ? formatTimeTo24h(data.estimated_drop_time) : null,
        address: data.address || null,
      };
      if (isUuidString(data.id)) payload.id = data.id;
      if (isUuidString(data.route_id)) payload.route_id = data.route_id;

      const { data: created, error } = await supabase.from('transport_stops').insert(payload).select().single();
      if (!error && created) return created;
      if (error) throw new Error(`Database createTransportStop failed: ${error.message}`);
    }
    return data;
  },

  async updateTransportStop(id: string, updates: any): Promise<any> {
    const supabase = getSupabaseAdmin();
    if (supabase && isUuidString(id)) {
      const payload: any = {};
      if (updates.stop_name !== undefined) payload.stop_name = updates.stop_name;
      if (updates.stop_order !== undefined) payload.stop_order = Number(updates.stop_order) || 1;
      if (updates.estimated_pickup_time !== undefined) {
        payload.estimated_pickup_time = formatTimeTo24h(updates.estimated_pickup_time);
      }
      if (updates.estimated_drop_time !== undefined) {
        payload.estimated_drop_time = updates.estimated_drop_time ? formatTimeTo24h(updates.estimated_drop_time) : null;
      }
      if (updates.address !== undefined) payload.address = updates.address;
      if (updates.route_id !== undefined && isUuidString(updates.route_id)) payload.route_id = updates.route_id;

      const { data: updated, error } = await supabase.from('transport_stops').update(payload).eq('id', id).select().single();
      if (!error && updated) return updated;
      if (error) throw new Error(`Database updateTransportStop failed: ${error.message}`);
    }
    return { id, ...updates };
  },

  async deleteTransportStop(id: string): Promise<void> {
    const supabase = getSupabaseAdmin();
    if (supabase && isUuidString(id)) {
      await supabase.from('transport_stops').delete().eq('id', id);
    }
  },

  async getTransportAssignments(schoolId: string): Promise<any[]> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { data, error } = await supabase.from('student_transport_assignments').select('*').eq('school_id', schoolId);
      if (!error && data) return data;
      if (error) throw new Error(`Database read failed: ${error.message}`);
    }
    return [];
  },

  async createTransportAssignment(data: any): Promise<any> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const payload: any = {
        school_id: data.school_id,
        pickup_enabled: data.pickup_enabled !== false,
        drop_enabled: data.drop_enabled !== false,
        status: data.status || 'active',
      };
      if (isUuidString(data.id)) payload.id = data.id;
      if (isUuidString(data.student_id)) payload.student_id = data.student_id;
      if (isUuidString(data.vehicle_id)) payload.vehicle_id = data.vehicle_id;
      if (isUuidString(data.route_id)) payload.route_id = data.route_id;
      if (isUuidString(data.stop_id)) payload.stop_id = data.stop_id;
      if (isUuidString(data.academic_year_id)) payload.academic_year_id = data.academic_year_id;

      const { data: created, error } = await supabase.from('student_transport_assignments').insert(payload).select().single();
      if (!error && created) return created;
      if (error) throw new Error(`Database createTransportAssignment failed: ${error.message}`);
    }
    return data;
  },

  async updateTransportAssignment(id: string, updates: any): Promise<any> {
    const supabase = getSupabaseAdmin();
    if (supabase && isUuidString(id)) {
      const payload: any = {};
      if (updates.pickup_enabled !== undefined) payload.pickup_enabled = updates.pickup_enabled;
      if (updates.drop_enabled !== undefined) payload.drop_enabled = updates.drop_enabled;
      if (updates.status !== undefined) payload.status = updates.status;
      if (updates.vehicle_id !== undefined && isUuidString(updates.vehicle_id)) payload.vehicle_id = updates.vehicle_id;
      if (updates.route_id !== undefined && isUuidString(updates.route_id)) payload.route_id = updates.route_id;
      if (updates.stop_id !== undefined && isUuidString(updates.stop_id)) payload.stop_id = updates.stop_id;

      const { data: updated, error } = await supabase.from('student_transport_assignments').update(payload).eq('id', id).select().single();
      if (!error && updated) return updated;
      if (error) throw new Error(`Database updateTransportAssignment failed: ${error.message}`);
    }
    return { id, ...updates };
  },

  async deleteTransportAssignment(id: string): Promise<void> {
    const supabase = getSupabaseAdmin();
    if (supabase && isUuidString(id)) {
      await supabase.from('student_transport_assignments').delete().eq('id', id);
    }
  },

  async getTransportEvents(schoolId: string, filters?: any): Promise<any[]> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      await this.deleteOldTransportEvents(schoolId);
      let query = supabase.from('student_transport_events').select('*').eq('school_id', schoolId);
      if (filters?.event_date) {
        query = query.eq('event_date', filters.event_date);
      }
      if (filters?.vehicle_id && isUuidString(filters.vehicle_id)) {
        query = query.eq('vehicle_id', filters.vehicle_id);
      }
      const { data, error } = await query;
      if (!error && data) return data;
      if (error) throw new Error(`Database read failed: ${error.message}`);
    }
    return [];
  },

  async createTransportEvent(data: any): Promise<any> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      await this.deleteOldTransportEvents(data.school_id);
      const payload: any = {
        school_id: data.school_id,
        event_type: data.event_type,
        event_date: data.event_date || new Date().toISOString().split('T')[0],
      };
      if (isUuidString(data.id)) payload.id = data.id;
      if (isUuidString(data.student_id)) payload.student_id = data.student_id;
      if (isUuidString(data.transport_assignment_id)) payload.transport_assignment_id = data.transport_assignment_id;
      if (isUuidString(data.vehicle_id)) payload.vehicle_id = data.vehicle_id;
      if (isUuidString(data.route_id)) payload.route_id = data.route_id;
      if (isUuidString(data.stop_id)) payload.stop_id = data.stop_id;
      if (isUuidString(data.recorded_by)) payload.recorded_by = data.recorded_by;
      if (data.notes) payload.notes = data.notes;
      if (data.event_time) {
        try {
          const d = new Date(`${payload.event_date} ${data.event_time}`);
          payload.event_time = !isNaN(d.getTime()) ? d.toISOString() : new Date().toISOString();
        } catch {
          payload.event_time = new Date().toISOString();
        }
      } else {
        payload.event_time = new Date().toISOString();
      }

      const { data: created, error } = await supabase.from('student_transport_events').insert(payload).select().single();
      if (!error && created) return created;
      if (error) console.error('Error creating transport event in Supabase:', error.message);
    }
    return data;
  },

  async deleteTransportEvent(schoolId: string, studentId: string, eventDate?: string, eventType?: string): Promise<void> {
    const supabase = getSupabaseAdmin();
    if (supabase && isUuidString(studentId)) {
      const date = eventDate || new Date().toISOString().split('T')[0];
      let query = supabase
        .from('student_transport_events')
        .delete()
        .eq('school_id', schoolId)
        .eq('student_id', studentId)
        .eq('event_date', date);
      if (eventType) query = query.eq('event_type', eventType);
      await query;
    }
  },

  async deleteOldTransportEvents(schoolId: string): Promise<void> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      await supabase
        .from('student_transport_events')
        .delete()
        .eq('school_id', schoolId)
        .lt('created_at', new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString());
    }
  },

  async getTimetable(schoolId: string): Promise<any[]> {
    const supabase = getSupabaseAdmin();
    if (supabase && isUuidString(schoolId)) {
      const { data, error } = await supabase.from('timetable_entries').select('*').eq('school_id', schoolId);
      if (!error && data) return data;
    }
    const db = initServerDb();
    return db.timetable.filter((t: any) => t.school_id === schoolId);
  },

  async createTimetableEntry(data: any): Promise<any> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const payload = sanitizeSupabasePayload(data);
      if (payload.start_time) payload.start_time = formatTimeTo24h(payload.start_time);
      if (payload.end_time) payload.end_time = formatTimeTo24h(payload.end_time);
      if (payload.day_of_week) payload.day_of_week = Number(payload.day_of_week) || 1;
      const { data: created, error } = await supabase.from('timetable_entries').insert(payload).select().single();
      if (!error && created) return created;
    }
    return data;
  },

  async updateTimetableEntry(id: string, updates: any): Promise<any> {
    const supabase = getSupabaseAdmin();
    if (supabase && isUuidString(id)) {
      const payload = sanitizeSupabasePayload(updates);
      delete payload.id;
      if (payload.start_time) payload.start_time = formatTimeTo24h(payload.start_time);
      if (payload.end_time) payload.end_time = formatTimeTo24h(payload.end_time);
      if (payload.day_of_week) payload.day_of_week = Number(payload.day_of_week);
      const { data: updated, error } = await supabase.from('timetable_entries').update(payload).eq('id', id).select().single();
      if (!error && updated) return updated;
    }
    return { id, ...updates };
  },

  async deleteTimetableEntry(id: string): Promise<void> {
    const supabase = getSupabaseAdmin();
    if (supabase && isUuidString(id)) {
      await supabase.from('timetable_entries').delete().eq('id', id);
    }
  },

  async getStudentAttendances(schoolId: string): Promise<any[]> {
    const supabase = getSupabaseAdmin();
    if (supabase && isUuidString(schoolId)) {
      const { data, error } = await supabase.from('student_attendance').select('*').eq('school_id', schoolId);
      if (!error && data) return data;
    }
    const db = initServerDb();
    return (db.attendance || []).filter((a: any) => a.school_id === schoolId);
  },

  async createStudentAttendance(data: any): Promise<any> {
    const supabase = getSupabaseAdmin();
    if (supabase && isUuidString(data.school_id)) {
      const payload = sanitizeSupabasePayload(data);
      const { data: created, error } = await supabase.from('student_attendance').upsert(payload, { onConflict: 'school_id,student_id,attendance_date' }).select().single();
      if (!error && created) return created;
    }
    return data;
  },

  async getTeacherAttendances(schoolId: string): Promise<any[]> {
    const supabase = getSupabaseAdmin();
    if (supabase && isUuidString(schoolId)) {
      const { data, error } = await supabase.from('teacher_attendance').select('*').eq('school_id', schoolId);
      if (!error && data) return data;
    }
    return [];
  },

  async createTeacherAttendance(data: any): Promise<any> {
    const supabase = getSupabaseAdmin();
    if (supabase && isUuidString(data.school_id)) {
      const payload = sanitizeSupabasePayload(data);
      const { data: created, error } = await supabase.from('teacher_attendance').upsert(payload, { onConflict: 'school_id,teacher_id,attendance_date' }).select().single();
      if (!error && created) return created;
    }
    return data;
  },

  async getStaffAttendances(schoolId: string): Promise<any[]> {
    const supabase = getSupabaseAdmin();
    if (supabase && isUuidString(schoolId)) {
      const { data, error } = await supabase.from('staff_attendance').select('*').eq('school_id', schoolId);
      if (!error && data) return data;
    }
    return [];
  },

  async createStaffAttendance(data: any): Promise<any> {
    const supabase = getSupabaseAdmin();
    if (supabase && isUuidString(data.school_id)) {
      const payload = sanitizeSupabasePayload(data);
      const { data: created, error } = await supabase.from('staff_attendance').upsert(payload, { onConflict: 'school_id,staff_id,attendance_date' }).select().single();
      if (!error && created) return created;
    }
    return data;
  },

  async getStudentLeaves(schoolId: string): Promise<any[]> {
    const supabase = getSupabaseAdmin();
    if (supabase && isUuidString(schoolId)) {
      const { data, error } = await supabase.from('student_leaves').select('*').eq('school_id', schoolId);
      if (!error && data) return data;
    }
    return [];
  },

  async createStudentLeave(data: any): Promise<any> {
    const supabase = getSupabaseAdmin();
    if (supabase && isUuidString(data.school_id)) {
      const payload = sanitizeSupabasePayload(data);
      const { data: created, error } = await supabase.from('student_leaves').insert(payload).select().single();
      if (!error && created) return created;
    }
    return data;
  },

  async updateStudentLeave(id: string, updates: any): Promise<any> {
    const supabase = getSupabaseAdmin();
    if (supabase && isUuidString(id)) {
      const payload = sanitizeSupabasePayload(updates);
      delete payload.id;
      const { data: updated, error } = await supabase.from('student_leaves').update(payload).eq('id', id).select().single();
      if (!error && updated) return updated;
    }
    return { id, ...updates };
  },

  async getTeacherLeaves(schoolId: string): Promise<any[]> {
    const supabase = getSupabaseAdmin();
    if (supabase && isUuidString(schoolId)) {
      const { data, error } = await supabase.from('teacher_leaves').select('*').eq('school_id', schoolId);
      if (!error && data) return data;
    }
    return [];
  },

  async createTeacherLeave(data: any): Promise<any> {
    const supabase = getSupabaseAdmin();
    if (!supabase) throw new Error('School database is not configured.');
    if (supabase) {
      const payload = sanitizeSupabasePayload(data);
      const { data: created, error } = await supabase.from('teacher_leaves').insert(payload).select().single();
      if (!error && created) return created;
      if (error) throw new Error(`Database createTeacherLeave failed: ${error.message}`);
    }
    return data;
  },

  async updateTeacherLeave(id: string, updates: any): Promise<any> {
    const supabase = getSupabaseAdmin();
    if (supabase && isUuidString(id)) {
      const payload = sanitizeSupabasePayload(updates);
      delete payload.id;
      const { data: updated, error } = await supabase.from('teacher_leaves').update(payload).eq('id', id).select().single();
      if (!error && updated) return updated;
      if (error) throw new Error(`Database updateTeacherLeave failed: ${error.message}`);
    }
    return { id, ...updates };
  },

  async getStaffLeaves(schoolId: string): Promise<any[]> {
    const supabase = getSupabaseAdmin();
    if (supabase && isUuidString(schoolId)) {
      const { data, error } = await supabase.from('staff_leaves').select('*').eq('school_id', schoolId);
      if (!error && data) return data;
    }
    return [];
  },

  async createStaffLeave(data: any): Promise<any> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const payload = sanitizeSupabasePayload(data);
      const { data: created, error } = await supabase.from('staff_leaves').insert(payload).select().single();
      if (!error && created) return created;
      if (error) throw new Error(`Database createStaffLeave failed: ${error.message}`);
    }
    return data;
  },

  async updateStaffLeave(id: string, updates: any): Promise<any> {
    const supabase = getSupabaseAdmin();
    if (supabase && isUuidString(id)) {
      const payload = sanitizeSupabasePayload(updates);
      delete payload.id;
      const { data: updated, error } = await supabase.from('staff_leaves').update(payload).eq('id', id).select().single();
      if (!error && updated) return updated;
      if (error) throw new Error(`Database updateStaffLeave failed: ${error.message}`);
    }
    return { id, ...updates };
  },

  async getFeeStructures(schoolId: string): Promise<any[]> {
    const supabase = getSupabaseAdmin();
    if (supabase && isUuidString(schoolId)) {
      const { data, error } = await supabase.from('fee_structures').select('*').eq('school_id', schoolId);
      if (!error && data) return data;
    }
    const db = initServerDb();
    return (db.feeStructures || []).filter((f: any) => f.school_id === schoolId);
  },

  async createFeeStructure(data: any): Promise<any> {
    const supabase = getSupabaseAdmin();
    if (!Number.isFinite(Number(data.amount)) || Number(data.amount) <= 0) throw new Error('A fee amount greater than zero is required.');
    const academicYearId = await this.resolveAcademicYearId(data.school_id, data.academic_year_id, new Date().toISOString().slice(0, 10));
    if (supabase && isUuidString(data.school_id)) {
      const payload = sanitizeSupabasePayload({ ...data, academic_year_id: academicYearId });
      const { data: created, error } = await supabase.from('fee_structures').insert(payload).select().single();
      if (!error && created) return created;
    }
    const db = initServerDb();
    const item = { id: data.id || `fs-${Date.now().toString().slice(-6)}`, ...data, academic_year_id: academicYearId };
    db.feeStructures = db.feeStructures || [];
    db.feeStructures.push(item);
    return item;
  },

  async updateFeeStructure(id: string, updates: any): Promise<any> {
    const supabase = getSupabaseAdmin();
    if (supabase && isUuidString(id)) {
      const payload = sanitizeSupabasePayload(updates);
      delete payload.id;
      const { data: updated, error } = await supabase.from('fee_structures').update(payload).eq('id', id).select().single();
      if (!error && updated) return updated;
    }
    return { id, ...updates };
  },

  async deleteFeeStructure(id: string): Promise<void> {
    const supabase = getSupabaseAdmin();
    if (supabase && isUuidString(id)) {
      await supabase.from('fee_structures').delete().eq('id', id);
    }
  },

  async getFeeInvoices(schoolId: string): Promise<any[]> {
    const supabase = getSupabaseAdmin();
    if (supabase && isUuidString(schoolId)) {
      const { data, error } = await supabase.from('student_fee_invoices').select('*').eq('school_id', schoolId);
      if (!error && data) {
        const [students, structures] = await Promise.all([this.getStudents(schoolId), this.getFeeStructures(schoolId)]);
        const invoices = (data || []).map((row: any) => displayFeeInvoice(row, students.find((student) => student.id === row.student_id), structures.find((structure: any) => structure.id === row.fee_structure_id)));
        const balances = reconcileChargePayments(invoices.map((invoice: any) => ({ ...invoice, amount: invoice.final_amount })), await this.getPaymentReceipts(schoolId), true);
        return invoices.map((invoice: any, index: number) => ({ ...invoice, paid_amount: balances[index].paid_amount, remaining_amount: balances[index].remaining_amount, status: balances[index].status }));
      }
    }
    const db = initServerDb();
    const [students, structures] = await Promise.all([this.getStudents(schoolId), this.getFeeStructures(schoolId)]);
    const invoices = (db.feeInvoices || []).filter((i: any) => i.school_id === schoolId).map((row: any) => displayFeeInvoice(row, students.find((student) => student.id === row.student_id), structures.find((structure: any) => structure.id === row.fee_structure_id)));
    const balances = reconcileChargePayments(invoices.map((invoice: any) => ({ ...invoice, amount: invoice.final_amount })), await this.getPaymentReceipts(schoolId), true);
    return invoices.map((invoice: any, index: number) => ({ ...invoice, paid_amount: balances[index].paid_amount, remaining_amount: balances[index].remaining_amount, status: balances[index].status }));
  },

  async createFeeInvoice(data: any): Promise<any> {
    const supabase = getSupabaseAdmin();
    if (!supabase) throw new Error('Fee database is not configured.');
    const students = await this.getStudents(data.school_id);
    const student = students.find((s) => s.id === data.student_id);
    if (!student) throw new Error('Student not found in this school.');
    const month = String(data.billing_month || '').slice(0, 7);
    const years = await this.getAcademicYears(data.school_id);
    const year = years.find((y: any) => y.id === data.academic_year_id) || years.find((y: any) => y.start_date <= `${month}-01` && `${month}-01` <= y.end_date);
    if (!year) throw new Error('No academic year matches this invoice.');
    const structures = await this.getFeeStructures(data.school_id);
    const structure = structures.find((f: any) => f.id === data.fee_structure_id);
    if (data.fee_structure_id && isUuidString(data.fee_structure_id) && !structure) throw new Error('Fee structure not found in this school.');
    const row = feeInvoiceRow({ ...data, academic_year_id: year.id, fee_structure_id: structure?.id || null });
    const { data: existing, error: lookupError } = await supabase.from('student_fee_invoices').select('*').eq('school_id', data.school_id).eq('student_id', student.id).eq('academic_year_id', year.id).eq('billing_month', row.billing_month);
    if (lookupError) throw new Error(`Could not check existing invoices: ${lookupError.message}`);
    if (existing?.length) throw new Error('An invoice already exists for this student and billing month. Refresh before recording another invoice.');
    const { data: created, error } = await supabase.from('student_fee_invoices').insert(row).select().single();
    if (error || !created) throw new Error(`Invoice was not saved: ${error?.message || 'No saved record returned'}`);
    return displayFeeInvoice(created, student, structure);
  },

  async updateFeeInvoice(id: string, updates: any, schoolId: string): Promise<any> {
    const supabase = getSupabaseAdmin();
    if (!supabase || !isUuidString(id)) throw new Error('A saved database invoice is required before recording payment.');
    const { data: existing, error: readError } = await supabase.from('student_fee_invoices').select('*').eq('id', id).eq('school_id', schoolId).single();
    if (readError || !existing) throw new Error('Invoice not found in this school.');
    const row = feeInvoiceRow({ ...existing, ...updates, school_id: schoolId, student_id: existing.student_id, academic_year_id: existing.academic_year_id, fee_structure_id: existing.fee_structure_id });
    const { data: updated, error } = await supabase.from('student_fee_invoices').update(row).eq('id', id).eq('school_id', schoolId).select().single();
    if (error || !updated) throw new Error(`Invoice payment was not saved: ${error?.message || 'No saved record returned'}`);
    return displayFeeInvoice(updated);
  },

  async getStudentCharges(schoolId: string): Promise<any[]> {
    const db = initServerDb();
    const supabase = getSupabaseAdmin();
    let charges = db.studentCharges.filter((c) => c.school_id === schoolId);
    if (supabase && isUuidString(schoolId)) {
      const { data, error } = await supabase.from('student_charges').select('*').eq('school_id', schoolId);
      if (!error && data?.length) charges = data;
    }
    return reconcileChargePayments(charges, await this.getPaymentReceipts(schoolId));
  },

  async createStudentCharge(data: any): Promise<any> {
    const db = initServerDb();
    const supabase = getSupabaseAdmin();
    let createdItem = data;
    if (supabase) {
      try {
        const payload = sanitizeSupabasePayload(data);
        if (payload.status === 'pending') payload.status = 'unpaid';
        const { data: created, error } = await supabase.from('student_charges').insert(payload).select().single();
        if (error) throw new Error(`Database charge insert failed: ${error.message}`);
        if (created) createdItem = { ...created, status: created.status === 'unpaid' ? 'pending' : created.status };
      } catch (e) {
        throw e;
      }
    }
    const idx = db.studentCharges.findIndex((c) => c.id === createdItem.id);
    if (idx !== -1) {
      db.studentCharges[idx] = { ...db.studentCharges[idx], ...createdItem };
    } else {
      db.studentCharges.unshift(createdItem);
    }
    saveStudentChargesToFile(db.studentCharges);
    return createdItem;
  },

  async updateStudentCharge(id: string, updates: any, schoolId?: string): Promise<any> {
    const db = initServerDb();
    const supabase = getSupabaseAdmin();
    let updatedItem = { id, ...updates };
    if (supabase && isUuidString(id)) {
      try {
        const payload = sanitizeSupabasePayload(updates);
        delete payload.id;
        let query = supabase.from('student_charges').update(payload).eq('id', id);
        if (schoolId) query = query.eq('school_id', schoolId);
        const { data: updated, error } = await query.select().single();
        if (error) throw new Error(`Database charge update failed: ${error.message}`);
        if (!error && updated) updatedItem = updated;
      } catch (e) {
        throw e;
      }
    }
    const idx = db.studentCharges.findIndex((c) => c.id === id && (!schoolId || c.school_id === schoolId));
    if (idx !== -1) {
      db.studentCharges[idx] = { ...db.studentCharges[idx], ...updates, id };
      updatedItem = db.studentCharges[idx];
    } else {
      db.studentCharges.push(updatedItem);
    }
    saveStudentChargesToFile(db.studentCharges);
    return updatedItem;
  },

  async getPaymentReceipts(schoolId: string): Promise<any[]> {
    const supabase = getSupabaseAdmin();
    if (supabase && isUuidString(schoolId)) {
      const { data, error } = await supabase.from('payment_receipts').select('*, items:payment_receipt_items(*)').eq('school_id', schoolId);
      if (!error && data) return data || [];
    }
    const db = initServerDb();
    return (db.paymentReceipts || []).filter((r: any) => r.school_id === schoolId);
  },

  async createPaymentReceipt(data: any): Promise<any> {
    if (!Number.isFinite(data.amount_paid) || data.amount_paid <= 0 || !Number.isFinite(data.total_amount) || data.amount_paid > data.total_amount || !Array.isArray(data.items) || !data.items.length) {
      throw new Error('Invalid payment amount or receipt items.');
    }
    for (const item of data.items) {
      if (!Number.isFinite(item.amount) || (item.item_type !== 'discount' && item.amount < 0)) throw new Error('Invalid receipt item amount.');
    }
    const db = initServerDb();
    const supabase = getSupabaseAdmin();
    if (!supabase) throw new Error('Fee database is not configured.');
    let createdItem = data;
    if (supabase) {
      try {
        const payload = sanitizeSupabasePayload(data);
        delete payload.items;
        const { data: created, error } = await supabase.from('payment_receipts').insert(payload).select().single();
        if (error) throw new Error(`Database receipt insert failed: ${error.message}`);
        const items = (data.items || []).map((item: any, index: number) => {
          const row = sanitizeSupabasePayload(item);
          delete row.id;
          return { ...row, receipt_id: created.id, created_at: new Date(new Date(created.created_at).getTime() + index).toISOString() };
        });
        const { data: savedItems, error: itemError } = items.length
          ? await supabase.from('payment_receipt_items').insert(items).select()
          : { data: [], error: null };
        if (itemError) {
          await supabase.from('payment_receipts').delete().eq('id', created.id);
          throw new Error(`Database receipt items insert failed: ${itemError.message}`);
        }
        createdItem = { ...created, items: savedItems || [] };
      } catch (e) {
        throw e;
      }
    }
    const idx = db.paymentReceipts.findIndex((r) => r.id === createdItem.id || (r.receipt_number && r.receipt_number === createdItem.receipt_number));
    if (idx !== -1) {
      db.paymentReceipts[idx] = { ...db.paymentReceipts[idx], ...createdItem };
    } else {
      db.paymentReceipts.unshift(createdItem);
    }
    savePaymentReceiptsToFile(db.paymentReceipts);
    return createdItem;
  },

  async getEmployeePayments(schoolId: string): Promise<any[]> {
    const supabase = getSupabaseAdmin();
    if (supabase && isUuidString(schoolId)) {
      const { data, error } = await supabase.from('employee_payments').select('*').eq('school_id', schoolId);
      if (!error && data) return data;
    }
    const db = initServerDb();
    return (db.employeePayments || []).filter((p: any) => p.school_id === schoolId);
  },

  async createEmployeePayment(data: any): Promise<any> {
    const supabase = getSupabaseAdmin();
    if (supabase && isUuidString(data.school_id)) {
      const payload = sanitizeSupabasePayload(data);
      const { data: created, error } = await supabase.from('employee_payments').insert(payload).select().single();
      if (!error && created) return created;
    }
    const db = initServerDb();
    const item = { id: data.id || `ep-${Date.now().toString().slice(-6)}`, ...data };
    db.employeePayments = db.employeePayments || [];
    db.employeePayments.push(item);
    return item;
  },

  async updateEmployeePayment(id: string, updates: any, schoolId?: string): Promise<any> {
    const supabase = getSupabaseAdmin();
    if (supabase && isUuidString(id)) {
      const payload = sanitizeSupabasePayload(updates);
      delete payload.id;
      let query = supabase.from('employee_payments').update(payload).eq('id', id);
      if (schoolId && isUuidString(schoolId)) query = query.eq('school_id', schoolId);
      const { data: updated, error } = await query.select().single();
      if (!error && updated) return updated;
    }
    const db = initServerDb();
    const idx = (db.employeePayments || []).findIndex((p: any) => p.id === id);
    if (idx !== -1) {
      db.employeePayments[idx] = { ...db.employeePayments[idx], ...updates };
      return db.employeePayments[idx];
    }
    return { id, ...updates };
  },

  async getTeacherPayments(schoolId: string): Promise<any[]> {
    const supabase = getSupabaseAdmin();
    if (supabase && isUuidString(schoolId)) {
      const { data, error } = await supabase.from('teacher_payments').select('*').eq('school_id', schoolId);
      if (!error && data) return data;
    }
    const db = initServerDb();
    return (db.teacherPayments || []).filter((p: any) => p.school_id === schoolId);
  },

  async createTeacherPayment(data: any): Promise<any> {
    const supabase = getSupabaseAdmin();
    if (supabase && isUuidString(data.school_id)) {
      const payload = sanitizeSupabasePayload(data);
      const { data: created, error } = await supabase.from('teacher_payments').insert(payload).select().single();
      if (!error && created) return created;
    }
    return data;
  },

  async getSalaryHistory(schoolId: string): Promise<any[]> {
    const supabase = getSupabaseAdmin();
    if (supabase && isUuidString(schoolId)) {
      const { data, error } = await supabase.from('employee_salary_history').select('*').eq('school_id', schoolId);
      if (!error && data) return data;
    }
    const db = initServerDb();
    return (db.salaryAdjustments || []).filter((p: any) => p.school_id === schoolId);
  },

  async createSalaryHistory(data: any): Promise<any> {
    const supabase = getSupabaseAdmin();
    if (supabase && isUuidString(data.school_id)) {
      const payload = sanitizeSupabasePayload(data);
      const { data: created, error } = await supabase.from('employee_salary_history').insert(payload).select().single();
      if (!error && created) return created;
    }
    return data;
  },

  async getFeeVersions(schoolId: string, feeStructureId?: string): Promise<any[]> {
    const supabase = getSupabaseAdmin();
    if (supabase && isUuidString(schoolId)) {
      let query = supabase.from('fee_structure_versions').select('*').eq('school_id', schoolId);
      if (feeStructureId && isUuidString(feeStructureId)) {
        query = query.eq('fee_structure_id', feeStructureId);
      }
      const { data, error } = await query.order('effective_from', { ascending: false });
      if (!error && data) return data;
    }
    const db = initServerDb();
    let list = (db.feeStructureVersions || []).filter((v: any) => v.school_id === schoolId);
    if (feeStructureId) {
      list = list.filter((v: any) => v.fee_structure_id === feeStructureId);
    }
    return list.sort((a: any, b: any) => (b.effective_from || '').localeCompare(a.effective_from || ''));
  },

  async createFeeVersion(data: any): Promise<any> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const payload = sanitizeSupabasePayload(data);
      const { data: created, error } = await supabase.from('fee_structure_versions').insert(payload).select().single();
      if (!error && created) {
        initServerDb().feeStructureVersions.unshift(created);
        return created;
      }
      if (error) throw new Error(`Database createFeeVersion failed: ${error.message}`);
    }
    initServerDb().feeStructureVersions.unshift(data);
    return data;
  },

  async updateClassFeeStructure(data: {
    school_id: string;
    fee_structure_id: string;
    class_id: string;
    class_name?: string;
    new_amount: number;
    effective_from: string;
    reason: string;
    actorId?: string;
    actorName?: string;
  }): Promise<{ version: FeeStructureVersion; affectedStudentsCount: number }> {
    const supabase = getSupabaseAdmin();
    const db = initServerDb();
    let struct: any = null;

    if (supabase) {
      const { data: found } = await supabase
        .from('fee_structures')
        .select('*')
        .eq('id', data.fee_structure_id)
        .eq('school_id', data.school_id)
        .maybeSingle();
      struct = found;
    }
    if (!struct) {
      struct = db.feeStructures.find((s: any) => s.id === data.fee_structure_id && s.school_id === data.school_id);
    }
    if (!struct) throw new Error('Fee structure not found');

    const oldAmount = struct.amount;

    // 1. Close previous version if exists
    if (supabase) {
      await supabase
        .from('fee_structure_versions')
        .update({ effective_to: data.effective_from })
        .eq('fee_structure_id', data.fee_structure_id)
        .is('effective_to', null);
    }
    const lastVersionIndex = db.feeStructureVersions.findIndex(
      (v: any) => v.fee_structure_id === data.fee_structure_id && !v.effective_to
    );
    if (lastVersionIndex !== -1) {
      db.feeStructureVersions[lastVersionIndex].effective_to = data.effective_from;
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

    if (supabase) {
      const payload = sanitizeSupabasePayload(newVersion);
      await supabase.from('fee_structure_versions').insert(payload);
    }
    db.feeStructureVersions.unshift(newVersion);

    // 3. Update structure amount
    if (supabase) {
      await supabase
        .from('fee_structures')
        .update({ amount: data.new_amount })
        .eq('id', data.fee_structure_id);
    }
    const sIdx = db.feeStructures.findIndex((s: any) => s.id === data.fee_structure_id);
    if (sIdx !== -1) {
      db.feeStructures[sIdx].amount = data.new_amount;
    }

    // 4. Count affected students
    const students = await this.getStudents(data.school_id);
    const affected = students.filter(
      (st: any) => data.class_id === 'all' || st.current_enrollment?.class_id === data.class_id
    );

    // 5. Audit log
    await this.logAuthEvent({
      school_id: data.school_id,
      user_id: data.actorId || 'usr-admin-01',
      event_type: 'fee_structure_changed',
      success: true,
      role: 'school_admin',
      user_name: data.actorName || 'School Administrator',
      details: {
        structureName: struct.name,
        className: data.class_name || 'Class',
        oldAmount,
        newAmount: data.new_amount,
        effectiveFrom: data.effective_from,
        reason: data.reason,
        affectedStudents: affected.length,
      },
    });

    return { version: newVersion, affectedStudentsCount: affected.length };
  },

  async getBulkChargeBatchs(schoolId: string): Promise<any[]> {
    const supabase = getSupabaseAdmin();
    if (supabase && isUuidString(schoolId)) {
      const { data, error } = await supabase.from('bulk_charge_batches').select('*').eq('school_id', schoolId).order('created_at', { ascending: false });
      if (!error && data) return data;
    }
    const db = initServerDb();
    return (db.bulkChargeBatches || []).filter((b: any) => b.school_id === schoolId).sort((a: any, b: any) => (b.created_at || '').localeCompare(a.created_at || ''));
  },

  async createBulkChargeBatch(data: any): Promise<any> {
    const supabase = getSupabaseAdmin();
    const batchId = isUuidString(data.id) ? data.id : (supabase ? undefined : `bcb-${Date.now().toString().slice(-4)}`);
    const nowIso = new Date().toISOString();
    const chargeDate = data.charge_date || nowIso.split('T')[0];

    // 1. Get eligible students
    const allStudents = await this.getStudents(data.school_id);
    const targetIds = Array.isArray(data.target_student_ids) ? data.target_student_ids : [];
    const eligibleStudents = allStudents.filter(
      (s: any) => s.school_id === data.school_id && targetIds.includes(s.id)
    );

    const totalAmount = (Number(data.amount) || 0) * eligibleStudents.length;

    const batchRecord: any = {
      ...(batchId ? { id: batchId } : {}),
      school_id: data.school_id,
      academic_year_id: data.academic_year_id,
      name: (data.name || '').trim(),
      amount: Number(data.amount) || 0,
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

    let createdBatch = batchRecord;
    if (supabase) {
      const payload = sanitizeSupabasePayload(batchRecord);
      const { data: created, error } = await supabase.from('bulk_charge_batches').insert(payload).select().single();
      if (error || !created) throw new Error(`Database createBulkChargeBatch failed: ${error?.message}`);
      createdBatch = created;
    }
    const db = initServerDb();
    if (!createdBatch.id) createdBatch.id = `bcb-${Date.now().toString().slice(-4)}`;
    db.bulkChargeBatches.unshift(createdBatch);

    // 2. Create student charges for each eligible student
    const newStudentCharges: any[] = eligibleStudents.map((std: any, idx: number) => ({
      id: `chg-${Date.now().toString().slice(-4)}-${idx + 1}`,
      school_id: data.school_id,
      student_id: std.id,
      academic_year_id: data.academic_year_id,
      charge_name: (data.name || '').trim(),
      description: data.description?.trim() || undefined,
      amount: Number(data.amount) || 0,
      paid_amount: 0,
      remaining_amount: Number(data.amount) || 0,
      charge_date: chargeDate,
      due_date: data.due_date || undefined,
      status: 'unpaid',
      created_by: data.actorId,
      created_by_name: data.actorName || 'School Administrator',
      student_name: `${std.first_name || ''} ${std.last_name || ''}`.trim(),
      registration_number: std.registration_number,
      bulk_charge_batch_id: createdBatch.id,
      created_at: nowIso,
      updated_at: nowIso,
    }));

    if (supabase && newStudentCharges.length > 0) {
      const payloads = newStudentCharges.map((chg) => {
        const p = sanitizeSupabasePayload(chg);
        delete p.id;
        return p;
      });
      const { error: chgErr } = await supabase.from('student_charges').insert(payloads);
      if (chgErr) console.warn('Supabase student charges batch insert notice:', chgErr.message);
    }
    db.studentCharges.unshift(...newStudentCharges);

    await this.logAuthEvent({
      school_id: data.school_id,
      user_id: data.actorId || 'usr-admin-01',
      event_type: 'bulk_charge_created',
      success: true,
      role: 'school_admin',
      user_name: data.actorName || 'School Administrator',
      details: {
        batchId: createdBatch.id,
        chargeName: data.name,
        amount: data.amount,
        target: data.target_label,
        studentsCount: eligibleStudents.length,
        totalAmount,
      },
    });

    return { batch: createdBatch, chargesCreated: newStudentCharges.length };
  },

  async updateBulkChargeBatch(id: string, updates: any): Promise<any> {
    const supabase = getSupabaseAdmin();
    if (supabase && isUuidString(id)) {
      const payload = sanitizeSupabasePayload(updates);
      delete payload.id;
      const { data: updated, error } = await supabase.from('bulk_charge_batches').update(payload).eq('id', id).select().single();
      if (!error && updated) return updated;
      if (error) throw new Error(`Database updateBulkChargeBatch failed: ${error.message}`);
    }
    const db = initServerDb();
    const idx = db.bulkChargeBatches.findIndex((b: any) => b.id === id);
    if (idx !== -1) {
      db.bulkChargeBatches[idx] = { ...db.bulkChargeBatches[idx], ...updates };
      return db.bulkChargeBatches[idx];
    }
    return { id, ...updates };
  },

  async cancelBulkChargeBatch(schoolId: string, batchId: string, actorId?: string, actorName?: string): Promise<any> {
    const supabase = getSupabaseAdmin();
    const db = initServerDb();

    let batch: any = null;
    if (supabase) {
      const { data: found } = await supabase.from('bulk_charge_batches').select('*').eq('id', batchId).eq('school_id', schoolId).maybeSingle();
      batch = found;
    }
    if (!batch) {
      batch = db.bulkChargeBatches.find((b: any) => b.id === batchId && b.school_id === schoolId);
    }
    if (!batch) throw new Error('Bulk charge batch not found');

    let batchCharges: any[] = [];
    if (supabase) {
      const { data: chgs } = await supabase.from('student_charges').select('*').eq('bulk_charge_batch_id', batchId);
      if (chgs) batchCharges = chgs;
    }
    if (batchCharges.length === 0) {
      batchCharges = db.studentCharges.filter((c: any) => c.bulk_charge_batch_id === batchId);
    }

    const paidCount = batchCharges.filter((c: any) => (Number(c.paid_amount) || 0) > 0).length;
    if (paidCount > 0) {
      throw new Error(
        `Cannot cancel batch: ${paidCount} students have already made payments against this charge. Please refund or adjust individual receipts first.`
      );
    }

    const nowIso = new Date().toISOString();
    if (supabase) {
      await supabase
        .from('student_charges')
        .update({ status: 'cancelled', waive_reason: 'Bulk charge batch cancelled by administrator', updated_at: nowIso })
        .eq('bulk_charge_batch_id', batchId);
    }
    db.studentCharges.forEach((c: any) => {
      if (c.bulk_charge_batch_id === batchId) {
        c.status = 'cancelled';
        c.waive_reason = 'Bulk charge batch cancelled by administrator';
        c.updated_at = nowIso;
      }
    });

    if (supabase) {
      await supabase
        .from('bulk_charge_batches')
        .update({
          status: 'cancelled',
          cancelled_at: nowIso,
          cancelled_by: actorName || 'School Administrator',
        })
        .eq('id', batchId);
    }
    const bIdx = db.bulkChargeBatches.findIndex((b: any) => b.id === batchId);
    if (bIdx !== -1) {
      db.bulkChargeBatches[bIdx].status = 'cancelled';
      db.bulkChargeBatches[bIdx].cancelled_at = nowIso;
      db.bulkChargeBatches[bIdx].cancelled_by = actorName || 'School Administrator';
    }

    await this.logAuthEvent({
      school_id: schoolId,
      user_id: actorId || 'usr-admin-01',
      event_type: 'bulk_charge_cancelled',
      success: true,
      role: 'school_admin',
      user_name: actorName || 'School Administrator',
      details: { batchId, cancelledChargesCount: batchCharges.length },
    });

    return { success: true, cancelledChargesCount: batchCharges.length };
  },

  async getExams(schoolId: string): Promise<any[]> {
    const supabase = getSupabaseAdmin();
    if (supabase && isUuidString(schoolId)) {
      const { data, error } = await supabase.from('exams').select('*').eq('school_id', schoolId);
      if (!error && data) return data;
    }
    const db = initServerDb();
    return (db.exams || []).filter((e: any) => e.school_id === schoolId);
  },

  async createExam(data: any): Promise<any> {
    const supabase = getSupabaseAdmin();
    if (supabase && isUuidString(data.school_id)) {
      const payload = sanitizeSupabasePayload(data);
      const { data: created, error } = await supabase.from('exams').insert(payload).select().single();
      if (!error && created) return created;
    }
    const db = initServerDb();
    const item = { id: data.id || `ex-${Date.now().toString().slice(-6)}`, ...data };
    db.exams = db.exams || [];
    db.exams.push(item);
    return item;
  },

  async updateExam(id: string, updates: any): Promise<any> {
    const supabase = getSupabaseAdmin();
    if (supabase && isUuidString(id)) {
      const payload = sanitizeSupabasePayload(updates);
      delete payload.id;
      const { data: updated, error } = await supabase.from('exams').update(payload).eq('id', id).select().single();
      if (!error && updated) return updated;
    }
    return { id, ...updates };
  },

  async deleteExam(id: string): Promise<void> {
    const supabase = getSupabaseAdmin();
    if (supabase && isUuidString(id)) {
      await supabase.from('exams').delete().eq('id', id);
    }
  },

  async getExamResults(schoolId: string): Promise<any[]> {
    const supabase = getSupabaseAdmin();
    if (supabase && isUuidString(schoolId)) {
      const { data, error } = await supabase.from('exam_results').select('*').eq('school_id', schoolId);
      if (!error && data) return data;
    }
    const db = initServerDb();
    return (db.examResults || []).filter((r: any) => r.school_id === schoolId);
  },

  async createExamResult(data: any): Promise<any> {
    const supabase = getSupabaseAdmin();
    if (supabase && isUuidString(data.school_id)) {
      const payload = sanitizeSupabasePayload(data);
      const { data: created, error } = await supabase.from('exam_results').upsert(payload, { onConflict: 'exam_id,student_id' }).select().single();
      if (!error && created) return created;
    }
    const db = initServerDb();
    const item = { id: data.id || `er-${Date.now().toString().slice(-6)}`, ...data };
    db.examResults = db.examResults || [];
    db.examResults.push(item);
    return item;
  },

  async updateExamResult(id: string, updates: any): Promise<any> {
    const supabase = getSupabaseAdmin();
    if (supabase && isUuidString(id)) {
      const payload = sanitizeSupabasePayload(updates);
      delete payload.id;
      const { data: updated, error } = await supabase.from('exam_results').update(payload).eq('id', id).select().single();
      if (!error && updated) return updated;
    }
    return { id, ...updates };
  },

  async getNotices(schoolId: string): Promise<any[]> {
    const supabase = getSupabaseAdmin();
    if (supabase && isUuidString(schoolId)) {
      const { data, error } = await supabase.from('notices').select('*').eq('school_id', schoolId);
      if (!error && data) return data;
    }
    const db = initServerDb();
    return (db.notices || []).filter((n: any) => n.school_id === schoolId);
  },

  async createNotice(data: any): Promise<any> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const payload = sanitizeSupabasePayload(data);
      const { data: created, error } = await supabase.from('notices').insert(payload).select().single();
      if (!error && created) return created;
      if (error) throw new Error(`Database createNotice failed: ${error.message}`);
    }
    return data;
  },

  async updateNotice(id: string, updates: any): Promise<any> {
    const supabase = getSupabaseAdmin();
    if (supabase && isUuidString(id)) {
      const payload = sanitizeSupabasePayload(updates);
      delete payload.id;
      const { data: updated, error } = await supabase.from('notices').update(payload).eq('id', id).select().single();
      if (!error && updated) return updated;
      if (error) throw new Error(`Database updateNotice failed: ${error.message}`);
    }
    return { id, ...updates };
  },

  async deleteNotice(id: string): Promise<void> {
    const supabase = getSupabaseAdmin();
    if (supabase && isUuidString(id)) {
      await supabase.from('notices').delete().eq('id', id);
    }
  },

  async getNotifications(schoolId: string): Promise<any[]> {
    const supabase = getSupabaseAdmin();
    if (supabase && isUuidString(schoolId)) {
      const { data, error } = await supabase.from('app_notifications').select('*').eq('school_id', schoolId);
      if (!error && data) return data;
    }
    const db = initServerDb();
    return (db.authEvents || []).filter((n: any) => n.school_id === schoolId);
  },

  async createNotification(data: any): Promise<any> {
    const supabase = getSupabaseAdmin();
    if (supabase && isUuidString(data.school_id)) {
      const payload = sanitizeSupabasePayload(data);
      const { data: created, error } = await supabase.from('app_notifications').insert(payload).select().single();
      if (!error && created) return created;
    }
    return data;
  },

  async updateNotification(id: string,
    schoolId: string, updates: any): Promise<any> {
    const supabase = getSupabaseAdmin();
    if (supabase && isUuidString(id)) {
      const payload = sanitizeSupabasePayload(updates);
      delete payload.id;
      let query = supabase.from('app_notifications').update(payload).eq('id', id);
      if (isUuidString(schoolId)) query = query.eq('school_id', schoolId);
      const { data: updated, error } = await query.select().single();
      if (!error && updated) return updated;
    }
    return { id, ...updates };
  },

  async getParents(schoolId: string): Promise<any[]> {
    const supabase = getSupabaseAdmin();
    if (supabase && isUuidString(schoolId)) {
      const { data, error } = await supabase.from('parent_profiles').select('*').eq('school_id', schoolId);
      if (!error && data) return data;
    }
    const db = initServerDb();
    return (db.parents || []).filter((p: any) => p.school_id === schoolId);
  },

  async createParent(data: any): Promise<any> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const payload = sanitizeSupabasePayload(data);
      const { data: created, error } = await supabase.from('parent_profiles').insert(payload).select().single();
      if (!error && created) return created;
      if (error) throw new Error(`Database parent insert failed: ${error.message}`);
    }
    const db = initServerDb();
    if (!db.parents) db.parents = [];
    db.parents.unshift(data);
    return data;
  },

  async updateParent(id: string, updates: any): Promise<any> {
    const supabase = getSupabaseAdmin();
    if (supabase && isUuidString(id)) {
      const payload = sanitizeSupabasePayload(updates);
      delete payload.id;
      const { data: updated, error } = await supabase.from('parent_profiles').update(payload).eq('id', id).select().single();
      if (!error && updated) return updated;
      if (error) throw new Error(`Database parent update failed: ${error.message}`);
    }
    return { id, ...updates };
  },

  async deleteParent(id: string): Promise<void> {
    const supabase = getSupabaseAdmin();
    if (supabase && isUuidString(id)) {
      await supabase.from('parent_profiles').delete().eq('id', id);
    }
  },

  async getParentLinks(schoolId: string): Promise<any[]> {
    const supabase = getSupabaseAdmin();
    if (supabase && isUuidString(schoolId)) {
      const { data, error } = await supabase.from('parent_student_links').select('*').eq('school_id', schoolId);
      if (!error && data) return data;
    }
    const db = initServerDb();
    return (db.parentLinks || []).filter((l: any) => l.school_id === schoolId);
  },

  async createParentLink(data: any): Promise<any> {
    const supabase = getSupabaseAdmin();
    if (supabase && isUuidString(data.school_id)) {
      const payload = sanitizeSupabasePayload(data);
      const { data: created, error } = await supabase.from('parent_student_links').insert(payload).select().single();
      if (!error && created) return created;
    }
    return data;
  },

  async deleteParentLink(id: string): Promise<void> {
    const supabase = getSupabaseAdmin();
    if (supabase && isUuidString(id)) {
      await supabase.from('parent_student_links').delete().eq('id', id);
    }
  },

  async getEnquiries(schoolId: string): Promise<any[]> {
    const supabase = getSupabaseAdmin();
    if (supabase && isUuidString(schoolId)) {
      const { data, error } = await supabase.from('admission_enquiries').select('*').eq('school_id', schoolId);
      if (!error && data) return data;
    }
    return [];
  },

  async createEnquiry(data: any): Promise<any> {
    const supabase = getSupabaseAdmin();
    if (supabase && isUuidString(data.school_id)) {
      const payload = sanitizeSupabasePayload(data);
      const { data: created, error } = await supabase.from('admission_enquiries').insert(payload).select().single();
      if (!error && created) return created;
    }
    return data;
  },

  async updateEnquiry(id: string,
    schoolId: string, updates: any): Promise<any> {
    const supabase = getSupabaseAdmin();
    if (supabase && isUuidString(id)) {
      const payload = sanitizeSupabasePayload(updates);
      delete payload.id;
      let query = supabase.from('admission_enquiries').update(payload).eq('id', id);
      if (isUuidString(schoolId)) query = query.eq('school_id', schoolId);
      const { data: updated, error } = await query.select().single();
      if (!error && updated) return updated;
    }
    return { id, ...updates };
  },

  async getFollowUps(schoolId: string): Promise<any[]> {
    const supabase = getSupabaseAdmin();
    if (supabase && isUuidString(schoolId)) {
      const { data, error } = await supabase.from('student_followups').select('*').eq('school_id', schoolId);
      if (!error && data) return data;
    }
    return [];
  },

  async createFollowUp(data: any): Promise<any> {
    const supabase = getSupabaseAdmin();
    if (supabase && isUuidString(data.school_id)) {
      const payload = sanitizeSupabasePayload(data);
      const { data: created, error } = await supabase.from('student_followups').insert(payload).select().single();
      if (!error && created) return created;
    }
    return data;
  },

  async updateFollowUp(id: string,
    schoolId: string, updates: any): Promise<any> {
    const supabase = getSupabaseAdmin();
    if (supabase && isUuidString(id)) {
      const payload = sanitizeSupabasePayload(updates);
      delete payload.id;
      let query = supabase.from('student_followups').update(payload).eq('id', id);
      if (isUuidString(schoolId)) query = query.eq('school_id', schoolId);
      const { data: updated, error } = await query.select().single();
      if (!error && updated) return updated;
    }
    return { id, ...updates };
  },

  async getTransitionBatchs(schoolId: string): Promise<any[]> {
    const supabase = getSupabaseAdmin();
    if (supabase && isUuidString(schoolId)) {
      const { data, error } = await supabase.from('academic_year_transition_batches').select('*').eq('school_id', schoolId).order('created_at', { ascending: false });
      if (!error && data) return data;
    }
    const db = initServerDb();
    return (db.transitionBatches || []).filter((b: any) => b.school_id === schoolId).sort((a: any, b: any) => (b.created_at || '').localeCompare(a.created_at || ''));
  },

  async createTransitionBatch(data: any): Promise<any> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const payload = sanitizeSupabasePayload(data);
      const { data: created, error } = await supabase.from('academic_year_transition_batches').insert(payload).select().single();
      if (!error && created) {
        initServerDb().transitionBatches.unshift(created);
        return created;
      }
      if (error) throw new Error(`Database createTransitionBatch failed: ${error.message}`);
    }
    initServerDb().transitionBatches.unshift(data);
    return data;
  },

  async updateTransitionBatch(id: string, updates: any): Promise<any> {
    const supabase = getSupabaseAdmin();
    if (supabase && isUuidString(id)) {
      const payload = sanitizeSupabasePayload(updates);
      delete payload.id;
      const { data: updated, error } = await supabase.from('academic_year_transition_batches').update(payload).eq('id', id).select().single();
      if (!error && updated) return updated;
      if (error) throw new Error(`Database updateTransitionBatch failed: ${error.message}`);
    }
    const db = initServerDb();
    const idx = db.transitionBatches.findIndex((b: any) => b.id === id);
    if (idx !== -1) {
      db.transitionBatches[idx] = { ...db.transitionBatches[idx], ...updates };
      return db.transitionBatches[idx];
    }
    return { id, ...updates };
  },

  async getTransitionSuggestions(
    schoolId: string,
    sourceYearId: string,
    targetYearId: string
  ): Promise<{
    items: StudentTransitionItem[];
    summary: TransitionSummaryBreakdown;
    sourceYear: any;
    targetYear: any;
  }> {
    const students = await this.getStudents(schoolId);
    const classes = await this.getClasses(schoolId);
    const sections = await this.getSections(schoolId);
    const academicYears = await this.getAcademicYears(schoolId);

    const sourceYear = academicYears.find((y: any) => y.id === sourceYearId) || academicYears[0] || null;
    const targetYear = academicYears.find((y: any) => y.id === targetYearId) || academicYears.find((y: any) => y.id !== sourceYearId) || null;

    const items: StudentTransitionItem[] = students.map((st: any) => {
      const enr = st.current_enrollment;
      const currentClass = classes.find((c: any) => c.id === enr?.class_id);
      const currentSection = sections.find((s: any) => s.id === enr?.section_id);

      let suggestedDecision: any = 'promote';
      let targetClassId: string | undefined = currentClass?.next_class_id;
      let targetClassName: string | undefined = currentClass?.next_class_name;
      let targetSectionId: string | undefined = enr?.section_id;
      let targetSectionName: string | undefined = enr?.section_name;
      let notes: string | undefined = st.academic_status_note;
      let isException = false;
      let requiresResolution = false;

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
        if (currentClass?.next_class_id) {
          suggestedDecision = 'promote';
          targetClassId = currentClass.next_class_id;
          const nextCls = classes.find((c: any) => c.id === currentClass.next_class_id);
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
        student_name: `${st.first_name || ''} ${st.last_name || ''}`.trim(),
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
    const pendingItems = (params.items || []).filter((i) => i.selected_decision === 'pending');
    if (pendingItems.length > 0) {
      throw new Error(
        `Cannot execute transition with ${pendingItems.length} student(s) still in Pending Decision status. Please resolve all pending decisions first.`
      );
    }

    const students = await this.getStudents(schoolId);
    const classes = await this.getClasses(schoolId);
    const academicYears = await this.getAcademicYears(schoolId);
    const sourceYear = academicYears.find((y: any) => y.id === params.sourceYearId);
    const targetYear = academicYears.find((y: any) => y.id === params.targetYearId);

    const batchId = `trb-${Date.now().toString().slice(-4)}`;
    const decisionsRecord: any[] = [];

    let promotedCount = 0;
    let repeatedCount = 0;
    let leftCount = 0;
    let graduatedCount = 0;

    for (const item of params.items) {
      const student = students.find((s: any) => s.id === item.student_id);
      if (!student) continue;

      const previousEnrollment = student.current_enrollment;
      const prevEnrollmentId = previousEnrollment?.id || `enr-prev-${item.student_id}`;
      let newEnrollmentId: string | undefined = undefined;
      let newStatus = student.status || 'active';
      let newEnrollment: any = undefined;

      if (item.selected_decision === 'promote') {
        promotedCount += 1;
        newEnrollmentId = `enr-${Date.now().toString().slice(-4)}-${student.id.slice(-3)}`;
        const targetCls = classes.find((c: any) => c.id === item.target_class_id);
        newEnrollment = {
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
        newStatus = 'active';
      } else if (item.selected_decision === 'repeat') {
        repeatedCount += 1;
        newEnrollmentId = `enr-${Date.now().toString().slice(-4)}-${student.id.slice(-3)}`;
        newEnrollment = {
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
        newStatus = 'active';
      } else if (item.selected_decision === 'left_school' || item.selected_decision === 'transfer_out') {
        leftCount += 1;
        newStatus = 'inactive';
      } else if (item.selected_decision === 'graduate') {
        graduatedCount += 1;
        newStatus = 'inactive';
      }

      const updatedEnrollments = student.enrollments ? [...student.enrollments] : [];
      if (previousEnrollment && !updatedEnrollments.some((e: any) => e.id === previousEnrollment.id)) {
        updatedEnrollments.push(previousEnrollment);
      }
      if (newEnrollment) {
        updatedEnrollments.push(newEnrollment);
      }

      await this.updateStudent(student.id, {
        status: newStatus,
        ...(newEnrollment ? { current_enrollment: newEnrollment, enrollments: updatedEnrollments } : {}),
      });

      decisionsRecord.push({
        student_id: student.id,
        student_name: `${student.first_name || ''} ${student.last_name || ''}`.trim(),
        decision: item.selected_decision,
        previous_enrollment_id: prevEnrollmentId,
        new_enrollment_id: newEnrollmentId,
        target_class_name: item.target_class_name,
        target_section_name: item.target_section_name,
      });
    }

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

    const supabase = getSupabaseAdmin();
    if (supabase) {
      const payload = sanitizeSupabasePayload(batch);
      await supabase.from('academic_year_transition_batches').insert(payload);
    }
    const db = initServerDb();
    db.transitionBatches.unshift(batch);

    await this.logAuthEvent({
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

    return batch;
  },

  async canReverseTransition(schoolId: string, targetYearId: string): Promise<any> {
    const attendance = await this.getStudentAttendances(schoolId);
    const invoices = await this.getFeeInvoices(schoolId);
    const exams = await this.getExams(schoolId);

    const targetAttendance = attendance.filter((a: any) => a.academic_year_id === targetYearId);
    const targetPaidInvoices = invoices.filter(
      (i: any) => i.academic_year_id === targetYearId && (Number(i.paid_amount) || 0) > 0
    );
    const targetExams = exams.filter(
      (e: any) => e.academic_year_id === targetYearId && e.status === 'published'
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

    return { canReverse: true, details };
  },

  async reverseAcademicYearTransition(
    schoolId: string,
    batchId: string,
    actorName: string = 'School Admin',
    actorId?: string
  ): Promise<AcademicYearTransitionBatch> {
    const batches = await this.getTransitionBatchs(schoolId);
    const batch = batches.find((b: any) => b.id === batchId && b.school_id === schoolId);
    if (!batch) throw new Error('Transition batch not found');
    if (batch.status === 'reversed') throw new Error('This transition has already been reversed.');

    const check = await this.canReverseTransition(schoolId, batch.target_academic_year_id);
    if (!check.canReverse) {
      throw new Error(check.reason || 'Operational records exist. Cannot reverse transition.');
    }

    const students = await this.getStudents(schoolId);
    for (const d of batch.decisions || []) {
      const student = students.find((s: any) => s.id === d.student_id);
      if (!student) continue;

      let enrollments = (student.enrollments || []).filter((e: any) => e.id !== d.new_enrollment_id);
      const prev =
        enrollments.find((e: any) => e.id === d.previous_enrollment_id) ||
        enrollments[enrollments.length - 1] ||
        student.current_enrollment;

      await this.updateStudent(student.id, {
        status: 'active',
        current_enrollment: prev,
        enrollments,
      });
    }

    batch.status = 'reversed';
    batch.reversed_at = new Date().toISOString();
    batch.reversed_by_name = actorName;

    const supabase = getSupabaseAdmin();
    if (supabase) {
      await supabase
        .from('academic_year_transition_batches')
        .update({ status: 'reversed', reversed_at: batch.reversed_at, reversed_by_name: actorName })
        .eq('id', batchId);
    }
    const db = initServerDb();
    const idx = db.transitionBatches.findIndex((b: any) => b.id === batchId);
    if (idx !== -1) {
      db.transitionBatches[idx] = batch;
    }

    await this.logAuthEvent({
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

    return batch;
  },

  async addToRecycleBin(data: any): Promise<any> {
    const deletedAt = new Date();
    const purgeAt = new Date(deletedAt.getTime() + 30 * 24 * 60 * 60 * 1000);
    const binItem: RecycleBinItem = {
      id: `bin-${Date.now().toString().slice(-4)}`,
      school_id: data.school_id || data.schoolId,
      school_name: data.school_name || data.schoolName,
      entity_type: data.entity_type || data.entityType,
      entity_id: data.entity_id || data.entityId,
      entity_name: data.entity_name || data.entityName,
      entity_details: data.entity_details || data.entityDetails,
      original_data: data.original_data || data.originalData,
      deleted_by_name: data.deleted_by_name || data.deletedByName,
      deleted_by_role: data.deleted_by_role || data.deletedByRole,
      deleted_at: deletedAt.toISOString(),
      permanent_purge_at: purgeAt.toISOString(),
      status: 'in_bin',
    };

    const supabase = getSupabaseAdmin();
    if (supabase) {
      const payload = sanitizeSupabasePayload(binItem);
      const { data: created, error } = await supabase.from('recycle_bin_items').insert(payload).select().single();
      if (!error && created) {
        initServerDb().recycleBin.unshift(created);
        return created;
      }
      if (error) throw new Error(`Database recycle-bin insert failed: ${error.message}`);
    }
    const db = initServerDb();
    db.recycleBin.unshift(binItem);
    return binItem;
  },

  async getRecycleBinItems(schoolId: string): Promise<any[]> {
    const now = new Date();
    const supabase = getSupabaseAdmin();
    if (supabase && isUuidString(schoolId)) {
      const { data, error } = await supabase
        .from('recycle_bin_items')
        .select('*')
        .eq('school_id', schoolId)
        .eq('status', 'in_bin');
      if (!error && data) {
        const active = data.filter((item: any) => new Date(item.permanent_purge_at) > now);
        return active;
      }
    }
    const db = initServerDb();
    return db.recycleBin.filter((item: any) => {
      const belongs = item.school_id === schoolId || !item.school_id;
      if (!belongs) return false;
      if (item.status === 'in_bin' && new Date(item.permanent_purge_at) <= now) {
        item.status = 'purged';
        return false;
      }
      return item.status === 'in_bin';
    });
  },

  async restoreFromRecycleBin(id: string, restoredByName: string, schoolId?: string): Promise<any> {
    const supabase = getSupabaseAdmin();
    const db = initServerDb();
    let item: any = null;

    if (supabase) {
      const { data } = await supabase.from('recycle_bin_items').select('*').eq('id', id).maybeSingle();
      item = data;
    }
    if (!item) {
      item = db.recycleBin.find((i: any) => i.id === id);
    }
    if (!item) throw new Error('Recycle Bin item not found');
    if (schoolId && item.school_id && item.school_id !== schoolId) {
      throw new Error('Unauthorized access to recycle bin item');
    }
    if (item.status !== 'in_bin') throw new Error(`This item is already ${item.status}.`);

    const nowIso = new Date().toISOString();
    item.status = 'restored';
    item.restored_at = nowIso;
    item.restored_by = restoredByName;

    if (supabase) {
      await supabase.from('recycle_bin_items').update({ status: 'restored', restored_at: nowIso, restored_by: restoredByName }).eq('id', id);
    }
    const idx = db.recycleBin.findIndex((i: any) => i.id === id);
    if (idx !== -1) db.recycleBin[idx] = item;

    const data = item.original_data;
    if (data && data.id) {
      if (item.entity_type === 'teacher') {
        const teachers = await this.getTeachers(item.school_id);
        if (teachers.some((t: any) => t.id === data.id)) {
          await this.updateTeacher(data.id, { status: 'active' });
        } else {
          await this.createTeacher({ ...data, status: 'active' });
        }
      } else if (item.entity_type === 'student') {
        const students = await this.getStudents(item.school_id);
        if (students.some((s: any) => s.id === data.id)) {
          await this.updateStudent(data.id, { status: 'active' });
        } else {
          await this.createStudent({ ...data, status: 'active' });
        }
      } else if (item.entity_type === 'staff') {
        const staffList = await this.getStaff(item.school_id);
        if (staffList.some((s: any) => s.id === data.id)) {
          await this.updateStaff(data.id, { status: 'active' });
        } else {
          await this.createStaff({ ...data, status: 'active' });
        }
      } else if (item.entity_type === 'school') {
        await this.updateSchool(data.id, { status: 'active', pending_deletion_until: undefined });
      } else if (item.entity_type === 'room') {
        await this.createRoom(data);
      } else if (item.entity_type === 'vehicle') {
        await this.createVehicle(data);
      } else if (item.entity_type === 'route') {
        await this.createTransportRoute(data);
      } else if (item.entity_type === 'notice') {
        await this.createNotice(data);
      } else if (item.entity_type === 'holiday') {
        await this.createHoliday(data);
      }
    }

    await this.logAuthEvent({
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

    return item;
  },

  async removeFromRecycleBin(id: string): Promise<void> {
    const supabase = getSupabaseAdmin();
    if (supabase && isUuidString(id)) {
      await supabase.from('recycle_bin_items').delete().eq('id', id);
    }
  },

  async getAccountDeletionRequests(schoolId?: string, requestedBy?: string): Promise<AccountDeletionRequest[]> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      let query = supabase.from('account_deletion_requests').select('*');
      if (schoolId) query = query.eq('school_id', schoolId);
      if (requestedBy) query = query.eq('requested_by', requestedBy);
      const { data, error } = await query.order('requested_at', { ascending: false });
      if (!error && data) return data;
      if (error) throw new Error(`Database read failed: ${error.message}`);
    }
    const db = initServerDb();
    let list = db.accountDeletionRequests || [];
    if (schoolId) list = list.filter((r) => r.school_id === schoolId);
    if (requestedBy) list = list.filter((r) => r.requested_by === requestedBy);
    return list.sort((a, b) => (b.requested_at || '').localeCompare(a.requested_at || ''));
  },

  async createAccountDeletionRequest(data: any): Promise<AccountDeletionRequest> {
    const newReq: AccountDeletionRequest = {
      id: `del-req-${Date.now().toString().slice(-4)}`,
      school_id: data.school_id,
      school_name: data.school_name,
      user_id: data.user_id,
      user_role: data.user_role,
      user_name: data.user_name,
      user_email: data.user_email,
      requested_by: data.requested_by || data.user_id,
      request_reason: data.request_reason,
      status: 'pending',
      requested_at: new Date().toISOString(),
    };

    const supabase = getSupabaseAdmin();
    if (supabase) {
      const payload = sanitizeSupabasePayload(newReq);
      const { data: created, error } = await supabase.from('account_deletion_requests').insert(payload).select().single();
      if (!error && created) {
        initServerDb().accountDeletionRequests.unshift(created);
        return created;
      }
    }
    initServerDb().accountDeletionRequests.unshift(newReq);

    await this.logAuthEvent({
      school_id: data.school_id,
      user_id: data.user_id,
      event_type: 'user_deletion_attempt',
      success: true,
      role: data.user_role,
      user_name: data.user_name,
      details: { reason: data.request_reason },
    });

    return newReq;
  },

  async reviewAccountDeletionRequest(
    requestId: string,
    decision: 'approved' | 'rejected',
    reviewReason?: string,
    reviewerId?: string,
    reviewerName?: string,
    schoolId?: string
  ): Promise<AccountDeletionRequest> {
    const supabase = getSupabaseAdmin();
    const db = initServerDb();
    let req: any = null;

    if (supabase) {
      const { data } = await supabase.from('account_deletion_requests').select('*').eq('id', requestId).maybeSingle();
      req = data;
    }
    if (!req) {
      req = db.accountDeletionRequests.find((r) => r.id === requestId);
    }
    if (!req) throw new Error('Deletion request not found');

    if (decision === 'rejected' && !reviewReason?.trim()) {
      throw new Error('A mandatory reason is required when rejecting an account deletion request.');
    }

    const nowIso = new Date().toISOString();
    const updates: Partial<AccountDeletionRequest> = {
      status: decision === 'approved' ? 'completed' : 'rejected',
      reviewed_by: reviewerId || 'admin',
      reviewed_by_name: reviewerName || 'School Administrator',
      review_reason: reviewReason || '',
      reviewed_at: nowIso,
      ...(decision === 'approved' ? { completed_at: nowIso } : {}),
    };

    if (supabase) {
      const payload = sanitizeSupabasePayload(updates);
      await supabase.from('account_deletion_requests').update(payload).eq('id', requestId);
    }

    const updated = { ...req, ...updates };
    const idx = db.accountDeletionRequests.findIndex((r) => r.id === requestId);
    if (idx !== -1) db.accountDeletionRequests[idx] = updated;

    return updated;
  },

  async suspendSchool(
    schoolId: string,
    typedSchoolCode: string,
    reason?: string,
    superAdminName?: string
  ): Promise<School> {
    const school = await this.getSchoolById(schoolId);
    if (!school) throw new Error('School not found');

    if (typedSchoolCode.trim().toUpperCase() !== school.code.toUpperCase()) {
      throw new Error(`School code confirmation mismatch. Expected ${school.code}`);
    }

    const updated = await this.updateSchool(schoolId, { status: 'suspended' });

    await this.logAuthEvent({
      school_id: schoolId,
      school_name: school.name,
      event_type: 'school_suspension_attempt',
      success: true,
      role: 'super_admin',
      user_name: superAdminName,
      details: { reason },
    });

    return updated;
  },

  async restoreSchool(schoolId: string, superAdminName?: string): Promise<School> {
    const school = await this.getSchoolById(schoolId);
    if (!school) throw new Error('School not found');

    const updated = await this.updateSchool(schoolId, {
      status: 'active',
      pending_deletion_until: undefined,
    });
    return updated;
  },

  async scheduleSchoolDeletion(
    schoolId: string,
    typedDeleteText: string,
    gracePeriodDays: number,
    reason: string,
    superAdminId: string,
    superAdminName: string
  ): Promise<SchoolDeletionRequest> {
    const school = await this.getSchoolById(schoolId);
    if (!school) throw new Error('School not found');

    if (typedDeleteText.trim() !== 'DELETE SCHOOL') {
      throw new Error('You must type "DELETE SCHOOL" to confirm.');
    }

    const scheduledDate = new Date();
    scheduledDate.setDate(scheduledDate.getDate() + (Number(gracePeriodDays) || 14));
    const scheduledIso = scheduledDate.toISOString();

    await this.updateSchool(schoolId, {
      status: 'pending_deletion',
      pending_deletion_until: scheduledIso,
    });

    const newReq: SchoolDeletionRequest = {
      id: `sch-del-${Date.now().toString().slice(-4)}`,
      school_id: schoolId,
      school_name: school.name,
      requested_by: superAdminId || 'usr-super-01',
      requested_by_name: superAdminName || 'Super Admin',
      reason,
      grace_period_days: gracePeriodDays,
      scheduled_deletion_date: scheduledIso,
      status: 'pending_deletion',
      created_at: new Date().toISOString(),
    };

    const supabase = getSupabaseAdmin();
    if (supabase) {
      const payload = sanitizeSupabasePayload(newReq);
      await supabase.from('school_deletion_requests').insert(payload);
    }
    initServerDb().schoolDeletionRequests.unshift(newReq);

    await this.logAuthEvent({
      school_id: schoolId,
      school_name: school.name,
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
    await this.updateSchool(schoolId, {
      status: 'active',
      pending_deletion_until: undefined,
    });

    const nowIso = new Date().toISOString();
    const supabase = getSupabaseAdmin();
    if (supabase) {
      await supabase
        .from('school_deletion_requests')
        .update({
          status: 'cancelled',
          cancelled_by: superAdminName,
          cancellation_reason: cancellationReason,
          cancelled_at: nowIso,
        })
        .eq('school_id', schoolId)
        .eq('status', 'pending_deletion');
    }
    const db = initServerDb();
    const req = db.schoolDeletionRequests.find(
      (r: any) => r.school_id === schoolId && r.status === 'pending_deletion'
    );
    if (req) {
      req.status = 'cancelled';
      req.cancelled_by = superAdminName;
      req.cancellation_reason = cancellationReason;
      req.cancelled_at = nowIso;
    }
  },

  async logAuthEvent(event: any): Promise<void> {
    try {
      const supabase = getSupabaseAdmin();
      if (supabase) {
        const payload = sanitizeSupabasePayload({
          ...event,
          created_at: new Date().toISOString(),
        });
        await supabase.from('auth_events').insert(payload);
      }
      const db = initServerDb();
      db.authEvents.unshift({
        id: `evt-${Date.now()}`,
        created_at: new Date().toISOString(),
        ...event,
      });
    } catch {
      // Non-blocking log
    }
  },
};
