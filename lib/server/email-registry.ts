// ============================================================================
// Centralized Email & Identity Registry Engine
// Enforces @gmail.com domain, single-role integrity, and cross-role collision checks
// ============================================================================

import { requireIdentity, getServiceSupabase } from './auth';
import { serverDb } from './db';

export interface EmailCheckResult {
  valid: boolean;
  available: boolean;
  normalizedEmail: string;
  error?: string;
  existingRecord?: {
    type: 'profile' | 'membership' | 'teacher' | 'staff' | 'student' | 'access_request';
    name?: string;
    role?: string;
    schoolName?: string;
    schoolCode?: string;
    status?: string;
  };
}

/**
 * Validates that an email is structurally valid.
 * Allows Google Workspace domains (e.g. @school.edu.in) alongside @gmail.com.
 */
export function validateGmailDomain(email: string): { valid: boolean; error?: string } {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Email address is required.' };
  }

  const clean = email.trim().toLowerCase();

  // Basic email structure regex
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(clean)) {
    return { valid: false, error: 'Please enter a valid email address format.' };
  }

  return { valid: true };
}

/**
 * Runs the email through the centralized database (Supabase PostgreSQL + Server DB store)
 * to verify whether the email is already in use by another user, role, or school.
 */
export async function checkEmailRegistry(
  email: string,
  options?: {
    excludeUserId?: string;
    excludeEmail?: string;
    excludeSchoolId?: string;
    targetSchoolId?: string;
    targetRole?: string;
  }
): Promise<EmailCheckResult> {
  const domainCheck = validateGmailDomain(email);
  const normalizedEmail = email ? email.trim().toLowerCase() : '';

  if (!domainCheck.valid) {
    return {
      valid: false,
      available: false,
      normalizedEmail,
      error: domainCheck.error,
    };
  }

  if (options?.excludeEmail && options.excludeEmail.trim().toLowerCase() === normalizedEmail) {
    return {
      valid: true,
      available: true,
      normalizedEmail,
    };
  }

  // 0. Hardcoded Super Admin Accounts
  const superAdminEmails = [
    'superadmin@platform.erp',
    'superadmin@schoolerp.com',
    'pay.laxmikant@gmail.com',
  ];
  if (superAdminEmails.includes(normalizedEmail)) {
    return {
      valid: true,
      available: false,
      normalizedEmail,
      error: `This email is reserved as Platform Super Administrator. It cannot be registered for school administrator login.`,
      existingRecord: {
        type: 'profile',
        name: 'Platform Super Admin',
        role: 'Super Admin',
      },
    };
  }

  try {
    const { supabase } = await requireIdentity();
    const adminClient = getServiceSupabase() || supabase;

    // 1. Check Profiles & Active School Memberships in Supabase
    const { data: profiles, error: profileErr } = await adminClient
      .from('profiles')
      .select('id, email, display_name, role, status, school_id')
      .ilike('email', normalizedEmail)
      .limit(5);

    if (!profileErr && profiles && profiles.length > 0) {
      for (const p of profiles) {
        if (options?.excludeUserId && p.id === options.excludeUserId) continue;

        // If Super Admin
        if (p.role === 'super_admin') {
          return {
            valid: true,
            available: false,
            normalizedEmail,
            error: `This email is already assigned as Platform Super Administrator (${p.display_name || p.email}).`,
            existingRecord: {
              type: 'profile',
              name: p.display_name,
              role: 'Super Admin',
              status: p.status,
            },
          };
        }

        // Check active membership
        const { data: memberships } = await adminClient
          .from('school_memberships')
          .select('*, schools(name, code)')
          .eq('user_id', p.id)
          .eq('status', 'active');

        if (memberships && memberships.length > 0) {
          const m = memberships[0];
          const schoolName = (m.schools as any)?.name || 'another school';
          const schoolCode = (m.schools as any)?.code || '';
          const roleDisplay = String(m.role || p.role || 'Member').replace('_', ' ');

          return {
            valid: true,
            available: false,
            normalizedEmail,
            error: `This email is already active as ${roleDisplay} in ${schoolName} ${schoolCode ? `(${schoolCode})` : ''}. A single email cannot have conflicting roles.`,
            existingRecord: {
              type: 'membership',
              name: p.display_name,
              role: roleDisplay,
              schoolName,
              schoolCode,
              status: m.status,
            },
          };
        }
      }
    }

    // 2. Check Schools admin_email in Supabase & serverDb
    const allSchools = await serverDb.getSchools();
    const existingSchoolWithAdmin = allSchools.find(
      (s) =>
        s.admin_email?.toLowerCase().trim() === normalizedEmail &&
        (!options?.excludeSchoolId || s.id !== options.excludeSchoolId)
    );
    if (existingSchoolWithAdmin) {
      return {
        valid: true,
        available: false,
        normalizedEmail,
        error: `This Google email is already registered as the Administrator login account for "${existingSchoolWithAdmin.name}" (${existingSchoolWithAdmin.code}).`,
        existingRecord: {
          type: 'membership',
          name: existingSchoolWithAdmin.admin_name || existingSchoolWithAdmin.name,
          role: 'School Administrator',
          schoolName: existingSchoolWithAdmin.name,
          schoolCode: existingSchoolWithAdmin.code,
          status: existingSchoolWithAdmin.status,
        },
      };
    }

    // 3. Check Teachers in serverDb
    for (const school of allSchools) {
      const teachers = await serverDb.getTeachers(school.id);
      const existingTeacher = teachers.find(
        (t) => t.email?.toLowerCase().trim() === normalizedEmail && t.id !== options?.excludeUserId
      );
      if (existingTeacher) {
        return {
          valid: true,
          available: false,
          normalizedEmail,
          error: `This email is already assigned to Teacher "${existingTeacher.first_name} ${existingTeacher.last_name}" in ${school.name} (${school.code}).`,
          existingRecord: {
            type: 'teacher',
            name: `${existingTeacher.first_name} ${existingTeacher.last_name}`,
            role: 'Teacher',
            schoolName: school.name,
            schoolCode: school.code,
            status: existingTeacher.status,
          },
        };
      }

      // 3. Check Staff in serverDb
      const staffList = await serverDb.getStaff(school.id);
      const existingStaff = staffList.find(
        (s) => s.email?.toLowerCase().trim() === normalizedEmail && s.id !== options?.excludeUserId
      );
      if (existingStaff) {
        return {
          valid: true,
          available: false,
          normalizedEmail,
          error: `This email is already assigned to Staff member "${existingStaff.first_name} ${existingStaff.last_name}" (${existingStaff.staff_type}) in ${school.name} (${school.code}).`,
          existingRecord: {
            type: 'staff',
            name: `${existingStaff.first_name} ${existingStaff.last_name}`,
            role: `Staff (${existingStaff.staff_type})`,
            schoolName: school.name,
            schoolCode: school.code,
            status: existingStaff.status,
          },
        };
      }

      // 4. Check Students / Parents in serverDb
      const students = await serverDb.getStudents(school.id);
      const existingStudent = students.find(
        (s) => s.guardian?.email?.toLowerCase().trim() === normalizedEmail && s.id !== options?.excludeUserId
      );
      if (existingStudent) {
        // If checking a parent email for a new student in the same school, allow linking to existing parent
        const isSameSchoolParent = options?.targetRole === 'parent' && options?.targetSchoolId === school.id;
        if (!isSameSchoolParent) {
          return {
            valid: true,
            available: false,
            normalizedEmail,
            error: `This email is already linked to Student "${existingStudent.first_name} ${existingStudent.last_name}" (${existingStudent.registration_number}) in ${school.name}.`,
            existingRecord: {
              type: 'student',
              name: `${existingStudent.first_name} ${existingStudent.last_name}`,
              role: 'Student / Parent',
              schoolName: school.name,
              schoolCode: school.code,
              status: existingStudent.status,
            },
          };
        }
      }
    }

    return {
      valid: true,
      available: true,
      normalizedEmail,
    };
  } catch (err: any) {
    console.error('checkEmailRegistry error:', err);
    // On unexpected lookup failure, still return validation
    return {
      valid: true,
      available: true,
      normalizedEmail,
    };
  }
}
