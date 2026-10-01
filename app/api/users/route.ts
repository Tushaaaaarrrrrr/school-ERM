import { NextResponse } from 'next/server';
import { getAccessContext } from '@/lib/server/access';
import { requireIdentity, getServiceSupabase } from '@/lib/server/auth';

function assertNoDbError(result: { error?: any }, action: string) {
  if (result.error) {
    throw new Error(`${action}: ${result.error.message || result.error}`);
  }
}

export async function GET() {
  try {
    const context = await getAccessContext();
    if (!context.authenticated) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
    const { supabase } = await requireIdentity();
    const adminClient = getServiceSupabase() || supabase;

    if (context.state !== 'SUPER_ADMIN' && !(context.state === 'ACTIVE_SCHOOL_USER' && context.user?.role === 'school_admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const [profilesResult, membershipsResult, schoolsResult] = await Promise.all([
      adminClient.from('profiles').select('id,email,display_name,phone,status,role,created_at').order('created_at', { ascending: false }),
      adminClient.from('school_memberships').select('id,user_id,school_id,role,status'),
      adminClient.from('schools').select('id,name,code'),
    ]);

    if (profilesResult.error) throw profilesResult.error;
    if (membershipsResult.error) throw membershipsResult.error;
    if (schoolsResult.error) throw schoolsResult.error;

    const schools = new Map((schoolsResult.data || []).map((school: any) => [school.id, school]));
    const memberships = (membershipsResult.data || []).map((membership: any) => ({
      ...membership,
      schools: schools.get(membership.school_id) || null,
    }));

    let profiles = profilesResult.data || [];
    if (context.state !== 'SUPER_ADMIN') {
      const visibleIds = new Set(
        memberships
          .filter((membership: any) => membership.school_id === context.user!.school_id)
          .map((membership: any) => membership.user_id)
      );
      profiles = profiles.filter((profile: any) => visibleIds.has(profile.id));
    }

    return NextResponse.json({
      success: true,
      data: profiles.map((profile: any) => ({
        ...profile,
        school_memberships: memberships.filter((membership: any) => membership.user_id === profile.id),
      })),
    });
  } catch (error) {
    console.error('Users API failure:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to load users' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const context = await getAccessContext();
    if (!context.authenticated) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
    const body = await request.json();
    const { supabase } = await requireIdentity();
    const adminClient = getServiceSupabase() || supabase;

    if (context.state !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Only a Super Admin can directly manage user access.' }, { status: 403 });
    }

    if (!body.userId) {
      return NextResponse.json({ error: 'User ID is required.' }, { status: 400 });
    }

    // Handle Revocation
    if (body.status === 'revoked') {
      assertNoDbError(await adminClient.from('school_memberships').update({
        status: 'revoked',
        revoked_at: new Date().toISOString(),
        revoked_by: context.profile?.id || null,
      }).eq('user_id', body.userId).eq('status', 'active'), 'Revoke active memberships');

      assertNoDbError(await adminClient.from('profiles').update({
        status: 'revoked',
        school_id: null,
        updated_at: new Date().toISOString(),
      }).eq('id', body.userId), 'Revoke profile access');

      return NextResponse.json({ success: true, message: 'User access revoked' });
    }

    // Handle Disabled
    if (body.status === 'disabled') {
      assertNoDbError(await adminClient.from('school_memberships').update({
        status: 'revoked',
        revoked_at: new Date().toISOString(),
        revoked_by: context.profile?.id || null,
      }).eq('user_id', body.userId).eq('status', 'active'), 'Disable active memberships');

      assertNoDbError(await adminClient.from('profiles').update({
        status: 'disabled',
        updated_at: new Date().toISOString(),
      }).eq('id', body.userId), 'Disable profile');

      return NextResponse.json({ success: true, message: 'User disabled' });
    }

    const allowed = ['super_admin', 'school_admin', 'teacher', 'accountant', 'parent', 'student', 'staff', 'driver'];
    if (!allowed.includes(body.role)) {
      return NextResponse.json({ error: 'Invalid school role.' }, { status: 400 });
    }

    // Handle Super Admin Promotion
    if (body.role === 'super_admin') {
      assertNoDbError(await adminClient.from('school_memberships').update({
        status: 'revoked',
        revoked_at: new Date().toISOString(),
        revoked_by: context.profile?.id || null,
      }).eq('user_id', body.userId), 'Revoke school memberships');

      assertNoDbError(await adminClient.from('profiles').update({
        display_name: body.name || undefined,
        phone: body.phone || undefined,
        status: 'active',
        school_id: null,
        role: 'super_admin',
        updated_at: new Date().toISOString(),
      }).eq('id', body.userId), 'Promote profile');

      return NextResponse.json({ success: true, message: 'User promoted to Super Admin' });
    }

    if (!body.schoolId) {
      return NextResponse.json({ error: 'School selection is required for this role.' }, { status: 400 });
    }

    assertNoDbError(await supabase.rpc('assign_user_school_access', {
      p_user_id: body.userId,
      p_school_id: body.schoolId,
      p_role: body.role,
      p_name: body.name || '',
      p_phone: body.phone || '',
      p_status: 'active',
    }), 'Save school access');

    return NextResponse.json({ success: true, message: 'User access successfully updated' });
  } catch (err: any) {
    console.error('Users PUT error:', err);
    return NextResponse.json({ error: err?.message || 'Unable to save user access' }, { status: 409 });
  }
}

export async function PATCH(request: Request) {
  try {
    const context = await getAccessContext();
    if (!context.authenticated || !context.profile?.id) {
      return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
    }
    const body = await request.json();
    const { supabase } = await requireIdentity();
    const adminClient = getServiceSupabase() || supabase;

    const isStudent = context.user?.role === 'student' || context.profile?.role === 'student';

    const updates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    if (body.name !== undefined && typeof body.name === 'string') {
      const trimmedName = body.name.trim();
      if (isStudent && trimmedName !== (context.profile.display_name || '').trim()) {
        return NextResponse.json(
          { error: 'Students are not authorized to modify their official name. Please contact school administration.' },
          { status: 403 }
        );
      }
      if (!isStudent) {
        updates.display_name = trimmedName;
      }
    }
    if (body.phone !== undefined && typeof body.phone === 'string') {
      updates.phone = body.phone.trim();
    }

    const { data, error } = await adminClient
      .from('profiles')
      .update(updates)
      .eq('id', context.profile.id)
      .select()
      .maybeSingle();

    if (error) {
      console.warn('Profile update error in DB:', error);
    }

    return NextResponse.json({
      success: true,
      data: {
        id: context.profile.id,
        name: updates.display_name || context.profile.display_name,
        phone: updates.phone !== undefined ? updates.phone : context.profile.phone,
      },
    });
  } catch (err: any) {
    console.error('Profile PATCH error:', err);
    return NextResponse.json({ error: err?.message || 'Failed to update profile' }, { status: 500 });
  }
}
