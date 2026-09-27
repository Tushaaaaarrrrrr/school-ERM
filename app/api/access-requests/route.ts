import { NextResponse } from 'next/server';
import { getAccessContext } from '@/lib/server/access';
import { requireIdentity, getServiceSupabase } from '@/lib/server/auth';
import { validateGmailDomain } from '@/lib/server/email-registry';
import { serverDb } from '@/lib/server/db';

export async function GET() {
  try {
    const context = await getAccessContext();
    if (!context.authenticated) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
    const { supabase } = await requireIdentity();
    const adminClient = getServiceSupabase() || supabase;

    let query = adminClient.from('school_access_requests').select('*').order('requested_at', { ascending: false });
    if (context.state === 'ACTIVE_SCHOOL_USER' && context.user?.role === 'school_admin') {
      query = query.eq('school_id', context.user.school_id!);
    } else if (context.state !== 'SUPER_ADMIN') {
      query = query.eq('user_id', context.profile.id);
    }
    const requestsResult = await query;
    if (requestsResult.error) throw requestsResult.error;
    const requests = requestsResult.data || [];
    const userIds = [...new Set(requests.map((item: any) => item.user_id))];
    const schoolIds = [...new Set(requests.map((item: any) => item.school_id))];
    const [profilesResult, schoolsResult] = await Promise.all([
      userIds.length ? adminClient.from('profiles').select('id,email,display_name,phone').in('id', userIds) : Promise.resolve({ data: [], error: null }),
      schoolIds.length ? adminClient.from('schools').select('id,name,code').in('id', schoolIds) : Promise.resolve({ data: [], error: null }),
    ]);
    if (profilesResult.error) throw profilesResult.error;
    if (schoolsResult.error) throw schoolsResult.error;
    const profiles = new Map((profilesResult.data || []).map((profile: any) => [profile.id, profile]));
    const schools = new Map((schoolsResult.data || []).map((school: any) => [school.id, school]));
    return NextResponse.json({ success: true, data: requests.map((item: any) => ({ ...item, profiles: profiles.get(item.user_id) || null, schools: schools.get(item.school_id) || null })) });
  } catch (error) {
    console.error('Access requests API failure:', error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unable to load access requests' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const context = await getAccessContext();
    if (!context.authenticated) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
    if (context.state === 'ACTIVE_SCHOOL_USER' || context.state === 'SUPER_ADMIN') return NextResponse.json({ error: 'You already have active access.' }, { status: 409 });
    if (context.state === 'DISABLED' || context.state === 'REVOKED') return NextResponse.json({ error: 'Account access is unavailable.' }, { status: 403 });
    const userEmail = context.profile.email;
    const domainCheck = validateGmailDomain(userEmail);
    if (!domainCheck.valid) return NextResponse.json({ error: domainCheck.error }, { status: 400 });

    const { schoolCode, name, phone, notes } = await request.json();
    const cleanCode = String(schoolCode || '').trim().toUpperCase();
    const { supabase } = await requireIdentity();

    let rpcError: any = null;
    let rpcData: any = null;

    try {
      const res = await supabase.rpc('submit_school_access_request', {
        p_school_code: cleanCode,
        p_name: name || context.profile.display_name,
        p_phone: phone || '',
        p_notes: notes || '',
      });
      rpcData = res.data;
      rpcError = res.error;
    } catch (e: any) {
      rpcError = e;
    }

    if (!rpcError && rpcData) {
      return NextResponse.json({ success: true, data: rpcData }, { status: 201 });
    }

    if (rpcError?.message?.includes('school_not_found')) {
      return NextResponse.json({ error: `School code "${cleanCode}" does not exist. Please check with your school administrator.` }, { status: 404 });
    }
    if (rpcError?.message?.includes('request_already_pending')) {
      return NextResponse.json({ error: 'Your request is already waiting for approval.' }, { status: 409 });
    }

    // Direct fallback if RPC is unavailable or encounters schema cache issues
    const school = await serverDb.getSchoolByCode(cleanCode);
    if (!school) {
      return NextResponse.json({ error: `School code "${cleanCode}" does not exist. Please check with your school administrator.` }, { status: 404 });
    }

    const adminClient = getServiceSupabase() || supabase;
    const { data: inserted, error: insertError } = await adminClient
      .from('school_access_requests')
      .insert({
        user_id: context.profile.id,
        school_id: school.id,
        applicant_name: name || context.profile.display_name,
        phone: phone || null,
        applicant_notes: notes || null,
        status: 'pending',
      })
      .select()
      .single();

    if (insertError) {
      if (
        insertError.message?.includes('duplicate key') ||
        insertError.message?.includes('unique constraint') ||
        insertError.message?.includes('uq_one_pending_request_per_user')
      ) {
        return NextResponse.json({ error: 'Your request is already waiting for approval.' }, { status: 409 });
      }
      throw insertError;
    }

    return NextResponse.json({ success: true, data: inserted }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "We couldn't submit your request right now. Please try again." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const context = await getAccessContext();
    if (!context.authenticated) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
    const body = await request.json();
    const { supabase } = await requireIdentity();
    const adminClient = getServiceSupabase() || supabase;

    if (body.action === 'cancel') {
      try {
        await supabase.rpc('cancel_school_access_request', { p_request_id: body.requestId });
      } catch {}
      await adminClient.from('school_access_requests').update({
        status: 'cancelled',
        reviewed_at: new Date().toISOString(),
      }).eq('id', body.requestId).eq('user_id', context.profile.id);
    } else if (body.action === 'approve') {
      if (context.state !== 'SUPER_ADMIN' && !(context.state === 'ACTIVE_SCHOOL_USER' && context.user?.role === 'school_admin')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      const { data: reqRecord, error: fetchErr } = await adminClient
        .from('school_access_requests')
        .select('*')
        .eq('id', body.requestId)
        .single();
      if (fetchErr || !reqRecord) throw new Error('Access request not found');

      const assignedRole = body.role || 'school_admin';
      const assignedName = body.name || reqRecord.applicant_name || undefined;
      const assignedPhone = body.phone || reqRecord.phone || undefined;

      // 1. If RPC is available, attempt RPC
      if (assignedRole === 'school_admin') {
        try {
          await supabase.rpc('assign_user_school_access', {
            p_user_id: reqRecord.user_id,
            p_school_id: reqRecord.school_id,
            p_role: 'school_admin',
            p_name: assignedName || '',
            p_phone: assignedPhone || '',
            p_status: 'active',
          });
        } catch {}
      } else {
        try {
          await supabase.rpc('approve_school_access_request', {
            p_request_id: body.requestId,
            p_role: assignedRole,
            p_name: assignedName || null,
            p_phone: assignedPhone || null,
            p_designation: body.designation || null,
            p_department: body.department || null,
          });
        } catch {}
      }

      // 2. Direct atomic guarantee using adminClient (bypasses RLS)
      await adminClient.from('school_access_requests').update({
        status: 'approved',
        assigned_role: assignedRole,
        assigned_designation: body.designation || null,
        assigned_department: body.department || null,
        reviewed_by: context.profile.id,
        reviewed_at: new Date().toISOString(),
      }).eq('id', body.requestId);

      await adminClient.from('school_memberships').upsert({
        user_id: reqRecord.user_id,
        school_id: reqRecord.school_id,
        role: assignedRole,
        status: 'active',
        updated_at: new Date().toISOString(),
        revoked_at: null,
      }, { onConflict: 'user_id,school_id' });

      await adminClient.from('profiles').update({
        display_name: assignedName,
        phone: assignedPhone,
        role: assignedRole,
        school_id: reqRecord.school_id,
        status: 'active',
        updated_at: new Date().toISOString(),
      }).eq('id', reqRecord.user_id);

    } else if (body.action === 'reject') {
      if (context.state !== 'SUPER_ADMIN' && !(context.state === 'ACTIVE_SCHOOL_USER' && context.user?.role === 'school_admin')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      try {
        await supabase.rpc('reject_school_access_request', {
          p_request_id: body.requestId,
          p_reason: body.reason || 'Rejected by administrator',
        });
      } catch {}

      await adminClient.from('school_access_requests').update({
        status: 'rejected',
        rejection_reason: body.reason || 'Rejected by administrator',
        reviewed_by: context.profile.id,
        reviewed_at: new Date().toISOString(),
      }).eq('id', body.requestId);
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Access requests PATCH failure:', err);
    return NextResponse.json({ error: err?.message || 'The request could not be updated.' }, { status: 409 });
  }
}
