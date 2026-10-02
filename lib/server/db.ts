// ============================================================================
// Server Database Engine (Supabase PostgreSQL + Central Enterprise Store)
// ============================================================================

import { escapeLikePattern } from '@/lib/utils/security';
import {
  School,
  Teacher,
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

// With a real database attached, memory is only a scratch fallback: never seed it with demo data or files.
function emptyServerDb(): NonNullable<typeof globalThis.__SERVER_DB__> {
  return {
    schools: [], teachers: [], staff: [], students: [], profiles: [], classes: [], sections: [],
    subjects: [], timetable: [], attendance: [], feeInvoices: [], teacherPayments: [],
    employeePayments: [], accessRequests: [], holidays: [], recycleBin: [], authEvents: [],
    temporaryAssignments: [], salaryAdjustments: [], parents: [], parentLinks: [],
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
      feeInvoices: [...INITIAL_FEE_INVOICES],
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
    'class_id', 'section_id', 'subject_id', 'academic_year_id', 'room_id',
    'class_teacher_id', 'parent_id', 'receipt_id', 'fee_structure_id',
    'exam_id', 'batch_id', 'bulk_charge_batch_id', 'enrollment_id',
    'auth_user_id', 'marked_by', 'reviewed_by', 'created_by', 'assigned_to',
    'target_class_id', 'target_section_id', 'contacted_parent_id', 'next_class_id',
    'helper_id', 'payment_id', 'received_by_id', 'cancelled_by'
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

      if (!schoolsResult.error && schoolsResult.data && schoolsResult.data.length > 0) {
        const db = initServerDb();
        const memberships = membershipsResult.data || [];
        return schoolsResult.data.map((school: any) => {
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
      if (!error && data && data.length > 0) {
        return {
          available: false,
          valid: true,
          error: `School code "${cleanCode}" is already registered.`,
          existingSchool: { id: data[0].id, name: data[0].name, code: data[0].code },
        };
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
    if (supabase) {
      let query = supabase.from('teachers').select('*').eq('school_id', schoolId);
      if (filters) {
        for (const key of Object.keys(filters)) {
          query = query.eq(key, filters[key]);
        }
      }
      const { data, error } = await query;
      if (!error && data) return (data as Teacher[]).map(withPinFlag);
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
      if (!error && data && data.length > 0) {
        // Enrich any students whose current_enrollment was not stored in Supabase table
        const enriched = (data as Student[]).map((st) => {
          if (!st.current_enrollment) {
            const memoryStudent = db.students.find((s) => s.id === st.id || s.registration_number === st.registration_number);
            if (memoryStudent?.current_enrollment) {
              return { ...st, current_enrollment: memoryStudent.current_enrollment };
            }
          }
          return st;
        });
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
    if (supabase) {
      const { data, error } = await supabase.from('school_holidays').select('*').eq('school_id', schoolId).order('start_date');
      if (error) throw new Error(`Database holidays read failed: ${error.message}`);
      return (data || []) as SchoolHoliday[];
    }
    const db = initServerDb();
    return db.holidays.filter((h) => h.school_id === schoolId);
  },
  async createHoliday(holiday: SchoolHoliday): Promise<SchoolHoliday> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const academicYearId = await this.resolveAcademicYearId(holiday.school_id, holiday.academic_year_id, holiday.start_date);
      const row = this.holidayRow({ ...holiday, academic_year_id: academicYearId, end_date: holiday.end_date || holiday.start_date });
      const { data, error } = await supabase.from('school_holidays').insert(row).select().single();
      if (error) throw new Error(`Database holiday insert failed: ${error.message}`);
      return data as SchoolHoliday;
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
    if (supabase) {
      const row = this.holidayRow(updates);
      delete row.school_id;
      if (updates.academic_year_id !== undefined) {
        row.academic_year_id = await this.resolveAcademicYearId(schoolId, updates.academic_year_id, updates.start_date || new Date().toISOString().slice(0, 10));
      }
      const { data, error } = await supabase.from('school_holidays').update(row).eq('id', id).eq('school_id', schoolId).select().maybeSingle();
      if (error) throw new Error(`Database holiday update failed: ${error.message}`);
      if (!data) throw new Error('Holiday not found');
      return data as SchoolHoliday;
    }
    const db = initServerDb();
    const idx = db.holidays.findIndex((h) => h.id === id && h.school_id === schoolId);
    if (idx === -1) throw new Error('Holiday not found');
    db.holidays[idx] = { ...db.holidays[idx], ...updates, id, school_id: schoolId };
    return db.holidays[idx];
  },
  async deleteHoliday(id: string, schoolId: string): Promise<void> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { error } = await supabase.from('school_holidays').delete().eq('id', id).eq('school_id', schoolId);
      if (error) throw new Error(`Database holiday delete failed: ${error.message}`);
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
    if (supabase) {
      let query = supabase
        .from('temporary_assignments')
        .select('*')
        .eq('school_id', schoolId)
        .order('created_at', { ascending: false });
      if (filter?.absentEmployeeId) query = query.eq('absent_employee_id', filter.absentEmployeeId);
      if (filter?.replacementEmployeeId) query = query.eq('replacement_employee_id', filter.replacementEmployeeId);
      if (filter?.status) query = query.eq('status', filter.status);

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return data as TemporaryAssignment[];
      }
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
    updates: Partial<TemporaryAssignment>
  ): Promise<TemporaryAssignment> {
    const changes = { ...updates, updated_at: new Date().toISOString() };
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const payload = sanitizeSupabasePayload(changes);
      delete payload.id;
      const { data, error } = await supabase.from('temporary_assignments').update(payload).eq('id', id).select().maybeSingle();
      if (error) throw new Error(`Database temporary assignment update failed: ${error.message}`);
      if (!data) throw new Error('Temporary assignment not found');
      return data as TemporaryAssignment;
    }

    const db = initServerDb();
    const idx = db.temporaryAssignments.findIndex((a) => a.id === id);
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
      if (!error && data && data.length > 0) {
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

  async deleteSalaryAdjustment(id: string): Promise<void> {
    const supabase = getSupabaseAdmin();
    if (supabase && isUuidString(id)) {
      const { error } = await supabase.from('employee_salary_adjustments').delete().eq('id', id);
      if (error) throw new Error(`Database salary adjustment delete failed: ${error.message}`);
    }
    const db = initServerDb();
    db.salaryAdjustments = db.salaryAdjustments.filter((a) => a.id !== id);
  },

  async getAcademicYears(schoolId: string): Promise<any[]> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { data, error } = await supabase.from('academic_years').select('*').eq('school_id', schoolId);
      if (!error && data) return data;
      if (error) throw new Error(`Database read failed: ${error.message}`);
    }
    return [];
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
    if (supabase) {
      const { data, error } = await supabase.from('classes').select('*').eq('school_id', schoolId).order('sort_order', { ascending: true });
      if (error) throw new Error(`Database read failed: ${error.message}`);
      
      const existingClasses = (data || []) as any[];

      // Check if classes need to be seeded or healed from enrolled students
      try {
        const students = await this.getStudents(schoolId);
        const enrolledClassNames = new Set<string>();
        students.forEach((st) => {
          if (st.current_enrollment?.class_name) {
            enrolledClassNames.add(st.current_enrollment.class_name.trim());
          }
        });

        // If no classes exist at all, seed standard Classes 1–10 + any student classes
        if (existingClasses.length === 0) {
          const defaultNames = ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'];
          const namesToSeed = Array.from(new Set([...defaultNames, ...Array.from(enrolledClassNames)]));
          const toInsert = namesToSeed.map((name, idx) => {
            const num = name.match(/\d+/);
            return {
              school_id: schoolId,
              name,
              sort_order: num ? parseInt(num[0], 10) : (idx + 1),
              status: 'active',
            };
          });

          const { data: createdClasses } = await supabase.from('classes').insert(toInsert).select();
          if (createdClasses && createdClasses.length > 0) {
            // Auto-create Section 'A' for each seeded class
            const secToInsert = createdClasses.map((cls: any) => ({
              school_id: schoolId,
              class_id: cls.id,
              name: 'A',
              status: 'active',
            }));
            const { data: createdSecs } = await supabase.from('sections').insert(secToInsert).select();

            // Heal student enrollments so class_id and section_id reference the database IDs
            for (const st of students) {
              const enr = st.current_enrollment;
              if (enr && enr.class_name) {
                const cName = enr.class_name.trim().toLowerCase();
                const matchedCls = createdClasses.find((c: any) => c.name.toLowerCase() === cName);
                if (matchedCls) {
                  const matchedSec = (createdSecs || []).find((s: any) => s.class_id === matchedCls.id);
                  const updatedEnrollment = {
                    ...enr,
                    class_id: matchedCls.id,
                    section_id: matchedSec?.id || enr.section_id || '',
                    section_name: matchedSec?.name || enr.section_name || 'A',
                  };
                  await supabase.from('students').update({ current_enrollment: updatedEnrollment }).eq('id', st.id);
                }
              }
            }

            return createdClasses.sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0));
          }
        } else {
          // Classes exist, but check if any student's class is missing from classes table
          const missingClassNames: string[] = [];
          enrolledClassNames.forEach((name) => {
            const exists = existingClasses.some((c: any) => c.name.toLowerCase() === name.toLowerCase());
            if (!exists) missingClassNames.push(name);
          });

          if (missingClassNames.length > 0) {
            const toAdd = missingClassNames.map((name) => {
              const num = name.match(/\d+/);
              return {
                school_id: schoolId,
                name,
                sort_order: num ? parseInt(num[0], 10) : (existingClasses.length + 1),
                status: 'active',
              };
            });
            const { data: extraClasses } = await supabase.from('classes').insert(toAdd).select();
            if (extraClasses && extraClasses.length > 0) {
              const secToInsert = extraClasses.map((cls: any) => ({
                school_id: schoolId,
                class_id: cls.id,
                name: 'A',
                status: 'active',
              }));
              const { data: extraSecs } = await supabase.from('sections').insert(secToInsert).select();

              for (const st of students) {
                const enr = st.current_enrollment;
                if (enr && enr.class_name && missingClassNames.includes(enr.class_name.trim())) {
                  const cName = enr.class_name.trim().toLowerCase();
                  const matchedCls = extraClasses.find((c: any) => c.name.toLowerCase() === cName);
                  if (matchedCls) {
                    const matchedSec = (extraSecs || []).find((s: any) => s.class_id === matchedCls.id);
                    const updatedEnrollment = {
                      ...enr,
                      class_id: matchedCls.id,
                      section_id: matchedSec?.id || enr.section_id || '',
                      section_name: matchedSec?.name || enr.section_name || 'A',
                    };
                    await supabase.from('students').update({ current_enrollment: updatedEnrollment }).eq('id', st.id);
                  }
                }
              }

              return [...existingClasses, ...extraClasses].sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0));
            }
          }
        }
      } catch (seedErr) {
        console.warn('Auto-seed classes notice:', seedErr);
      }

      return existingClasses;
    }
    return [];
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
    if (supabase) {
      const { data, error } = await supabase.from('sections').select('*').eq('school_id', schoolId);
      if (error) throw new Error(`Database read failed: ${error.message}`);
      if (data && data.length > 0) return data;

      // Auto-heal: if classes exist for this school, ensure each class has at least Section A
      try {
        const { data: existingClasses } = await supabase.from('classes').select('id, name').eq('school_id', schoolId);
        if (existingClasses && existingClasses.length > 0) {
          const sectionsToInsert = existingClasses.map((cls: any) => ({
            school_id: schoolId,
            class_id: cls.id,
            name: 'A',
            status: 'active',
          }));
          const { data: createdSections } = await supabase.from('sections').insert(sectionsToInsert).select();
          if (createdSections && createdSections.length > 0) return createdSections;
        }
      } catch (secSeedErr) {
        console.warn('Auto-seed sections notice:', secSeedErr);
      }
    }
    return [];
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
    if (supabase) {
      const { data, error } = await supabase.from('subjects').select('*').eq('school_id', schoolId);
      if (!error && data) return data;
      if (error) throw new Error(`Database read failed: ${error.message}`);
    }
    return [];
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
    if (supabase) {
      const { data, error } = await supabase.from('school_rooms').select('*').eq('school_id', schoolId);
      if (error) throw new Error(`Database read failed: ${error.message}`);
      if (data && data.length > 0) return data;

      // Auto-seed standard rooms if none exist for this school
      try {
        const defaultRooms = [
          { school_id: schoolId, name: 'Classroom 101', room_number: '101', building: 'Academic Block A', floor: 'Ground Floor', type: 'classroom', capacity: 45, status: 'active' },
          { school_id: schoolId, name: 'Classroom 102', room_number: '102', building: 'Academic Block A', floor: 'Ground Floor', type: 'classroom', capacity: 45, status: 'active' },
          { school_id: schoolId, name: 'Classroom 201', room_number: '201', building: 'Academic Block A', floor: 'First Floor', type: 'classroom', capacity: 45, status: 'active' },
          { school_id: schoolId, name: 'Classroom 202', room_number: '202', building: 'Academic Block A', floor: 'First Floor', type: 'classroom', capacity: 45, status: 'active' },
          { school_id: schoolId, name: 'Science Laboratory', room_number: 'LAB-1', building: 'Academic Block B', floor: 'Ground Floor', type: 'lab', capacity: 35, status: 'active' },
          { school_id: schoolId, name: 'Computer Laboratory', room_number: 'LAB-2', building: 'Academic Block B', floor: 'Ground Floor', type: 'lab', capacity: 40, status: 'active' },
          { school_id: schoolId, name: 'Central Library', room_number: 'LIB-1', building: 'Central Block', floor: 'First Floor', type: 'library', capacity: 80, status: 'active' },
        ];
        const { data: createdRooms } = await supabase.from('school_rooms').insert(defaultRooms).select();
        if (createdRooms && createdRooms.length > 0) return createdRooms;
      } catch (rmSeedErr) {
        console.warn('Auto-seed rooms notice:', rmSeedErr);
      }
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
    if (supabase) {
      const { data, error } = await supabase.from('timetable_entries').select('*').eq('school_id', schoolId);
      if (!error && data) return data;
      if (error) throw new Error(`Database read failed: ${error.message}`);
    }
    return [];
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
      if (error) throw new Error(`Database createTimetableEntry failed: ${error.message}`);
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
      if (error) throw new Error(`Database updateTimetableEntry failed: ${error.message}`);
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
    if (supabase) {
      const { data, error } = await supabase.from('student_attendance').select('*').eq('school_id', schoolId);
      if (!error && data) return data;
      if (error) throw new Error(`Database read failed: ${error.message}`);
    }
    return [];
  },

  async createStudentAttendance(data: any): Promise<any> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const payload = sanitizeSupabasePayload(data);
      const { data: created, error } = await supabase.from('student_attendance').upsert(payload, { onConflict: 'school_id,student_id,attendance_date' }).select().single();
      if (!error && created) return created;
      if (error) throw new Error(`Database createStudentAttendance failed: ${error.message}`);
    }
    return data;
  },

  async getTeacherAttendances(schoolId: string): Promise<any[]> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { data, error } = await supabase.from('teacher_attendance').select('*').eq('school_id', schoolId);
      if (!error && data) return data;
      if (error) throw new Error(`Database read failed: ${error.message}`);
    }
    return [];
  },

  async createTeacherAttendance(data: any): Promise<any> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const payload = sanitizeSupabasePayload(data);
      const { data: created, error } = await supabase.from('teacher_attendance').upsert(payload, { onConflict: 'school_id,teacher_id,attendance_date' }).select().single();
      if (!error && created) return created;
      if (error) throw new Error(`Database createTeacherAttendance failed: ${error.message}`);
    }
    return data;
  },

  async getStaffAttendances(schoolId: string): Promise<any[]> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { data, error } = await supabase.from('staff_attendance').select('*').eq('school_id', schoolId);
      if (!error && data) return data;
      if (error) throw new Error(`Database read failed: ${error.message}`);
    }
    return [];
  },

  async createStaffAttendance(data: any): Promise<any> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const payload = sanitizeSupabasePayload(data);
      const { data: created, error } = await supabase.from('staff_attendance').upsert(payload, { onConflict: 'school_id,staff_id,attendance_date' }).select().single();
      if (!error && created) return created;
      if (error) throw new Error(`Database createStaffAttendance failed: ${error.message}`);
    }
    return data;
  },

  async getStudentLeaves(schoolId: string): Promise<any[]> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { data, error } = await supabase.from('student_leaves').select('*').eq('school_id', schoolId);
      if (!error && data) return data;
      if (error) throw new Error(`Database read failed: ${error.message}`);
    }
    return [];
  },

  async createStudentLeave(data: any): Promise<any> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const payload = sanitizeSupabasePayload(data);
      const { data: created, error } = await supabase.from('student_leaves').insert(payload).select().single();
      if (!error && created) return created;
      if (error) throw new Error(`Database createStudentLeave failed: ${error.message}`);
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
      if (error) throw new Error(`Database updateStudentLeave failed: ${error.message}`);
    }
    return { id, ...updates };
  },

  async getTeacherLeaves(schoolId: string): Promise<any[]> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { data, error } = await supabase.from('teacher_leaves').select('*').eq('school_id', schoolId);
      if (!error && data) return data;
      if (error) throw new Error(`Database read failed: ${error.message}`);
    }
    return [];
  },

  async createTeacherLeave(data: any): Promise<any> {
    const supabase = getSupabaseAdmin();
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
    if (supabase) {
      const { data, error } = await supabase.from('staff_leaves').select('*').eq('school_id', schoolId);
      if (!error && data) return data;
      if (error) throw new Error(`Database read failed: ${error.message}`);
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
    if (supabase) {
      const { data, error } = await supabase.from('fee_structures').select('*').eq('school_id', schoolId);
      if (!error && data) return data;
      if (error) throw new Error(`Database read failed: ${error.message}`);
    }
    return [];
  },

  async createFeeStructure(data: any): Promise<any> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const payload = sanitizeSupabasePayload(data);
      const { data: created, error } = await supabase.from('fee_structures').insert(payload).select().single();
      if (!error && created) return created;
      if (error) throw new Error(`Database createFeeStructure failed: ${error.message}`);
    }
    return data;
  },

  async updateFeeStructure(id: string, updates: any): Promise<any> {
    const supabase = getSupabaseAdmin();
    if (supabase && isUuidString(id)) {
      const payload = sanitizeSupabasePayload(updates);
      delete payload.id;
      const { data: updated, error } = await supabase.from('fee_structures').update(payload).eq('id', id).select().single();
      if (!error && updated) return updated;
      if (error) throw new Error(`Database updateFeeStructure failed: ${error.message}`);
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
    if (supabase) {
      const { data, error } = await supabase.from('student_fee_invoices').select('*').eq('school_id', schoolId);
      if (!error && data) return data;
      if (error) throw new Error(`Database read failed: ${error.message}`);
    }
    return [];
  },

  async createFeeInvoice(data: any): Promise<any> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const payload = sanitizeSupabasePayload(data);
      const { data: created, error } = await supabase.from('student_fee_invoices').insert(payload).select().single();
      if (!error && created) return created;
      if (error) throw new Error(`Database createFeeInvoice failed: ${error.message}`);
    }
    return data;
  },

  async updateFeeInvoice(id: string, updates: any): Promise<any> {
    const supabase = getSupabaseAdmin();
    if (supabase && isUuidString(id)) {
      const payload = sanitizeSupabasePayload(updates);
      delete payload.id;
      const { data: updated, error } = await supabase.from('student_fee_invoices').update(payload).eq('id', id).select().single();
      if (!error && updated) return updated;
      if (error) throw new Error(`Database updateFeeInvoice failed: ${error.message}`);
    }
    return { id, ...updates };
  },

  async getStudentCharges(schoolId: string): Promise<any[]> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { data, error } = await supabase.from('student_charges').select('*').eq('school_id', schoolId);
      if (!error && data) return data;
      if (error) throw new Error(`Database read failed: ${error.message}`);
    }
    return [];
  },

  async createStudentCharge(data: any): Promise<any> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const payload = sanitizeSupabasePayload(data);
      const { data: created, error } = await supabase.from('student_charges').insert(payload).select().single();
      if (!error && created) return created;
      if (error) throw new Error(`Database createStudentCharge failed: ${error.message}`);
    }
    return data;
  },

  async updateStudentCharge(id: string, updates: any): Promise<any> {
    const supabase = getSupabaseAdmin();
    if (supabase && isUuidString(id)) {
      const payload = sanitizeSupabasePayload(updates);
      delete payload.id;
      const { data: updated, error } = await supabase.from('student_charges').update(payload).eq('id', id).select().single();
      if (!error && updated) return updated;
      if (error) throw new Error(`Database updateStudentCharge failed: ${error.message}`);
    }
    return { id, ...updates };
  },

  async getPaymentReceipts(schoolId: string): Promise<any[]> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { data, error } = await supabase.from('payment_receipts').select('*').eq('school_id', schoolId);
      if (!error && data) return data;
      if (error) throw new Error(`Database read failed: ${error.message}`);
    }
    return [];
  },

  async createPaymentReceipt(data: any): Promise<any> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const payload = sanitizeSupabasePayload(data);
      const { data: created, error } = await supabase.from('payment_receipts').insert(payload).select().single();
      if (!error && created) return created;
      if (error) throw new Error(`Database createPaymentReceipt failed: ${error.message}`);
    }
    return data;
  },

  async getEmployeePayments(schoolId: string): Promise<any[]> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { data, error } = await supabase.from('employee_payments').select('*').eq('school_id', schoolId);
      if (!error && data) return data;
      if (error) throw new Error(`Database read failed: ${error.message}`);
    }
    return [];
  },

  async createEmployeePayment(data: any): Promise<any> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const payload = sanitizeSupabasePayload(data);
      const { data: created, error } = await supabase.from('employee_payments').insert(payload).select().single();
      if (!error && created) return created;
      if (error) throw new Error(`Database createEmployeePayment failed: ${error.message}`);
    }
    return data;
  },

  async updateEmployeePayment(id: string, updates: any): Promise<any> {
    const supabase = getSupabaseAdmin();
    if (supabase && isUuidString(id)) {
      const payload = sanitizeSupabasePayload(updates);
      delete payload.id;
      const { data: updated, error } = await supabase.from('employee_payments').update(payload).eq('id', id).select().single();
      if (!error && updated) return updated;
      if (error) throw new Error(`Database updateEmployeePayment failed: ${error.message}`);
    }
    return { id, ...updates };
  },

  async getTeacherPayments(schoolId: string): Promise<any[]> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { data, error } = await supabase.from('teacher_payments').select('*').eq('school_id', schoolId);
      if (!error && data) return data;
      if (error) throw new Error(`Database read failed: ${error.message}`);
    }
    return [];
  },

  async createTeacherPayment(data: any): Promise<any> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const payload = sanitizeSupabasePayload(data);
      const { data: created, error } = await supabase.from('teacher_payments').insert(payload).select().single();
      if (!error && created) return created;
      if (error) throw new Error(`Database createTeacherPayment failed: ${error.message}`);
    }
    return data;
  },

  async getSalaryHistory(schoolId: string): Promise<any[]> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { data, error } = await supabase.from('employee_salary_history').select('*').eq('school_id', schoolId);
      if (!error && data) return data;
      if (error) throw new Error(`Database read failed: ${error.message}`);
    }
    return [];
  },

  async createSalaryHistory(data: any): Promise<any> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const payload = sanitizeSupabasePayload(data);
      const { data: created, error } = await supabase.from('employee_salary_history').insert(payload).select().single();
      if (!error && created) return created;
      if (error) throw new Error(`Database createSalaryHistory failed: ${error.message}`);
    }
    return data;
  },

  async getFeeVersions(schoolId: string): Promise<any[]> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { data, error } = await supabase.from('fee_structure_versions').select('*').eq('school_id', schoolId);
      if (!error && data) return data;
      if (error) throw new Error(`Database read failed: ${error.message}`);
    }
    return [];
  },

  async createFeeVersion(data: any): Promise<any> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const payload = sanitizeSupabasePayload(data);
      const { data: created, error } = await supabase.from('fee_structure_versions').insert(payload).select().single();
      if (!error && created) return created;
      if (error) throw new Error(`Database createFeeVersion failed: ${error.message}`);
    }
    return data;
  },

  async getBulkChargeBatchs(schoolId: string): Promise<any[]> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { data, error } = await supabase.from('bulk_charge_batches').select('*').eq('school_id', schoolId);
      if (!error && data) return data;
      if (error) throw new Error(`Database read failed: ${error.message}`);
    }
    return [];
  },

  async createBulkChargeBatch(data: any): Promise<any> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const payload = sanitizeSupabasePayload(data);
      const { data: created, error } = await supabase.from('bulk_charge_batches').insert(payload).select().single();
      if (!error && created) return created;
      if (error) throw new Error(`Database createBulkChargeBatch failed: ${error.message}`);
    }
    return data;
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
    return { id, ...updates };
  },

  async getExams(schoolId: string): Promise<any[]> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { data, error } = await supabase.from('exams').select('*').eq('school_id', schoolId);
      if (!error && data) return data;
      if (error) throw new Error(`Database read failed: ${error.message}`);
    }
    return [];
  },

  async createExam(data: any): Promise<any> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const payload = sanitizeSupabasePayload(data);
      const { data: created, error } = await supabase.from('exams').insert(payload).select().single();
      if (!error && created) return created;
      if (error) throw new Error(`Database createExam failed: ${error.message}`);
    }
    return data;
  },

  async updateExam(id: string, updates: any): Promise<any> {
    const supabase = getSupabaseAdmin();
    if (supabase && isUuidString(id)) {
      const payload = sanitizeSupabasePayload(updates);
      delete payload.id;
      const { data: updated, error } = await supabase.from('exams').update(payload).eq('id', id).select().single();
      if (!error && updated) return updated;
      if (error) throw new Error(`Database updateExam failed: ${error.message}`);
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
    if (supabase) {
      const { data, error } = await supabase.from('exam_results').select('*').eq('school_id', schoolId);
      if (!error && data) return data;
      if (error) throw new Error(`Database read failed: ${error.message}`);
    }
    return [];
  },

  async createExamResult(data: any): Promise<any> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const payload = sanitizeSupabasePayload(data);
      const { data: created, error } = await supabase.from('exam_results').insert(payload).select().single();
      if (!error && created) return created;
      if (error) throw new Error(`Database createExamResult failed: ${error.message}`);
    }
    return data;
  },

  async updateExamResult(id: string, updates: any): Promise<any> {
    const supabase = getSupabaseAdmin();
    if (supabase && isUuidString(id)) {
      const payload = sanitizeSupabasePayload(updates);
      delete payload.id;
      const { data: updated, error } = await supabase.from('exam_results').update(payload).eq('id', id).select().single();
      if (!error && updated) return updated;
      if (error) throw new Error(`Database updateExamResult failed: ${error.message}`);
    }
    return { id, ...updates };
  },

  async getNotices(schoolId: string): Promise<any[]> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { data, error } = await supabase.from('notices').select('*').eq('school_id', schoolId);
      if (!error && data) return data;
      if (error) throw new Error(`Database read failed: ${error.message}`);
    }
    return [];
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
    if (supabase) {
      const { data, error } = await supabase.from('app_notifications').select('*').eq('school_id', schoolId);
      if (!error && data) return data;
      if (error) throw new Error(`Database read failed: ${error.message}`);
    }
    return [];
  },

  async createNotification(data: any): Promise<any> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const payload = sanitizeSupabasePayload(data);
      const { data: created, error } = await supabase.from('app_notifications').insert(payload).select().single();
      if (!error && created) return created;
      if (error) throw new Error(`Database createNotification failed: ${error.message}`);
    }
    return data;
  },

  async updateNotification(id: string, updates: any): Promise<any> {
    const supabase = getSupabaseAdmin();
    if (supabase && isUuidString(id)) {
      const payload = sanitizeSupabasePayload(updates);
      delete payload.id;
      const { data: updated, error } = await supabase.from('app_notifications').update(payload).eq('id', id).select().single();
      if (!error && updated) return updated;
      if (error) throw new Error(`Database updateNotification failed: ${error.message}`);
    }
    return { id, ...updates };
  },

  async getParents(schoolId: string): Promise<any[]> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
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
    if (supabase) {
      const { data, error } = await supabase.from('parent_student_links').select('*').eq('school_id', schoolId);
      if (!error && data) return data;
      if (error) throw new Error(`Database read failed: ${error.message}`);
    }
    return [];
  },

  async createParentLink(data: any): Promise<any> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const payload = sanitizeSupabasePayload(data);
      const { data: created, error } = await supabase.from('parent_student_links').insert(payload).select().single();
      if (!error && created) return created;
      if (error) throw new Error(`Database parent link insert failed: ${error.message}`);
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
    if (supabase) {
      const { data, error } = await supabase.from('admission_enquiries').select('*').eq('school_id', schoolId);
      if (!error && data) return data;
      if (error) throw new Error(`Database read failed: ${error.message}`);
    }
    return [];
  },

  async createEnquiry(data: any): Promise<any> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const payload = sanitizeSupabasePayload(data);
      const { data: created, error } = await supabase.from('admission_enquiries').insert(payload).select().single();
      if (!error && created) return created;
      if (error) throw new Error(`Database createEnquiry failed: ${error.message}`);
    }
    return data;
  },

  async updateEnquiry(id: string, updates: any): Promise<any> {
    const supabase = getSupabaseAdmin();
    if (supabase && isUuidString(id)) {
      const payload = sanitizeSupabasePayload(updates);
      delete payload.id;
      const { data: updated, error } = await supabase.from('admission_enquiries').update(payload).eq('id', id).select().single();
      if (!error && updated) return updated;
      if (error) throw new Error(`Database updateEnquiry failed: ${error.message}`);
    }
    return { id, ...updates };
  },

  async getFollowUps(schoolId: string): Promise<any[]> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { data, error } = await supabase.from('student_followups').select('*').eq('school_id', schoolId);
      if (!error && data) return data;
      if (error) throw new Error(`Database read failed: ${error.message}`);
    }
    return [];
  },

  async createFollowUp(data: any): Promise<any> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const payload = sanitizeSupabasePayload(data);
      const { data: created, error } = await supabase.from('student_followups').insert(payload).select().single();
      if (!error && created) return created;
      if (error) throw new Error(`Database createFollowUp failed: ${error.message}`);
    }
    return data;
  },

  async updateFollowUp(id: string, updates: any): Promise<any> {
    const supabase = getSupabaseAdmin();
    if (supabase && isUuidString(id)) {
      const payload = sanitizeSupabasePayload(updates);
      delete payload.id;
      const { data: updated, error } = await supabase.from('student_followups').update(payload).eq('id', id).select().single();
      if (!error && updated) return updated;
      if (error) throw new Error(`Database updateFollowUp failed: ${error.message}`);
    }
    return { id, ...updates };
  },

  async getTransitionBatchs(schoolId: string): Promise<any[]> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { data, error } = await supabase.from('academic_year_transition_batches').select('*').eq('school_id', schoolId);
      if (!error && data) return data;
      if (error) throw new Error(`Database read failed: ${error.message}`);
    }
    return [];
  },

  async createTransitionBatch(data: any): Promise<any> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const payload = sanitizeSupabasePayload(data);
      const { data: created, error } = await supabase.from('academic_year_transition_batches').insert(payload).select().single();
      if (!error && created) return created;
      if (error) throw new Error(`Database createTransitionBatch failed: ${error.message}`);
    }
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
    return { id, ...updates };
  },

  async addToRecycleBin(data: any): Promise<any> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const payload = sanitizeSupabasePayload(data);
      const { data: created, error } = await supabase.from('recycle_bin_items').insert(payload).select().single();
      if (!error && created) return created;
      if (error) throw new Error(`Database recycle-bin insert failed: ${error.message}`);
    }
    const db = initServerDb();
    db.recycleBin.unshift(data);
    return data;
  },

  async getRecycleBinItems(schoolId: string): Promise<any[]> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { data, error } = await supabase
        .from('recycle_bin_items')
        .select('*')
        .eq('school_id', schoolId)
        .eq('status', 'in_bin');
      if (!error && data) return data;
      if (error) throw new Error(`Database recycle-bin fetch failed: ${error.message}`);
    }
    const db = initServerDb();
    return db.recycleBin.filter((item: any) => item.school_id === schoolId && item.status === 'in_bin');
  },

  async removeFromRecycleBin(id: string): Promise<void> {
    const supabase = getSupabaseAdmin();
    if (supabase && isUuidString(id)) {
      await supabase.from('recycle_bin_items').delete().eq('id', id);
    }
  },
};
