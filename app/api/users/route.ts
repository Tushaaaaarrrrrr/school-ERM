import { NextResponse } from 'next/server';
import { getAccessContext } from '@/lib/server/access';
import { requireIdentity, getServiceSupabase } from '@/lib/server/auth';

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

    if (body.status === 'revoked' && context.state !== 'SUPER_ADMIN') {
      const { error } = await supabase.rpc('revoke_school_membership', { p_user_id: body.userId, p_school_id: body.schoolId });
      if (error) {
        await adminClient.from('school_memberships').update({
          status: 'revoked',
          revoked_at: new Date().toISOString(),
          revoked_by: context.profile.id,
        }).eq('user_id', body.userId).eq('school_id', body.schoolId);
      }
      return NextResponse.json({ success: true });
    }

    if (context.state !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Only a Super Admin can directly assign a school.' }, { status: 403 });
    }

    const allowed = ['super_admin', 'school_admin', 'teacher', 'accountant', 'parent', 'student', 'staff', 'driver'];
    if (!allowed.includes(body.role)) return NextResponse.json({ error: 'Invalid school role' }, { status: 400 });

    if (body.role === 'super_admin') {
      await adminClient.from('profiles').update({
        display_name: body.name || undefined,
        phone: body.phone || undefined,
        status: body.status === 'disabled' ? 'disabled' : 'active',
        school_id: null,
        role: 'super_admin',
        updated_at: new Date().toISOString(),
      }).eq('id', body.userId);

      await adminClient.from('school_memberships').update({
        status: 'revoked',
        revoked_at: new Date().toISOString(),
      }).eq('user_id', body.userId);

      return NextResponse.json({ success: true });
    }

    // 1. Try RPC assignment
    try {
      await supabase.rpc('assign_user_school_access', {
        p_user_id: body.userId,
        p_school_id: body.schoolId,
        p_role: body.role,
        p_name: body.name || '',
        p_phone: body.phone || '',
        p_status: body.status || 'active',
      });
    } catch {}

    // 2. Direct atomic guarantee with adminClient
    await adminClient.from('profiles').update({
      display_name: body.name || undefined,
      phone: body.phone || undefined,
      status: body.status === 'disabled' ? 'disabled' : 'active',
      school_id: body.status === 'active' ? body.schoolId : null,
      role: body.status === 'active' ? body.role : undefined,
      updated_at: new Date().toISOString(),
    }).eq('id', body.userId);

    if (body.status === 'active' && body.schoolId) {
      await adminClient.from('school_memberships').upsert({
        user_id: body.userId,
        school_id: body.schoolId,
        role: body.role,
        status: 'active',
        updated_at: new Date().toISOString(),
        revoked_at: null,
      }, { onConflict: 'user_id,school_id' });

      await adminClient.from('school_access_requests').update({
        status: 'approved',
        assigned_role: body.role,
        reviewed_by: context.profile.id,
        reviewed_at: new Date().toISOString(),
      }).eq('user_id', body.userId).eq('school_id', body.schoolId).eq('status', 'pending');
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Users PUT error:', err);
    return NextResponse.json({ error: err?.message || 'Unable to save user access' }, { status: 409 });
  }
}
