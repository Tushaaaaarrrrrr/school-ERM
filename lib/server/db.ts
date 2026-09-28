// ============================================================================
// Server Database Engine (Supabase PostgreSQL + Central Enterprise Store)
// ============================================================================

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
  } | undefined;
}

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

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

function schoolDatabaseFields(school: Partial<School>) {
  return {
    ...(school.name !== undefined && { name: school.name }),
    ...(school.code !== undefined && { code: school.code.trim().toUpperCase() }),
    ...(school.email !== undefined && { email: school.email }),
    ...(school.admin_email !== undefined && { admin_email: school.admin_email?.trim().toLowerCase() }),
    ...(school.admin_name !== undefined && { admin_name: school.admin_name }),
    ...(school.admin_pin !== undefined && { admin_pin: school.admin_pin }),
    ...(school.admin_pin_failed_attempts !== undefined && { admin_pin_failed_attempts: school.admin_pin_failed_attempts }),
    ...(school.is_admin_pin_locked !== undefined && { is_admin_pin_locked: school.is_admin_pin_locked }),
    ...(school.phone !== undefined && { phone: school.phone }),
    ...(school.school_contact_phone !== undefined && { school_contact_phone: school.school_contact_phone }),
    ...(school.school_contact_alternate !== undefined && { school_contact_alternate: school.school_contact_alternate }),
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

function saveSchoolsToFile(schools: School[]) {
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

    globalThis.__SERVER_DB__ = {
      schools: mergedSchools,
      teachers: [...INITIAL_TEACHERS],
      staff: [...INITIAL_STAFF],
      students: [...INITIAL_STUDENTS],
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
    };
  }
  return globalThis.__SERVER_DB__;
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
      let query = supabase.from('schools').select('id, name, code').ilike('code', cleanCode);
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
              const cleanAdminEmail = cleanSchool.admin_email.trim().toLowerCase();
              let { data: adminProf } = await supabase
                .from('profiles')
                .select('id')
                .ilike('email', cleanAdminEmail)
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
          console.warn('Supabase create school notice:', error.message);
          break;
        }
      }
    }

    return cleanSchool;
  },

  async updateSchool(id: string, updates: Partial<School>): Promise<School> {
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
              const cleanAdminEmail = updates.admin_email.trim().toLowerCase();
              let { data: adminProf } = await supabase
                .from('profiles')
                .select('id')
                .ilike('email', cleanAdminEmail)
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
          // If other non-fatal error, log and return fullUpdatedSchool from cache
          console.warn('Supabase update school notice:', error.message);
          break;
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
    if (
      email === 'superadmin@platform.erp' ||
      email === 'superadmin@schoolerp.com' ||
      email === 'pay.laxmikant@gmail.com'
    ) {
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
      const aEmail = s.admin_email?.trim().toLowerCase();
      return aEmail === email;
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
  async getUserPinStatus(user: UserPersona): Promise<{
    hasPin: boolean;
    isLocked: boolean;
    failedAttempts: number;
    maxAttempts: number;
    pin?: string;
  }> {
    const maxAttempts = 5;
    if (user.role === 'super_admin') {
      return { hasPin: false, isLocked: false, failedAttempts: 0, maxAttempts };
    }

    if (user.role === 'school_admin' && user.school_id) {
      const school = await this.getSchoolById(user.school_id);
      const rawPin = school?.admin_pin?.trim();
      const hasPin = Boolean(rawPin && rawPin.length === 5);
      return {
        hasPin,
        isLocked: school?.is_admin_pin_locked || false,
        failedAttempts: school?.admin_pin_failed_attempts || 0,
        maxAttempts,
        pin: hasPin ? rawPin : undefined,
      };
    }

    const db = initServerDb();
    if (user.role === 'teacher') {
      const tch = db.teachers.find((t) => t.id === user.teacher_id || t.id === user.id || t.email === user.email);
      const rawPin = tch?.security_pin?.trim();
      const hasPin = Boolean(rawPin && rawPin.length === 5);
      return {
        hasPin,
        isLocked: tch?.is_pin_locked || false,
        failedAttempts: tch?.pin_failed_attempts || 0,
        maxAttempts,
        pin: hasPin ? rawPin : undefined,
      };
    }

    if (['staff', 'driver'].includes(user.role)) {
      const stf = db.staff.find((s) => s.id === user.staff_id || s.id === user.id || s.email === user.email);
      const rawPin = stf?.security_pin?.trim();
      const hasPin = Boolean(rawPin && rawPin.length === 5);
      return {
        hasPin,
        isLocked: stf?.is_pin_locked || false,
        failedAttempts: stf?.pin_failed_attempts || 0,
        maxAttempts,
        pin: hasPin ? rawPin : undefined,
      };
    }

    return { hasPin: false, isLocked: false, failedAttempts: 0, maxAttempts };
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

    const isMatch = enteredPin.trim() === (status.pin || '').trim();
    const db = initServerDb();

    if (isMatch) {
      // Clear failed attempts on server
      if (user.role === 'school_admin' && user.school_id) {
        await this.updateSchool(user.school_id, { admin_pin_failed_attempts: 0, is_admin_pin_locked: false });
      } else if (user.role === 'teacher') {
        const idx = db.teachers.findIndex((t) => t.id === user.teacher_id || t.id === user.id);
        if (idx !== -1) {
          db.teachers[idx].pin_failed_attempts = 0;
          db.teachers[idx].is_pin_locked = false;
        }
      } else if (['staff', 'driver'].includes(user.role)) {
        const idx = db.staff.findIndex((s) => s.id === user.staff_id || s.id === user.id);
        if (idx !== -1) {
          db.staff[idx].pin_failed_attempts = 0;
          db.staff[idx].is_pin_locked = false;
        }
      }
      return { success: true, isLocked: false, remainingAttempts: maxAttempts };
    }

    // Increment failed attempts on server
    const newCount = status.failedAttempts + 1;
    const shouldLock = newCount >= maxAttempts;

    if (user.role === 'school_admin' && user.school_id) {
      await this.updateSchool(user.school_id, {
        admin_pin_failed_attempts: newCount,
        is_admin_pin_locked: shouldLock,
      });
    } else if (user.role === 'teacher') {
      const idx = db.teachers.findIndex((t) => t.id === user.teacher_id || t.id === user.id);
      if (idx !== -1) {
        db.teachers[idx].pin_failed_attempts = newCount;
        db.teachers[idx].is_pin_locked = shouldLock;
      }
    } else if (['staff', 'driver'].includes(user.role)) {
      const idx = db.staff.findIndex((s) => s.id === user.staff_id || s.id === user.id);
      if (idx !== -1) {
        db.staff[idx].pin_failed_attempts = newCount;
        db.staff[idx].is_pin_locked = shouldLock;
      }
    }

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

  async unlockAndResetPin(params: {
    targetType: 'school_admin' | 'teacher' | 'staff' | 'profile';
    targetId: string;
    newPin?: string;
    unlockedByName?: string;
  }): Promise<void> {
    const pinToSet = params.newPin?.trim() || undefined;
    const db = initServerDb();

    if (params.targetType === 'school_admin') {
      await this.updateSchool(params.targetId, {
        admin_pin: pinToSet,
        admin_pin_failed_attempts: 0,
        is_admin_pin_locked: false,
      });
    } else if (params.targetType === 'teacher') {
      const idx = db.teachers.findIndex((t) => t.id === params.targetId);
      if (idx !== -1) {
        db.teachers[idx].security_pin = pinToSet;
        db.teachers[idx].pin_failed_attempts = 0;
        db.teachers[idx].is_pin_locked = false;
      }
    } else if (params.targetType === 'staff') {
      const idx = db.staff.findIndex((s) => s.id === params.targetId);
      if (idx !== -1) {
        db.staff[idx].security_pin = pinToSet;
        db.staff[idx].pin_failed_attempts = 0;
        db.staff[idx].is_pin_locked = false;
      }
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
      if (!error && data) return data as Teacher[];
    }
    const db = initServerDb();
    let res = (db.teachers || []).filter((item: any) => item.school_id === schoolId);
    if (filters) {
      for (const key of Object.keys(filters)) {
        res = res.filter((item: any) => item[key] === filters[key]);
      }
    }
    return res as Teacher[];
  },

  async createTeacher(data: Teacher): Promise<Teacher> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const payload: any = { ...data };
      const isUuid = (v: any) => typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
      if (payload.id && !isUuid(payload.id)) delete payload.id;
      const { data: inserted, error } = await supabase.from('teachers').insert(payload).select().single();
      if (!error && inserted) data = inserted as Teacher;
    }
    const db = initServerDb();
    if (!db.teachers) db.teachers = [];
    db.teachers.unshift(data);
    return data;
  },

  async updateTeacher(id: string, updates: Partial<Teacher>): Promise<Teacher> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { data, error } = await supabase.from('teachers').update(updates).eq('id', id).select().single();
    }
    const db = initServerDb();
    if (!db.teachers) db.teachers = [];
    const idx = db.teachers.findIndex((item: any) => item.id === id);
    if (idx !== -1) {
      db.teachers[idx] = { ...db.teachers[idx], ...updates };
      return db.teachers[idx];
    }
    return updates as Teacher;
  },

  async deleteTeacher(id: string): Promise<boolean> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      await supabase.from('teachers').delete().eq('id', id);
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
      if (!error && data) return data as Staff[];
    }
    const db = initServerDb();
    let res = (db.staff || []).filter((item: any) => item.school_id === schoolId);
    if (filters) {
      for (const key of Object.keys(filters)) {
        res = res.filter((item: any) => item[key] === filters[key]);
      }
    }
    return res as Staff[];
  },

  async createStaff(data: Staff): Promise<Staff> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const payload: any = { ...data };
      const isUuid = (v: any) => typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
      if (payload.id && !isUuid(payload.id)) {
        delete payload.id;
      }
      if (payload.school_id && !isUuid(payload.school_id)) {
        // preserve school_id if valid
      }
      const { data: inserted, error } = await supabase.from('staff').insert(payload).select().single();
      if (!error && inserted) {
        data = inserted as Staff;
      } else if (error) {
        console.warn('Supabase staff insert warning:', error);
      }
    }
    const db = initServerDb();
    if (!db.staff) db.staff = [];
    db.staff.unshift(data);
    return data;
  },

  async updateStaff(id: string, updates: Partial<Staff>): Promise<Staff> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const isUuid = (v: any) => typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
      if (isUuid(id)) {
        const payload: any = { ...updates };
        delete payload.id;
        await supabase.from('staff').update(payload).eq('id', id);
      }
    }
    const db = initServerDb();
    if (!db.staff) db.staff = [];
    const idx = db.staff.findIndex((item: any) => item.id === id);
    if (idx !== -1) {
      db.staff[idx] = { ...db.staff[idx], ...updates };
      return db.staff[idx];
    }
    return updates as Staff;
  },

  async deleteStaff(id: string): Promise<boolean> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const isUuid = (v: any) => typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
      if (isUuid(id)) {
        await supabase.from('staff').delete().eq('id', id);
      }
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
    const supabase = getSupabaseAdmin();
    if (supabase) {
      let query = supabase.from('students').select('*').eq('school_id', schoolId);
      if (filters?.classId) query = query.eq('class_id', filters.classId);
      if (filters?.sectionId) query = query.eq('section_id', filters.sectionId);
      if (filters?.status) query = query.eq('status', filters.status);
      const { data, error } = await query;
      if (!error && data && data.length > 0) return data as Student[];
    }
    const db = initServerDb();
    return db.students.filter((s) => s.school_id === schoolId);
  },

  async createStudent(student: Student): Promise<Student> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const payload: any = { ...student };
      const isUuid = (v: any) => typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
      if (payload.id && !isUuid(payload.id)) delete payload.id;
      const { data: inserted, error } = await supabase.from('students').insert(payload).select().single();
      if (!error && inserted) student = inserted as Student;
    }
    const db = initServerDb();
    db.students.unshift(student);
    return student;
  },

  async updateStudent(id: string, updates: Partial<Student>): Promise<Student> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const isUuid = (v: any) => typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
      if (isUuid(id)) {
        const payload: any = { ...updates };
        delete payload.id;
        await supabase.from('students').update(payload).eq('id', id);
      }
    }
    const db = initServerDb();
    const idx = db.students.findIndex((s) => s.id === id);
    if (idx !== -1) {
      db.students[idx] = { ...db.students[idx], ...updates };
      return db.students[idx];
    }
    return updates as Student;
  },

  async deleteStudent(id: string): Promise<boolean> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const isUuid = (v: any) => typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
      if (isUuid(id)) {
        await supabase.from('students').delete().eq('id', id);
      }
    }
    const db = initServerDb();
    db.students = db.students.filter((s) => s.id !== id);
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
  async getHolidays(schoolId: string): Promise<SchoolHoliday[]> {
    const db = initServerDb();
    return db.holidays.filter((h) => h.school_id === schoolId);
  },

  async createHoliday(holiday: SchoolHoliday): Promise<SchoolHoliday> {
    const db = initServerDb();
    db.holidays.unshift(holiday);
    return holiday;
  },

  async updateHoliday(id: string, updates: Partial<SchoolHoliday>): Promise<SchoolHoliday> {
    const db = initServerDb();
    const idx = db.holidays.findIndex((h) => h.id === id);
    if (idx === -1) throw new Error('Holiday not found');
    db.holidays[idx] = { ...db.holidays[idx], ...updates };
    return db.holidays[idx];
  },

  async deleteHoliday(id: string): Promise<void> {
    const db = initServerDb();
    db.holidays = db.holidays.filter((h) => h.id !== id);
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
    const db = initServerDb();
    const item: TemporaryAssignment = {
      ...assignment,
      id: assignment.id || `tmp-asg-${Date.now().toString().slice(-4)}`,
      status: assignment.status || 'active',
      created_at: assignment.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    db.temporaryAssignments.unshift(item);

    const supabase = getSupabaseAdmin();
    if (supabase) {
      try {
        await supabase.from('temporary_assignments').insert(item);
      } catch (err) {
        console.warn('Supabase insert temporary_assignments notice:', err);
      }
    }

    return item;
  },

  async updateTemporaryAssignment(
    id: string,
    updates: Partial<TemporaryAssignment>
  ): Promise<TemporaryAssignment> {
    const db = initServerDb();
    const idx = db.temporaryAssignments.findIndex((a) => a.id === id);
    if (idx === -1) throw new Error('Temporary assignment not found');
    db.temporaryAssignments[idx] = {
      ...db.temporaryAssignments[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    };

    const supabase = getSupabaseAdmin();
    if (supabase) {
      try {
        await supabase
          .from('temporary_assignments')
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq('id', id);
      } catch (err) {
        console.warn('Supabase update temporary_assignments notice:', err);
      }
    }

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
    const db = initServerDb();
    const item: EmployeeSalaryAdjustment = {
      ...adjustment,
      id: adjustment.id || `sal-adj-${Date.now().toString().slice(-4)}`,
      billing_month: adjustment.billing_month || adjustment.effective_date.slice(0, 7),
      created_at: adjustment.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    db.salaryAdjustments.unshift(item);

    const supabase = getSupabaseAdmin();
    if (supabase) {
      try {
        await supabase.from('employee_salary_adjustments').insert(item);
      } catch (err) {
        console.warn('Supabase insert employee_salary_adjustments notice:', err);
      }
    }

    return item;
  },

  async deleteSalaryAdjustment(id: string): Promise<void> {
    const db = initServerDb();
    db.salaryAdjustments = db.salaryAdjustments.filter((a) => a.id !== id);

    const supabase = getSupabaseAdmin();
    if (supabase) {
      try {
        await supabase.from('employee_salary_adjustments').delete().eq('id', id);
      } catch (err) {
        console.warn('Supabase delete employee_salary_adjustments notice:', err);
      }
    }
  },

  async getAcademicYears(schoolId: string): Promise<any[]> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { data, error } = await supabase.from('academic_years').select('*').eq('school_id', schoolId);
      if (!error && data) return data;
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
      const { data, error } = await supabase.from('classes').select('*').eq('school_id', schoolId);
      if (!error && data) return data;
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
      if (!error && data) return data;
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
      if (isUuidString(data.driver_id)) payload.driver_id = data.driver_id;
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
      if (error) console.error('Supabase createVehicle error:', error);
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
        const { data: updated, error } = await supabase.from('vehicles').update(payload).eq('id', targetId).select().single();
        if (!error && updated) {
          return {
            ...updated,
            type: updated.vehicle_type || 'bus',
            driver_name: updates.driver_name,
            driver_phone: updates.driver_phone,
          };
        }
        if (error) console.error('Supabase updateVehicle error:', error);
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
      if (error) console.error('Supabase createTransportRoute error:', error);
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
        if (error) console.error('Supabase updateTransportRoute error:', error);
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
      if (error) console.error('Supabase createTransportStop error:', error);
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
      if (error) console.error('Supabase updateTransportStop error:', error);
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
      if (error) console.error('Supabase createTransportAssignment error:', error);
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
      if (error) console.error('Supabase updateTransportAssignment error:', error);
    }
    return { id, ...updates };
  },

  async deleteTransportAssignment(id: string): Promise<void> {
    const supabase = getSupabaseAdmin();
    if (supabase && isUuidString(id)) {
      await supabase.from('student_transport_assignments').delete().eq('id', id);
    }
  },

  async getTransportEvents(schoolId: string): Promise<any[]> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { data, error } = await supabase.from('student_transport_events').select('*').eq('school_id', schoolId);
      if (!error && data) return data;
    }
    return [];
  },

  async createTransportEvent(data: any): Promise<any> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { data: created, error } = await supabase.from('student_transport_events').insert(data).select().single();
      if (!error && created) return created;
    }
    return data;
  },

  async getTimetable(schoolId: string): Promise<any[]> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { data, error } = await supabase.from('timetable_entries').select('*').eq('school_id', schoolId);
      if (!error && data) return data;
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
      if (error) console.error('Supabase createTimetableEntry error:', error);
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
      if (error) console.error('Supabase updateTimetableEntry error:', error);
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
    }
    return [];
  },

  async createStudentAttendance(data: any): Promise<any> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const payload = sanitizeSupabasePayload(data);
      const { data: created, error } = await supabase.from('student_attendance').upsert(payload, { onConflict: 'school_id,student_id,attendance_date' }).select().single();
      if (!error && created) return created;
      if (error) console.error('Supabase createStudentAttendance error:', error);
    }
    return data;
  },

  async getTeacherAttendances(schoolId: string): Promise<any[]> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { data, error } = await supabase.from('teacher_attendance').select('*').eq('school_id', schoolId);
      if (!error && data) return data;
    }
    return [];
  },

  async createTeacherAttendance(data: any): Promise<any> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const payload = sanitizeSupabasePayload(data);
      const { data: created, error } = await supabase.from('teacher_attendance').upsert(payload, { onConflict: 'school_id,teacher_id,attendance_date' }).select().single();
      if (!error && created) return created;
      if (error) console.error('Supabase createTeacherAttendance error:', error);
    }
    return data;
  },

  async getStaffAttendances(schoolId: string): Promise<any[]> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { data, error } = await supabase.from('staff_attendance').select('*').eq('school_id', schoolId);
      if (!error && data) return data;
    }
    return [];
  },

  async createStaffAttendance(data: any): Promise<any> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const payload = sanitizeSupabasePayload(data);
      const { data: created, error } = await supabase.from('staff_attendance').upsert(payload, { onConflict: 'school_id,staff_id,attendance_date' }).select().single();
      if (!error && created) return created;
      if (error) console.error('Supabase createStaffAttendance error:', error);
    }
    return data;
  },

  async getStudentLeaves(schoolId: string): Promise<any[]> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { data, error } = await supabase.from('student_leaves').select('*').eq('school_id', schoolId);
      if (!error && data) return data;
    }
    return [];
  },

  async createStudentLeave(data: any): Promise<any> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const payload = sanitizeSupabasePayload(data);
      const { data: created, error } = await supabase.from('student_leaves').insert(payload).select().single();
      if (!error && created) return created;
      if (error) console.error('Supabase createStudentLeave error:', error);
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
      if (error) console.error('Supabase updateStudentLeave error:', error);
    }
    return { id, ...updates };
  },

  async getTeacherLeaves(schoolId: string): Promise<any[]> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { data, error } = await supabase.from('teacher_leaves').select('*').eq('school_id', schoolId);
      if (!error && data) return data;
    }
    return [];
  },

  async createTeacherLeave(data: any): Promise<any> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const payload = sanitizeSupabasePayload(data);
      const { data: created, error } = await supabase.from('teacher_leaves').insert(payload).select().single();
      if (!error && created) return created;
      if (error) console.error('Supabase createTeacherLeave error:', error);
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
      if (error) console.error('Supabase updateTeacherLeave error:', error);
    }
    return { id, ...updates };
  },

  async getStaffLeaves(schoolId: string): Promise<any[]> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
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
      if (error) console.error('Supabase createStaffLeave error:', error);
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
      if (error) console.error('Supabase updateStaffLeave error:', error);
    }
    return { id, ...updates };
  },

  async getFeeStructures(schoolId: string): Promise<any[]> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { data, error } = await supabase.from('fee_structures').select('*').eq('school_id', schoolId);
      if (!error && data) return data;
    }
    return [];
  },

  async createFeeStructure(data: any): Promise<any> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const payload = sanitizeSupabasePayload(data);
      const { data: created, error } = await supabase.from('fee_structures').insert(payload).select().single();
      if (!error && created) return created;
      if (error) console.error('Supabase createFeeStructure error:', error);
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
      if (error) console.error('Supabase updateFeeStructure error:', error);
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
    }
    return [];
  },

  async createFeeInvoice(data: any): Promise<any> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const payload = sanitizeSupabasePayload(data);
      const { data: created, error } = await supabase.from('student_fee_invoices').insert(payload).select().single();
      if (!error && created) return created;
      if (error) console.error('Supabase createFeeInvoice error:', error);
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
      if (error) console.error('Supabase updateFeeInvoice error:', error);
    }
    return { id, ...updates };
  },

  async getStudentCharges(schoolId: string): Promise<any[]> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { data, error } = await supabase.from('student_charges').select('*').eq('school_id', schoolId);
      if (!error && data) return data;
    }
    return [];
  },

  async createStudentCharge(data: any): Promise<any> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const payload = sanitizeSupabasePayload(data);
      const { data: created, error } = await supabase.from('student_charges').insert(payload).select().single();
      if (!error && created) return created;
      if (error) console.error('Supabase createStudentCharge error:', error);
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
      if (error) console.error('Supabase updateStudentCharge error:', error);
    }
    return { id, ...updates };
  },

  async getPaymentReceipts(schoolId: string): Promise<any[]> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { data, error } = await supabase.from('payment_receipts').select('*').eq('school_id', schoolId);
      if (!error && data) return data;
    }
    return [];
  },

  async createPaymentReceipt(data: any): Promise<any> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const payload = sanitizeSupabasePayload(data);
      const { data: created, error } = await supabase.from('payment_receipts').insert(payload).select().single();
      if (!error && created) return created;
      if (error) console.error('Supabase createPaymentReceipt error:', error);
    }
    return data;
  },

  async getEmployeePayments(schoolId: string): Promise<any[]> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { data, error } = await supabase.from('employee_payments').select('*').eq('school_id', schoolId);
      if (!error && data) return data;
    }
    return [];
  },

  async createEmployeePayment(data: any): Promise<any> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const payload = sanitizeSupabasePayload(data);
      const { data: created, error } = await supabase.from('employee_payments').insert(payload).select().single();
      if (!error && created) return created;
      if (error) console.error('Supabase createEmployeePayment error:', error);
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
      if (error) console.error('Supabase updateEmployeePayment error:', error);
    }
    return { id, ...updates };
  },

  async getTeacherPayments(schoolId: string): Promise<any[]> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { data, error } = await supabase.from('teacher_payments').select('*').eq('school_id', schoolId);
      if (!error && data) return data;
    }
    return [];
  },

  async createTeacherPayment(data: any): Promise<any> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const payload = sanitizeSupabasePayload(data);
      const { data: created, error } = await supabase.from('teacher_payments').insert(payload).select().single();
      if (!error && created) return created;
      if (error) console.error('Supabase createTeacherPayment error:', error);
    }
    return data;
  },

  async getSalaryHistory(schoolId: string): Promise<any[]> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { data, error } = await supabase.from('employee_salary_history').select('*').eq('school_id', schoolId);
      if (!error && data) return data;
    }
    return [];
  },

  async createSalaryHistory(data: any): Promise<any> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const payload = sanitizeSupabasePayload(data);
      const { data: created, error } = await supabase.from('employee_salary_history').insert(payload).select().single();
      if (!error && created) return created;
      if (error) console.error('Supabase createSalaryHistory error:', error);
    }
    return data;
  },

  async getFeeVersions(schoolId: string): Promise<any[]> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { data, error } = await supabase.from('fee_structure_versions').select('*').eq('school_id', schoolId);
      if (!error && data) return data;
    }
    return [];
  },

  async createFeeVersion(data: any): Promise<any> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const payload = sanitizeSupabasePayload(data);
      const { data: created, error } = await supabase.from('fee_structure_versions').insert(payload).select().single();
      if (!error && created) return created;
      if (error) console.error('Supabase createFeeVersion error:', error);
    }
    return data;
  },

  async getBulkChargeBatchs(schoolId: string): Promise<any[]> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { data, error } = await supabase.from('bulk_charge_batches').select('*').eq('school_id', schoolId);
      if (!error && data) return data;
    }
    return [];
  },

  async createBulkChargeBatch(data: any): Promise<any> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const payload = sanitizeSupabasePayload(data);
      const { data: created, error } = await supabase.from('bulk_charge_batches').insert(payload).select().single();
      if (!error && created) return created;
      if (error) console.error('Supabase createBulkChargeBatch error:', error);
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
      if (error) console.error('Supabase updateBulkChargeBatch error:', error);
    }
    return { id, ...updates };
  },

  async getExams(schoolId: string): Promise<any[]> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { data, error } = await supabase.from('exams').select('*').eq('school_id', schoolId);
      if (!error && data) return data;
    }
    return [];
  },

  async createExam(data: any): Promise<any> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const payload = sanitizeSupabasePayload(data);
      const { data: created, error } = await supabase.from('exams').insert(payload).select().single();
      if (!error && created) return created;
      if (error) console.error('Supabase createExam error:', error);
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
      if (error) console.error('Supabase updateExam error:', error);
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
    }
    return [];
  },

  async createExamResult(data: any): Promise<any> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const payload = sanitizeSupabasePayload(data);
      const { data: created, error } = await supabase.from('exam_results').insert(payload).select().single();
      if (!error && created) return created;
      if (error) console.error('Supabase createExamResult error:', error);
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
      if (error) console.error('Supabase updateExamResult error:', error);
    }
    return { id, ...updates };
  },

  async getNotices(schoolId: string): Promise<any[]> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { data, error } = await supabase.from('notices').select('*').eq('school_id', schoolId);
      if (!error && data) return data;
    }
    return [];
  },

  async createNotice(data: any): Promise<any> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const payload = sanitizeSupabasePayload(data);
      const { data: created, error } = await supabase.from('notices').insert(payload).select().single();
      if (!error && created) return created;
      if (error) console.error('Supabase createNotice error:', error);
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
      if (error) console.error('Supabase updateNotice error:', error);
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
    }
    return [];
  },

  async createNotification(data: any): Promise<any> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const payload = sanitizeSupabasePayload(data);
      const { data: created, error } = await supabase.from('app_notifications').insert(payload).select().single();
      if (!error && created) return created;
      if (error) console.error('Supabase createNotification error:', error);
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
      if (error) console.error('Supabase updateNotification error:', error);
    }
    return { id, ...updates };
  },

  async getParents(schoolId: string): Promise<any[]> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { data, error } = await supabase.from('parent_profiles').select('*').eq('school_id', schoolId);
      if (!error && data) return data;
    }
    return [];
  },

  async createParent(data: any): Promise<any> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const payload = sanitizeSupabasePayload(data);
      const { data: created, error } = await supabase.from('parent_profiles').insert(payload).select().single();
      if (!error && created) return created;
      if (error) console.error('Supabase createParent error:', error);
    }
    return data;
  },

  async updateParent(id: string, updates: any): Promise<any> {
    const supabase = getSupabaseAdmin();
    if (supabase && isUuidString(id)) {
      const payload = sanitizeSupabasePayload(updates);
      delete payload.id;
      const { data: updated, error } = await supabase.from('parent_profiles').update(payload).eq('id', id).select().single();
      if (!error && updated) return updated;
      if (error) console.error('Supabase updateParent error:', error);
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
    }
    return [];
  },

  async createParentLink(data: any): Promise<any> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const payload = sanitizeSupabasePayload(data);
      const { data: created, error } = await supabase.from('parent_student_links').insert(payload).select().single();
      if (!error && created) return created;
      if (error) console.error('Supabase createParentLink error:', error);
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
    }
    return [];
  },

  async createEnquiry(data: any): Promise<any> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const payload = sanitizeSupabasePayload(data);
      const { data: created, error } = await supabase.from('admission_enquiries').insert(payload).select().single();
      if (!error && created) return created;
      if (error) console.error('Supabase createEnquiry error:', error);
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
      if (error) console.error('Supabase updateEnquiry error:', error);
    }
    return { id, ...updates };
  },

  async getFollowUps(schoolId: string): Promise<any[]> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { data, error } = await supabase.from('student_followups').select('*').eq('school_id', schoolId);
      if (!error && data) return data;
    }
    return [];
  },

  async createFollowUp(data: any): Promise<any> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const payload = sanitizeSupabasePayload(data);
      const { data: created, error } = await supabase.from('student_followups').insert(payload).select().single();
      if (!error && created) return created;
      if (error) console.error('Supabase createFollowUp error:', error);
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
      if (error) console.error('Supabase updateFollowUp error:', error);
    }
    return { id, ...updates };
  },

  async getTransitionBatchs(schoolId: string): Promise<any[]> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { data, error } = await supabase.from('academic_year_transition_batches').select('*').eq('school_id', schoolId);
      if (!error && data) return data;
    }
    return [];
  },

  async createTransitionBatch(data: any): Promise<any> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const payload = sanitizeSupabasePayload(data);
      const { data: created, error } = await supabase.from('academic_year_transition_batches').insert(payload).select().single();
      if (!error && created) return created;
      if (error) console.error('Supabase createTransitionBatch error:', error);
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
      if (error) console.error('Supabase updateTransitionBatch error:', error);
    }
    return { id, ...updates };
  },

  async addToRecycleBin(data: any): Promise<any> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const payload = sanitizeSupabasePayload(data);
      const { data: created, error } = await supabase.from('recycle_bin_items').insert(payload).select().single();
      if (!error && created) return created;
      if (error) console.error('Supabase addToRecycleBin error:', error);
    }
    return data;
  },

  async removeFromRecycleBin(id: string): Promise<void> {
    const supabase = getSupabaseAdmin();
    if (supabase && isUuidString(id)) {
      await supabase.from('recycle_bin_items').delete().eq('id', id);
    }
  },
};
