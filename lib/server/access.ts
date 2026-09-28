import type { UserPersona, UserRole } from '@/lib/types';
import { requireIdentity, getServiceSupabase } from './auth';
import { serverDb } from './db';
import { validateGmailDomain } from './email-registry';

export type AccessState = 'SUPER_ADMIN' | 'ACTIVE_SCHOOL_USER' | 'PENDING_ACCESS_REQUEST' | 'NO_SCHOOL_ACCESS' | 'DISABLED' | 'REVOKED';

export async function getAccessContext() {
  const { supabase, user } = await requireIdentity();
  if (!user) return { authenticated: false as const };
  return resolveAccessContext(supabase, user);
}

export async function resolveAccessContext(supabase: any, user: any) {
  const email = user.email!.trim().toLowerCase();
  const name = String(user.user_metadata?.full_name || user.user_metadata?.name || email.split('@')[0]);
  const adminClient = getServiceSupabase() || supabase;

  const envSuperAdminEmails = (process.env.SUPER_ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  const isSuperAdminEmail =
    email === 'pay.laxmikant@gmail.com' ||
    email === 'superadmin@platform.erp' ||
    email === 'superadmin@schoolerp.com' ||
    envSuperAdminEmails.includes(email);

  let profile: any = null;
  try {
    const { data: profByAuth } = await adminClient.from('profiles').select('*').eq('auth_user_id', user.id).maybeSingle();
    profile = profByAuth;
    if (!profile) {
      const { data: profileByEmail } = await adminClient.from('profiles').select('*').ilike('email', email).maybeSingle();
      if (profileByEmail) {
        const { data: updatedProf } = await adminClient.from('profiles').update({ auth_user_id: user.id, updated_at: new Date().toISOString() }).eq('id', profileByEmail.id).select().single();
        profile = updatedProf || profileByEmail;
      }
    }

    if (!profile) {
      const registration = await supabase.rpc('ensure_platform_profile', { p_email: email, p_display_name: name });
      profile = registration?.data;
    }

    if (!profile) {
      const { data: createdProf } = await adminClient.from('profiles').insert({
        auth_user_id: user.id,
        email: email,
        display_name: name,
        status: 'active',
        role: isSuperAdminEmail ? 'super_admin' : 'school_user',
      }).select().single();
      profile = createdProf;
    }
  } catch (e) {
    console.warn('Supabase profile resolution fallback to memory:', e);
  }

  if (!profile) {
    profile = {
      id: user.id,
      auth_user_id: user.id,
      email: email,
      display_name: name,
      status: 'active',
      role: isSuperAdminEmail ? 'super_admin' : 'school_user',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  if (profile.status && profile.status !== 'active') {
    return { authenticated: true as const, state: profile.status === 'revoked' ? 'REVOKED' as AccessState : 'DISABLED' as AccessState, profile };
  }

  if (isSuperAdminEmail || profile.role === 'super_admin') {
    if (profile.id && profile.role !== 'super_admin') {
      try {
        await adminClient.from('profiles').update({
          role: 'super_admin',
          status: 'active',
          updated_at: new Date().toISOString(),
        }).eq('id', profile.id);
        profile.role = 'super_admin';
      } catch (adminSyncErr) {
        console.warn('Super admin role sync notice:', adminSyncErr);
      }
    }
    const superAdminPersona: UserPersona = {
      id: profile.id || user.id,
      name: profile.display_name || name || 'Super Admin',
      email: email,
      role: 'super_admin',
    };
    return { authenticated: true as const, state: 'SUPER_ADMIN' as AccessState, user: superAdminPersona, profile };
  }

  let membership: any = null;
  try {
    const { data: mems } = await adminClient
      .from('school_memberships')
      .select('*, schools(*)')
      .eq('user_id', profile.id)
      .eq('status', 'active')
      .order('updated_at', { ascending: false })
      .limit(1);
    membership = mems && mems.length > 0 ? mems[0] : null;
  } catch (memErr) {
    console.warn('Membership query notice:', memErr);
  }

  if (membership) {
    let school = membership.schools as any;
    if (school && school.status !== 'active') {
      return { authenticated: true as const, state: 'DISABLED' as AccessState, profile };
    }
    const serverSchool = await serverDb.getSchoolById(membership.school_id);
    if (serverSchool) {
      school = {
        ...school,
        ...serverSchool,
        school_hours: (serverSchool.school_hours && Object.keys(serverSchool.school_hours).length > 0)
          ? serverSchool.school_hours
          : (school?.school_hours && Object.keys(school.school_hours).length > 0 ? school.school_hours : undefined),
      };
    }
    return {
      authenticated: true as const,
      state: 'ACTIVE_SCHOOL_USER' as AccessState,
      user: persona(profile, membership, school),
      membership,
      school,
      profile,
    };
  }

  // 1. Direct school admin lookup by email (instant auto-link for any school)
  try {
    const { data: matchedAdminSchools } = await adminClient
      .from('schools')
      .select('*')
      .ilike('admin_email', email)
      .eq('status', 'active');

    if (matchedAdminSchools && matchedAdminSchools.length > 0) {
      const s = matchedAdminSchools[0];
      await adminClient.from('school_memberships').upsert({
        user_id: profile.id,
        school_id: s.id,
        role: 'school_admin',
        status: 'active',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,school_id' });

      await adminClient.from('profiles').update({
        role: 'school_admin',
        school_id: s.id,
        updated_at: new Date().toISOString(),
      }).eq('id', profile.id);

      const adminPersona: UserPersona = {
        id: profile.id,
        name: s.admin_name || `${s.name} Administrator`,
        email: email,
        role: 'school_admin',
        school_id: s.id,
        school_name: s.name,
        school_code: s.code,
        permissions: [],
      };
      return {
        authenticated: true as const,
        state: 'ACTIVE_SCHOOL_USER' as AccessState,
        user: adminPersona,
        school: s,
        profile: { ...profile, role: 'school_admin', school_id: s.id },
      };
    }
  } catch (directAdminErr) {
    console.warn('Direct admin_email lookup notice:', directAdminErr);
  }

  // Pre-registration sync from centralized server database
  const allSchools = await serverDb.getSchools();
  for (const s of allSchools) {
    // 1. Check School Admin
    const adminEmail = s.admin_email?.trim().toLowerCase() || s.email?.trim().toLowerCase();
    const genericAdmin = `admin@${s.code.toLowerCase()}.edu.in`;
    const isSchoolAdmin =
      email === adminEmail ||
      email === genericAdmin ||
      (s.id === 'sch-001' && (email === 'admin@delhipublic.edu.in' || email.startsWith('admin@')));

    if (isSchoolAdmin) {
      try {
        await adminClient.from('school_memberships').upsert({
          user_id: profile.id,
          school_id: s.id,
          role: 'school_admin',
          status: 'active',
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id,school_id' });

        await adminClient.from('profiles').update({
          role: 'school_admin',
          school_id: s.id,
          updated_at: new Date().toISOString(),
        }).eq('id', profile.id);
      } catch {}

      const adminPersona: UserPersona = {
        id: profile.id,
        name: s.admin_name || `${s.name} Administrator`,
        email: email,
        role: 'school_admin',
        school_id: s.id,
        school_name: s.name,
        school_code: s.code,
        permissions: [],
      };
      return {
        authenticated: true as const,
        state: 'ACTIVE_SCHOOL_USER' as AccessState,
        user: adminPersona,
        school: s,
        profile: { ...profile, role: 'school_admin', school_id: s.id },
      };
    }

    const teachers = await serverDb.getTeachers(s.id);
    const matchedTeacher = teachers.find((t) => t.email?.trim().toLowerCase() === email);
    if (matchedTeacher && matchedTeacher.status === 'active') {
      await adminClient.from('school_memberships').upsert({
        user_id: profile.id,
        school_id: s.id,
        role: 'teacher',
        status: 'active',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,school_id' });

      await adminClient.from('profiles').update({
        role: 'teacher',
        school_id: s.id,
        updated_at: new Date().toISOString(),
      }).eq('id', profile.id);

      const teacherPersona: UserPersona = {
        id: profile.id,
        name: `${matchedTeacher.first_name} ${matchedTeacher.last_name}`,
        email: email,
        role: 'teacher',
        school_id: s.id,
        school_name: s.name,
        school_code: s.code,
        permissions: [],
      };
      return {
        authenticated: true as const,
        state: 'ACTIVE_SCHOOL_USER' as AccessState,
        user: teacherPersona,
        school: s,
        profile,
      };
    }

    const staffList = await serverDb.getStaff(s.id);
    const matchedStaff = staffList.find((st) => st.email?.trim().toLowerCase() === email);
    if (matchedStaff && matchedStaff.status === 'active') {
      const assignedRole: UserRole = matchedStaff.staff_type === 'driver' ? 'driver' : matchedStaff.staff_type === 'accountant' ? 'accountant' : 'staff';
      await adminClient.from('school_memberships').upsert({
        user_id: profile.id,
        school_id: s.id,
        role: assignedRole,
        status: 'active',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,school_id' });

      await adminClient.from('profiles').update({
        role: assignedRole,
        school_id: s.id,
        updated_at: new Date().toISOString(),
      }).eq('id', profile.id);

      const staffPersona: UserPersona = {
        id: profile.id,
        name: `${matchedStaff.first_name} ${matchedStaff.last_name}`,
        email: email,
        role: assignedRole,
        school_id: s.id,
        school_name: s.name,
        school_code: s.code,
        permissions: matchedStaff.permissions || [],
      };
      return {
        authenticated: true as const,
        state: 'ACTIVE_SCHOOL_USER' as AccessState,
        user: staffPersona,
        school: s,
        profile,
      };
    }

    // 5. Check Students (by guardian email for parent auto-sync)
    const students = await serverDb.getStudents(s.id);
    const matchedStudent = students.find(
      (st) => st.guardian?.email?.trim().toLowerCase() === email
    );
    if (matchedStudent && matchedStudent.status === 'active') {
      // Guardian email match → assign as parent
      const assignedRole: UserRole = 'parent';

      await adminClient.from('school_memberships').upsert({
        user_id: profile.id,
        school_id: s.id,
        role: assignedRole,
        status: 'active',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,school_id' });

      await adminClient.from('profiles').update({
        role: assignedRole,
        school_id: s.id,
        updated_at: new Date().toISOString(),
      }).eq('id', profile.id);

      const guardianName = matchedStudent.guardian?.guardian_name
        || matchedStudent.guardian?.father_name
        || matchedStudent.guardian?.mother_name
        || `${matchedStudent.first_name}'s Guardian`;

      const studentPersona: UserPersona = {
        id: profile.id,
        name: guardianName,
        email: email,
        role: assignedRole,
        school_id: s.id,
        school_name: s.name,
        school_code: s.code,
        permissions: [],
      };
      return {
        authenticated: true as const,
        state: 'ACTIVE_SCHOOL_USER' as AccessState,
        user: studentPersona,
        school: s,
        profile,
      };
    }
  }

  const { data: revoked } = await adminClient.from('school_memberships').select('id').eq('user_id', profile.id).eq('status', 'revoked').limit(1).maybeSingle();
  if (revoked) return { authenticated: true as const, state: 'REVOKED' as AccessState, profile };

  const { data: request } = await adminClient.from('school_access_requests').select('*, schools(name, code)')
    .eq('user_id', profile.id).eq('status', 'pending').order('requested_at', { ascending: false }).limit(1).maybeSingle();

  return {
    authenticated: true as const,
    state: request ? 'PENDING_ACCESS_REQUEST' as AccessState : 'NO_SCHOOL_ACCESS' as AccessState,
    profile,
    request,
  };
}

function persona(profile: any, membership?: any, school?: any): UserPersona {
  return {
    id: profile.id,
    name: profile.display_name,
    email: profile.email,
    role: (membership?.role || profile.role) as UserRole,
    school_id: membership?.school_id,
    school_name: school?.name,
    school_code: school?.code,
    permissions: membership?.permissions || [],
  };
}

export function redirectForContext(context: any) {
  if (!context.authenticated) return '/login';
  if (context.state === 'SUPER_ADMIN') return '/super-admin';
  if (context.state === 'PENDING_ACCESS_REQUEST' || context.state === 'NO_SCHOOL_ACCESS') return '/join';
  if (context.state === 'DISABLED' || context.state === 'REVOKED') return '/access-unavailable';
  const role = context.user?.role;
  return role === 'school_admin' ? '/admin' : role === 'teacher' ? '/teacher' : role === 'student' ? '/student' : role === 'driver' ? '/driver' : role === 'parent' ? '/parent' : '/staff';
}

export async function requireSchoolAccess(
  first?: string | (UserRole | string)[] | null,
  second?: (UserRole | string)[]
) {
  let requestedSchoolId: string | null | undefined;
  let roles: (UserRole | string)[] | undefined;

  if (Array.isArray(first)) {
    roles = first;
    requestedSchoolId = undefined;
  } else {
    requestedSchoolId = first;
    roles = second;
  }

  const context = await getAccessContext();
  if (!context.authenticated) return { ok: false as const, status: 401, context, schoolId: undefined, email: undefined, role: undefined };
  if (context.state === 'SUPER_ADMIN') return { ok: true as const, schoolId: requestedSchoolId || undefined, email: context.profile?.email, role: 'super_admin' as UserRole, context };
  if (context.state !== 'ACTIVE_SCHOOL_USER' || !context.user?.school_id) return { ok: false as const, status: 403, context, schoolId: undefined, email: undefined, role: undefined };
  if (requestedSchoolId && requestedSchoolId !== context.user.school_id) return { ok: false as const, status: 403, context, schoolId: undefined, email: undefined, role: undefined };
  if (roles && !roles.includes(context.user.role)) return { ok: false as const, status: 403, context, schoolId: undefined, email: undefined, role: undefined };
  return { ok: true as const, schoolId: context.user.school_id, email: context.user.email, role: context.user.role, context };
}
