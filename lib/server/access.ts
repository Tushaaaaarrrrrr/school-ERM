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

  // 2. Direct teacher lookup by email
  try {
    const { data: matchedTeachers } = await adminClient
      .from('teachers')
      .select('*, schools(*)')
      .ilike('email', email)
      .eq('status', 'active');

    if (matchedTeachers && matchedTeachers.length > 0) {
      const t = matchedTeachers[0];
      const targetSchool = t.schools || (await serverDb.getSchoolById(t.school_id));
      if (targetSchool) {
        await adminClient.from('school_memberships').upsert({
          user_id: profile.id,
          school_id: targetSchool.id,
          role: 'teacher',
          status: 'active',
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id,school_id' });

        await adminClient.from('profiles').update({
          role: 'teacher',
          school_id: targetSchool.id,
          updated_at: new Date().toISOString(),
        }).eq('id', profile.id);

        const teacherPersona: UserPersona = {
          id: profile.id,
          name: `${t.first_name} ${t.last_name}`,
          email: email,
          role: 'teacher',
          school_id: targetSchool.id,
          school_name: targetSchool.name,
          school_code: targetSchool.code,
          permissions: [],
        };
        return {
          authenticated: true as const,
          state: 'ACTIVE_SCHOOL_USER' as AccessState,
          user: teacherPersona,
          school: targetSchool,
          profile: { ...profile, role: 'teacher', school_id: targetSchool.id },
        };
      }
    }
  } catch (tErr) {
    console.warn('Direct teacher lookup notice:', tErr);
  }

  // 3. Direct staff lookup by email
  try {
    const { data: matchedStaffMembers } = await adminClient
      .from('staff')
      .select('*, schools(*)')
      .ilike('email', email)
      .eq('status', 'active');

    if (matchedStaffMembers && matchedStaffMembers.length > 0) {
      const st = matchedStaffMembers[0];
      const targetSchool = st.schools || (await serverDb.getSchoolById(st.school_id));
      if (targetSchool) {
        const assignedRole: UserRole = st.staff_type === 'driver' ? 'driver' : st.staff_type === 'accountant' ? 'accountant' : 'staff';
        await adminClient.from('school_memberships').upsert({
          user_id: profile.id,
          school_id: targetSchool.id,
          role: assignedRole,
          status: 'active',
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id,school_id' });

        await adminClient.from('profiles').update({
          role: assignedRole,
          school_id: targetSchool.id,
          updated_at: new Date().toISOString(),
        }).eq('id', profile.id);

        const staffPersona: UserPersona = {
          id: profile.id,
          name: `${st.first_name} ${st.last_name}`,
          email: email,
          role: assignedRole,
          school_id: targetSchool.id,
          school_name: targetSchool.name,
          school_code: targetSchool.code,
          permissions: st.permissions || [],
        };
        return {
          authenticated: true as const,
          state: 'ACTIVE_SCHOOL_USER' as AccessState,
          user: staffPersona,
          school: targetSchool,
          profile: { ...profile, role: assignedRole, school_id: targetSchool.id },
        };
      }
    }
  } catch (stErr) {
    console.warn('Direct staff lookup notice:', stErr);
  }

  // 4. Direct parent lookup by parent_profiles
  try {
    const { data: matchedParents } = await adminClient
      .from('parent_profiles')
      .select('*, schools(*)')
      .ilike('email', email)
      .eq('status', 'active');

    if (matchedParents && matchedParents.length > 0) {
      const p = matchedParents[0];
      const targetSchool = p.schools || (await serverDb.getSchoolById(p.school_id));
      if (targetSchool) {
        await adminClient.from('school_memberships').upsert({
          user_id: profile.id,
          school_id: targetSchool.id,
          role: 'parent',
          status: 'active',
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id,school_id' });

        await adminClient.from('profiles').update({
          role: 'parent',
          school_id: targetSchool.id,
          updated_at: new Date().toISOString(),
        }).eq('id', profile.id);

        try {
          await adminClient.from('parent_profiles').update({
            auth_user_id: user.id,
            updated_at: new Date().toISOString(),
          }).eq('id', p.id);
        } catch {}

        const parentPersona: UserPersona = {
          id: profile.id,
          name: p.guardian_name || p.father_name || p.mother_name || name,
          email: email,
          role: 'parent',
          school_id: targetSchool.id,
          school_name: targetSchool.name,
          school_code: targetSchool.code,
          parent_id: p.id,
          permissions: [],
        };
        return {
          authenticated: true as const,
          state: 'ACTIVE_SCHOOL_USER' as AccessState,
          user: parentPersona,
          school: targetSchool,
          profile: { ...profile, role: 'parent', school_id: targetSchool.id },
        };
      }
    }
  } catch (parentErr) {
    console.warn('Direct parent_profiles lookup notice:', parentErr);
  }

  // 5. Direct parent lookup by guardians table
  try {
    const { data: matchedGuardians } = await adminClient
      .from('guardians')
      .select('*, schools(*)')
      .ilike('email', email);

    if (matchedGuardians && matchedGuardians.length > 0) {
      const g = matchedGuardians[0];
      const targetSchool = g.schools || (await serverDb.getSchoolById(g.school_id));
      if (targetSchool) {
        await adminClient.from('school_memberships').upsert({
          user_id: profile.id,
          school_id: targetSchool.id,
          role: 'parent',
          status: 'active',
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id,school_id' });

        await adminClient.from('profiles').update({
          role: 'parent',
          school_id: targetSchool.id,
          updated_at: new Date().toISOString(),
        }).eq('id', profile.id);

        const parentPersona: UserPersona = {
          id: profile.id,
          name: g.guardian_name || g.father_name || g.mother_name || name,
          email: email,
          role: 'parent',
          school_id: targetSchool.id,
          school_name: targetSchool.name,
          school_code: targetSchool.code,
          permissions: [],
        };
        return {
          authenticated: true as const,
          state: 'ACTIVE_SCHOOL_USER' as AccessState,
          user: parentPersona,
          school: targetSchool,
          profile: { ...profile, role: 'parent', school_id: targetSchool.id },
        };
      }
    }
  } catch (gErr) {
    console.warn('Direct guardians table lookup notice:', gErr);
  }

  // 6. Direct parent lookup by student's guardian JSON
  try {
    const { data: matchedStudents } = await adminClient
      .from('students')
      .select('*, schools(*)')
      .ilike('guardian->>email', email)
      .eq('status', 'active');

    if (matchedStudents && matchedStudents.length > 0) {
      const st = matchedStudents[0];
      const targetSchool = st.schools || (await serverDb.getSchoolById(st.school_id));
      if (targetSchool) {
        await adminClient.from('school_memberships').upsert({
          user_id: profile.id,
          school_id: targetSchool.id,
          role: 'parent',
          status: 'active',
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id,school_id' });

        await adminClient.from('profiles').update({
          role: 'parent',
          school_id: targetSchool.id,
          updated_at: new Date().toISOString(),
        }).eq('id', profile.id);

        const gName = st.guardian?.guardian_name || st.guardian?.father_name || st.guardian?.mother_name || `${st.first_name}'s Guardian`;
        const parentPersona: UserPersona = {
          id: profile.id,
          name: gName,
          email: email,
          role: 'parent',
          school_id: targetSchool.id,
          school_name: targetSchool.name,
          school_code: targetSchool.code,
          permissions: [],
        };
        return {
          authenticated: true as const,
          state: 'ACTIVE_SCHOOL_USER' as AccessState,
          user: parentPersona,
          school: targetSchool,
          profile: { ...profile, role: 'parent', school_id: targetSchool.id },
        };
      }
    }
  } catch (stGuardErr) {
    console.warn('Direct student guardian JSON lookup notice:', stGuardErr);
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

    // 6. Check Parents (by parent_profiles in serverDb)
    const parents = await serverDb.getParents(s.id);
    const matchedParent = parents.find((p: any) => p.email?.trim().toLowerCase() === email);
    if (matchedParent && matchedParent.status === 'active') {
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

      const parentPersona: UserPersona = {
        id: profile.id,
        name: matchedParent.guardian_name || matchedParent.father_name || matchedParent.mother_name || name,
        email: email,
        role: assignedRole,
        school_id: s.id,
        school_name: s.name,
        school_code: s.code,
        parent_id: matchedParent.id,
        permissions: [],
      };
      return {
        authenticated: true as const,
        state: 'ACTIVE_SCHOOL_USER' as AccessState,
        user: parentPersona,
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
  if (!context.authenticated) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const isConfigured = Boolean(url && !url.includes('demo.supabase.co') && !url.includes('your-project-id'));
    if (!isConfigured) {
      const allSchools = await serverDb.getSchools();
      const schoolId = requestedSchoolId || allSchools[0]?.id || 'sch-4404';
      const adminUser: UserPersona = { id: 'usr-admin-01', name: 'School Administrator', email: 'admin@school.com', role: 'school_admin', school_id: schoolId };
      return { ok: true as const, schoolId, email: 'admin@school.com', role: 'school_admin' as UserRole, context: { authenticated: true as const, state: 'ACTIVE_SCHOOL_USER' as AccessState, user: adminUser } as any };
    }
    return { ok: false as const, status: 401, context, schoolId: undefined, email: undefined, role: undefined };
  }
  if (context.state === 'SUPER_ADMIN') return { ok: true as const, schoolId: requestedSchoolId || undefined, email: context.profile?.email, role: 'super_admin' as UserRole, context };
  if (context.state !== 'ACTIVE_SCHOOL_USER' || !context.user?.school_id) return { ok: false as const, status: 403, context, schoolId: undefined, email: undefined, role: undefined };
  if (requestedSchoolId && requestedSchoolId !== context.user.school_id) return { ok: false as const, status: 403, context, schoolId: undefined, email: undefined, role: undefined };
  if (roles && !roles.includes(context.user.role)) return { ok: false as const, status: 403, context, schoolId: undefined, email: undefined, role: undefined };
  return { ok: true as const, schoolId: context.user.school_id, email: context.user.email, role: context.user.role, context };
}
