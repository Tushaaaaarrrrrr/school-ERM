// ============================================================================
// Institutional Role Invite API
// Allows instant, zero-cost Google OAuth onboarding for Teachers, Drivers, Staff, and Parents
// ============================================================================

import { escapeLikePattern } from '@/lib/utils/security';
import { NextResponse } from 'next/server';
import { requireIdentity, getServiceSupabase } from '@/lib/server/auth';
import { serverDb } from '@/lib/server/db';
import { redirectForContext } from '@/lib/server/access';
import { sanitizeSchoolCode } from '@/lib/utils/school-code';

const ALLOWED_INVITE_ROLES = [
  'teacher',
  'driver',
  'staff',
  'accountant',
  'parent',
  'student',
  'school_admin',
];

// GET: Validate invite details (publicly accessible)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawCode = searchParams.get('code') || '';
    const rawRole = (searchParams.get('role') || 'teacher').toLowerCase().trim();

    if (!rawCode) {
      return NextResponse.json(
        { success: false, error: 'School code is required in the invite link.' },
        { status: 400 }
      );
    }

    const cleanCode = sanitizeSchoolCode(rawCode);
    const school = await serverDb.getSchoolByCode(cleanCode);

    if (!school) {
      return NextResponse.json(
        { success: false, error: `No registered school found with code "${cleanCode}".` },
        { status: 404 }
      );
    }

    if (school.status !== 'active') {
      return NextResponse.json(
        { success: false, error: `The school "${school.name}" is currently ${school.status}. Invitations are disabled.` },
        { status: 403 }
      );
    }

    const targetRole = ALLOWED_INVITE_ROLES.includes(rawRole) ? rawRole : 'teacher';

    return NextResponse.json({
      success: true,
      school: {
        id: school.id,
        name: school.name,
        code: school.code,
        logo_url: school.logo_url,
        address: school.address,
        email: school.email,
        phone: school.phone,
      },
      role: targetRole,
      roleDisplay: targetRole.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    });
  } catch (err: unknown) {
    console.error('Invite lookup error:', err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Unable to verify invitation link.' },
      { status: 500 }
    );
  }
}

// POST: Accept invite and bind user identity to school & role
export async function POST(request: Request) {
  try {
    const { supabase, user } = await requireIdentity();
    if (!user || !user.email) {
      return NextResponse.json(
        { success: false, error: 'Please sign in with Google to accept this invitation.' },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const rawCode = body.code || '';
    const rawRole = (body.role || 'teacher').toLowerCase().trim();

    if (!rawCode) {
      return NextResponse.json(
        { success: false, error: 'School code is required.' },
        { status: 400 }
      );
    }

    const cleanCode = sanitizeSchoolCode(rawCode);
    const school = await serverDb.getSchoolByCode(cleanCode);

    if (!school || school.status !== 'active') {
      return NextResponse.json(
        { success: false, error: 'Invalid or inactive school invite.' },
        { status: 404 }
      );
    }

    const targetRole = ALLOWED_INVITE_ROLES.includes(rawRole) ? rawRole : 'teacher';
    const email = user.email.trim().toLowerCase();
    const name = String(user.user_metadata?.full_name || user.user_metadata?.name || email.split('@')[0]);
    const adminClient = getServiceSupabase() || supabase;

    // 1. Ensure user profile exists
    let { data: profile } = await adminClient
      .from('profiles')
      .select('*')
      .ilike('email', escapeLikePattern(email))
      .maybeSingle();

    if (!profile) {
      const { data: newProf, error: createErr } = await adminClient
        .from('profiles')
        .insert({
          auth_user_id: user.id,
          email,
          display_name: name,
          school_id: school.id,
          role: targetRole,
          status: 'active',
        })
        .select()
        .single();

      if (createErr) throw createErr;
      profile = newProf;
    } else {
      // Don't downgrade Super Admin if they click an invite
      if (profile.role === 'super_admin') {
        return NextResponse.json({
          success: true,
          message: 'You are already a Super Admin with platform-wide access.',
          redirectUrl: '/super-admin',
          role: 'super_admin',
        });
      }

      await adminClient.from('profiles').update({
        auth_user_id: user.id,
        display_name: profile.display_name || name,
        school_id: school.id,
        role: targetRole,
        status: 'active',
        updated_at: new Date().toISOString(),
      }).eq('id', profile.id);
    }

    // 2. Safely revoke any prior active memberships across all schools
    // Strictly prevents uq_one_active_school_per_user unique constraint collision
    await adminClient
      .from('school_memberships')
      .update({
        status: 'revoked',
        revoked_at: new Date().toISOString(),
      })
      .eq('user_id', profile.id)
      .eq('status', 'active');

    // 3. Upsert active membership for the target school
    const { error: memErr } = await adminClient.from('school_memberships').upsert(
      {
        user_id: profile.id,
        school_id: school.id,
        role: targetRole,
        status: 'active',
        revoked_at: null,
        revoked_by: null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,school_id' }
    );

    if (memErr) {
      console.error('Invite membership upsert notice, retrying insert:', memErr);
      await adminClient.from('school_memberships').insert({
        user_id: profile.id,
        school_id: school.id,
        role: targetRole,
        status: 'active',
        updated_at: new Date().toISOString(),
      });
    }

    // 4. Clean up any pending access requests
    await adminClient
      .from('school_access_requests')
      .update({
        status: 'approved',
        assigned_role: targetRole,
        reviewed_at: new Date().toISOString(),
      })
      .eq('user_id', profile.id)
      .eq('school_id', school.id)
      .eq('status', 'pending');

    // 5. Ensure stub in teacher / staff directory if needed
    if (targetRole === 'teacher') {
      try {
        const teachers = await serverDb.getTeachers(school.id);
        const existingTeacher = teachers.find((t) => t.email?.toLowerCase().trim() === email);
        if (!existingTeacher) {
          const names = name.split(' ');
          await serverDb.createTeacher({
            id: `tch-${Date.now()}`,
            school_id: school.id,
            first_name: names[0] || 'Teacher',
            last_name: names.slice(1).join(' ') || '',
            email: email,
            phone: '',
            status: 'active',
            joining_date: new Date().toISOString().split('T')[0],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          } as any);
        }
      } catch (tchErr) {
        console.warn('Teacher directory auto-sync notice:', tchErr);
      }
    }

    const redirectPath =
      targetRole === 'school_admin'
        ? '/admin'
        : targetRole === 'teacher'
        ? '/teacher'
        : targetRole === 'driver'
        ? '/driver'
        : targetRole === 'parent'
        ? '/parent'
        : targetRole === 'student'
        ? '/student'
        : '/staff';

    return NextResponse.json({
      success: true,
      schoolId: school.id,
      schoolName: school.name,
      role: targetRole,
      redirectUrl: redirectPath,
      message: `Welcome to ${school.name}! Your ${targetRole.replace('_', ' ')} account is ready.`,
    });
  } catch (err: unknown) {
    console.error('Invite accept failure:', err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Unable to accept invite.' },
      { status: 500 }
    );
  }
}
